import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useScheduler } from '../context/SchedulerContext';
import { useTheme, useSettings } from '../context/SettingsContext';
import { resolveTemplate } from '../storage/scheduler';
import { todayKey, formatTime } from '../utils/dates';
import { TimeBlock } from '../types';
import ScreenHeader from '../components/ScreenHeader';
import ProgressRing from '../components/ProgressRing';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getScoreLabel(pct: number): string {
  if (pct >= 80) return 'Steady & Mindful';
  if (pct >= 50) return 'Building Momentum';
  if (pct >= 20) return 'Finding Your Rhythm';
  return 'Just Beginning';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardScreen() {
  const { templates, assignments, blockCompletions, toggleBlockCompletion } =
    useScheduler();
  const { colors } = useTheme();
  const { settings } = useSettings();

  const dateKey = todayKey();

  const template = useMemo(
    () => resolveTemplate(assignments, templates, dateKey),
    [assignments, templates, dateKey],
  );

  const sortedBlocks = useMemo(() => {
    if (!template) return [];
    return [...template.blocks]
      .filter((b) => b.tracked)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [template]);

  const dayCompletions = blockCompletions[dateKey] ?? {};
  const totalBlocks = sortedBlocks.length;
  const completedCount = sortedBlocks.filter(
    (b) => dayCompletions[b.id],
  ).length;
  const progressPct =
    totalBlocks > 0 ? (completedCount / totalBlocks) * 100 : 0;

  const handleToggle = (blockId: string) => {
    toggleBlockCompletion(dateKey, blockId);
  };

  /* ── Render helpers ──────────────────────────────────────────────── */

  const renderBlock = (block: TimeBlock) => {
    const done = !!dayCompletions[block.id];

    if (done) {
      return (
        <TouchableOpacity
          key={block.id}
          activeOpacity={0.7}
          onPress={() => handleToggle(block.id)}
          style={[
            styles.blockCardCompleted,
            {
              backgroundColor: colors.surfaceContainerLowest,
              shadowColor: colors.onSurface,
            },
          ]}
        >
          <View style={styles.blockRow}>
            <View
              style={[
                styles.checkCircleDone,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <Text style={styles.checkMarkText}>{'\u2713'}</Text>
            </View>
            <View style={styles.blockTextColumn}>
              <Text
                style={[styles.blockTitle, { color: colors.primary }]}
                numberOfLines={1}
              >
                {block.activity}
              </Text>
              <Text
                style={[
                  styles.blockSubtitle,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {formatTime(block.startTime)} – {formatTime(block.endTime)}{' '}
                completed
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={block.id}
        activeOpacity={0.7}
        onPress={() => handleToggle(block.id)}
        style={[
          styles.blockCardPending,
          { borderColor: colors.outlineVariant },
        ]}
      >
        <View style={styles.blockRow}>
          <View
            style={[
              styles.checkCircleEmpty,
              { borderColor: colors.outlineVariant },
            ]}
          />
          <View style={styles.blockTextColumn}>
            <Text
              style={[
                styles.blockTitle,
                { color: colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {block.activity}
            </Text>
            <Text
              style={[
                styles.blockSubtitle,
                { color: colors.onSurfaceVariant },
              ]}
            >
              {formatTime(block.startTime)} – {formatTime(block.endTime)}{' '}
              scheduled
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ── Main render ─────────────────────────────────────────────────── */

  const hasBlocks = sortedBlocks.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScreenHeader />

      <ScrollView
        style={{ backgroundColor: colors.surface }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ─────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <Text style={[styles.eyebrow, { color: colors.secondary }]}>
            A NEW DAWN
          </Text>
          <Text style={[styles.greeting, { color: colors.primary }]}>
            {getGreeting()},{'\n'}
            {settings.displayName || 'Friend'}
          </Text>
          <View
            style={[
              styles.quoteBlock,
              { borderLeftColor: colors.secondaryContainer },
            ]}
          >
            <Text
              style={[styles.quoteText, { color: colors.onSurfaceVariant }]}
            >
              The mind is a sanctuary, not a storehouse.
            </Text>
          </View>
        </View>

        {/* ── Bento Grid ───────────────────────────────────────────── */}
        {hasBlocks ? (
          <View style={styles.bentoGrid}>
            {/* Focus Score Card */}
            <View
              style={[
                styles.focusScoreCard,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <Text
                style={[
                  styles.focusScoreTitle,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                DAILY FOCUS SCORE
              </Text>
              <ProgressRing
                size={160}
                trackColor={colors.surfaceContainerHighest}
                progressColor={colors.primaryContainer}
                progress={progressPct}
              >
                <Text
                  style={[styles.scoreValue, { color: colors.primary }]}
                >
                  {Math.round(progressPct)}%
                </Text>
                <Text
                  style={[
                    styles.scoreLabel,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {getScoreLabel(progressPct)}
                </Text>
              </ProgressRing>
              <Text
                style={[
                  styles.scoreCaption,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                You've completed {completedCount} of {totalBlocks} rituals
                today.
              </Text>
            </View>

            {/* Daily Rituals Card */}
            <View
              style={[
                styles.ritualsCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  shadowColor: colors.onSurface,
                },
              ]}
            >
              <View style={styles.ritualsHeader}>
                <Text
                  style={[styles.ritualsTitle, { color: colors.primary }]}
                >
                  Daily Rituals
                </Text>
                <View
                  style={[
                    styles.ritualsBadge,
                    { backgroundColor: colors.secondary },
                  ]}
                >
                  <Text
                    style={[
                      styles.ritualsBadgeText,
                      { color: colors.onSecondary },
                    ]}
                  >
                    {completedCount}/{totalBlocks} Done
                  </Text>
                </View>
              </View>

              <View style={styles.blockList}>
                {sortedBlocks.map(renderBlock)}
              </View>
            </View>
          </View>
        ) : (
          /* ── Empty state ───────────────────────────────────────── */
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                shadowColor: colors.onSurface,
              },
            ]}
          >
            <Text
              style={[styles.emptyText, { color: colors.onSurfaceVariant }]}
            >
              {template
                ? 'No rituals scheduled today'
                : 'No schedule assigned for today. Set one up in the Scheduler tab.'}
            </Text>
          </View>
        )}

        {/* ── Insights Card ────────────────────────────────────────── */}
        <View
          style={[
            styles.insightsCard,
            { backgroundColor: colors.tertiary },
          ]}
        >
          <Text
            style={[
              styles.insightsLabel,
              { color: colors.onTertiary },
            ]}
          >
            DAILY INSIGHTS
          </Text>
          <Text
            style={[
              styles.insightsHeadline,
              { color: colors.onTertiary },
            ]}
          >
            Your rhythm is aligning.
          </Text>
          <Text
            style={[styles.insightsBody, { color: colors.onTertiary }]}
          >
            Keep building on today's momentum. Consistency is the foundation
            of your sanctuary.
          </Text>
          <View
            style={[
              styles.insightsButton,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                styles.insightsButtonText,
                { color: colors.tertiary },
              ]}
            >
              VIEW FOCUS MAP
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },

  /* ── Hero ──────────────────────────────────────────────────────── */

  heroSection: {
    marginBottom: 40,
  },
  eyebrow: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  greeting: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '300',
  },
  quoteBlock: {
    borderLeftWidth: 2,
    paddingLeft: 20,
    paddingVertical: 8,
    marginTop: 20,
  },
  quoteText: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 22,
  },

  /* ── Bento Grid ────────────────────────────────────────────────── */

  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  /* Focus Score Card (~45%) */
  focusScoreCard: {
    width: '45%',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  focusScoreTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 24,
  },
  scoreValue: {
    fontFamily: 'Newsreader_700Bold_Italic',
    fontSize: 40,
  },
  scoreLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    textAlign: 'center',
  },
  scoreCaption: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 180,
  },

  /* Daily Rituals Card (~52%) */
  ritualsCard: {
    width: '52%',
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.02,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  ritualsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ritualsTitle: {
    fontFamily: 'Newsreader_600SemiBold_Italic',
    fontSize: 22,
  },
  ritualsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ritualsBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
  },

  blockList: {
    marginTop: 16,
    gap: 10,
  },

  /* Block cards */
  blockCardCompleted: {
    borderRadius: 12,
    padding: 16,
    shadowOpacity: 0.02,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  blockCardPending: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircleDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkMarkText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkCircleEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
  },
  blockTextColumn: {
    flex: 1,
  },
  blockTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  blockSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    marginTop: 2,
  },

  /* ── Empty state ───────────────────────────────────────────────── */

  emptyCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowOpacity: 0.02,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  emptyText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },

  /* ── Insights Card ─────────────────────────────────────────────── */

  insightsCard: {
    width: '100%',
    marginTop: 24,
    borderRadius: 16,
    padding: 28,
    overflow: 'hidden',
  },
  insightsLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.8,
  },
  insightsHeadline: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 26,
    marginTop: 8,
  },
  insightsBody: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 20,
    marginTop: 8,
  },
  insightsButton: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
    alignSelf: 'flex-start',
  },
  insightsButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
