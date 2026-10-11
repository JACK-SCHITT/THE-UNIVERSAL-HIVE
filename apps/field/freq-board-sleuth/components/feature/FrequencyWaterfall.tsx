// Real-time frequency waterfall display
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../constants/theme';
import { FrequencyReading } from '../../types';
import { TerminalText } from '../ui/TerminalText';

interface FrequencyWaterfallProps {
  readings: FrequencyReading[];
  width?: number;
  height?: number;
}

export function FrequencyWaterfall({ readings, width = Dimensions.get('window').width - 32, height = 200 }: FrequencyWaterfallProps) {
  // Group readings into frequency bins for waterfall display
  const bins = 50;
  const maxFreq = Math.max(...readings.map(r => r.frequency), 1);
  
  const getBinIndex = (freq: number) => Math.floor((freq / maxFreq) * (bins - 1));
  
  const binData = new Array(bins).fill(0);
  readings.forEach(r => {
    const bin = getBinIndex(r.frequency);
    binData[bin] = Math.max(binData[bin], r.amplitude);
  });

  const maxAmp = Math.max(...binData, 1);

  return (
    <View style={styles.container}>
      <TerminalText variant="dim" style={styles.label}>WATERFALL PLOT</TerminalText>
      <View style={[styles.graph, { width, height }]}>
        {binData.map((amp, i) => {
          const normalized = amp / maxAmp;
          const barHeight = normalized * height;
          const color = normalized > 0.7 ? theme.colors.graph.peak :
                       normalized > 0.4 ? theme.colors.graph.high :
                       normalized > 0.2 ? theme.colors.graph.med :
                       theme.colors.graph.low;
          
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  width: width / bins - 1,
                  height: Math.max(barHeight, 2),
                  backgroundColor: color,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.info}>
        <TerminalText mono variant="dim">
          0 Hz{' '} 
        </TerminalText>
        <TerminalText mono variant="dim">
          {(maxFreq / 1000).toFixed(1)} kHz
        </TerminalText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.sm,
    fontSize: 12,
  },
  graph: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 4,
  },
  bar: {
    marginHorizontal: 0.5,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
});
