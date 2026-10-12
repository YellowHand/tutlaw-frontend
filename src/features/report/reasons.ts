import type { ReportReason } from "../../api/reports";

export const REPORT_COMMENT_MAX_LENGTH = 1000;

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "WRONG_ANSWER", label: "Zaznaczona odpowiedź jest błędna" },
  { value: "OUTDATED", label: "Przepis się zmienił (pytanie jest nieaktualne)" },
  { value: "UNCLEAR", label: "Literówka albo niejasne sformułowanie" },
  { value: "OTHER", label: "Coś innego" },
];
