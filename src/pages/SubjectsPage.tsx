import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { getSubjectsByCategory, type Subject } from "../api/subjects";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/layout/PageHeader";
import { ROUTES } from "../config/routes";

export function SubjectsPage() {
  const { categoryId } = useParams();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    getSubjectsByCategory(Number(categoryId)).then(setSubjects);
  }, [categoryId]);

  return (
    <div>
      <PageHeader title="Przedmioty" />
      <div className="px-4 pb-8 sm:px-8">
        {subjects === null ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState icon={BookOpen} title="Brak przedmiotów" description="Wkrótce pojawią się tu materiały." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link key={subject.id} to={ROUTES.flashcardsSources(subject.id)} className="group block">
                <Card className="flex h-full flex-col justify-between gap-4 transition-colors hover:bg-surface-2">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <BookOpen size={20} aria-hidden="true" />
                    </span>
                    <ChevronRight size={18} className="text-fg-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{subject.name}</h2>
                    <p className="text-sm text-fg-muted">Zobacz rozdziały i fiszki</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}