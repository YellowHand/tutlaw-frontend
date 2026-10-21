import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, RotateCcw, Check, X } from "lucide-react";
import { decideReport, decideReportsOfQuestion, type AdminReport, type ReportReasonCode, type ReportStatus } from "../../api/admin";
import { LIST_PAGE_SIZE } from "../../api/pagination";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { cn } from "../../lib/cn";
import { serverMessage } from "../../lib/errors";
import { Pagination } from "../customTest/Pagination";
import { REPORT_REASONS } from "../report/reasons";
import { formatCount } from "../tests/format";
import { FlashMessage } from "./FlashMessage";
import { QuestionDialog } from "./QuestionDialog";
import { QuestionOptions } from "./QuestionOptions";
import { useAdminMutation, useAdminReports, useReportSummary } from "./adminQueries";
import { Badge, ConfirmDialog, SelectField } from "./adminUi";
import { formatIsoDateTime } from "./dates";
import { useAdminListParams } from "./useAdminListParams";
import { useFlash } from "./useFlash";
import { useQuestionVisibility } from "./questionVisibility";

const STATUS_TABS: { value: ReportStatus; label: string }[] = [
  { value: "NEW", label: "Nowe" },
  { value: "RESOLVED", label: "Poprawione" },
  { value: "REJECTED", label: "Odrzucone" },
];

function reasonLabel(reason: ReportReasonCode): string {
  return REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;
}

function parseStatus(value: string): ReportStatus {
  return value === "RESOLVED" || value === "REJECTED" ? value : "NEW";
}

function parseReason(value: string): ReportReasonCode | undefined {
  return REPORT_REASONS.some((r) => r.value === value) ? (value as ReportReasonCode) : undefined;
}

type Dialog = { kind: "edit"; questionId: number } | { kind: "hide"; report: AdminReport };

/**
 * Zgłoszenia błędów w pytaniach: karty ze stanem (nowe, poprawione, odrzucone) i filtrem powodu. Z karty można poprawić
 * pytanie, ukryć je, rozpatrzyć zgłoszenie albo wszystkie otwarte zgłoszenia tego pytania naraz. Zgłaszającego nie widać.
 */
