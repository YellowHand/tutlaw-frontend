import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ListPlus, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createAdminSection,
  createAdminSectionsBulk,
  deleteAdminSection,
  renameAdminSection,
  reorderAdminSections,
  type AdminSection,
} from "../../api/admin";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { formatCount } from "../tests/format";
import { FlashMessage } from "./FlashMessage";
import { BulkDialog, NameDialog } from "./NameDialog";
import { useAdminMutation, useAdminSections } from "./adminQueries";
import { ConfirmDialog } from "./adminUi";
import { useFlash } from "./useFlash";

type Dialog = { kind: "rename"; section: AdminSection } | { kind: "delete"; section: AdminSection } | { kind: "bulk" };

/**
 * Rozdziały jednego aktu: dodawanie pojedynczo i hurtem (wklejony spis), zmiana nazwy, kolejność strzałkami, usuwanie
 * rozdziałów bez pytań. Każda operacja zwraca pełną listę, więc ekran zawsze pokazuje stan z serwera.
 */
export function ActSectionsCard({ actId }: { actId: number }) {
  const { data, isLoading, isError, refetch } = useAdminSections(actId);
  const queryClient = useQueryClient();
  const { flash, ok, fail, clear } = useFlash();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  function close() {
    setDialog(null);
    setDialogError(null);
  }
  function open(next: Dialog) {
    clear();
    setDialogError(null);
    setDialog(next);
  }

  /** Wynik każdej operacji to nowa lista rozdziałów: wpisujemy ją od razu, zanim odświeży się reszta. */
  function remember(list: AdminSection[]) {
    queryClient.setQueryData(["admin", "sections", actId], list);
  }

  const add = useAdminMutation((name: string) => createAdminSection(actId, name), (list) => {
    remember(list);
    setNewName("");
    ok("Dodano rozdział.");
  });
  const bulk = useAdminMutation((names: string[]) => createAdminSectionsBulk(actId, names), (list, names) => {
    remember(list);
    close();
    ok(`Dodano rozdziały: ${list.length - (data?.length ?? 0)} z ${names.length} wklejonych (powtórzone nazwy pominięto).`);
  });
  const rename = useAdminMutation(({ id, name }: { id: number; name: string }) => renameAdminSection(id, name), (list) => {
    remember(list);
    close();
    ok("Zmieniono nazwę rozdziału.");
  });
  const reorder = useAdminMutation((ids: number[]) => reorderAdminSections(actId, ids), (list) => {
    remember(list);
    ok("Zapisano kolejność rozdziałów.");
  });
  const remove = useAdminMutation((section: AdminSection) => deleteAdminSection(section.id), (list) => {
    remember(list);
    close();
    ok("Usunięto rozdział.");
  });

  function move(index: number, delta: -1 | 1) {
    if (!data) return;
    const ids = data.map((s) => s.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    clear();
    reorder.mutate(ids, { onError: (e) => fail(e, "Nie udało się zapisać kolejności.") });
  }

  function submitNew(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return fail(null, "Wpisz nazwę rozdziału.");
    clear();
    add.mutate(newName.trim(), { onError: (err) => fail(err, "Nie udało się dodać rozdziału.") });
  }

  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6" data-testid="sections-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Rozdziały{data ? ` (${data.length})` : ""}</h2>
        <Button type="button" variant="secondary" onClick={() => open({ kind: "bulk" })} data-testid="sections-bulk">
          <ListPlus size={16} aria-hidden="true" />
          Wklej spis rozdziałów
        </Button>
      </div>
      <FlashMessage flash={flash} />

      <form onSubmit={submitNew} className="flex flex-col gap-2 sm:flex-row sm:items-end" data-testid="section-add-form">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="section-new" className="text-sm text-fg-muted">
            Nowy rozdział
          </label>
          <input
            id="section-new"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={300}
            className="min-h-11 rounded-xl border border-field bg-surface-2 px-3"
          />
        </div>
        <Button type="submit" disabled={add.isPending} data-testid="section-add">
          <Plus size={16} aria-hidden="true" />
          Dodaj rozdział
        </Button>
      </form>

      {isLoading && <Skeleton className="h-32 w-full" />}
      {isError && <ErrorState message="Nie udało się pobrać rozdziałów." onRetry={() => refetch()} />}
      {data && data.length === 0 && <p className="text-sm text-fg-muted">Ten akt nie ma jeszcze rozdziałów.</p>}
      {data && data.length > 0 && (
        <ol className="flex flex-col divide-y divide-line rounded-xl border border-line" data-testid="section-list">
          {data.map((section, index) => (
            <li key={section.id} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center" data-testid={`section-${section.id}`}>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium">{section.name}</p>
                <p className="text-xs text-fg-muted">
                  {formatCount(section.questionCount)} {pluralizePl(section.questionCount, { one: "pytanie", few: "pytania", many: "pytań" })}
                  {section.hiddenQuestionCount > 0 && ` (ukrytych: ${formatCount(section.hiddenQuestionCount)})`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <IconButton label={`Przesuń w górę: ${section.name}`} disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)}>
                  <ArrowUp size={16} aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={`Przesuń w dół: ${section.name}`}
                  disabled={index === data.length - 1 || reorder.isPending}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={16} aria-hidden="true" />
                </IconButton>
                <IconButton label={`Zmień nazwę: ${section.name}`} onClick={() => open({ kind: "rename", section })} testId={`section-rename-${section.id}`}>
                  <Pencil size={16} aria-hidden="true" />
                </IconButton>
                {section.questionCount === 0 && (
                  <IconButton label={`Usuń rozdział: ${section.name}`} onClick={() => open({ kind: "delete", section })} testId={`section-delete-${section.id}`}>
                    <Trash2 size={16} aria-hidden="true" />
                  </IconButton>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {dialog?.kind === "bulk" && (
        <BulkDialog
          title="Wklej spis rozdziałów"
          description="Każdy wiersz to jeden rozdział, w podanej kolejności, na końcu listy. Rozdziały, które akt już ma, zostaną pominięte."
          submitLabel="Dodaj rozdziały"
          pending={bulk.isPending}
          error={dialogError}
          onSubmit={(names) => {
            setDialogError(null);
            bulk.mutate(names, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się dodać rozdziałów.")) });
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "rename" && (
        <NameDialog
          title="Zmień nazwę rozdziału"
          label="Nazwa rozdziału"
          initial={dialog.section.name}
          submitLabel="Zapisz"
          pending={rename.isPending}
          error={dialogError}
          onSubmit={(name) => {
            setDialogError(null);
            rename.mutate({ id: dialog.section.id, name }, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się zmienić nazwy.")) });
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Usunąć rozdział?"
          confirmLabel="Usuń rozdział"
          danger
          pending={remove.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            remove.mutate(dialog.section, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się usunąć rozdziału.")) });
          }}
          onClose={close}
        >
          <p>Rozdział „{dialog.section.name}” zniknie z listy. Usunąć można tylko rozdział bez pytań.</p>
        </ConfirmDialog>
      )}
    </Card>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  testId,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
