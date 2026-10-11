import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { reportService, MonthlyReport } from '@/services/reportService';
import { shareService } from '@/services/shareService';

function ImpactMetric({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.metricCard}>
      <MaterialIcons name={icon as any} size={32} color={color} />
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ReportCard({ report }: { report: MonthlyReport }) {
  const handleShare = () => {
    shareService.shareMonthlyReport(`${report.month} ${report.year}`, report.highlights);
  };

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View>
          <Text style={styles.reportMonth}>{report.month} {report.year}</Text>
          <Text style={styles.reportSubtext}>
            ${report.totalDonations.toFixed(0)} from {report.donorCount} donors
          </Text>
        </View>
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <MaterialIcons name="share" size={24} color={THEME.colors.primary} />
        </Pressable>
      </View>

      <View style={styles.metricsGrid}>
        <ImpactMetric
          icon="search"
          label="Investigations"
          value={report.scamsInvestigated.toString()}
          color="#00D632"
        />
        <ImpactMetric
          icon="savings"
          label="Money Saved"
          value={`$${(report.moneySaved / 1000).toFixed(0)}K`}
          color="#FFD700"
        />
        <ImpactMetric
          icon="shield"
          label="People Protected"
          value={report.peopleProtected.toLocaleString()}
          color="#FF6B35"
        />
        <ImpactMetric
          icon="gavel"
          label="Takedowns"
          value={report.takedowns.toString()}
          color="#E55A2B"
        />
      </View>

      <View style={styles.highlightsSection}>
        <Text style={styles.highlightsTitle}>Key Achievements</Text>
        {report.highlights.map((highlight, index) => (
          <View key={index} style={styles.highlightItem}>
            <MaterialIcons name="check-circle" size={20} color={THEME.colors.primary} />
            <Text style={styles.highlightText}>{highlight}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<MonthlyReport[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allReports = reportService.getAllReports();
    setReports(allReports);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <MaterialIcons name="assessment" size={32} color={THEME.colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Impact Reports</Text>
          <Text style={styles.subtitle}>See what your donations achieve</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {reports.map((report, index) => (
          <ReportCard key={`${report.month}-${report.year}`} report={report} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerText: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    includeFontPadding: false,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    includeFontPadding: false,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.md,
  },
  reportCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.lg,
  },
  reportMonth: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    includeFontPadding: false,
  },
  reportSubtext: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
    includeFontPadding: false,
  },
  shareButton: {
    padding: THEME.spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -THEME.spacing.xs,
    marginBottom: THEME.spacing.lg,
  },
  metricCard: {
    width: '50%',
    padding: THEME.spacing.xs,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: THEME.spacing.sm,
    includeFontPadding: false,
  },
  metricLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs / 2,
    includeFontPadding: false,
  },
  highlightsSection: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: THEME.spacing.md,
  },
  highlightsTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text,
    fontWeight: '600',
    marginBottom: THEME.spacing.sm,
    includeFontPadding: false,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  highlightText: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    flex: 1,
    lineHeight: 20,
    includeFontPadding: false,
  },
});
