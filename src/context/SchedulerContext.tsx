import React, { createContext, useContext, useEffect, useState } from 'react';
import { ScheduleTemplate, DayAssignment } from '../types';
import {
  loadTemplates,
  saveTemplates,
  loadAssignments,
  saveAssignments,
} from '../storage/scheduler';

interface SchedulerContextValue {
  templates: ScheduleTemplate[];
  assignments: DayAssignment;
  setTemplates: (templates: ScheduleTemplate[]) => Promise<void>;
  setAssignments: (assignments: DayAssignment) => Promise<void>;
  reloadScheduler: () => Promise<void>;
}

const SchedulerContext = createContext<SchedulerContextValue>({
  templates: [],
  assignments: { weekdays: {}, dates: {} },
  setTemplates: async () => {},
  setAssignments: async () => {},
  reloadScheduler: async () => {},
});

export function SchedulerProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplatesState] = useState<ScheduleTemplate[]>([]);
  const [assignments, setAssignmentsState] = useState<DayAssignment>({ weekdays: {}, dates: {} });

  const reloadScheduler = async () => {
    const [t, a] = await Promise.all([loadTemplates(), loadAssignments()]);
    setTemplatesState(t);
    setAssignmentsState(a);
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

  return (
    <SchedulerContext.Provider value={{ templates, assignments, setTemplates, setAssignments, reloadScheduler }}>
      {children}
    </SchedulerContext.Provider>
  );
}

export function useScheduler() {
  return useContext(SchedulerContext);
}
