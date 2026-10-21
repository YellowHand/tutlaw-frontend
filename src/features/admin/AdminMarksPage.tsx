import { useMemo, useState } from "react";
import { Check, Play, RotateCcw, X } from "lucide-react";
import {
  analyzeMarks,
  bulkDecideMarks,
  decideMark,
  type MarkedQuestion,
  type MarkStatus,
  type MarkType,
} from "../../api/admin";
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
import { formatCount } from "../tests/format";
import { FlashMessage } from "./FlashMessage";
import { QuestionOptions } from "./QuestionOptions";
import { useAdminMutation, useMarkedQuestions, useMarkSummary } from "./adminQueries";
import { Badge, ConfirmDialog, SelectField } from "./adminUi";
import { isMarkStatus, isMarkType, MARK_ORIGIN_LABELS, MARK_STATUS_LABELS, MARK_TYPES, markLabel } from "./marks";
import { useAdminListParams } from "./useAdminListParams";
import { useFlash } from "./useFlash";

const STATUS_ORDER: MarkStatus[] = ["SUGGESTED", "CONFIRMED", "REJECTED"];

type Dialog = { kind: "approve-all" } | { kind: "reject-all" };

/**
 * Oznaczenia pytań: podsumowanie, uruchomienie automatu (tylko proponuje) oraz kolejka propozycji do zatwierdzenia,
 * pojedynczo albo hurtem. W testach „Pytania z terminów” i „Pułapki” liczą się wyłącznie oznaczenia zatwierdzone.
 */
