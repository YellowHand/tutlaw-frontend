import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { deleteAdminAct, setAdminActAssignments, setAdminActHidden, updateAdminAct, type ActInput, type AdminAct } from "../../api/admin";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { SummaryRow } from "../../components/ui/SectionCard";
import { ROUTES } from "../../config/routes";
import { serverMessage } from "../../lib/errors";
import { formatCount } from "../tests/format";
import { ActFormDialog } from "./ActFormDialog";
import { ActSectionsCard } from "./ActSectionsCard";
import { FlashMessage } from "./FlashMessage";
import { useAdminAct, useAdminCourses, useAdminFields, useAdminMutation, useAdminTracks } from "./adminQueries";
import { Badge, ConfirmDialog } from "./adminUi";
import { useFlash } from "./useFlash";

type Dialog = { kind: "edit" } | { kind: "hide" } | { kind: "delete" };

/** Jeden akt: dane, ukrywanie, usuwanie (gdy bez pytań), przypisanie do aplikacji i przedmiotów oraz rozdziały. */
export function AdminActPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();
  const { data: act, isLoading, isError, refetch } = useAdminAct(id);
  const { data: fields } = useAdminFields();
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

  const update = useAdminMutation((input: ActInput) => updateAdminAct(id, input), () => {
    close();
    ok("Zapisano dane aktu.");
  });
  const hide = useAdminMutation((hidden: boolean) => setAdminActHidden(id, hidden), (updated) => {
    close();
    ok(updated.hidden ? "Ukryto akt przed wszystkimi użytkownikami." : "Przywrócono akt.");
  });
  const remove = useAdminMutation(() => deleteAdminAct(id), () => {
    navigate(ROUTES.adminActs, { replace: true });
  });

  const back = (
    <Link
      to={ROUTES.adminActs}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
      data-testid="act-back"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Akty prawne
    </Link>
  );

  if (!Number.isFinite(id)) {
    return (
      <div className="px-4 py-6 sm:px-8">
        {back}
        <ErrorState message="Nieprawidłowy adres aktu." />
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 pt-4 sm:px-8">{back}</div>
      <PageHeader title={act?.name ?? "Akt prawny"} subtitle={act ? `${act.fieldName} · adres: ${act.slug}` : undefined} />
      <div className="flex max-w-4xl flex-col gap-6 px-4 pb-8 sm:px-8">
        <FlashMessage flash={flash} />
        {isLoading && <Skeleton className="h-48 w-full" />}
        {isError && <ErrorState message="Nie udało się pobrać aktu." onRetry={() => refetch()} />}
        {act && (
          <>
            <Card className="flex flex-col gap-4 p-5 sm:p-6" data-testid="act-details">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">Dane aktu</h2>
                {act.kind === "TOPIC" && <Badge>Temat</Badge>}
                {act.hidden && <Badge tone="warn" data-testid="act-hidden-badge">Ukryty</Badge>}
              </div>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryRow label="Dziedzina">{act.fieldName}</SummaryRow>
                <SummaryRow label="Krótka nazwa">{act.shortName}</SummaryRow>
                <SummaryRow label="Pytania">
                  {formatCount(act.questionCount)}
                  {act.hiddenQuestionCount > 0 && <span className="font-normal text-fg-muted"> (ukrytych: {formatCount(act.hiddenQuestionCount)})</span>}
                </SummaryRow>
                <SummaryRow label="Miejsce na liście">{act.sortOrder}</SummaryRow>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => open({ kind: "edit" })} data-testid="act-edit">
                  <Pencil size={16} aria-hidden="true" />
                  Edytuj
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  data-testid="act-toggle-hidden"
                  onClick={() => {
                    if (act.hidden) {
                      clear();
                      hide.mutate(false, { onError: (e) => fail(e, "Nie udało się przywrócić aktu.") });
                    } else open({ kind: "hide" });
                  }}
                >
                  {act.hidden ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
                  {act.hidden ? "Przywróć akt" : "Ukryj akt"}
                </Button>
                {act.questionCount === 0 && (
                  <Button type="button" variant="ghost" onClick={() => open({ kind: "delete" })} data-testid="act-delete">
                    <Trash2 size={16} aria-hidden="true" />
                    Usuń akt
                  </Button>
                )}
              </div>
              {act.questionCount > 0 && (
                <p className="text-sm text-fg-muted">Akt z pytaniami można tylko ukryć. Usunięcie jest możliwe, gdy nie ma w nim pytań.</p>
              )}
            </Card>

            <AssignmentsCard key={act.id} act={act} />

            <ActSectionsCard actId={act.id} />
          </>
        )}
      </div>

      {act && dialog?.kind === "edit" && (
        <ActFormDialog
          title="Edytuj akt"
          fields={fields ?? []}
          initial={{ fieldId: String(act.fieldId), name: act.name, shortName: act.shortName, kind: act.kind, sortOrder: String(act.sortOrder) }}
          pending={update.isPending}
          error={dialogError}
          onSubmit={(input) => {
            setDialogError(null);
            update.mutate(input, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się zapisać aktu.")) });
          }}
          onClose={close}
        />
      )}
      {act && dialog?.kind === "hide" && (
        <ConfirmDialog
          title="Ukryć akt?"
          confirmLabel="Ukryj akt"
          pending={hide.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            hide.mutate(true, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się ukryć aktu.")) });
          }}
          onClose={close}
        >
          <p>
            Akt „{act.name}” zniknie <strong className="text-fg">u wszystkich użytkowników</strong>: z testów, fiszek, liczników i statystyk.
            Pytania i historia odpowiedzi zostają, a po przywróceniu wszystko wraca tak, jak było.
          </p>
        </ConfirmDialog>
      )}
      {act && dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Usunąć akt?"
          confirmLabel="Usuń akt"
          danger
          pending={remove.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            remove.mutate(undefined, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się usunąć aktu.")) });
          }}
          onClose={close}
        >
          <p>Akt „{act.name}” zniknie razem z rozdziałami i przypisaniami. Tego nie da się cofnąć.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

/** Do jakich aplikacji i przedmiotów Studenta należy akt (zaznaczane pola wyboru, jeden zapis). */
function AssignmentsCard({ act }: { act: AdminAct }) {
  const { data: tracks } = useAdminTracks();
  const { data: courses } = useAdminCourses();
  const { flash, ok, fail, clear } = useFlash();
  const [trackIds, setTrackIds] = useState<Set<number>>(() => new Set(act.trackIds));
  const [courseIds, setCourseIds] = useState<Set<number>>(() => new Set(act.courseIds));

  const queryClient = useQueryClient();
  const save = useAdminMutation(() => setAdminActAssignments(act.id, [...trackIds], [...courseIds]), (updated) => {
    // Nowy stan aktu wpisujemy od razu, żeby „Zapisz” zgasło bez czekania na odświeżenie.
    queryClient.setQueryData(["admin", "act", act.id], updated);
    ok("Zapisano przypisania aktu.");
  });

  const dirty =
    trackIds.size !== act.trackIds.length ||
    courseIds.size !== act.courseIds.length ||
    act.trackIds.some((x) => !trackIds.has(x)) ||
    act.courseIds.some((x) => !courseIds.has(x));

  function toggle(set: Set<number>, setter: (next: Set<number>) => void, value: number) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    clear();
    setter(next);
  }

  const examTracks = (tracks ?? []).filter((t) => t.kind === "EXAM");

  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6" data-testid="assignments-card">
      <div>
        <h2 className="text-base font-semibold">Przypisanie</h2>
        <p className="text-sm text-fg-muted">
          Akt trafia do puli pytań aplikacji, które zaznaczysz, oraz studentów, którzy wybrali zaznaczone przedmioty. Zmiana działa od
          razu u wszystkich.
        </p>
      </div>
      <FlashMessage flash={flash} />
      <div className="grid gap-6 sm:grid-cols-2">
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">Aplikacje</legend>
          {examTracks.map((track) => (
            <label key={track.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm hover:bg-surface-2">
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-accent)]"
                checked={trackIds.has(track.id)}
                onChange={() => toggle(trackIds, setTrackIds, track.id)}
                data-testid={`assign-track-${track.slug}`}
              />
              {track.name}
            </label>
          ))}
        </fieldset>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">Przedmioty Studenta</legend>
          {(courses ?? []).length === 0 && <p className="text-sm text-fg-muted">Nie ma jeszcze przedmiotów.</p>}
          {(courses ?? []).map((course) => (
            <label key={course.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm hover:bg-surface-2">
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-accent)]"
                checked={courseIds.has(course.id)}
                onChange={() => toggle(courseIds, setCourseIds, course.id)}
                data-testid={`assign-course-${course.slug}`}
              />
              {course.name}
            </label>
          ))}
        </fieldset>
      </div>
      <div>
        <Button
          type="button"
          disabled={!dirty || save.isPending}
          onClick={() => {
            clear();
            save.mutate(undefined, { onError: (e) => fail(e, "Nie udało się zapisać przypisań.") });
          }}
          data-testid="assignments-save"
        >
          {save.isPending ? "Zapisuję..." : "Zapisz przypisanie"}
        </Button>
      </div>
    </Card>
  );
}
