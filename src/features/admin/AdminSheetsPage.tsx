import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { createAdminSheet, deleteAdminSheet, setAdminSheetHidden, updateAdminSheet, type AdminSheet } from "../../api/admin";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { formatCount } from "../tests/format";
import { FlashMessage } from "./FlashMessage";
import { SheetFormDialog } from "./SheetFormDialog";
import { useAdminMutation, useAdminSheets, useAdminTracks } from "./adminQueries";
import { Badge, ConfirmDialog, SelectField } from "./adminUi";
import { useFlash } from "./useFlash";

type Dialog = { kind: "create" } | { kind: "edit"; sheet: AdminSheet } | { kind: "hide"; sheet: AdminSheet } | { kind: "delete"; sheet: AdminSheet };

/** Arkusze egzaminów (aplikacja + rok): dodawanie, zmiana roku i nazwy, ukrywanie, usuwanie pustych arkuszy. */
export function AdminSheetsPage() {
  const [trackFilter, setTrackFilter] = useState("");
  const trackId = trackFilter ? Number(trackFilter) : undefined;
  const { data, isLoading, isError, refetch } = useAdminSheets(trackId);
  const { data: tracks } = useAdminTracks();
  const examTracks = useMemo(() => (tracks ?? []).filter((t) => t.kind === "EXAM"), [tracks]);
  const { flash, ok, fail, clear } = useFlash();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  function close() {
    setDialog(null);
    setDialogError(null);
  }
  function open(next: Dialog) {
    clear();
    setDialogError(null);
    setDialog(next);
  }

  const create = useAdminMutation(
    ({ trackId: t, examYear }: { trackId: number; examYear: number }) => createAdminSheet(t, examYear),
    (sheet) => {
      close();
      ok(`Dodano arkusz „${sheet.name}”.`);
    }
  );
  const update = useAdminMutation(
    ({ id, examYear, name }: { id: number; examYear: number; name: string }) => updateAdminSheet(id, examYear, name),
    (sheet) => {
      close();
      ok(`Zapisano arkusz „${sheet.name}”.`);
    }
  );
  const hide = useAdminMutation(
    (sheet: AdminSheet) => setAdminSheetHidden(sheet.id, !sheet.hidden),
    (sheet) => {
      close();
      ok(sheet.hidden ? `Ukryto arkusz „${sheet.name}” przed wszystkimi użytkownikami.` : `Przywrócono arkusz „${sheet.name}”.`);
    }
  );
  const remove = useAdminMutation(
    (sheet: AdminSheet) => deleteAdminSheet(sheet.id),
    (_r, sheet) => {
      close();
      ok(`Usunięto arkusz „${sheet.name}”.`);
    }
  );

  return (
    <div>
      <PageHeader
        title="Arkusze egzaminów"
        subtitle="Arkusz to egzamin jednej aplikacji z danego roku; z niego powstają egzaminy próbne i pytania z lat ubiegłych"
        actions={
          <Button type="button" onClick={() => open({ kind: "create" })} data-testid="sheet-add">
            <Plus size={18} aria-hidden="true" />
            Dodaj arkusz
          </Button>
        }
      />
      <div className="flex max-w-5xl flex-col gap-4 px-4 pb-8 sm:px-8">
        <FlashMessage flash={flash} />
        <Card className="max-w-sm">
          <SelectField label="Aplikacja" value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} data-testid="sheet-filter-track">
            <option value="">Wszystkie</option>
            {examTracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </SelectField>
        </Card>
        {isLoading && <Skeleton className="h-64 w-full" />}
        {isError && <ErrorState message="Nie udało się pobrać arkuszy." onRetry={() => refetch()} />}
        {data && data.length === 0 && (
          <EmptyState
            title="Nie ma jeszcze arkuszy"
            description={trackFilter ? "Ta aplikacja nie ma arkuszy. Dodaj pierwszy." : "Dodaj pierwszy arkusz egzaminu."}
          />
        )}
        {data && data.length > 0 && (
          <ul className="flex flex-col gap-3" data-testid="sheet-list">
            {data.map((sheet) => {
              const questions = `${formatCount(sheet.questionCount)} ${pluralizePl(sheet.questionCount, { one: "pytanie", few: "pytania", many: "pytań" })}`;
              return (
                <li key={sheet.id}>
                  <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-testid={`sheet-${sheet.slug}`}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold break-words">{sheet.name}</h2>
                        {sheet.hidden && <Badge tone="warn">Ukryty</Badge>}
                      </div>
                      <p className="text-sm text-fg-muted">
                        {sheet.trackName} · rok {sheet.examYear} · {questions}
                        {sheet.hiddenQuestionCount > 0 && ` (ukrytych: ${formatCount(sheet.hiddenQuestionCount)})`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => open({ kind: "edit", sheet })} data-testid={`sheet-edit-${sheet.slug}`}>
                        <Pencil size={16} aria-hidden="true" />
                        Edytuj
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        data-testid={`sheet-toggle-${sheet.slug}`}
                        onClick={() => {
                          clear();
                          if (sheet.hidden) hide.mutate(sheet, { onError: (e) => fail(e, "Nie udało się przywrócić arkusza.") });
                          else open({ kind: "hide", sheet });
                        }}
                      >
                        {sheet.hidden ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
                        {sheet.hidden ? "Przywróć" : "Ukryj"}
                      </Button>
                      {sheet.questionCount === 0 && (
                        <Button type="button" variant="ghost" onClick={() => open({ kind: "delete", sheet })} data-testid={`sheet-delete-${sheet.slug}`}>
                          <Trash2 size={16} aria-hidden="true" />
                          Usuń
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {dialog?.kind === "create" && (
        <SheetFormDialog
          mode="create"
          tracks={examTracks}
          initial={{ trackId: trackFilter, examYear: String(new Date().getFullYear()), name: "" }}
          pending={create.isPending}
          error={dialogError}
          onSubmit={(v) => {
            setDialogError(null);
            create.mutate({ trackId: v.trackId, examYear: v.examYear }, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się dodać arkusza.")) });
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "edit" && (
        <SheetFormDialog
          mode="edit"
          tracks={examTracks}
          initial={{ trackId: String(dialog.sheet.trackId), examYear: String(dialog.sheet.examYear), name: dialog.sheet.name }}
          trackShortName={dialog.sheet.trackName}
          pending={update.isPending}
          error={dialogError}
          onSubmit={(v) => {
            setDialogError(null);
            update.mutate(
              { id: dialog.sheet.id, examYear: v.examYear, name: v.name },
              { onError: (e) => setDialogError(serverMessage(e, "Nie udało się zapisać arkusza.")) }
            );
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "hide" && (
        <ConfirmDialog
          title="Ukryć arkusz?"
          confirmLabel="Ukryj arkusz"
          pending={hide.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            hide.mutate(dialog.sheet, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się ukryć arkusza.")) });
          }}
          onClose={close}
        >
          <p>
            Arkusz „{dialog.sheet.name}” zniknie <strong className="text-fg">u wszystkich użytkowników</strong>: z egzaminów próbnych
            i pytań z lat ubiegłych. Pytania i historia odpowiedzi zostają, a po przywróceniu wszystko wraca.
          </p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Usunąć arkusz?"
          confirmLabel="Usuń arkusz"
          danger
          pending={remove.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            remove.mutate(dialog.sheet, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się usunąć arkusza.")) });
          }}
          onClose={close}
        >
          <p>Arkusz „{dialog.sheet.name}” zniknie. Tego nie da się cofnąć. Usunąć można tylko arkusz bez pytań.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
