/** 7 → „0:07", 75 → „1:15", 3725 → „62:05" (bez godzin: pytanie nie trwa godzinami). */
export function formatQuestionTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
