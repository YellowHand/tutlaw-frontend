import { pluralizePl } from "../../lib/plural";

interface LeechHintProps {
  lapses: number;
  /** Test mówi o „pytaniu", fiszka o „fiszce". */
  kind: "test" | "flashcard";
  className?: string;
}

const TIMES = { one: "raz", few: "razy", many: "razy" };

/**
 * Podpowiedź przy trudnym pytaniu (z wieloma błędami): zamiast w kółko powtarzać to samo, można zgłosić błąd
 * w pytaniu albo odłożyć je na później. Niczego nie zawiesza sama.
 */
export function LeechHint({ lapses, kind, className }: LeechHintProps) {
  const text =
    kind === "test"
      ? `To pytanie sprawia Ci trudność: pomyliłeś się w nim już ${lapses} ${pluralizePl(lapses, TIMES)}. Jeśli jest niejasne albo nieaktualne, zgłoś błąd. Możesz też zawiesić je na jakiś czas.`
      : `Ta fiszka sprawia Ci trudność: nie pamiętałeś jej już ${lapses} ${pluralizePl(lapses, TIMES)}. Jeśli jest niejasna, zgłoś błąd. Możesz też zawiesić ją na jakiś czas.`;
  return <p className={className ?? "text-sm text-fg-muted"}>{text}</p>;
}
