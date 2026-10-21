import type { AdminQuestion, AdminSource, CorrectOption, QuestionInput } from "../../api/admin";

/** Wartości pól formularza pytania (wszystko jako tekst, jak w polach formularza). */
export interface QuestionFormValue {
  actId: string;
  sectionId: string;
  sourceId: string;
  body: string;
  optionA: string;
  optionB: string;
  optionC: string;
  correctOption: CorrectOption | "";
  explanation: string;
  legalBasis: string;
  validAsOf: string;
  lawChangedAt: string;
  lawChangeNote: string;
}

export interface QuestionDefaults {
  actId?: number;
  sectionId?: number;
  sourceId?: number;
}

export function emptyValue(defaults: QuestionDefaults, sources: AdminSource[]): QuestionFormValue {
  const authored = sources.find((s) => s.kind === "AUTHORED");
  const sourceId = defaults.sourceId ?? authored?.id;
  return {
    actId: defaults.actId ? String(defaults.actId) : "",
    sectionId: defaults.actId && defaults.sectionId ? String(defaults.sectionId) : "",
    sourceId: sourceId ? String(sourceId) : "",
    body: "",
    optionA: "",
    optionB: "",
    optionC: "",
    correctOption: "",
    explanation: "",
    legalBasis: "",
    validAsOf: "",
    lawChangedAt: "",
    lawChangeNote: "",
  };
}

export function fromQuestion(q: AdminQuestion): QuestionFormValue {
  return {
    actId: String(q.actId),
    sectionId: q.sectionId ? String(q.sectionId) : "",
    sourceId: String(q.sourceId),
    body: q.body,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    correctOption: q.correctOption,
    explanation: q.explanation ?? "",
    legalBasis: q.legalBasis ?? "",
    validAsOf: q.validAsOf ?? "",
    lawChangedAt: q.lawChangedAt ?? "",
    lawChangeNote: q.lawChangeNote ?? "",
  };
}

/** Pierwszy problem w formularzu albo null. Te same reguły sprawdza serwer; tu tylko szybciej i bez przesyłania. */
export function validate(v: QuestionFormValue): string | null {
  if (!v.actId) return "Wybierz akt prawny.";
  if (!v.sourceId) return "Wybierz źródło pytania.";
  if (!v.body.trim()) return "Wpisz treść pytania.";
  if (!v.optionA.trim()) return "Wpisz odpowiedź A.";
  if (!v.optionB.trim()) return "Wpisz odpowiedź B.";
  if (!v.optionC.trim()) return "Wpisz odpowiedź C.";
  if (!v.correctOption) return "Wskaż poprawną odpowiedź (A, B albo C).";
  if (v.lawChangeNote.trim() && !v.lawChangedAt) return "Opis zmiany w prawie wymaga daty zmiany.";
  return null;
}

export function toInput(v: QuestionFormValue): QuestionInput {
  const optional = (text: string) => (text.trim() === "" ? null : text.trim());
  return {
    actId: Number(v.actId),
    sectionId: v.sectionId ? Number(v.sectionId) : null,
    sourceId: Number(v.sourceId),
    body: v.body.trim(),
    optionA: v.optionA.trim(),
    optionB: v.optionB.trim(),
    optionC: v.optionC.trim(),
    correctOption: v.correctOption === "" ? null : v.correctOption,
    explanation: optional(v.explanation),
    legalBasis: optional(v.legalBasis),
    validAsOf: optional(v.validAsOf),
    lawChangedAt: optional(v.lawChangedAt),
    lawChangeNote: optional(v.lawChangeNote),
  };
}
