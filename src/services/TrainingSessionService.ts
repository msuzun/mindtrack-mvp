import { insertTrainingSession } from '../db/database';
import { CreateTrainingSessionInput, TrainingSession } from '../types';
import { RecordTrackerService } from './RecordTrackerService';

function createId() {
  return `training-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function optionalCount(value: number | null) {
  if (value == null) return null;
  return Math.max(0, Math.round(value));
}

export const TrainingSessionService = {
  calculateAccuracy(correct: number | null, total: number | null) {
    if (correct == null || total == null || total <= 0) return null;
    return Math.round(Math.min(100, Math.max(0, correct / total * 100)) * 10) / 10;
  },

  async save(input: CreateTrainingSessionInput): Promise<TrainingSession> {
    const totalItems = optionalCount(input.totalItems);
    const correctCount = optionalCount(input.correctCount);
    const incorrectCount = optionalCount(input.incorrectCount);
    const effectiveTotal = totalItems ?? (
      correctCount != null && incorrectCount != null ? correctCount + incorrectCount : null
    );
    if (effectiveTotal != null && correctCount != null && correctCount > effectiveTotal) {
      throw new Error('Doğru sayısı toplam öğe sayısını aşamaz.');
    }

    const session: TrainingSession = {
      ...input,
      id: createId(),
      totalItems: effectiveTotal,
      correctCount,
      incorrectCount,
      durationSeconds: Math.max(0, Math.round(input.durationSeconds)),
      accuracyRate: this.calculateAccuracy(correctCount, effectiveTotal),
      rating: input.rating == null ? null : Math.min(5, Math.max(1, Math.round(input.rating))),
      notes: input.notes?.trim() || null,
      createdAt: new Date().toISOString(),
    };
    await insertTrainingSession(session);
    await RecordTrackerService.checkTrainingSession(session);
    return session;
  },
};
