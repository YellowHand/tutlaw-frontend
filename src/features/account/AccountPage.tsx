import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { ROUTES } from "../../config/routes";
import { fetchMe } from "./api";
import { ExportCard } from "./ExportCard";
import { DeleteAccountCard } from "./DeleteAccountCard";
import { LearningSettingsCard } from "../settings/LearningSettingsCard";

export function AccountPage() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: fetchMe, staleTime: 5 * 60_000 });

  return (
    <div>
      <PageHeader title="Konto" subtitle="Ustawienia nauki, Twoje dane, kopia danych i usunięcie konta" />
      <div className="flex max-w-3xl flex-col gap-6 px-4 pb-8 sm:px-8">
        <Card>
          <h2 className="text-lg font-semibold">Zalogowano jako</h2>
          <p className="mt-1 break-all text-sm text-fg-muted" data-testid="account-email">
            {me?.email ?? "..."}
          </p>
        </Card>

        <LearningSettingsCard />

        <ExportCard />
        <DeleteAccountCard />

        <p className="text-sm text-fg-muted">
          Więcej o tym, jak przetwarzamy dane, znajdziesz w{" "}
          <Link to={ROUTES.privacy} className="text-accent underline">
            polityce prywatności
          </Link>{" "}
          i{" "}
          <Link to={ROUTES.terms} className="text-accent underline">
            regulaminie
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
