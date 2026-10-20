import type { StudyProgress } from "../../api/studyProgress";
import { formatDuration } from "../exam/format";

export interface ProgressLine {
  key: string;
  label: string;
  value: string;
}

const NUMBER = new Intl.NumberFormat("pl-PL");

/**
 * Co zniknie po wyzerowaniu, jako lista „co: ile". Pozycje z zerem pomijamy, żeby lista mówiła tylko o tym, co naprawdę
 * jest do skasowania. Pusta lista oznacza, że nie ma czego zerować.
 */
export function progressLines(progress: StudyProgress): ProgressLine[] {
  const lines: ProgressLine[] = [];
  const add = (key: string, label: string, count: number) => {
    if (count > 0) lines.push({ key, label, value: NUMBER.format(count) });
  };
  add("testQuestions", "Pytania w nauce (testy)", progress.testQuestions);
  add("flashcards", "Pytania w nauce (fiszki)", progress.flashcards);
  add("answers", "Zapisane odpowiedzi", progress.answers);
  add("manualFlashcards", "Fiszki dodane ręcznie", progress.manualFlashcards);
  add("customTests", "Własne testy", progress.customTests);
  add("exams", "Egzaminy próbne", progress.exams);
  if (progress.studyTimeSeconds > 0) {
    lines.push({
      key: "studyTime",
      label: "Czas nauki",
      value: progress.studyTimeSeconds < 60 ? "poniżej minuty" : formatDuration(progress.studyTimeSeconds),
    });
  }
  return lines;
}
