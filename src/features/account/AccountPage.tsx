import { Link } from "react-router-dom";
import { LogoutButton } from "../../components/layout/LogoutButton";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { ROUTES } from "../../config/routes";
import { useMe } from "./hooks";
import { ChangePasswordCard } from "./ChangePasswordCard";
import { ExportCard } from "./ExportCard";
import { DeleteAccountCard } from "./DeleteAccountCard";
import { DifficultCardsCard } from "../difficult/DifficultCardsCard";
import { AppearanceCard } from "../settings/AppearanceCard";
import { ExamTermsCard } from "../settings/ExamTermsCard";
import { LearningSettingsCard } from "../settings/LearningSettingsCard";

export function AccountPage() {
  const { data: me } = useMe();

  return (
    <div>
      <PageHeader title="Konto" subtitle="Wygląd, ustawienia nauki, zawieszone pytania, zmiana hasła, kopia danych i usunięcie konta" />
      <div className="flex max-w-3xl flex-col gap-6 px-4 pb-8 sm:px-8">
        <Card>
          <h2 className="text-lg font-semibold">Zalogowano jako</h2>
          <p className="mt-1 break-all text-sm text-fg-muted" data-testid="account-email">
            {me?.email ?? "..."}
          </p>
          {/* Na telefonie dolna belka nie ma wylogowania (jest w pasku bocznym od szerokości md), więc ten przycisk jest tu. */}
          <LogoutButton variant="text" className="mt-4 md:hidden" />
        </Card>

        <AppearanceCard />

        <LearningSettingsCard />

        <ExamTermsCard />

        <DifficultCardsCard />

        <ChangePasswordCard />

        <ExportCard />
        <DeleteAccountCard />

        <p className="text-sm text-fg-muted">
          Więcej o tym, jak przetwarzamy dane, znajdziesz w{" "}
          <Link to={ROUTES.privacy} className="text-accent-ink underline">
            polityce prywatności
          </Link>{" "}
          i{" "}
          <Link to={ROUTES.terms} className="text-accent-ink underline">
            regulaminie
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
