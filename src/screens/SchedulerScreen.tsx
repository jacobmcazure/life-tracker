import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useScheduler } from '../context/SchedulerContext';
import { useTheme } from '../context/SettingsContext';
import { deleteTemplate, assignWeekday, loadAssignments } from '../storage/scheduler';
import { formatTime } from '../utils/dates';
import { ScheduleTemplate } from '../types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Palette of accent colors for template cards
const TEMPLATE_COLORS = [
  '#1a237e', '#00695c', '#4a148c', '#bf360c', '#1565c0', '#558b2f', '#6a1b9a',
];

function templateColor(index: number): string {
  return TEMPLATE_COLORS[index % TEMPLATE_COLORS.length];
}

export default function SchedulerScreen() {
  const navigation = useNavigation<any>();
  const { templates, assignments, setTemplates, setAssignments } = useScheduler();
  const { colors } = useTheme();
  const [assigningDow, setAssigningDow] = useState<number | null>(null);

  // ── Template CRUD ──────────────────────────────────────────────────────────

  const confirmDeleteTemplate = (template: ScheduleTemplate) => {
    Alert.alert('Delete Template', `Delete "${template.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // deleteTemplate also cleans up any assignments pointing to this
          // template, so we reload assignments from storage afterwards.
          const nextTemplates = await deleteTemplate(template.id);
          const nextAssignments = await loadAssignments();
          setTemplates(nextTemplates);
          setAssignments(nextAssignments);
        },
      },
    ]);
  };

  // ── Day-of-week assignment ─────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={[styles.headerBlock, { backgroundColor: colors.headerBg }]}>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>Daily Scheduler</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>Build templates and assign them to days</Text>
        </View>

        {/* ── Weekly Assignment Grid ── */}
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>Weekly Defaults</Text>
        <Text style={[styles.sectionHint, { color: colors.muted }]}>Tap a day to assign a template</Text>
        <View style={styles.dowGrid}>
          {DAY_LABELS.map((label, dow) => {
            const assigned = getAssignedTemplate(dow);
            const colorIdx = assigned ? templates.indexOf(assigned) : -1;
            const isSelecting = assigningDow === dow;
            return (
              <TouchableOpacity
                key={dow}
                style={[
                  styles.dowCell,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  assigned && { backgroundColor: templateColor(colorIdx), borderColor: templateColor(colorIdx) },
                  isSelecting && [styles.dowCellSelecting, { borderColor: colors.primary }],
                ]}
                onPress={() => handleDowPress(dow)}
              >
                <Text style={[styles.dowLabel, { color: colors.primary }, assigned && [styles.dowLabelAssigned, { color: colors.headerText }]]}>{label}</Text>
                {assigned ? (
                  <Text style={[styles.dowTemplateName, { color: colors.headerText }]} numberOfLines={1}>{assigned.name}</Text>
                ) : (
                  <Text style={[styles.dowEmpty, { color: colors.muted }]}>—</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Template picker for selected day */}
        {assigningDow !== null && (
          <View style={[styles.pickerPanel, { backgroundColor: colors.card }]}>
            <Text style={[styles.pickerTitle, { color: colors.primary }]}>
              Assign template to {DAY_LABELS[assigningDow]}
            </Text>
            {templates.length === 0 ? (
              <Text style={[styles.pickerEmpty, { color: colors.muted }]}>No templates yet. Create one below.</Text>
            ) : (
              templates.map((t, idx) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.pickerRow, { borderLeftColor: templateColor(idx), backgroundColor: colors.inputBg }]}
                  onPress={() => handleAssignTemplate(assigningDow, t.id)}
                >
                  <Text style={[styles.pickerRowName, { color: colors.text }]}>{t.name}</Text>
                  <Text style={[styles.pickerRowMeta, { color: colors.muted }]}>{t.blocks.length} block{t.blocks.length !== 1 ? 's' : ''}</Text>
                </TouchableOpacity>
              ))
            )}
            {assignments.weekdays[String(assigningDow)] && (
              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: colors.dangerBg }]}
                onPress={() => handleAssignTemplate(assigningDow, null)}
              >
                <Text style={[styles.clearBtnText, { color: colors.dangerText }]}>Clear assignment</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.bg }]} onPress={() => setAssigningDow(null)}>
              <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Templates list ── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>Templates</Text>
        </View>

        {templates.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>No templates yet.</Text>
            <Text style={[styles.emptyHint, { color: colors.muted }]}>Tap + below to create your first schedule template.</Text>
          </View>
        ) : (
          templates.map((template, idx) => {
            const color = templateColor(idx);
            const sortedBlocks = [...template.blocks].sort((a, b) =>
              a.startTime.localeCompare(b.startTime)
            );
            return (
              <View key={template.id} style={[styles.templateCard, { backgroundColor: colors.card, borderLeftColor: color }]}>
                <View style={styles.templateCardHeader}>
                  <Text style={[styles.templateName, { color }]}>{template.name}</Text>
                  <View style={styles.templateActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.border }]}
                      onPress={() => navigation.navigate('TemplateEditor', { template })}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDelete, { backgroundColor: colors.dangerBg }]}
                      onPress={() => confirmDeleteTemplate(template)}
                    >
                      <Text style={[styles.actionBtnText, styles.actionBtnDeleteText, { color: colors.dangerText }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.templateBlockCount, { color: colors.muted }]}>
                  {template.blocks.length} time block{template.blocks.length !== 1 ? 's' : ''}
                </Text>
                {sortedBlocks.slice(0, 3).map((block) => (
                  <View key={block.id} style={styles.blockPreviewRow}>
                    <Text style={[styles.blockPreviewTime, { color: colors.muted }]}>
                      {formatTime(block.startTime)} – {formatTime(block.endTime)}
                    </Text>
                    <Text style={[styles.blockPreviewActivity, { color: colors.text }]} numberOfLines={1}>
                      {block.activity}
                    </Text>
                  </View>
                ))}
                {sortedBlocks.length > 3 && (
                  <Text style={[styles.blockPreviewMore, { color: colors.muted }]}>
                    +{sortedBlocks.length - 3} more…
                  </Text>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('TemplateEditor', {})}
      >
        <Text style={[styles.fabText, { color: colors.headerText }]}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },

  headerBlock: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 4 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  sectionHint: { fontSize: 12, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 6 },

  // Day-of-week grid
  dowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  dowCell: {
    width: '13%',
    minWidth: 42,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  dowCellSelecting: {
    borderWidth: 2,
  },
  dowLabel: { fontSize: 11, fontWeight: '700' },
  dowLabelAssigned: {},
  dowTemplateName: { fontSize: 9, marginTop: 2, textAlign: 'center' },
  dowEmpty: { fontSize: 14, marginTop: 2 },

  // Template picker panel
  pickerPanel: {
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    marginBottom: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pickerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  pickerEmpty: { fontSize: 13, marginBottom: 8 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  pickerRowName: { fontSize: 14, fontWeight: '600' },
  pickerRowMeta: { fontSize: 12 },
  clearBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  clearBtnText: { fontSize: 13, fontWeight: '600' },
  cancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600' },

  // Template cards
  templateCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  templateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  templateName: { fontSize: 17, fontWeight: '700', flex: 1 },
  templateBlockCount: { fontSize: 12, marginBottom: 8 },
  templateActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  actionBtnDelete: {},
  actionBtnDeleteText: {},

  blockPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  blockPreviewTime: {
    fontSize: 11,
    width: 130,
    fontVariant: ['tabular-nums'],
  },
  blockPreviewActivity: { fontSize: 12, flex: 1, fontWeight: '500' },
  blockPreviewMore: { fontSize: 11, marginTop: 2 },

  emptyCard: {
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptyHint: { fontSize: 13, marginTop: 6, textAlign: 'center' },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
