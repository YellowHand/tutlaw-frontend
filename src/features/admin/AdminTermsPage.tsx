import { PageHeader } from "../../components/layout/PageHeader";
import { ExamTermsCard } from "../settings/ExamTermsCard";

/** Terminy egzaminów: ta sama karta co w Koncie, ale w panelu, gdzie ich szukasz razem z resztą ustawień aplikacji. */
export function AdminTermsPage() {
  return (
    <div>
      <PageHeader title="Terminy egzaminów" subtitle="Jedna data na aplikację: od niej zależą odliczanie i plan nauki użytkowników" />
      <div className="max-w-3xl px-4 pb-8 sm:px-8">
        <ExamTermsCard />
      </div>
    </div>
  );
}
