import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Scale, Trash2 } from "lucide-react";
import {
  createAdminTrack,
  deleteAdminTrack,
  setAdminTrackActs,
  updateAdminTrack,
  type AdminTrack,
  type TrackInput,
} from "../../api/admin";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { ROUTES } from "../../config/routes";
import { formatDatePl } from "../../lib/date";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { ActPickerDialog } from "./ActPickerDialog";
import { FlashMessage } from "./FlashMessage";
import { TrackFormDialog } from "./TrackFormDialog";
import { useAdminMutation, useAdminTracks } from "./adminQueries";
import { Badge, ConfirmDialog } from "./adminUi";
import { useFlash } from "./useFlash";

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; track: AdminTrack }
  | { kind: "acts"; track: AdminTrack }
  | { kind: "delete"; track: AdminTrack };

/** Aplikacje (ścieżki egzaminacyjne) i Student: dodawanie, edycja, akty prawne aplikacji, usuwanie pustych aplikacji. */
export function AdminTracksPage() {
  const { data, isLoading, isError, refetch } = useAdminTracks();
  const { flash, ok, clear } = useFlash();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  function close() {
    setDialog(null);
    setDialogError(null);
  }

  const create = useAdminMutation(
    (input: TrackInput) => createAdminTrack(input),
    (track) => {
      close();
      ok(`Dodano aplikację „${track.name}”. Dodaj do niej akty prawne i arkusze.`);
    }
  );
  const update = useAdminMutation(
    ({ id, input }: { id: number; input: TrackInput }) => updateAdminTrack(id, input),
    (track) => {
      close();
      ok(`Zapisano aplikację „${track.name}”.`);
    }
  );
  const setActs = useAdminMutation(
    ({ id, actIds }: { id: number; actIds: number[] }) => setAdminTrackActs(id, actIds),
    (track) => {
      close();
      ok(`Zapisano akty aplikacji „${track.name}”: ${track.actIds.length}.`);
    }
  );
  const remove = useAdminMutation(
    (track: AdminTrack) => deleteAdminTrack(track.id),
    (_r, track) => {
      close();
      ok(`Usunięto aplikację „${track.name}”.`);
    }
  );

  function open(next: Dialog) {
    clear();
    setDialogError(null);
    setDialog(next);
  }

  return (
    <div>
      <PageHeader
        title="Aplikacje"
        subtitle="Ścieżki egzaminacyjne, które użytkownik wybiera przy starcie, oraz Student"
        actions={
          <Button type="button" onClick={() => open({ kind: "create" })} data-testid="track-add">
            <Plus size={18} aria-hidden="true" />
            Dodaj aplikację
          </Button>
        }
      />
      <div className="flex max-w-5xl flex-col gap-4 px-4 pb-8 sm:px-8">
        <FlashMessage flash={flash} />
        {isLoading && <Skeleton className="h-64 w-full" />}
        {isError && <ErrorState message="Nie udało się pobrać aplikacji." onRetry={() => refetch()} />}
        {data && (
          <ul className="flex flex-col gap-3" data-testid="track-list">
            {data.map((track) => (
              <li key={track.id}>
                <TrackCard track={track} onOpen={open} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {dialog?.kind === "create" && (
        <TrackFormDialog
          title="Dodaj aplikację"
          initial={{ name: "", shortName: "", sortOrder: "" }}
          pending={create.isPending}
          error={dialogError}
          onSubmit={(input) => {
            setDialogError(null);
            create.mutate(input, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się dodać aplikacji.")) });
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "edit" && (
        <TrackFormDialog
          title="Edytuj aplikację"
          initial={{ name: dialog.track.name, shortName: dialog.track.shortName, sortOrder: String(dialog.track.sortOrder) }}
          pending={update.isPending}
          error={dialogError}
          onSubmit={(input) => {
            setDialogError(null);
            update.mutate({ id: dialog.track.id, input }, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się zapisać aplikacji.")) });
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "acts" && (
        <ActPickerDialog
          title={`Akty prawne: ${dialog.track.shortName}`}
          description="Zaznaczone akty wchodzą do puli pytań tej aplikacji. Zmiana działa od razu u wszystkich, którzy ją wybrali."
          initialIds={dialog.track.actIds}
          pending={setActs.isPending}
          error={dialogError}
          onSave={(actIds) => {
            setDialogError(null);
            setActs.mutate({ id: dialog.track.id, actIds }, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się zapisać aktów.")) });
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Usunąć aplikację?"
          confirmLabel="Usuń aplikację"
          danger
          pending={remove.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            remove.mutate(dialog.track, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się usunąć aplikacji.")) });
          }}
          onClose={close}
        >
          <p>
            Aplikacja „{dialog.track.name}” zniknie z wyboru. Usunąć można tylko aplikację bez arkuszy, której nikt nie wybrał.
            Przypisania aktów prawnych znikną razem z nią, same akty zostają.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}

function TrackCard({ track, onOpen }: { track: AdminTrack; onOpen: (dialog: Dialog) => void }) {
  const student = track.kind === "STUDENT";
  const users = `${track.userCount} ${pluralizePl(track.userCount, { one: "użytkownik", few: "użytkowników", many: "użytkowników" })}`;
  const sheets = `${track.sheetCount} ${pluralizePl(track.sheetCount, { one: "arkusz", few: "arkusze", many: "arkuszy" })}`;
  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-testid={`track-${track.slug}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">{track.name}</h2>
          {student && <Badge>Student</Badge>}
        </div>
        <p className="text-sm text-fg-muted">Krótka nazwa: {track.shortName}</p>
        <p className="mt-1 text-sm text-fg-muted">
          {student ? (
            <>
              Bez terminu i arkuszy. Akty prawne Studenta ustawiasz w <Link to={ROUTES.adminCourses} className="text-accent-ink underline">przedmiotach</Link>.
            </>
          ) : (
            <>
              Akty prawne: {track.actIds.length} · {sheets} · {track.examDate ? `egzamin ${formatDatePl(track.examDate)}` : "termin nieogłoszony"}
            </>
          )}
          {" · "}
          wybrało ją: {users}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {!student && (
          <Button type="button" variant="secondary" onClick={() => onOpen({ kind: "acts", track })} data-testid={`track-acts-${track.slug}`}>
            <Scale size={16} aria-hidden="true" />
            Akty prawne
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => onOpen({ kind: "edit", track })} data-testid={`track-edit-${track.slug}`}>
          <Pencil size={16} aria-hidden="true" />
          Edytuj
        </Button>
        {!student && (
          <Button type="button" variant="ghost" onClick={() => onOpen({ kind: "delete", track })} data-testid={`track-delete-${track.slug}`}>
            <Trash2 size={16} aria-hidden="true" />
            Usuń
          </Button>
        )}
      </div>
    </Card>
  );
}
