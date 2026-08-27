import { useCallback, useEffect, useRef, useState } from 'react';
import { saveFocusSession } from '../db/database';
import { HapticService } from '../services/HapticService';

export type FocusTimerMode = 15 | 25 | 45 | 'stopwatch';

export function useFocusTimer(taskId: number, initialMode: FocusTimerMode = 25) {
  const [mode, setModeState] = useState<FocusTimerMode>(initialMode);
  const initialSeconds = initialMode === 'stopwatch' ? 0 : initialMode * 60;
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const startedAt = useRef<number | null>(null);
  const baseSeconds = useRef(initialSeconds);
  const secondsRef = useRef(initialSeconds);
  const recorded = useRef(false);

  useEffect(() => { secondsRef.current = seconds; }, [seconds]);

  const elapsedSeconds = useCallback(() => mode === 'stopwatch'
    ? secondsRef.current
    : Math.max(0, mode * 60 - secondsRef.current), [mode]);

  const recordSession = useCallback(async (duration = elapsedSeconds()) => {
    if (recorded.current || duration <= 0) return;
    recorded.current = true;
    await saveFocusSession(taskId, duration);
  }, [elapsedSeconds, taskId]);

  useEffect(() => {
    if (!running) return;
    startedAt.current = Date.now();
    baseSeconds.current = seconds;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000);
      const next = mode === 'stopwatch'
        ? baseSeconds.current + elapsed
        : Math.max(0, baseSeconds.current - elapsed);
      setSeconds(next);
      if (mode !== 'stopwatch' && next === 0) {
        setRunning(false);
        void recordSession(mode * 60);
        void HapticService.taskCompleted();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [mode, recordSession, running]);

  const setMode = (next: FocusTimerMode) => {
    setRunning(false);
    setModeState(next);
    setSeconds(next === 'stopwatch' ? 0 : next * 60);
    recorded.current = false;
  };

  const toggle = () => setRunning((value) => !value);
  const reset = () => {
    setRunning(false);
    setSeconds(mode === 'stopwatch' ? 0 : mode * 60);
    recorded.current = false;
  };

  return { mode, seconds, running, setMode, toggle, reset, recordSession, elapsedSeconds };
}
