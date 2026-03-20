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
import { deleteTemplate, assignWeekday, loadAssignments } from '../storage/scheduler';
import { ScheduleTemplate } from '../types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Palette of accent colors for template cards
const TEMPLATE_COLORS = [
  '#1a237e', '#00695c', '#4a148c', '#bf360c', '#1565c0', '#558b2f', '#6a1b9a',
];

function templateColor(index: number): string {
  return TEMPLATE_COLORS[index % TEMPLATE_COLORS.length];
}

function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr;
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m}${period}`;
}

export default function SchedulerScreen() {
  const navigation = useNavigation<any>();
  const { templates, assignments, setTemplates, setAssignments } = useScheduler();
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={styles.headerBlock}>
          <Text style={styles.headerTitle}>Daily Scheduler</Text>
          <Text style={styles.headerSub}>Build templates and assign them to days</Text>
        </View>

        {/* ── Weekly Assignment Grid ── */}
        <Text style={styles.sectionLabel}>Weekly Defaults</Text>
        <Text style={styles.sectionHint}>Tap a day to assign a template</Text>
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
                  assigned && { backgroundColor: templateColor(colorIdx), borderColor: templateColor(colorIdx) },
                  isSelecting && styles.dowCellSelecting,
                ]}
                onPress={() => handleDowPress(dow)}
              >
                <Text style={[styles.dowLabel, assigned && styles.dowLabelAssigned]}>{label}</Text>
                {assigned ? (
                  <Text style={styles.dowTemplateName} numberOfLines={1}>{assigned.name}</Text>
                ) : (
                  <Text style={styles.dowEmpty}>—</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Template picker for selected day */}
        {assigningDow !== null && (
          <View style={styles.pickerPanel}>
            <Text style={styles.pickerTitle}>
              Assign template to {DAY_LABELS[assigningDow]}
            </Text>
            {templates.length === 0 ? (
              <Text style={styles.pickerEmpty}>No templates yet. Create one below.</Text>
            ) : (
              templates.map((t, idx) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.pickerRow, { borderLeftColor: templateColor(idx) }]}
                  onPress={() => handleAssignTemplate(assigningDow, t.id)}
                >
                  <Text style={styles.pickerRowName}>{t.name}</Text>
                  <Text style={styles.pickerRowMeta}>{t.blocks.length} block{t.blocks.length !== 1 ? 's' : ''}</Text>
                </TouchableOpacity>
              ))
            )}
            {assignments.weekdays[String(assigningDow)] && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => handleAssignTemplate(assigningDow, null)}
              >
                <Text style={styles.clearBtnText}>Clear assignment</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAssigningDow(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Templates list ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Templates</Text>
        </View>

        {templates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No templates yet.</Text>
            <Text style={styles.emptyHint}>Tap + below to create your first schedule template.</Text>
          </View>
        ) : (
          templates.map((template, idx) => {
            const color = templateColor(idx);
            const sortedBlocks = [...template.blocks].sort((a, b) =>
              a.startTime.localeCompare(b.startTime)
            );
            return (
              <View key={template.id} style={[styles.templateCard, { borderLeftColor: color }]}>
                <View style={styles.templateCardHeader}>
                  <Text style={[styles.templateName, { color }]}>{template.name}</Text>
                  <View style={styles.templateActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => navigation.navigate('TemplateEditor', { template })}
                    >
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDelete]}
                      onPress={() => confirmDeleteTemplate(template)}
                    >
                      <Text style={[styles.actionBtnText, styles.actionBtnDeleteText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.templateBlockCount}>
                  {template.blocks.length} time block{template.blocks.length !== 1 ? 's' : ''}
                </Text>
                {sortedBlocks.slice(0, 3).map((block) => (
                  <View key={block.id} style={styles.blockPreviewRow}>
                    <Text style={styles.blockPreviewTime}>
                      {formatTime(block.startTime)} – {formatTime(block.endTime)}
                    </Text>
                    <Text style={styles.blockPreviewActivity} numberOfLines={1}>
                      {block.activity}
                    </Text>
                  </View>
                ))}
                {sortedBlocks.length > 3 && (
                  <Text style={styles.blockPreviewMore}>
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
        style={styles.fab}
        onPress={() => navigation.navigate('TemplateEditor', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  scroll: { padding: 16 },

  headerBlock: {
    backgroundColor: '#1a237e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerSub: { color: '#9fa8da', fontSize: 13, marginTop: 4 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a237e',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  sectionHint: { fontSize: 12, color: '#888', marginBottom: 10 },
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
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#dde3f0',
  },
  dowCellSelecting: {
    borderColor: '#1a237e',
    borderWidth: 2,
  },
  dowLabel: { fontSize: 11, fontWeight: '700', color: '#1a237e' },
  dowLabelAssigned: { color: '#fff' },
  dowTemplateName: { fontSize: 9, color: '#e8eaf6', marginTop: 2, textAlign: 'center' },
  dowEmpty: { fontSize: 14, color: '#c5cae9', marginTop: 2 },

  // Template picker panel
  pickerPanel: {
    backgroundColor: '#fff',
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
  pickerTitle: { fontSize: 14, fontWeight: '700', color: '#1a237e', marginBottom: 12 },
  pickerEmpty: { fontSize: 13, color: '#aaa', marginBottom: 8 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    marginBottom: 8,
  },
  pickerRowName: { fontSize: 14, fontWeight: '600', color: '#222' },
  pickerRowMeta: { fontSize: 12, color: '#888' },
  clearBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fce4ec',
    marginBottom: 8,
  },
  clearBtnText: { color: '#c62828', fontSize: 13, fontWeight: '600' },
  cancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f4f8',
  },
  cancelBtnText: { color: '#555', fontSize: 13, fontWeight: '600' },

  // Template cards
  templateCard: {
    backgroundColor: '#fff',
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
  templateBlockCount: { fontSize: 12, color: '#888', marginBottom: 8 },
  templateActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#e8eaf6',
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#1a237e' },
  actionBtnDelete: { backgroundColor: '#fce4ec' },
  actionBtnDeleteText: { color: '#c62828' },

  blockPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  blockPreviewTime: {
    fontSize: 11,
    color: '#888',
    width: 130,
    fontVariant: ['tabular-nums'],
  },
  blockPreviewActivity: { fontSize: 12, color: '#333', flex: 1, fontWeight: '500' },
  blockPreviewMore: { fontSize: 11, color: '#9fa8da', marginTop: 2 },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#aaa' },
  emptyHint: { fontSize: 13, color: '#bbb', marginTop: 6, textAlign: 'center' },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    backgroundColor: '#1a237e',
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
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
