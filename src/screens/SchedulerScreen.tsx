import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useScheduler } from '../context/SchedulerContext';
import { useTheme } from '../context/SettingsContext';
import { deleteTemplate, assignWeekday, loadAssignments } from '../storage/scheduler';
import { formatTime } from '../utils/dates';
import { ScheduleTemplate } from '../types';
import ScreenHeader from '../components/ScreenHeader';
import { typography, layout, TAB_BAR_BOTTOM_INSET } from '../styles/shared';

// ── Constants ───────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Accent colors for timeline dots — cycles through primary, secondary, tertiary. */
const DOT_COLORS_KEYS = ['primary', 'secondary', 'tertiary'] as const;

// ── Component ───────────────────────────────────────────────────────────────

export default function SchedulerScreen() {
  const navigation = useNavigation<any>();
  const { templates, assignments, setTemplates, setAssignments } = useScheduler();
  const { colors } = useTheme();
  const [assigningDow, setAssigningDow] = useState<number | null>(null);

  // ── Template CRUD ─────────────────────────────────────────────────────────

  const confirmDeleteTemplate = (template: ScheduleTemplate) => {
    Alert.alert('Delete Template', `Delete "${template.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const nextTemplates = await deleteTemplate(template.id);
          const nextAssignments = await loadAssignments();
          setTemplates(nextTemplates);
          setAssignments(nextAssignments);
        },
      },
    ]);
  };

  // ── Day-of-week assignment ────────────────────────────────────────────────

  const handleDowPress = (dow: number) => {
    setAssigningDow(assigningDow === dow ? null : dow);
  };

  const handleAssignTemplate = async (dow: number, templateId: string | null) => {
    const next = await assignWeekday(dow, templateId);
    setAssignments(next);
    setAssigningDow(null);
  };

  const getAssignedTemplate = (dow: number): ScheduleTemplate | undefined => {
    const tid = assignments.weekdays[String(dow)];
    return templates.find((t) => t.id === tid);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <ScreenHeader showPageName="Scheduler" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Editorial Header ── */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.outline }]}>
                MORNING ROUTINE
              </Text>
              <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                Daily Blueprint
              </Text>
            </View>
          </View>
        </View>

        {/* ── Weekly Assignment Strip ── */}
        <View style={styles.weekSection}>
          <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
            WEEKLY DEFAULTS
          </Text>
          <Text style={[styles.sectionHint, { color: colors.outline }]}>
            Tap a day to assign a template
          </Text>
          <View style={styles.dowGrid}>
            {DAY_LABELS.map((label, dow) => {
              const assigned = getAssignedTemplate(dow);
              const isSelecting = assigningDow === dow;
              return (
                <TouchableOpacity
                  key={dow}
                  style={[
                    styles.dowCell,
                    { backgroundColor: colors.surfaceContainerLow },
                    assigned && { backgroundColor: colors.primaryContainer },
                    isSelecting && { borderWidth: 2, borderColor: colors.primary },
                  ]}
                  onPress={() => handleDowPress(dow)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dowLabel,
                      { color: colors.onSurfaceVariant },
                      assigned && { color: colors.onPrimary },
                    ]}
                  >
                    {label}
                  </Text>
                  {assigned ? (
                    <Text
                      style={[styles.dowTemplateName, { color: colors.onPrimary }]}
                      numberOfLines={1}
                    >
                      {assigned.name}
                    </Text>
                  ) : (
                    <Text style={[styles.dowEmpty, { color: colors.outline }]}>{'\u2014'}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Template picker for selected day */}
        {assigningDow !== null && (
          <View
            style={[
              styles.pickerPanel,
              {
                backgroundColor: colors.surfaceContainerLowest,
                shadowColor: colors.onSurface,
              },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: colors.primary }]}>
              Assign template to {DAY_LABELS[assigningDow]}
            </Text>
            {templates.length === 0 ? (
              <Text style={[styles.pickerEmpty, { color: colors.onSurfaceVariant }]}>
                No templates yet. Create one below.
              </Text>
            ) : (
              templates.map((t, idx) => {
                const dotColor = colors[DOT_COLORS_KEYS[idx % DOT_COLORS_KEYS.length]];
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.pickerRow,
                      { borderLeftColor: dotColor, backgroundColor: colors.surfaceContainerLow },
                    ]}
                    onPress={() => handleAssignTemplate(assigningDow, t.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerRowName, { color: colors.onSurface }]}>
                      {t.name}
                    </Text>
                    <Text style={[styles.pickerRowMeta, { color: colors.onSurfaceVariant }]}>
                      {t.blocks.length} block{t.blocks.length !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
            {assignments.weekdays[String(assigningDow)] && (
              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: colors.errorContainer + '66' }]}
                onPress={() => handleAssignTemplate(assigningDow, null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.clearBtnText, { color: colors.error }]}>Clear assignment</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: colors.surfaceContainerLow }]}
              onPress={() => setAssigningDow(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Templates — Timeline Layout ── */}
        <View style={styles.templatesSection}>
          <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
            TEMPLATES
          </Text>
        </View>

        {templates.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                shadowColor: colors.onSurface,
              },
            ]}
          >
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              No templates yet.
            </Text>
            <Text style={[styles.emptyHint, { color: colors.outline }]}>
              Tap + below to create your first schedule template.
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {/* Vertical timeline line */}
            <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant + '4D' }]} />

            {templates.map((template, tIdx) => {
              const dotColorKey = DOT_COLORS_KEYS[tIdx % DOT_COLORS_KEYS.length];
              const dotColor = colors[dotColorKey];
              const sortedBlocks = [...template.blocks].sort((a, b) =>
                a.startTime.localeCompare(b.startTime),
              );
              const bgStyle =
                tIdx % 2 === 0
                  ? { backgroundColor: colors.surfaceContainerLow }
                  : {
                      backgroundColor: colors.surfaceContainerLowest,
                      borderWidth: 1,
                      borderColor: colors.outlineVariant + '1A',
                      shadowColor: colors.onSurface,
                      shadowOpacity: 0.02,
                      shadowRadius: 20,
                      shadowOffset: { width: 0, height: 4 },
                    };

              return (
                <View key={template.id} style={styles.timelineItem}>
                  {/* Dot */}
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: dotColor,
                        borderColor: colors.surface,
                      },
                    ]}
                  />

                  {/* Card */}
                  <View style={[styles.timelineCard, bgStyle]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <Text style={[styles.cardTimeLabel, { color: dotColor }]}>
                          {sortedBlocks.length > 0
                            ? `${formatTime(sortedBlocks[0].startTime)} – ${formatTime(sortedBlocks[sortedBlocks.length - 1].endTime)}`
                            : 'No blocks'}
                        </Text>
                        <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                          {template.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => navigation.navigate('TemplateEditor', { template })}
                      >
                        <Text style={[styles.moreIcon, { color: colors.outline }]}>
                          {'\u22EE'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Block preview list */}
                    {sortedBlocks.slice(0, 3).map((block) => (
                      <View key={block.id} style={styles.blockPreviewRow}>
                        <Text style={[styles.blockPreviewTime, { color: colors.onSurfaceVariant }]}>
                          {formatTime(block.startTime)} – {formatTime(block.endTime)}
                        </Text>
                        <Text
                          style={[styles.blockPreviewActivity, { color: colors.onSurface }]}
                          numberOfLines={1}
                        >
                          {block.activity}
                        </Text>
                      </View>
                    ))}
                    {sortedBlocks.length > 3 && (
                      <Text style={[styles.blockMore, { color: colors.onSurfaceVariant }]}>
                        +{sortedBlocks.length - 3} more...
                      </Text>
                    )}

                    {/* Tags */}
                    <View style={styles.tagRow}>
                      <View style={[styles.tag, { backgroundColor: dotColor + '0D' }]}>
                        <Text style={[styles.tagText, { color: dotColor }]}>
                          {sortedBlocks.length} Block{sortedBlocks.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      {sortedBlocks.some((b) => b.tracked) && (
                        <View style={[styles.tag, { backgroundColor: colors.tertiary + '0D' }]}>
                          <Text style={[styles.tagText, { color: colors.tertiary }]}>Tracked</Text>
                        </View>
                      )}
                    </View>

                    {/* Actions */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                        onPress={() => navigation.navigate('TemplateEditor', { template })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.errorContainer + '66' }]}
                        onPress={() => confirmDeleteTemplate(template)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('TemplateEditor', {})}
        activeOpacity={0.8}
      >
        <Text style={[styles.fabIcon, { color: colors.onPrimary }]}>+</Text>
      </TouchableOpacity>
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
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 36,
    lineHeight: 42,
  },

  // ── Week strip ──
  weekSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    ...typography.sectionLabel,
    marginBottom: 6,
  },
  sectionHint: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    marginBottom: 12,
  },
  dowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dowCell: {
    flex: 1,
    minWidth: 42,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  dowLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dowTemplateName: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 8,
    marginTop: 3,
    textAlign: 'center',
  },
  dowEmpty: {
    fontSize: 14,
    marginTop: 2,
  },

  // ── Picker Panel ──
  pickerPanel: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  pickerTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    marginBottom: 16,
  },
  pickerEmpty: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  pickerRowName: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  pickerRowMeta: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
  },
  clearBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 8,
  },
  clearBtnText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  cancelBtnText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },

  // ── Templates Section ──
  templatesSection: {
    marginBottom: 16,
  },

  // ── Timeline ──
  timeline: {
    position: 'relative',
    paddingLeft: 28,
  },
  timelineLine: {
    position: 'absolute',
    left: 9,
    top: 12,
    bottom: 12,
    width: 1,
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 20,
  },
  timelineDot: {
    position: 'absolute',
    left: -24,
    top: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    zIndex: 2,
  },
  timelineCard: {
    borderRadius: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTimeLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: 'Newsreader_600SemiBold_Italic',
    fontSize: 22,
    marginTop: 4,
  },
  moreIcon: {
    fontSize: 20,
    paddingHorizontal: 4,
  },

  // ── Block Preview ──
  blockPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  blockPreviewTime: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    width: 120,
  },
  blockPreviewActivity: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    flex: 1,
  },
  blockMore: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },

  // ── Tags ──
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Card Actions ──
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },

  // ── Empty ──
  emptyCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowOpacity: 0.02,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  emptyText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
  },
  emptyHint: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
