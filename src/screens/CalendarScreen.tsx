import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isFuture,
} from 'date-fns';
import { useScheduler } from '../context/SchedulerContext';
import { useTheme } from '../context/SettingsContext';
import { getDayCompletionRate, formatTime } from '../utils/dates';
import { resolveTemplate } from '../storage/scheduler';
import ScreenHeader from '../components/ScreenHeader';
import ProgressRing from '../components/ProgressRing';
import { typography, layout, TAB_BAR_BOTTOM_INSET } from '../styles/shared';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Map a 0-100 rate to an opacity level for the heatmap. */
function rateToOpacity(rate: number, isFutureDay: boolean): number {
  if (isFutureDay) return 0;
  if (rate === 0) return 0.05;
  if (rate < 25) return 0.15;
  if (rate < 50) return 0.3;
  if (rate < 75) return 0.5;
  if (rate < 100) return 0.7;
  return 0.9;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Component ───────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { templates, assignments, blockCompletions } = useScheduler();
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Sunday-first: pad = getDay(monthStart)
  const startPad = getDay(monthStart);

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
    setSelectedDate(null);
  };

  const today = new Date();

  // ── Selected day data ───────────────────────────────────────────────────

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    const template = resolveTemplate(assignments, templates, selectedDate);
    const dayCompletions = blockCompletions[selectedDate] ?? {};
    const rate = getDayCompletionRate(template, dayCompletions);

    const completedBlocks = template
      ? template.blocks
          .filter((b) => b.tracked && dayCompletions[b.id])
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
      : [];

    const totalTracked = template
      ? template.blocks.filter((b) => b.tracked).length
      : 0;

    return {
      template,
      rate,
      completedBlocks,
      totalTracked,
      completedCount: completedBlocks.length,
    };
  }, [selectedDate, assignments, templates, blockCompletions]);

  // ── Best day analysis ─────────────────────────────────────────────────

  const bestDayAnalysis = useMemo(() => {
    const dowTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
    const dowCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (const day of days) {
      if (isFuture(day) && !isSameDay(day, today)) continue;
      const key = format(day, 'yyyy-MM-dd');
      const template = resolveTemplate(assignments, templates, key);
      const rate = getDayCompletionRate(template, blockCompletions[key]);
      const dow = getDay(day);
      dowTotals[dow] += rate;
      dowCounts[dow] += 1;
    }

    let bestDow = 0;
    let bestAvg = 0;
    for (let i = 0; i < 7; i++) {
      if (dowCounts[i] > 0) {
        const avg = dowTotals[i] / dowCounts[i];
        if (avg > bestAvg) {
          bestAvg = avg;
          bestDow = i;
        }
      }
    }

    return { bestDay: WEEKDAY_LABELS[bestDow] + 's', bestAvg: Math.round(bestAvg) };
  }, [days, assignments, templates, blockCompletions]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Editorial Header ── */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.secondary }]}>
                MINDFUL RHYTHM
              </Text>
              <View style={styles.monthNavRow}>
                <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={[styles.navArrow, { color: colors.primary }]}>{'\u2039'}</Text>
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: colors.onSurface }]}>
                  {format(currentMonth, 'MMMM')}
                </Text>
                <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={[styles.navArrow, { color: colors.primary }]}>{'\u203A'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.surfaceContainer }]} />
                <Text style={[styles.legendLabel, { color: colors.onSurfaceVariant }]}>Low</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendLabel, { color: colors.onSurfaceVariant }]}>High</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Calendar Heatmap Grid ── */}
        <View style={styles.calendarSection}>
          {/* Day-of-week headers */}
          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((label) => (
              <View key={label} style={styles.weekDayCell}>
                <Text style={[styles.weekDayText, { color: colors.onSurfaceVariant + '99' }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Date grid */}
          <View style={styles.grid}>
            {Array.from({ length: startPad }).map((_, i) => (
              <View key={`pad-${i}`} style={styles.dayCell} />
            ))}
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const template = resolveTemplate(assignments, templates, key);
              const rate = getDayCompletionRate(template, blockCompletions[key]);
              const future = isFuture(day) && !isSameDay(day, today);
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate === key;
              const opacity = rateToOpacity(rate, future);

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: future
                        ? 'transparent'
                        : colors.primary + Math.round(opacity * 255).toString(16).padStart(2, '0'),
                    },
                    isSelected && {
                      borderWidth: 3,
                      borderColor: colors.primary + '33',
                      transform: [{ scale: 1.08 }],
                    },
                    isToday && !isSelected && {
                      borderWidth: 2,
                      borderColor: colors.primary,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDate(key)}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      {
                        color: opacity > 0.45
                          ? colors.onPrimary
                          : future
                            ? colors.onSurfaceVariant + '40'
                            : colors.primary,
                      },
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Selected Day Summary (Bento) ── */}
        {selectedDate && selectedDayData && (
          <View style={styles.bentoSection}>
            {/* Score Card */}
            <View
              style={[
                styles.scoreCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  shadowColor: colors.onSurface,
                },
              ]}
            >
              <Text style={[styles.scoreCardLabel, { color: colors.onSurfaceVariant }]}>
                DAILY SCORE
              </Text>
              <ProgressRing
                size={120}
                trackColor={colors.surfaceContainer}
                progressColor={colors.primary}
                progress={selectedDayData.rate}
                innerColor={colors.surfaceContainerLowest}
              >
                <Text style={[styles.scoreValue, { color: colors.onSurface }]}>
                  {selectedDayData.rate}%
                </Text>
              </ProgressRing>
              <Text style={[styles.scoreCaption, { color: colors.onSurfaceVariant }]}>
                {selectedDayData.rate >= 80
                  ? 'Peak performance reached.'
                  : selectedDayData.rate >= 50
                    ? 'Building momentum.'
                    : selectedDayData.rate > 0
                      ? 'Room to grow.'
                      : 'No activity recorded.'}
              </Text>
            </View>

            {/* Highlights Card */}
            <View
              style={[
                styles.highlightsCard,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <View style={styles.highlightsHeader}>
                <Text style={[styles.highlightsTitle, { color: colors.onSurface }]}>
                  Highlights of the {format(new Date(selectedDate + 'T12:00:00'), 'do')}
                </Text>
                {selectedDayData.rate >= 80 && (
                  <View style={[styles.focusBadge, { backgroundColor: colors.tertiaryFixed }]}>
                    <Text style={[styles.focusBadgeText, { color: colors.tertiary }]}>
                      Focused
                    </Text>
                  </View>
                )}
              </View>

              {selectedDayData.completedBlocks.length > 0 ? (
                <View style={styles.highlightsList}>
                  {selectedDayData.completedBlocks.slice(0, 4).map((block, idx) => (
                    <View key={block.id} style={styles.highlightRow}>
                      <View
                        style={[
                          styles.highlightIcon,
                          {
                            backgroundColor:
                              idx % 3 === 0
                                ? colors.primary + '1A'
                                : idx % 3 === 1
                                  ? colors.secondary + '1A'
                                  : colors.tertiary + '1A',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.highlightIconText,
                            {
                              color:
                                idx % 3 === 0
                                  ? colors.primary
                                  : idx % 3 === 1
                                    ? colors.secondary
                                    : colors.tertiary,
                            },
                          ]}
                        >
                          {'\u2713'}
                        </Text>
                      </View>
                      <View style={styles.highlightTextCol}>
                        <Text
                          style={[styles.highlightActivity, { color: colors.onSurface }]}
                          numberOfLines={1}
                        >
                          {block.activity}
                        </Text>
                        <Text style={[styles.highlightTime, { color: colors.onSurfaceVariant }]}>
                          {formatTime(block.startTime)} – {formatTime(block.endTime)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noHighlights, { color: colors.onSurfaceVariant }]}>
                  No completed rituals on this day.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ── Trend Analysis Banner ── */}
        <View
          style={[styles.trendBanner, { backgroundColor: colors.primary }]}
        >
          <View style={[styles.trendDecor, { backgroundColor: colors.primaryContainer, opacity: 0.4 }]} />
          <View style={styles.trendContent}>
            <Text style={[styles.trendLabel, { color: colors.onPrimary }]}>
              TREND ANALYSIS
            </Text>
            <Text style={[styles.trendHeadline, { color: colors.onPrimary }]}>
              You are most productive on {bestDayAnalysis.bestDay}.
            </Text>
            <Text style={[styles.trendBody, { color: colors.onPrimary }]}>
              Based on your activity heatmap, your completion rate peaks at{' '}
              {bestDayAnalysis.bestAvg}% on {bestDayAnalysis.bestDay}. Schedule your
              high-priority rituals on these days for best results.
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: layout.root,
  scroll: layout.scrollContent,

  // ── Header ──
  headerSection: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: typography.eyebrow,
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navArrow: {
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 42,
  },
  monthTitle: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 42,
    lineHeight: 48,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // ── Calendar Grid ──
  calendarSection: {
    marginBottom: 32,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayCell: {
    width: '14.28%',
    alignItems: 'center',
  },
  weekDayText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  dayNum: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },

  // ── Selected Day Bento ──
  bentoSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  scoreCard: {
    width: '38%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
  },
  scoreCardLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  scoreValue: {
    fontFamily: 'Newsreader_700Bold_Italic',
    fontSize: 32,
  },
  scoreCaption: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },

  highlightsCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
  },
  highlightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  highlightsTitle: {
    fontFamily: 'Newsreader_600SemiBold_Italic',
    fontSize: 18,
    flex: 1,
  },
  focusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  focusBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  highlightsList: {
    gap: 16,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  highlightTextCol: {
    flex: 1,
  },
  highlightActivity: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  highlightTime: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  noHighlights: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    fontStyle: 'italic',
  },

  // ── Trend Banner ──
  trendBanner: {
    borderRadius: 16,
    padding: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  trendDecor: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  trendContent: {
    position: 'relative',
    zIndex: 1,
  },
  trendLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.8,
    marginBottom: 8,
  },
  trendHeadline: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 26,
    marginBottom: 12,
  },
  trendBody: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.9,
  },
});
