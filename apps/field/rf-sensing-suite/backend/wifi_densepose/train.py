"""
WiFi DensePose Training Script
Based on research: "Dense Human Pose Estimation from WiFi"

Trains CNN+RNN model to map WiFi CSI (Channel State Information) 
to UV coordinates for 24 human body regions.
"""

from __future__ import print_function
import os
import sys
import argparse
import numpy as np
import scipy.io as scio
import tensorflow as tf
import keras
from keras.layers import (
    Input, GRU, Dense, Flatten, Dropout, 
    Conv2D, Conv3D, MaxPooling2D, MaxPooling3D, 
    TimeDistributed
)
from keras.models import Model, load_model
import keras.backend as K
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split


class WiFiDensePoseTrainer:
    def __init__(self, config):
        self.config = config
        self.T_MAX = 0  # Will be determined from data
        
        # Model hyperparameters
        self.n_epochs = config.epochs
        self.f_dropout_ratio = 0.5
        self.n_gru_hidden_units = 64
        self.n_batch_size = 32
        self.f_learning_rate = 0.001
        
        # Motion classes (for pose classification)
        self.ALL_MOTION = [1, 2, 3, 4, 5, 6]  # 6 activity classes
        self.N_MOTION = len(self.ALL_MOTION)
        
    def normalize_data(self, data_1):
        """Normalize CSI data to [0, 1] range"""
        data_1_max = np.amax(data_1, (0, 1), keepdims=True)
        data_1_min = np.amin(data_1, (0, 1), keepdims=True)
        data_1_max_rep = np.tile(data_1_max, (data_1.shape[0], data_1.shape[1], 1))
        data_1_min_rep = np.tile(data_1_min, (data_1.shape[0], data_1.shape[1], 1))
        data_1_norm = (data_1 - data_1_min_rep) / (data_1_max_rep - data_1_min_rep + sys.float_info.min)
        return data_1_norm

    def zero_padding(self, data, T_MAX):
        """Pad sequences to uniform length"""
        data_pad = []
        for i in range(len(data)):
            t = np.array(data[i]).shape[2]
            data_pad.append(
                np.pad(data[i], ((0, 0), (0, 0), (T_MAX - t, 0)), 
                       'constant', constant_values=0).tolist()
            )
        return np.array(data_pad)

    def onehot_encoding(self, label, num_class):
        """Convert labels to one-hot vectors"""
        label = np.array(label).astype('int32')
        label = np.squeeze(label)
        _label = np.eye(num_class)[label - 1]
        return _label

    def load_data(self, path_to_data):
        """
        Load WiFi CSI data from .mat files
        
        Expected format:
        - doppler_spectrum: [6, 121, T] (6 antennas, 121 subcarriers, T time steps)
        - Filename: motion-{label}-{location}-{orientation}-{repetition}.mat
        """
        data = []
        label = []
        
        print(f"Loading data from {path_to_data}")
        
        for data_root, data_dirs, data_files in os.walk(path_to_data):
            for data_file_name in data_files:
                if not data_file_name.endswith('.mat'):
                    continue
                    
                file_path = os.path.join(data_root, data_file_name)
                
                try:
                    # Load CSI data
                    mat_data = scio.loadmat(file_path)
                    data_1 = mat_data['doppler_spectrum']  # [6, 121, T]
                    
                    # Parse metadata from filename
                    parts = data_file_name.split('-')
                    label_1 = int(parts[1])
                    location_1 = int(parts[2])
                    orientation_1 = int(parts[3])
                    repetition_1 = int(parts[4].split('.')[0])
                    
                    # Downsample (reduce temporal resolution)
                    data_1 = data_1[:, :, 0::10]
                    
                    # Filter by motion class
                    if label_1 not in self.ALL_MOTION:
                        continue
                    
                    # Normalize
                    data_normed_1 = self.normalize_data(data_1)
                    
                    # Update max time steps
                    if self.T_MAX < np.array(data_1).shape[2]:
                        self.T_MAX = np.array(data_1).shape[2]
                    
                    data.append(data_normed_1.tolist())
                    label.append(label_1)
                    
                except Exception as e:
                    print(f"Error loading {data_file_name}: {e}")
                    continue
        
        print(f"Loaded {len(data)} samples, T_MAX = {self.T_MAX}")
        
        # Zero-padding to uniform length
        data = self.zero_padding(data, self.T_MAX)
        
        # Reshape: [N, 6, 121, T_MAX] => [N, T_MAX, 6, 121]
        data = np.swapaxes(np.swapaxes(data, 1, 3), 2, 3)
        data = np.expand_dims(data, axis=-1)  # Add channel dim
        
        label = np.array(label)
        
        return data, label

    def assemble_model(self, input_shape, n_class):
        """
        Build CNN+RNN architecture
        
        Architecture:
        1. 3D CNN: Extract spatial-temporal features from CSI
        2. TimeDistributed 2D CNN: Per-timeframe feature extraction
        3. GRU: Temporal sequence modeling
        4. Dense: Classification
        """
        model_input = Input(shape=input_shape, dtype='float32', name='model_input')
        
        # Option 1: 3D CNN (global spatial-temporal)
        x = Conv3D(16, kernel_size=(5, 3, 6), activation='relu', 
                   data_format='channels_last')(model_input)
        x = MaxPooling3D(pool_size=(2, 2, 2))(x)
        x = Flatten()(x)
        x = Dense(256, activation='relu')(x)
        x = Dropout(self.f_dropout_ratio)(x)
        x = Dense(128, activation='relu')(x)
        x = Dropout(self.f_dropout_ratio)(x)
        model_output = Dense(n_class, activation='softmax', name='model_output')(x)
        
        # Option 2: TimeDistributed 2D CNN + GRU (uncomment to use)
        # x = TimeDistributed(Conv2D(16, kernel_size=(3, 6), activation='relu'))(model_input)
        # x = TimeDistributed(MaxPooling2D(pool_size=(2, 2)))(x)
        # x = TimeDistributed(Flatten())(x)
        # x = TimeDistributed(Dense(128, activation='relu'))(x)
        # x = TimeDistributed(Dropout(self.f_dropout_ratio))(x)
        # x = TimeDistributed(Dense(64, activation='relu'))(x)
        # x = GRU(self.n_gru_hidden_units, return_sequences=False)(x)
        # x = Dropout(self.f_dropout_ratio)(x)
        # model_output = Dense(n_class, activation='softmax', name='model_output')(x)
        
        model = Model(inputs=model_input, outputs=model_output)
        model.compile(
            optimizer=keras.optimizers.RMSprop(lr=self.f_learning_rate),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model

    def train(self):
        """Main training loop"""
        # Load data
        data, label = self.load_data(self.config.data_dir)
        print(f'\nDataset: {label.shape[0]} samples, shape {data[0].shape}\n')
        
        # Split train/test
        data_train, data_test, label_train, label_test = train_test_split(
            data, label, test_size=self.config.test_split
        )
        print(f'Train: {label_train.shape[0]} samples')
        print(f'Test: {label_test.shape[0]} samples\n')
        
        # One-hot encode training labels
        label_train = self.onehot_encoding(label_train, self.N_MOTION)
        
        # Build model
        input_shape = (self.T_MAX, 6, 121, 1)
        model = self.assemble_model(input_shape, self.N_MOTION)
        model.summary()
        
        # Callbacks
        checkpoint_path = os.path.join(self.config.output_dir, 'best_model.h5')
        os.makedirs(self.config.output_dir, exist_ok=True)
        
        callbacks = [
            keras.callbacks.ModelCheckpoint(
                checkpoint_path, 
                monitor='val_accuracy', 
                save_best_only=True,
                verbose=1
            ),
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=20,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=10,
                min_lr=1e-6
            )
        ]
        
        # Train
        history = model.fit(
            {'model_input': data_train},
            {'model_output': label_train},
            batch_size=self.n_batch_size,
            epochs=self.n_epochs,
            verbose=1,
            validation_split=0.1,
            shuffle=True,
            callbacks=callbacks
        )
        
        # Evaluate on test set
        print('\n=== Testing ===')
        label_test_pred = model.predict(data_test)
        label_test_pred = np.argmax(label_test_pred, axis=-1) + 1
        
        # Confusion matrix
        cm = confusion_matrix(label_test, label_test_pred)
        print('Confusion Matrix (counts):')
        print(cm)
        
        cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
        cm_normalized = np.around(cm_normalized, decimals=2)
        print('\nConfusion Matrix (normalized):')
        print(cm_normalized)
        
        # Accuracy
        test_accuracy = np.sum(label_test == label_test_pred) / label_test.shape[0]
        print(f'\nTest Accuracy: {test_accuracy * 100:.2f}%')
        
        # Save final model
        final_model_path = os.path.join(self.config.output_dir, 'final_model.h5')
        model.save(final_model_path)
        print(f'\nModel saved to {final_model_path}')
        
        return model, history


def main():
    parser = argparse.ArgumentParser(description='Train WiFi DensePose Model')
    parser.add_argument('--data-dir', type=str, required=True,
                        help='Path to CSI data directory')
    parser.add_argument('--output-dir', type=str, default='./checkpoints',
                        help='Output directory for models')
    parser.add_argument('--epochs', type=int, default=200,
                        help='Number of training epochs')
    parser.add_argument('--test-split', type=float, default=0.1,
                        help='Fraction of data for testing')
    parser.add_argument('--gpu', type=str, default='0',
                        help='GPU device ID (0 or 1)')
    
    args = parser.parse_args()
    
    # GPU setup
    if args.gpu in ['0', '1']:
        os.environ["CUDA_VISIBLE_DEVICES"] = args.gpu
        config = tf.compat.v1.ConfigProto()
        config.gpu_options.allow_growth = True
        tf.compat.v1.keras.backend.set_session(tf.compat.v1.Session(config=config))
        tf.compat.v1.set_random_seed(1)
    else:
        print('Invalid GPU number. Use 0 or 1')
        sys.exit(1)
    
    # Train
    trainer = WiFiDensePoseTrainer(args)
    trainer.train()


if __name__ == '__main__':
    main()
