import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isFuture } from 'date-fns';
import { useScheduler } from '../context/SchedulerContext';
import { useTheme } from '../context/SettingsContext';
import { getDayCompletionRate } from '../utils/dates';
import { resolveTemplate } from '../storage/scheduler';

function getDayColor(rate: number, isFutureDay: boolean): string {
  if (isFutureDay) return 'transparent'; // handled via theme color inline
  if (rate === 0) return '#ffcdd2';
  if (rate < 50) return '#ffab91';
  if (rate < 80) return '#fff176';
  return '#a5d6a7';
}

export default function CalendarScreen() {
  const { templates, assignments, blockCompletions } = useScheduler();
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start with blank days
  const startPad = (getDay(monthStart) + 6) % 7; // Monday-first

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  const today = new Date();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: colors.primary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.primary }]}>{format(currentMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: colors.primary }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <Text key={i} style={[styles.weekDay, { color: colors.muted }]}>{d}</Text>
          ))}
        </View>

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
            const bg = future ? colors.border : getDayColor(rate, future);

            return (
              <View
                key={key}
                style={[
                  styles.dayCell,
                  { backgroundColor: bg },
                  isToday && [styles.todayBorder, { borderColor: colors.primary }],
                ]}
              >
                <Text style={[styles.dayNum, { color: colors.text }]}>{format(day, 'd')}</Text>
                {!future && <Text style={[styles.dayRate, { color: colors.muted }]}>{rate}%</Text>}
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          <Text style={[styles.legendTitle, { color: colors.primary }]}>Legend</Text>
          <View style={styles.legendRow}>
            {[
              { color: '#a5d6a7', label: '80-100%' },
              { color: '#fff176', label: '50-79%' },
              { color: '#ffab91', label: '1-49%' },
              { color: '#ffcdd2', label: '0% / future' },
            ].map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={[styles.legendLabel, { color: colors.muted }]}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 28, fontWeight: '300' },
  monthLabel: { fontSize: 18, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginVertical: 2,
    paddingHorizontal: 1,
  },
  todayBorder: { borderWidth: 2 },
  dayNum: { fontSize: 13, fontWeight: '600' },
  dayRate: { fontSize: 9, marginTop: 1 },
  legend: { marginTop: 24 },
  legendTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 3 },
  legendLabel: { fontSize: 12 },
});
