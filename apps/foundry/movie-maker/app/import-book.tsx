/**
 * Import Book Screen
 * Supports: paste large text, type content, or upload .txt file
 * No content filtering — processes user's book as-is
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  ActivityIndicator, Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { Book, BookImportMethod, ContentRating } from '../types';
import { storageService } from '../services/storageService';
import {
  analyzeBookContent,
  countWords,
  estimatePageCount,
  splitIntoChapters,
} from '../services/bookAnalysisService';
import Button from '../components/ui/Button';

type Step = 'method' | 'input' | 'details' | 'analyzing';

const RATING_OPTIONS: { rating: ContentRating; label: string; desc: string }[] = [
  { rating: 'PG', label: 'PG', desc: 'General audiences' },
  { rating: 'PG-13', label: 'PG-13', desc: 'Some mature content' },
  { rating: 'R', label: 'R', desc: 'Adult themes' },
  { rating: 'NC-17', label: 'NC-17', desc: 'Adults only' },
  { rating: 'Unrated', label: 'Unrated', desc: 'No restrictions' },
];

export default function ImportBookScreen() {
  const router = useRouter();

  // Step flow
  const [step, setStep] = useState<Step>('method');
  const [importMethod, setImportMethod] = useState<BookImportMethod>('paste');

  // Book metadata
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [contentRating, setContentRating] = useState<ContentRating>('Unrated');

  // Content
  const [bookText, setBookText] = useState('');
  const [fileName, setFileName] = useState('');

  // Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState('');
  const [analyzePct, setAnalyzePct] = useState(0);

  const wordCount = countWords(bookText);
  const pageCount = estimatePageCount(wordCount);

  // ─── File Upload ───────────────────────────
  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setFileName(file.name);

      if (!file.name.match(/\.(txt|md|text)$/i)) {
        Alert.alert('File Type', 'Please upload a .txt or .md file. PDF support coming soon.');
        return;
      }

      const content = await FileSystem.readAsStringAsync(file.uri);
      setBookText(content);

      // Auto-detect title from filename
      if (!bookTitle) {
        setBookTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err) {
      Alert.alert('Upload Error', 'Could not read file. Try paste instead.');
    }
  };

  // ─── Analysis & Save ──────────────────────
  const handleAnalyze = async () => {
    if (!bookTitle.trim() || !bookText.trim()) return;

    setStep('analyzing');
    setAnalyzing(true);

    try {
      const result = await analyzeBookContent(
        bookText,
        bookTitle,
        (stepLabel, pct) => {
          setAnalyzeStep(stepLabel);
          setAnalyzePct(pct);
        }
      );

      const chapters = splitIntoChapters(bookText);

      const book: Book = {
        id: Date.now().toString(),
        title: bookTitle.trim(),
        author: author.trim() || 'Unknown Author',
        genre: genre.trim() || 'General Fiction',
        synopsis: result.synopsis,
        pageCount,
        wordCount,
        chapters,
        characters: result.characters.map((c, i) => ({
          id: `char_${i}`,
          name: c.name || 'Unknown',
          role: c.role || 'Supporting',
          description: c.description || '',
          appearance: c.appearance || '',
          personality: c.personality || '',
          aliases: c.aliases || [],
          firstAppearance: c.firstAppearance || '',
          relationships: [],
          createdAt: new Date(),
        })),
        rawContent: bookText,
        importMethod,
        contentRating,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storageService.saveBook(book);

      router.replace(`/book/${book.id}`);
    } catch (err) {
      Alert.alert('Analysis Error', 'Something went wrong. Please try again.');
      setStep('details');
      setAnalyzing(false);
    }
  };

  // ─── RENDER STEP: method ──────────────────
  if (step === 'method') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Import Your Book</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>How do you want to add your book?</Text>
          <Text style={styles.hint}>Works with any size — even 790 pages</Text>

          {([
            { method: 'paste' as BookImportMethod, icon: 'content-paste', title: 'Paste Text', desc: 'Copy and paste your digital manuscript directly' },
            { method: 'type' as BookImportMethod, icon: 'edit', title: 'Type or Dictate', desc: 'Enter your story manually, section by section' },
            { method: 'upload' as BookImportMethod, icon: 'upload-file', title: 'Upload .TXT File', desc: 'Import a plain text file of your book' },
          ] as const).map(item => (
            <Pressable
              key={item.method}
              style={({ pressed }) => [styles.methodCard, pressed && styles.pressed]}
              onPress={() => { setImportMethod(item.method); setStep('input'); }}
            >
              <View style={styles.methodIcon}>
                <MaterialIcons name={item.icon as any} size={28} color={Colors.primary} />
              </View>
              <View style={styles.methodText}>
                <Text style={styles.methodTitle}>{item.title}</Text>
                <Text style={styles.methodDesc}>{item.desc}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RENDER STEP: input ───────────────────
  if (step === 'input') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setStep('method')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>
            {importMethod === 'upload' ? 'Upload Book' : importMethod === 'paste' ? 'Paste Book' : 'Type Book'}
          </Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.content}>
            {/* Upload button */}
            {importMethod === 'upload' && (
              <Pressable
                style={({ pressed }) => [styles.uploadBox, pressed && styles.pressed]}
                onPress={handleUploadFile}
              >
                <MaterialIcons name="cloud-upload" size={40} color={Colors.primary} />
                <Text style={styles.uploadTitle}>
                  {fileName ? fileName : 'Tap to select .TXT file'}
                </Text>
                <Text style={styles.uploadHint}>Supported: .txt, .md</Text>
              </Pressable>
            )}

            {/* Text input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {importMethod === 'paste' ? 'Paste your book text' : 'Enter your book content'}
                </Text>
                {wordCount > 0 && (
                  <Text style={styles.wordCount}>
                    {wordCount.toLocaleString()} words · ~{pageCount} pages
                  </Text>
                )}
              </View>
              <TextInput
                style={styles.bigTextArea}
                placeholder={
                  importMethod === 'paste'
                    ? 'Paste your entire manuscript here...'
                    : 'Start typing your book here. You can add content in multiple sessions...'
                }
                placeholderTextColor={Colors.textMuted}
                value={bookText}
                onChangeText={setBookText}
                multiline
                textAlignVertical="top"
                autoCorrect={false}
                spellCheck={false}
              />
            </View>

            {wordCount > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <MaterialIcons name="menu-book" size={16} color={Colors.primary} />
                  <Text style={styles.statText}>{pageCount} pages</Text>
                </View>
                <View style={styles.statBadge}>
                  <MaterialIcons name="text-fields" size={16} color={Colors.primary} />
                  <Text style={styles.statText}>{wordCount.toLocaleString()} words</Text>
                </View>
                <View style={styles.statBadge}>
                  <MaterialIcons name="movie" size={16} color={Colors.primary} />
                  <Text style={styles.statText}>~{Math.round(wordCount / 1000)} min film</Text>
                </View>
              </View>
            )}

            <Button
              title="Continue to Book Details"
              onPress={() => setStep('details')}
              variant="primary"
              fullWidth
              disabled={wordCount < 50}
              icon="arrow-forward"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── RENDER STEP: details ─────────────────
  if (step === 'details') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setStep('input')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Book Details</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Book Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your book's title"
                placeholderTextColor={Colors.textMuted}
                value={bookTitle}
                onChangeText={setBookTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Author</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name or pen name"
                placeholderTextColor={Colors.textMuted}
                value={author}
                onChangeText={setAuthor}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Genre</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Thriller, Romance, Sci-Fi, Horror..."
                placeholderTextColor={Colors.textMuted}
                value={genre}
                onChangeText={setGenre}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Content Rating</Text>
              <Text style={styles.ratingNote}>
                Your book is yours — choose the rating that fits your content
              </Text>
              <View style={styles.ratingRow}>
                {RATING_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.rating}
                    style={[styles.ratingChip, contentRating === opt.rating && styles.ratingSelected]}
                    onPress={() => setContentRating(opt.rating)}
                  >
                    <Text style={[styles.ratingLabel, contentRating === opt.rating && styles.ratingLabelSelected]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.ratingDesc}>
                {RATING_OPTIONS.find(o => o.rating === contentRating)?.desc}
              </Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Ready to Analyze</Text>
              <Text style={styles.summaryLine}>
                <Text style={styles.summaryKey}>Words: </Text>
                {wordCount.toLocaleString()}
              </Text>
              <Text style={styles.summaryLine}>
                <Text style={styles.summaryKey}>Pages: </Text>~{pageCount}
              </Text>
              <Text style={styles.summaryLine}>
                <Text style={styles.summaryKey}>Est. Movie: </Text>
                ~{Math.round(wordCount / 1000)} minutes
              </Text>
            </View>

            <Button
              title="Analyze & Import Book"
              onPress={handleAnalyze}
              variant="primary"
              fullWidth
              disabled={!bookTitle.trim()}
              icon="auto-awesome"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── RENDER STEP: analyzing ───────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.analyzingContainer}>
        <View style={styles.analyzingIcon}>
          <MaterialIcons name="auto-stories" size={56} color={Colors.primary} />
        </View>

        <Text style={styles.analyzingTitle}>Analyzing Your Book</Text>
        <Text style={styles.analyzingSubtitle}>{bookTitle}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${analyzePct}%` }]} />
          </View>
          <Text style={styles.progressPct}>{Math.round(analyzePct)}%</Text>
        </View>

        <Text style={styles.analyzeStep}>{analyzeStep}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statText}>{wordCount.toLocaleString()} words</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statText}>~{pageCount} pages</Text>
          </View>
        </View>

        <Text style={styles.analyzingNote}>
          AI is extracting characters, building scene list, and preparing your movie blueprint
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.headline,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  subtitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.xs,
  },
  hint: {
    ...Typography.caption,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },

  // Method cards
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  methodIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: {
    flex: 1,
  },
  methodTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  methodDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  // Upload box
  uploadBox: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  uploadTitle: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadHint: {
    ...Typography.caption,
    color: Colors.textMuted,
  },

  // Inputs
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordCount: {
    ...Typography.caption,
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 16,
  },
  bigTextArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 15,
    minHeight: 280,
    paddingTop: Spacing.md,
    lineHeight: 22,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  // Rating
  ratingNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  ratingChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ratingSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ratingLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.text,
  },
  ratingLabelSelected: {
    color: '#0a0a0a',
  },
  ratingDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Summary
  summaryBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    gap: Spacing.xs,
  },
  summaryTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  summaryLine: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryKey: {
    fontWeight: '600',
    color: Colors.text,
  },

  // Analyzing screen
  analyzingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  analyzingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  analyzingTitle: {
    ...Typography.title,
    textAlign: 'center',
  },
  analyzingSubtitle: {
    ...Typography.subtitle,
    textAlign: 'center',
    color: Colors.primary,
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  progressPct: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.primary,
    width: 44,
    textAlign: 'right',
  },
  analyzeStep: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  analyzingNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.md,
  },
});
