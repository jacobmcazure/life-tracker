import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useScheduler } from '../context/SchedulerContext';
import { useTheme } from '../context/SettingsContext';
import { addTemplate, updateTemplate } from '../storage/scheduler';
import { formatTime } from '../utils/dates';
import { ScheduleTemplate, TimeBlock } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}

// ── Time Picker ────────────────────────────────────────────────────────────────

interface TimePickerModalProps {
  visible: boolean;
  value: string; // 'HH:mm'
  label: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

function TimePickerModal({ visible, value, label, onConfirm, onCancel }: TimePickerModalProps) {
  const { colors } = useTheme();
  const [hour, setHour] = useState(() => parseInt(value.split(':')[0], 10));
  const [minute, setMinute] = useState(() => parseInt(value.split(':')[1], 10));
  const [period, setPeriod] = useState<'am' | 'pm'>(() => (parseInt(value.split(':')[0], 10) >= 12 ? 'pm' : 'am'));

  // Sync when value prop changes (modal re-opened for a different block)
  React.useEffect(() => {
    const h = parseInt(value.split(':')[0], 10);
    const m = parseInt(value.split(':')[1], 10);
    setHour(h === 0 ? 12 : h > 12 ? h - 12 : h);
    setMinute(m);
    setPeriod(h >= 12 ? 'pm' : 'am');
  }, [value, visible]);

  const handleConfirm = () => {
    let h24 = hour % 12;
    if (period === 'pm') h24 += 12;
    onConfirm(`${pad(h24)}:${pad(minute)}`);
  };

  const adjustHour = (delta: number) => {
    setHour((prev) => {
      let next = prev + delta;
      if (next < 1) next = 12;
      if (next > 12) next = 1;
      return next;
    });
  };

  const adjustMinute = (delta: number) => {
    setMinute((prev) => {
      let next = prev + delta;
      if (next < 0) next = 55;
      if (next > 55) next = 0;
      return next;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={tp.overlay}>
        <View style={[tp.sheet, { backgroundColor: colors.card }]}>
          <Text style={[tp.title, { color: colors.primary }]}>{label}</Text>
          <View style={tp.pickerRow}>
            {/* Hour */}
            <View style={tp.spinnerCol}>
              <TouchableOpacity style={tp.arrowBtn} onPress={() => adjustHour(1)}>
                <Text style={[tp.arrow, { color: colors.primary }]}>▲</Text>
              </TouchableOpacity>
              <Text style={[tp.timeValue, { color: colors.text }]}>{pad(hour)}</Text>
              <TouchableOpacity style={tp.arrowBtn} onPress={() => adjustHour(-1)}>
                <Text style={[tp.arrow, { color: colors.primary }]}>▼</Text>
              </TouchableOpacity>
            </View>

            <Text style={[tp.colon, { color: colors.muted }]}>:</Text>

            {/* Minute */}
            <View style={tp.spinnerCol}>
              <TouchableOpacity style={tp.arrowBtn} onPress={() => adjustMinute(5)}>
                <Text style={[tp.arrow, { color: colors.primary }]}>▲</Text>
              </TouchableOpacity>
              <Text style={[tp.timeValue, { color: colors.text }]}>{pad(minute)}</Text>
              <TouchableOpacity style={tp.arrowBtn} onPress={() => adjustMinute(-5)}>
                <Text style={[tp.arrow, { color: colors.primary }]}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* AM/PM */}
            <View style={tp.periodCol}>
              <TouchableOpacity
                style={[tp.periodBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }, period === 'am' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setPeriod('am')}
              >
                <Text style={[tp.periodText, { color: colors.muted }, period === 'am' && { color: colors.headerText }]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[tp.periodBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }, period === 'pm' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setPeriod('pm')}
              >
                <Text style={[tp.periodText, { color: colors.muted }, period === 'pm' && { color: colors.headerText }]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={tp.btnRow}>
            <TouchableOpacity style={[tp.cancelBtn, { backgroundColor: colors.inputBg }]} onPress={onCancel}>
              <Text style={[tp.cancelText, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[tp.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleConfirm}>
              <Text style={[tp.confirmText, { color: colors.headerText }]}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

interface RouteParams {
  template?: ScheduleTemplate;
}

export default function TemplateEditorScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { template } = (route.params ?? {}) as RouteParams;
  const { setTemplates } = useScheduler();
  const { colors } = useTheme();

  const isEditing = !!template;

  const [name, setName] = useState(template?.name ?? '');
  const [blocks, setBlocks] = useState<TimeBlock[]>(
    template?.blocks ? [...template.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime)) : []
  );

  // Time picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ blockId: string; field: 'startTime' | 'endTime' } | null>(null);
  const pickerValue = pickerTarget
    ? (blocks.find((b) => b.id === pickerTarget.blockId)?.[pickerTarget.field] ?? '08:00')
    : '08:00';
  const pickerLabel = pickerTarget?.field === 'startTime' ? 'Start Time' : 'End Time';

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Template' : 'New Template' });
  }, [isEditing]);

  // ── Block operations ────────────────────────────────────────────────────────

  const addBlock = () => {
    const lastBlock = blocks[blocks.length - 1];
    const defaultStart = lastBlock ? lastBlock.endTime : '08:00';
    const defaultEndMins = timeToMinutes(defaultStart) + 60;
    const defaultEnd = minutesToTime(defaultEndMins > 1439 ? 1439 : defaultEndMins);
    const newBlock: TimeBlock = {
      id: uid(),
      startTime: defaultStart,
      endTime: defaultEnd,
      activity: '',
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const updateBlock = (id: string, patch: Partial<TimeBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  };

  const removeBlock = (id: string) => {
    Alert.alert('Remove Block', 'Remove this time block?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setBlocks((prev) => prev.filter((b) => b.id !== id)) },
    ]);
  };

  const openTimePicker = (blockId: string, field: 'startTime' | 'endTime') => {
    setPickerTarget({ blockId, field });
    setPickerVisible(true);
  };

  const handleTimeConfirm = (value: string) => {
    if (pickerTarget) {
      updateBlock(pickerTarget.blockId, { [pickerTarget.field]: value });
    }
    setPickerVisible(false);
    setPickerTarget(null);
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for this template.');
      return;
    }
    if (blocks.length === 0) {
      Alert.alert('No blocks', 'Please add at least one time block.');
      return;
    }

    // Validate: endTime > startTime for every block
    for (const block of blocks) {
      if (!block.activity.trim()) {
        Alert.alert('Activity missing', 'Please fill in the activity for every time block.');
        return;
      }
      if (timeToMinutes(block.endTime) <= timeToMinutes(block.startTime)) {
        Alert.alert(
          'Invalid time',
          `End time must be after start time for "${block.activity || 'a block'}".`
        );
        return;
      }
    }

    const sortedBlocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (isEditing) {
      const updated: ScheduleTemplate = { ...template!, name: name.trim(), blocks: sortedBlocks };
      const next = await updateTemplate(updated);
      setTemplates(next);
    } else {
      const newTemplate: ScheduleTemplate = {
        id: uid(),
        name: name.trim(),
        blocks: sortedBlocks,
        createdAt: new Date().toISOString(),
      };
      const next = await addTemplate(newTemplate);
      setTemplates(next);
    }

    navigation.goBack();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const sortedBlocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Template Name */}
        <Text style={[styles.fieldLabel, { color: colors.primary }]}>Template Name</Text>
        <TextInput
          style={[styles.nameInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="e.g. Weekday, Weekend, Rest Day…"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
          maxLength={40}
        />

        {/* Blocks */}
        <Text style={[styles.fieldLabel, { color: colors.primary }]}>Time Blocks</Text>
        {sortedBlocks.length === 0 && (
          <Text style={[styles.emptyHint, { color: colors.muted }]}>No blocks yet. Tap "Add Block" to get started.</Text>
        )}

        {sortedBlocks.map((block, index) => (
          <View key={block.id} style={[styles.blockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.blockHeader}>
              <Text style={[styles.blockIndex, { color: colors.primary }]}>Block {index + 1}</Text>
              <TouchableOpacity onPress={() => removeBlock(block.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.removeText, { color: colors.dangerText }]}>Remove</Text>
              </TouchableOpacity>
            </View>

            {/* Activity */}
            <Text style={[styles.subLabel, { color: colors.muted }]}>Activity</Text>
            <TextInput
              style={[styles.activityInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Walk Dogs, Study, Gym…"
              placeholderTextColor={colors.muted}
              value={block.activity}
              onChangeText={(t) => updateBlock(block.id, { activity: t })}
              maxLength={60}
            />

            {/* Time range */}
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={[styles.subLabel, { color: colors.muted }]}>Start</Text>
                <TouchableOpacity
                  style={[styles.timeBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
                  onPress={() => openTimePicker(block.id, 'startTime')}
                >
                  <Text style={[styles.timeBtnText, { color: colors.primary }]}>{formatTime(block.startTime)}</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.timeDash, { color: colors.muted }]}>–</Text>
              <View style={styles.timeField}>
                <Text style={[styles.subLabel, { color: colors.muted }]}>End</Text>
                <TouchableOpacity
                  style={[styles.timeBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
                  onPress={() => openTimePicker(block.id, 'endTime')}
                >
                  <Text style={[styles.timeBtnText, { color: colors.primary }]}>{formatTime(block.endTime)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.durationBox}>
                <Text style={[styles.durationLabel, { color: colors.muted }]}>Duration</Text>
                <Text style={[styles.durationValue, { color: colors.muted }]}>
                  {(() => {
                    const diff = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
                    if (diff <= 0) return '—';
                    const h = Math.floor(diff / 60);
                    const m = diff % 60;
                    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
                  })()}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={[styles.addBlockBtn, { borderColor: colors.border }]} onPress={addBlock}>
          <Text style={[styles.addBlockBtnText, { color: colors.primary }]}>+ Add Block</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={[styles.saveBtnText, { color: colors.headerText }]}>{isEditing ? 'Save Changes' : 'Create Template'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={pickerVisible}
        value={pickerValue}
        label={pickerLabel}
        onConfirm={handleTimeConfirm}
        onCancel={() => { setPickerVisible(false); setPickerTarget(null); }}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 60 },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 16,
  },
  nameInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
  },

  emptyHint: { fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 4 },

  blockCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  blockIndex: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  removeText: { fontSize: 12, fontWeight: '600' },

  subLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  activityInput: {
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 12,
  },

  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  timeField: { flex: 1 },
  timeBtn: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  timeBtnText: { fontSize: 15, fontWeight: '700' },
  timeDash: { fontSize: 18, paddingBottom: 8 },
  durationBox: { alignItems: 'center', paddingBottom: 4, minWidth: 52 },
  durationLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  durationValue: { fontSize: 14, fontWeight: '700' },

  addBlockBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  addBlockBtnText: { fontSize: 15, fontWeight: '600' },

  saveBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
});

// ── Time Picker Modal Styles ───────────────────────────────────────────────────

const tp = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  spinnerCol: { alignItems: 'center', width: 64 },
  arrowBtn: { padding: 8 },
  arrow: { fontSize: 18 },
  timeValue: { fontSize: 36, fontWeight: '700', width: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  colon: { fontSize: 32, fontWeight: '700', paddingBottom: 4 },
  periodCol: { gap: 8, marginLeft: 8 },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  periodText: { fontSize: 14, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700' },
});