export function AdminMarksPage() {
  const list = useAdminListParams();
  const statusValue = list.get("status");
  const status: MarkStatus = isMarkStatus(statusValue) ? statusValue : "SUGGESTED";
  const markValue = list.get("mark");
  const mark: MarkType | undefined = isMarkType(markValue) ? markValue : undefined;

  const filter = useMemo(() => ({ status, mark, page: list.page, size: LIST_PAGE_SIZE }), [status, mark, list.page]);
  const { data, isLoading, isError, refetch } = useMarkedQuestions(filter);
  const summary = useMarkSummary();
  const { flash, ok, fail, clear } = useFlash();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  function close() {
    setDialog(null);
    setDialogError(null);
  }

  const analyze = useAdminMutation(
    () => analyzeMarks(),
    (r) =>
      ok(
        r.suggested === 0
          ? `Przejrzano ${formatCount(r.questionsScanned)} pytań. Nowych propozycji nie ma.`
          : `Przejrzano ${formatCount(r.questionsScanned)} pytań i dodano ${formatCount(r.suggested)} nowych propozycji do zatwierdzenia.`
      )
  );
  const decide = useAdminMutation(
    (v: { item: MarkedQuestion; status: "CONFIRMED" | "REJECTED" }) => decideMark(v.item.questionId, v.item.mark, v.status),
    (_r, v) =>
      ok(
        v.status === "CONFIRMED"
          ? `Zatwierdzono: ${markLabel(v.item.mark)}, pytanie nr ${v.item.questionId}.`
          : `Cofnięto: ${markLabel(v.item.mark)}, pytanie nr ${v.item.questionId}.`
      )
  );
  const bulk = useAdminMutation(
    (v: { to: "CONFIRMED" | "REJECTED" }) => bulkDecideMarks("SUGGESTED", v.to, mark ? [mark] : []),
    (r, v) => {
      close();
      ok(v.to === "CONFIRMED" ? `Zatwierdzono propozycje: ${formatCount(r.updated)}.` : `Odrzucono propozycje: ${formatCount(r.updated)}.`);
    }
  );

  const suggestedCount = (summary.data?.marks ?? [])
    .filter((row) => !mark || row.mark === mark)
    .reduce((sum, row) => sum + row.suggested, 0);
  const scope = mark ? `rodzaju „${markLabel(mark)}”` : "wszystkich rodzajów";

  return (
    <div>
      <PageHeader title="Oznaczenia pytań" subtitle="Pytania z terminami i pułapki: automat proponuje, ty zatwierdzasz" />
      <div className="flex max-w-5xl flex-col gap-4 px-4 pb-8 sm:px-8">
        <FlashMessage flash={flash} />

        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Podsumowanie</h2>
              <p className="text-sm text-fg-muted">
                Użytkownicy widzą tylko oznaczenia zatwierdzone: układają one testy „Pytania z terminów” i „Pułapki”. Automat niczego nie
                zatwierdza i nie zmienia wcześniejszych decyzji, więc można go uruchamiać po każdym imporcie.
              </p>
            </div>
            <Button type="button" onClick={() => { clear(); analyze.mutate(undefined, { onError: (e) => fail(e, "Nie udało się uruchomić automatu.") }); }} disabled={analyze.isPending} data-testid="marks-analyze">
              <Play size={16} aria-hidden="true" />
              {analyze.isPending ? "Sprawdzam pytania..." : "Uruchom automat"}
            </Button>
          </div>
          {summary.isLoading && <Skeleton className="h-40 w-full" />}
          {summary.isError && <ErrorState message="Nie udało się pobrać podsumowania." onRetry={() => summary.refetch()} />}
          {summary.data && (
            <div className="overflow-x-auto" role="region" aria-label="Podsumowanie oznaczeń" tabIndex={0}>
              <table className="w-full min-w-[32rem] text-sm" data-testid="marks-summary">
                <caption className="pb-2 text-left text-xs text-fg-muted">Pytań w bazie: {formatCount(summary.data.questions)}</caption>
                <thead>
                  <tr className="border-b border-line text-left text-fg-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">Rodzaj</th>
                    {STATUS_ORDER.map((s) => (
                      <th key={s} scope="col" className="px-3 py-2 text-right font-medium">{MARK_STATUS_LABELS[s]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.data.marks.map((row) => (
                    <tr key={row.mark} className="border-b border-line last:border-0" data-testid={`marks-summary-${row.mark}`}>
                      <th scope="row" className="py-2 pr-3 text-left font-normal">{markLabel(row.mark)}</th>
                      <td className="px-3 py-2 text-right tabular-nums" data-testid={`marks-summary-${row.mark}-suggested`}>{formatCount(row.suggested)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCount(row.confirmed)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCount(row.rejected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div role="tablist" aria-label="Stan oznaczeń" className="flex flex-wrap gap-2" data-testid="marks-tabs">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={status === s}
                onClick={() => list.setParam("status", s === "SUGGESTED" ? "" : s)}
                className={cn(
                  "min-h-11 cursor-pointer rounded-full px-4 text-sm font-medium transition-colors",
                  status === s ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg hover:bg-line"
                )}
                data-testid={`marks-tab-${s}`}
              >
                {MARK_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <SelectField label="Rodzaj" value={mark ?? ""} onChange={(e) => list.setParam("mark", e.target.value)} data-testid="marks-filter-mark">
            <option value="">Wszystkie</option>
            {MARK_TYPES.map((m) => (
              <option key={m.type} value={m.type}>
                {m.label}
              </option>
            ))}
          </SelectField>
        </Card>

        {status === "SUGGESTED" && suggestedCount > 0 && (
          <Card className="flex flex-wrap items-center justify-between gap-3" data-testid="marks-bulk">
            <p className="text-sm">
              Propozycji {scope}: <strong className="tabular-nums">{formatCount(suggestedCount)}</strong>. Możesz je przejrzeć niżej albo rozstrzygnąć hurtem.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => { clear(); setDialogError(null); setDialog({ kind: "approve-all" }); }} data-testid="marks-approve-all">
                Zatwierdź wszystkie
              </Button>
              <Button type="button" variant="ghost" onClick={() => { clear(); setDialogError(null); setDialog({ kind: "reject-all" }); }} data-testid="marks-reject-all">
                Odrzuć wszystkie
              </Button>
            </div>
          </Card>
        )}

        {isLoading && <Skeleton className="h-72 w-full" />}
        {isError && <ErrorState message="Nie udało się pobrać oznaczeń." onRetry={() => refetch()} />}
        {data && data.items.length === 0 && (
          <EmptyState
            title={status === "SUGGESTED" ? "Nie ma propozycji do przejrzenia" : "Brak oznaczeń w tym stanie"}
            description={
              status === "SUGGESTED"
                ? "Uruchom automat, żeby sprawdził pytania i zaproponował oznaczenia (także po wczytaniu nowych pytań)."
                : "Oznaczenia pojawią się tu po zatwierdzeniu albo odrzuceniu propozycji."
            }
          />
        )}
        {data && data.items.length > 0 && (
          <>
            <ul className="flex flex-col gap-3" data-testid="marks-list">
              {data.items.map((item) => (
                <li key={item.id}>
                  <MarkCard
                    item={item}
                    pending={decide.isPending}
                    onDecide={(next) => {
                      clear();
                      decide.mutate({ item, status: next }, { onError: (e) => fail(e, "Nie udało się zapisać decyzji.") });
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
              nouns={{ one: "oznaczenie", few: "oznaczenia", many: "oznaczeń" }}
            />
          </>
        )}
      </div>

      {dialog && (
        <ConfirmDialog
          title={dialog.kind === "approve-all" ? "Zatwierdzić wszystkie propozycje?" : "Odrzucić wszystkie propozycje?"}
          confirmLabel={dialog.kind === "approve-all" ? "Zatwierdź wszystkie" : "Odrzuć wszystkie"}
          danger={dialog.kind === "reject-all"}
          pending={bulk.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            bulk.mutate(
              { to: dialog.kind === "approve-all" ? "CONFIRMED" : "REJECTED" },
              { onError: (e) => setDialogError(serverMessage(e, "Nie udało się zapisać decyzji.")) }
            );
          }}
          onClose={close}
        >
          {dialog.kind === "approve-all" ? (
            <p>
              Propozycje {scope} ({formatCount(suggestedCount)}) staną się oznaczeniami i od razu zaczną układać testy „Pytania z terminów” i
              „Pułapki” u wszystkich użytkowników. Automat jest ostrożny, ale bywa, że oznacza pytanie niesłusznie, więc warto najpierw
              przejrzeć próbkę.
            </p>
          ) : (
            <p>
              Propozycje {scope} ({formatCount(suggestedCount)}) zostaną odrzucone, a automat nie zaproponuje ich ponownie. Odrzucone oznaczenie można
              później nadać ręcznie.
            </p>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}

function MarkCard({ item, pending, onDecide }: { item: MarkedQuestion; pending: boolean; onDecide: (status: "CONFIRMED" | "REJECTED") => void }) {
  return (
    <Card className="flex flex-col gap-3" data-testid={`mark-${item.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{markLabel(item.mark)}</Badge>
        <span className="text-sm text-fg-muted">Pytanie nr {item.questionId}</span>
        <span className="text-sm text-fg-muted">· {MARK_ORIGIN_LABELS[item.origin]}</span>
      </div>
      <p className="text-base break-words whitespace-pre-line">{item.body}</p>
      <QuestionOptions optionA={item.optionA} optionB={item.optionB} optionC={item.optionC} correctOption={item.correctOption} />
      <p className="text-sm text-fg-muted">
        {item.actShortName} · {item.sourceName}
      </p>
      <div className="flex flex-wrap gap-2">
        {item.status !== "CONFIRMED" && (
          <Button type="button" onClick={() => onDecide("CONFIRMED")} disabled={pending} data-testid={`mark-confirm-${item.id}`}>
            <Check size={16} aria-hidden="true" />
            Zatwierdź
          </Button>
        )}
        {item.status === "SUGGESTED" && (
          <Button type="button" variant="ghost" onClick={() => onDecide("REJECTED")} disabled={pending} data-testid={`mark-reject-${item.id}`}>
            <X size={16} aria-hidden="true" />
            Odrzuć
          </Button>
        )}
        {item.status === "CONFIRMED" && (
          <Button type="button" variant="ghost" onClick={() => onDecide("REJECTED")} disabled={pending} data-testid={`mark-revoke-${item.id}`}>
            <RotateCcw size={16} aria-hidden="true" />
            Cofnij
          </Button>
        )}
      </div>
    </Card>
  );
}
