import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useScheduler } from '../context/SchedulerContext';
import { useTheme } from '../context/SettingsContext';
import { resolveTemplate } from '../storage/scheduler';
import { todayKey, formatTime } from '../utils/dates';
import { TimeBlock } from '../types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTodayLong(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardScreen() {
  const { templates, assignments, blockCompletions, toggleBlockCompletion } =
    useScheduler();
  const theme = useTheme();
  const c = theme.colors;

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
  const progressPct = totalBlocks > 0 ? (completedCount / totalBlocks) * 100 : 0;

  const handleToggle = (blockId: string) => {
    toggleBlockCompletion(dateKey, blockId);
  };

  /* ── Render helpers ──────────────────────────────────────────────── */

  const renderBlock = ({ item }: { item: TimeBlock }) => {
    const done = !!dayCompletions[item.id];
    const accentColor = item.color ?? c.primary;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.blockCard,
          { backgroundColor: c.card },
          done && styles.blockCardDone,
        ]}
        onPress={() => handleToggle(item.id)}
      >
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.blockContent}>
          <Text style={[styles.blockTime, { color: c.muted }]}>
            {formatTime(item.startTime)} – {formatTime(item.endTime)}
          </Text>
          <Text
            style={[
              styles.blockActivity,
              { color: c.text },
              done && styles.blockActivityDone,
              done && { color: c.muted },
            ]}
            numberOfLines={2}
          >
            {item.activity}
          </Text>
        </View>

        <View
          style={[
            styles.checkBox,
            { borderColor: c.border },
            done && { backgroundColor: c.primary, borderColor: c.primary },
          ]}
        >
          {done && <Text style={[styles.checkMark, { color: c.headerText }]}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={[styles.emptyCard, { backgroundColor: c.card }]}>
      <Text style={[styles.emptyTitle, { color: c.muted }]}>
        {template ? 'No tracked tasks for today.' : 'No schedule assigned for today.'}
      </Text>
      <Text style={[styles.emptyHint, { color: c.muted }]}>
        {template
          ? 'Mark tasks as tracked in the Scheduler to see them here.'
          : 'Set one up in the Scheduler tab.'}
      </Text>
    </View>
  );

  /* ── Main render ─────────────────────────────────────────────────── */

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <Text style={[styles.headerTitle, { color: c.headerText }]}>
          Dashboard
        </Text>
        <Text style={[styles.headerDate, { color: c.headerText, opacity: 0.7 }]}>
          {formatTodayLong()}
        </Text>

        <View
          style={[
            styles.progressBar,
            { backgroundColor: `${c.headerText}33` },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${progressPct}%`, backgroundColor: c.accent },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: c.headerText, opacity: 0.8 }]}>
          {completedCount}/{totalBlocks} completed
        </Text>
      </View>

      {/* Template name subtitle */}
      {template && (
        <View style={styles.templateRow}>
          <Text style={[styles.templateLabel, { color: c.muted }]}>
            Schedule:{' '}
            <Text style={{ color: c.primary, fontWeight: '700' }}>
              {template.name}
            </Text>
          </Text>
        </View>
      )}

      {/* Block list */}
      <FlatList
        data={sortedBlocks}
        keyExtractor={(item) => item.id}
        renderItem={renderBlock}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerDate: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 6,
  },

  // Template subtitle
  templateRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Block list
  list: {
    padding: 16,
    paddingBottom: 40,
  },

  // Block card
  blockCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  blockCardDone: {
    opacity: 0.55,
  },
  accentBar: {
    width: 5,
  },
  blockContent: {
    flex: 1,
    padding: 14,
  },
  blockTime: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 3,
    fontVariant: ['tabular-nums'],
  },
  blockActivity: {
    fontSize: 16,
    fontWeight: '600',
  },
  blockActivityDone: {
    textDecorationLine: 'line-through',
  },

  // Checkbox
  checkBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    margin: 14,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty state
  emptyCard: {
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
