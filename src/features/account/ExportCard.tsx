import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { serverMessage } from "../../lib/errors";
import { fetchAccountExport } from "./api";
import { exportFilename, saveTextFile } from "./download";

/** Pobranie kopii wszystkich danych użytkownika (prawo dostępu i przenoszenia danych). */
export function ExportCard() {
  const exportMutation = useMutation({
    mutationFn: fetchAccountExport,
    onSuccess: (json) => saveTextFile(exportFilename(), json),
  });

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Pobierz moje dane</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Plik JSON z wszystkim, co o Tobie przechowujemy: adresami e-mail, datą akceptacji regulaminu, zaznaczonymi
          rozdziałami, stanem każdej fiszki (kiedy wrócisz do niej na powtórce), pełną historią Twoich odpowiedzi oraz
          zgłoszeniami błędów w pytaniach. Nie ma w nim hasła.
        </p>
      </div>

      {exportMutation.isError && (
        <p role="alert" className="text-sm text-danger">
          {serverMessage(exportMutation.error, "Nie udało się przygotować pliku. Spróbuj ponownie.")}
        </p>
      )}
      {exportMutation.isSuccess && (
        <p role="status" className="text-sm text-success">
          Plik został zapisany na Twoim urządzeniu.
        </p>
      )}

      <div>
        <Button variant="secondary" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
          <Download size={16} aria-hidden="true" />
          {exportMutation.isPending ? "Przygotowuję plik..." : "Pobierz plik JSON"}
        </Button>
      </div>
    </Card>
  );
}
