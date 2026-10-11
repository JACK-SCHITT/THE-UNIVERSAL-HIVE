// Component identification overlay on board image
import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { ComponentType } from '../../types';
import { TerminalText } from '../ui/TerminalText';

interface ComponentOverlayProps {
  imageUri: string;
  components: ComponentType[];
  onComponentPress?: (component: ComponentType) => void;
}

export function ComponentOverlay({ imageUri, components, onComponentPress }: ComponentOverlayProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      
      {components.map(comp => {
        if (!comp.bounds) return null;
        
        const { x, y, width, height } = comp.bounds;
        const confColor = comp.confidence > 0.9 ? theme.colors.success :
                         comp.confidence > 0.7 ? theme.colors.warning :
                         theme.colors.error;
        
        return (
          <Pressable
            key={comp.id}
            style={[
              styles.box,
              {
                left: x,
                top: y,
                width,
                height,
                borderColor: confColor,
              },
            ]}
            onPress={() => onComponentPress?.(comp)}
          >
            <View style={[styles.label, { backgroundColor: confColor }]}>
              <TerminalText mono style={styles.labelText}>
                {comp.name}
              </TerminalText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  box: {
    position: 'absolute',
    borderWidth: 2,
  },
  label: {
    position: 'absolute',
    top: -18,
    left: 0,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  labelText: {
    fontSize: 10,
    color: theme.colors.background,
  },
});
