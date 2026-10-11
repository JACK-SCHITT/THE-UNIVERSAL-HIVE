import React, { memo, useMemo, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { tokenizeLine } from '../../services/tokenizer';
import { TokenSpan } from '../../services/types';

interface Props {
  content: string;
  fileType: string;
  showLineNumbers?: boolean;
}

const MAX_LINES = 1500;

const TOKEN_COLORS: Record<TokenSpan['type'], string> = {
  keyword: Colors.syntaxKeyword,
  string: Colors.syntaxString,
  comment: Colors.syntaxComment,
  number: Colors.syntaxNumber,
  function: Colors.syntaxFunction,
  operator: '#56b6c2',
  type: Colors.syntaxType,
  plain: Colors.textCode,
  decorator: '#e5c07b',
  tag: '#e06c75',
  attribute: '#d19a66',
};

const CodeLine = memo(function CodeLine({
  line,
  lineNum,
  fileType,
  showLineNumbers,
}: {
  line: string;
  lineNum: number;
  fileType: string;
  showLineNumbers: boolean;
}) {
  const tokens = useMemo(() => tokenizeLine(line || ' ', fileType), [line, fileType]);

  return (
    <View style={styles.lineRow}>
      {showLineNumbers && (
        <Text style={styles.lineNum} selectable={false}>{lineNum}</Text>
      )}
      <Text style={styles.lineContent} selectable>
        {tokens.map((tok, idx) => (
          <Text key={idx} style={{ color: TOKEN_COLORS[tok.type] || Colors.textCode }}>
            {tok.text}
          </Text>
        ))}
      </Text>
    </View>
  );
});

export const CodeViewer = memo(function CodeViewer({ content, fileType, showLineNumbers = true }: Props) {
  const [showAll, setShowAll] = useState(false);

  const allLines = useMemo(() => content.split('\n'), [content]);
  const totalLines = allLines.length;
  const truncated = totalLines > MAX_LINES && !showAll;
  const displayLines = truncated ? allLines.slice(0, MAX_LINES) : allLines;

  const isPlainText = fileType === 'text' || fileType === 'markdown' || fileType === 'csv';

  if (isPlainText) {
    return (
      <ScrollView style={styles.container} horizontal={false}>
        <Text style={styles.plainText} selectable>{content}</Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.hScroll}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.codeBlock}>
            {displayLines.map((line, idx) => (
              <CodeLine
                key={idx}
                line={line}
                lineNum={idx + 1}
                fileType={fileType}
                showLineNumbers={showLineNumbers}
              />
            ))}
            {truncated && (
              <Pressable style={styles.showMoreBtn} onPress={() => setShowAll(true)}>
                <MaterialIcons name="expand-more" size={16} color={Colors.primary} />
                <Text style={styles.showMoreText}>
                  Show {totalLines - MAX_LINES} more lines
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  hScroll: { flex: 1 },
  container: { flex: 1 },
  codeBlock: { paddingVertical: Spacing.sm },
  lineRow: {
    flexDirection: 'row',
    minHeight: 20,
    paddingHorizontal: Spacing.sm,
  },
  lineNum: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    width: 36,
    textAlign: 'right',
    paddingRight: Spacing.sm,
    lineHeight: 20,
    userSelect: 'none',
  } as any,
  lineContent: {
    color: Colors.textCode,
    fontSize: FontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
    flexShrink: 0,
  },
  plainText: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    lineHeight: 24,
    padding: Spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  showMoreText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
});
