import { Link } from "react-router-dom";
import { Eye, EyeOff, Flag, Pencil, Tags } from "lucide-react";
import type { AdminQuestion } from "../../api/admin";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ROUTES } from "../../config/routes";
import { Badge } from "./adminUi";
import { formatIsoDate } from "./dates";
import { markLabel } from "./marks";
import { QuestionOptions } from "./QuestionOptions";

interface QuestionCardProps {
  question: AdminQuestion;
  onEdit: () => void;
  onMarks: () => void;
  onToggleHidden: () => void;
  onToggleFlashcard: () => void;
}

/** Jedno pytanie na liście panelu: treść z odpowiedziami, położenie, stany i działania. */
export function QuestionCard({ question: q, onEdit, onMarks, onToggleHidden, onToggleFlashcard }: QuestionCardProps) {
  const shownMarks = q.marks.filter((m) => m.status !== "REJECTED");
  return (
    <Card className="flex flex-col gap-3" data-testid={`question-${q.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-fg-muted">Nr {q.id}</span>
        {q.hidden && (
          <Badge tone="warn" data-testid={`question-hidden-${q.id}`}>
            Ukryte
          </Badge>
        )}
        {q.flashcardHidden && <Badge data-testid={`question-flashcard-hidden-${q.id}`}>Fiszka ukryta</Badge>}
        {q.openReports > 0 && (
          <Link to={ROUTES.adminReports} className="rounded-full" data-testid={`question-reports-${q.id}`}>
            <Badge tone="warn">
              <Flag size={12} aria-hidden="true" className="mr-1" />
              Zgłoszenia: {q.openReports}
            </Badge>
          </Link>
        )}
        {shownMarks.map((m) => (
          <Badge key={m.mark} data-testid={`question-mark-${q.id}-${m.mark}`}>
            {markLabel(m.mark)}
            {m.status === "SUGGESTED" ? " (propozycja)" : ""}
          </Badge>
        ))}
      </div>
      <p className="text-base break-words whitespace-pre-line">{q.body}</p>
      <QuestionOptions optionA={q.optionA} optionB={q.optionB} optionC={q.optionC} correctOption={q.correctOption} />
      {q.explanation && (
        <p className="text-sm text-fg-muted whitespace-pre-line">
          <span className="font-medium text-fg">Wyjaśnienie: </span>
          {q.explanation}
        </p>
      )}
      <p className="text-sm text-fg-muted">
        {q.actShortName}
        {q.sectionName ? ` · ${q.sectionName}` : ""} · {q.sourceName}
        {q.legalBasis ? ` · ${q.legalBasis}` : ""}
      </p>
      {q.lawChangedAt && (
        <p className="text-sm text-fg-muted" data-testid={`question-law-${q.id}`}>
          Zmiana w prawie od {formatIsoDate(q.lawChangedAt)}
          {q.lawChangeNote ? `: ${q.lawChangeNote}` : ""}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onEdit} data-testid={`question-edit-${q.id}`}>
          <Pencil size={16} aria-hidden="true" />
          Edytuj
        </Button>
        <Button type="button" variant="ghost" onClick={onMarks} data-testid={`question-marks-${q.id}`}>
          <Tags size={16} aria-hidden="true" />
          Oznaczenia
        </Button>
        <Button type="button" variant="ghost" onClick={onToggleHidden} data-testid={`question-toggle-${q.id}`}>
          {q.hidden ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
          {q.hidden ? "Przywróć pytanie" : "Ukryj pytanie"}
        </Button>
        <Button type="button" variant="ghost" onClick={onToggleFlashcard} data-testid={`question-flashcard-${q.id}`}>
          {q.flashcardHidden ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
          {q.flashcardHidden ? "Przywróć fiszkę" : "Ukryj fiszkę"}
        </Button>
      </div>
    </Card>
  );
}
