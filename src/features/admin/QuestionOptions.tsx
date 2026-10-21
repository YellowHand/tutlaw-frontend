import { Check } from "lucide-react";
import type { CorrectOption } from "../../api/admin";
import { cn } from "../../lib/cn";

interface QuestionOptionsProps {
  optionA: string;
  optionB: string;
  optionC: string;
  correctOption: CorrectOption;
}

/** Trzy odpowiedzi pytania z oznaczoną poprawną: znacznik i tekst „poprawna”, nie tylko kolor. */
export function QuestionOptions({ optionA, optionB, optionC, correctOption }: QuestionOptionsProps) {
  const options: [CorrectOption, string][] = [
    ["A", optionA],
    ["B", optionB],
    ["C", optionC],
  ];
  return (
    <ol className="flex flex-col gap-1 text-sm" aria-label="Odpowiedzi">
      {options.map(([letter, text]) => {
        const correct = letter === correctOption;
        return (
          <li key={letter} className={cn("flex gap-2 rounded-lg px-2 py-1", correct && "bg-accent/10 font-medium")} data-correct={correct || undefined}>
            <span className="w-4 shrink-0 font-semibold text-fg-muted">{letter}</span>
            <span className="min-w-0 break-words whitespace-pre-line">{text}</span>
            {correct && (
              <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-fg-muted">
                <Check size={14} aria-hidden="true" />
                poprawna
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
