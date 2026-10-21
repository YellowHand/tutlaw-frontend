import { useState } from "react";
import { Pencil, Plus, Scale, Trash2 } from "lucide-react";
import {
  createAdminCourse,
  deleteAdminCourse,
  setAdminCourseActs,
  updateAdminCourse,
  type AdminCourse,
  type CourseInput,
} from "../../api/admin";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { serverMessage } from "../../lib/errors";
import { pluralizePl } from "../../lib/plural";
import { ActPickerDialog } from "./ActPickerDialog";
import { CourseFormDialog } from "./CourseFormDialog";
import { FlashMessage } from "./FlashMessage";
import { useAdminCourses, useAdminMutation } from "./adminQueries";
import { ConfirmDialog } from "./adminUi";
import { useFlash } from "./useFlash";

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; course: AdminCourse }
  | { kind: "acts"; course: AdminCourse }
  | { kind: "delete"; course: AdminCourse };

/** Przedmioty ścieżki Student: dodawanie, edycja, akty prawne przedmiotu i usuwanie. */
export function AdminCoursesPage() {
  const { data, isLoading, isError, refetch } = useAdminCourses();
  const { flash, ok, clear } = useFlash();
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
    (input: CourseInput) => createAdminCourse(input),
    (course) => {
      close();
      ok(`Dodano przedmiot „${course.name}”. Przypisz do niego akty prawne.`);
    }
  );
  const update = useAdminMutation(
    ({ id, input }: { id: number; input: CourseInput }) => updateAdminCourse(id, input),
    (course) => {
      close();
      ok(`Zapisano przedmiot „${course.name}”.`);
    }
  );
  const setActs = useAdminMutation(
    ({ id, actIds }: { id: number; actIds: number[] }) => setAdminCourseActs(id, actIds),
    (course) => {
      close();
      ok(`Zapisano akty przedmiotu „${course.name}”: ${course.actIds.length}.`);
    }
  );
  const remove = useAdminMutation(
    (course: AdminCourse) => deleteAdminCourse(course.id),
    (_r, course) => {
      close();
      ok(`Usunięto przedmiot „${course.name}”.`);
    }
  );

  return (
    <div>
      <PageHeader
        title="Przedmioty Studenta"
        subtitle="Student wybiera przedmioty, których się uczy, a pula pytań składa się z ich aktów prawnych"
        actions={
          <Button type="button" onClick={() => open({ kind: "create" })} data-testid="course-add">
            <Plus size={18} aria-hidden="true" />
            Dodaj przedmiot
          </Button>
        }
      />
      <div className="flex max-w-5xl flex-col gap-4 px-4 pb-8 sm:px-8">
        <FlashMessage flash={flash} />
        {isLoading && <Skeleton className="h-64 w-full" />}
        {isError && <ErrorState message="Nie udało się pobrać przedmiotów." onRetry={() => refetch()} />}
        {data && data.length === 0 && <EmptyState title="Nie ma jeszcze przedmiotów" description="Dodaj pierwszy przedmiot i przypisz do niego akty prawne." />}
        {data && data.length > 0 && (
          <ul className="flex flex-col gap-3" data-testid="course-list">
            {data.map((course) => (
              <li key={course.id}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-testid={`course-${course.slug}`}>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">{course.name}</h2>
                    <p className="text-sm text-fg-muted">
                      Akty prawne: {course.actIds.length} · wybrało go: {course.userCount}{" "}
                      {pluralizePl(course.userCount, { one: "użytkownik", few: "użytkowników", many: "użytkowników" })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => open({ kind: "acts", course })} data-testid={`course-acts-${course.slug}`}>
                      <Scale size={16} aria-hidden="true" />
                      Akty prawne
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => open({ kind: "edit", course })} data-testid={`course-edit-${course.slug}`}>
                      <Pencil size={16} aria-hidden="true" />
                      Edytuj
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => open({ kind: "delete", course })} data-testid={`course-delete-${course.slug}`}>
                      <Trash2 size={16} aria-hidden="true" />
                      Usuń
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {dialog?.kind === "create" && (
        <CourseFormDialog
          title="Dodaj przedmiot"
          initial={{ name: "", sortOrder: "" }}
          pending={create.isPending}
          error={dialogError}
          onSubmit={(input) => {
            setDialogError(null);
            create.mutate(input, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się dodać przedmiotu.")) });
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "edit" && (
        <CourseFormDialog
          title="Edytuj przedmiot"
          initial={{ name: dialog.course.name, sortOrder: String(dialog.course.sortOrder) }}
          pending={update.isPending}
          error={dialogError}
          onSubmit={(input) => {
            setDialogError(null);
            update.mutate({ id: dialog.course.id, input }, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się zapisać przedmiotu.")) });
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "acts" && (
        <ActPickerDialog
          title={`Akty prawne: ${dialog.course.name}`}
          description="Zaznaczone akty wchodzą do puli pytań studentów, którzy wybrali ten przedmiot. Zmiana działa od razu."
          initialIds={dialog.course.actIds}
          pending={setActs.isPending}
          error={dialogError}
          onSave={(actIds) => {
            setDialogError(null);
            setActs.mutate({ id: dialog.course.id, actIds }, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się zapisać aktów.")) });
          }}
          onClose={close}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Usunąć przedmiot?"
          confirmLabel="Usuń przedmiot"
          danger
          pending={remove.isPending}
          error={dialogError}
          onConfirm={() => {
            setDialogError(null);
            remove.mutate(dialog.course, { onError: (e) => setDialogError(serverMessage(e, "Nie udało się usunąć przedmiotu.")) });
          }}
          onClose={close}
        >
          <p>
            Przedmiot „{dialog.course.name}” zniknie z wyboru, także u {dialog.course.userCount}{" "}
            {pluralizePl(dialog.course.userCount, { one: "użytkownika, który go wybrał", few: "użytkowników, którzy go wybrali", many: "użytkowników, którzy go wybrali" })}.
            Akty prawne i pytania zostają.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
