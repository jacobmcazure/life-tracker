import React, { createContext, useContext, useEffect, useState } from 'react';
import { ScheduleTemplate, DayAssignment, BlockCompletions, DayNote } from '../types';
import {
  loadTemplates,
  saveTemplates,
  loadAssignments,
  saveAssignments,
} from '../storage/scheduler';
import {
  loadBlockCompletions,
  saveBlockCompletions,
} from '../storage/blockCompletions';
import {
  loadDayNotes,
  upsertDayNote as upsertDayNoteStorage,
} from '../storage/notes';

interface SchedulerContextValue {
  templates: ScheduleTemplate[];
  assignments: DayAssignment;
  blockCompletions: BlockCompletions;
  dayNotes: DayNote[];
  setTemplates: (templates: ScheduleTemplate[]) => Promise<void>;
  setAssignments: (assignments: DayAssignment) => Promise<void>;
  toggleBlockCompletion: (dateKey: string, blockId: string) => Promise<void>;
  upsertDayNote: (dateKey: string, text: string) => Promise<void>;
  reloadScheduler: () => Promise<void>;
}

const SchedulerContext = createContext<SchedulerContextValue>({
  templates: [],
  assignments: { weekdays: {}, dates: {} },
  blockCompletions: {},
  dayNotes: [],
  setTemplates: async () => {},
  setAssignments: async () => {},
  toggleBlockCompletion: async () => {},
  upsertDayNote: async () => {},
  reloadScheduler: async () => {},
});

export function SchedulerProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplatesState] = useState<ScheduleTemplate[]>([]);
  const [assignments, setAssignmentsState] = useState<DayAssignment>({ weekdays: {}, dates: {} });
  const [blockCompletions, setBlockCompletions] = useState<BlockCompletions>({});
  const [dayNotes, setDayNotes] = useState<DayNote[]>([]);

  const reloadScheduler = async () => {
    const [t, a, bc, dn] = await Promise.all([
      loadTemplates(),
      loadAssignments(),
      loadBlockCompletions(),
      loadDayNotes(),
    ]);
    setTemplatesState(t);
    setAssignmentsState(a);
    setBlockCompletions(bc);
    setDayNotes(dn);
  };

  useEffect(() => {
    reloadScheduler();
  }, []);

  const setTemplates = async (updated: ScheduleTemplate[]) => {
    setTemplatesState(updated);
    await saveTemplates(updated);
  };

  const setAssignments = async (updated: DayAssignment) => {
    setAssignmentsState(updated);
    await saveAssignments(updated);
  };

  const toggleBlockCompletion = async (dateKey: string, blockId: string) => {
    const dayData = blockCompletions[dateKey] ?? {};
    const updated: BlockCompletions = {
      ...blockCompletions,
      [dateKey]: {
        ...dayData,
        [blockId]: !dayData[blockId],
      },
    };
    setBlockCompletions(updated);
    await saveBlockCompletions(updated);
  };

  const upsertDayNote = async (dateKey: string, text: string) => {
    const updated = await upsertDayNoteStorage(dateKey, text);
    setDayNotes(updated);
  };

  return (
    <SchedulerContext.Provider
      value={{
        templates,
        assignments,
        blockCompletions,
        dayNotes,
        setTemplates,
        setAssignments,
        toggleBlockCompletion,
        upsertDayNote,
        reloadScheduler,
      }}
    >
      {children}
    </SchedulerContext.Provider>
  );
}

export function useScheduler() {
  return useContext(SchedulerContext);
}
