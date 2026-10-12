import { ClipboardList } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";

export function TestsComingSoonCard() {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
      <EmptyState
        icon={ClipboardList}
        title="Moduł testów jest w budowie"
        description="Statystyki rozwiązanych pytań pojawią się tutaj, gdy funkcja testów będzie gotowa."
      />
    </Card>
  );
}