export function AdminReportsPage() {
  const list = useAdminListParams();
  const status = parseStatus(list.get("status"));
  const reason = parseReason(list.get("reason"));

  const filter = useMemo(() => ({ status, reason, page: list.page, size: LIST_PAGE_SIZE }), [status, reason, list.page]);
  const { data, isLoading, isError, refetch } = useAdminReports(filter);
  const summary = useReportSummary();
  const { flash, ok, fail, clear } = useFlash();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const { hide } = useQuestionVisibility((text) => {
    setDialog(null);
    setDialogError(null);
    ok(text);
  });

  const decide = useAdminMutation(
    (v: { id: number; status: ReportStatus }) => decideReport(v.id, v.status),
    (_r, v) => ok(v.status === "RESOLVED" ? "Oznaczono zgłoszenie jako poprawione." : v.status === "REJECTED" ? "Odrzucono zgłoszenie." : "Otwarto zgłoszenie ponownie.")
  );
  const decideAll = useAdminMutation(
    (v: { questionId: number; status: "RESOLVED" | "REJECTED" }) => decideReportsOfQuestion(v.questionId, v.status),
    (r, v) =>
      ok(
        `${v.status === "RESOLVED" ? "Oznaczono jako poprawione" : "Odrzucono"} wszystkie otwarte zgłoszenia pytania nr ${v.questionId} (${formatCount(r.updated)}).`
      )
  );

  function close() {
    setDialog(null);
    setDialogError(null);
  }

  const counts: Record<ReportStatus, number | undefined> = {
    NEW: summary.data?.open,
    RESOLVED: summary.data?.resolved,
    REJECTED: summary.data?.rejected,
  };

  return (
    <div>
      <PageHeader title="Zgłoszenia błędów" subtitle="Co użytkownicy zgłosili w pytaniach: popraw pytanie, a potem rozpatrz zgłoszenie" />
      <div className="flex max-w-5xl flex-col gap-4 px-4 pb-8 sm:px-8">
        <FlashMessage flash={flash} />

        <Card className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div role="tablist" aria-label="Stan zgłoszeń" className="flex flex-wrap gap-2" data-testid="report-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => list.setParam("status", tab.value === "NEW" ? "" : tab.value)}
                className={cn(
                  "min-h-11 cursor-pointer rounded-full px-4 text-sm font-medium transition-colors",
                  status === tab.value ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg hover:bg-line"
                )}
                data-testid={`report-tab-${tab.value}`}
              >
                {tab.label}
                {counts[tab.value] !== undefined && <span className="ml-1.5 tabular-nums">({formatCount(counts[tab.value] ?? 0)})</span>}
              </button>
            ))}
          </div>
          <SelectField label="Powód" value={reason ?? ""} onChange={(e) => list.setParam("reason", e.target.value)} data-testid="report-filter-reason">
            <option value="">Wszystkie</option>
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </SelectField>
        </Card>

        {isLoading && <Skeleton className="h-72 w-full" />}
        {isError && <ErrorState message="Nie udało się pobrać zgłoszeń." onRetry={() => refetch()} />}
        {data && data.items.length === 0 && (
          <EmptyState
            title={status === "NEW" ? "Nie ma nowych zgłoszeń" : "Brak zgłoszeń w tym stanie"}
            description={reason ? "Zmień powód albo wybierz „Wszystkie”." : "Gdy ktoś zgłosi błąd w pytaniu, pojawi się tutaj."}
          />
        )}
        {data && data.items.length > 0 && (
          <>
            <ul className="flex flex-col gap-3" data-testid="report-list">
              {data.items.map((report) => (
                <li key={report.id}>
                  <ReportCard
                    report={report}
                    pending={decide.isPending || decideAll.isPending || hide.isPending}
                    onEdit={() => {
                      clear();
                      setDialog({ kind: "edit", questionId: report.questionId });
                    }}
                    onToggleHidden={() => {
                      clear();
                      if (report.questionHidden) {
                        hide.mutate({ id: report.questionId, hidden: false }, { onError: (e) => fail(e, "Nie udało się przywrócić pytania.") });
                      } else {
                        setDialogError(null);
                        setDialog({ kind: "hide", report });
                      }
                    }}
                    onDecide={(next) => {
                      clear();
                      decide.mutate({ id: report.id, status: next }, { onError: (e) => fail(e, "Nie udało się zmienić stanu zgłoszenia.") });
                    }}
                    onDecideAll={(next) => {
                      clear();
                      decideAll.mutate(
                        { questionId: report.questionId, status: next },
                        { onError: (e) => fail(e, "Nie udało się rozpatrzyć zgłoszeń pytania.") }
                      );
                    }}
                  />
                </li>
              ))}
            </ul>
            <Pagination
              page={data.page}
              size={data.size}
              totalElements={data.totalElements}
              totalPages={data.totalPages}
              onPage={(p) => list.setParam("page", p > 0 ? String(p) : "")}
              nouns={{ one: "zgłoszenie", few: "zgłoszenia", many: "zgłoszeń" }}
            />
          </>
        )}
      </div>

      {dialog?.kind === "edit" && (
        <QuestionDialog
          mode="edit"
          questionId={dialog.questionId}
          onSaved={(saved) => {
            close();
            ok(`Zapisano pytanie nr ${saved.id}. Teraz możesz oznaczyć zgłoszenia tego pytania jako poprawione.`);
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "hide" && (
        <ConfirmDialog
          title="Ukryć pytanie?"
          confirmLabel="Ukryj pytanie"
          pending={hide.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            hide.mutate({ id: dialog.report.questionId, hidden: true }, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się ukryć pytania.")) });
          }}
          onClose={close}
        >
          <p>
            Pytanie nr {dialog.report.questionId} zniknie <strong className="text-fg">u wszystkich użytkowników</strong>, dopóki go nie przywrócisz
            (zakładka Pytania). Historia odpowiedzi zostaje.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}

interface ReportCardProps {
  report: AdminReport;
  pending: boolean;
  onEdit: () => void;
  onToggleHidden: () => void;
  onDecide: (status: ReportStatus) => void;
  onDecideAll: (status: "RESOLVED" | "REJECTED") => void;
}

function ReportCard({ report, pending, onEdit, onToggleHidden, onDecide, onDecideAll }: ReportCardProps) {
  const open = report.status === "NEW";
  return (
    <Card className="flex flex-col gap-3" data-testid={`report-${report.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={open ? "warn" : "neutral"} data-testid={`report-reason-${report.id}`}>
          {reasonLabel(report.reason)}
        </Badge>
        <span className="text-sm text-fg-muted">Pytanie nr {report.questionId}</span>
        <span className="text-sm text-fg-muted">· zgłoszono {formatIsoDateTime(report.createdAt)}</span>
        {report.resolvedAt && <span className="text-sm text-fg-muted">· rozpatrzono {formatIsoDateTime(report.resolvedAt)}</span>}
        {report.questionHidden && (
          <Badge tone="warn" data-testid={`report-hidden-${report.id}`}>
            Pytanie ukryte
          </Badge>
        )}
      </div>
      {report.comment ? (
        <blockquote className="border-l-2 border-line pl-3 text-sm whitespace-pre-line break-words" data-testid={`report-comment-${report.id}`}>
          {report.comment}
        </blockquote>
      ) : (
        <p className="text-sm text-fg-muted">Bez komentarza.</p>
      )}
      <div className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3">
        <p className="text-sm break-words whitespace-pre-line">{report.questionBody}</p>
        <QuestionOptions optionA={report.optionA} optionB={report.optionB} optionC={report.optionC} correctOption={report.correctOption} />
      </div>
      {open && report.openForQuestion > 1 && (
        <p className="text-sm text-fg-muted" data-testid={`report-others-${report.id}`}>
          To pytanie ma {formatCount(report.openForQuestion)} otwartych zgłoszeń.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onEdit} data-testid={`report-edit-${report.id}`}>
          <Pencil size={16} aria-hidden="true" />
          Edytuj pytanie
        </Button>
        <Button type="button" variant="ghost" onClick={onToggleHidden} disabled={pending} data-testid={`report-toggle-${report.id}`}>
          {report.questionHidden ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
          {report.questionHidden ? "Przywróć pytanie" : "Ukryj pytanie"}
        </Button>
        {open ? (
          <>
            <Button type="button" onClick={() => onDecide("RESOLVED")} disabled={pending} data-testid={`report-resolve-${report.id}`}>
              <Check size={16} aria-hidden="true" />
              Poprawione
            </Button>
            <Button type="button" variant="ghost" onClick={() => onDecide("REJECTED")} disabled={pending} data-testid={`report-reject-${report.id}`}>
              <X size={16} aria-hidden="true" />
              Odrzuć
            </Button>
            {report.openForQuestion > 1 && (
              <Button type="button" variant="secondary" onClick={() => onDecideAll("RESOLVED")} disabled={pending} data-testid={`report-resolve-all-${report.id}`}>
                Wszystkie zgłoszenia tego pytania: poprawione
              </Button>
            )}
          </>
        ) : (
          <Button type="button" variant="ghost" onClick={() => onDecide("NEW")} disabled={pending} data-testid={`report-reopen-${report.id}`}>
            <RotateCcw size={16} aria-hidden="true" />
            Otwórz ponownie
          </Button>
        )}
      </div>
    </Card>
  );
}
