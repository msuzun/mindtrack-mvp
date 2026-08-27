import { useCallback, useEffect, useState } from 'react';
import { LocalCoach } from '../services/LocalRuleBasedCoachEngine';
import { CoachInsight } from '../types';

export function useCoachInsights() {
  const [insights, setInsights] = useState<CoachInsight[]>([]); const [busyId, setBusyId] = useState<string | null>(null);
  const refresh = useCallback(async () => setInsights(await LocalCoach.generateInsights()), []);
  useEffect(() => { let active = true; void LocalCoach.generateInsights().then((items) => { if (active) setInsights(items); }); return () => { active = false; }; }, []);
  const apply = async (item: CoachInsight) => { setBusyId(item.id); try { await LocalCoach.applyAction(item.actionType, item.actionPayload); await LocalCoach.dismiss(item.id); await refresh(); return true; } finally { setBusyId(null); } };
  const dismiss = async (item: CoachInsight) => { await LocalCoach.dismiss(item.id); setInsights((current) => current.filter((entry) => entry.id !== item.id)); };
  return { insights, busyId, refresh, apply, dismiss };
}
