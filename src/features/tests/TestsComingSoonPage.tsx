import { ClipboardList } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

export function TestsComingSoonPage() {
  return (
    <div>
      <PageHeader title="Testy" />
      <div className="px-4 sm:px-8">
        <EmptyState
          icon={ClipboardList}
          title="Moduł testów jest w budowie"
          description="Wkrótce pojawią się tu pytania z aplikacji prawniczych, pogrupowane działami i aktami prawnymi."
        />
      </div>
    </div>
  );
}