import { useQuery } from "@tanstack/react-query";
import { getSubjects } from "../../api/subjects";

interface SubjectFilterProps {
  value: number | undefined;
  onChange: (subjectId: number | undefined) => void;
}

// Reuses the existing getSubjects() (src/api/subjects.ts) instead of
// duplicating a fetch function — it already returns the right shape.
export function SubjectFilter({ value, onChange }: SubjectFilterProps) {
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
    staleTime: 60_000,
  });

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-fg-muted">Przedmiot:</span>
      <select
        value={value ?? "all"}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === "all" ? undefined : Number(raw));
        }}
        className="min-h-11 rounded-xl border border-field bg-surface-2 px-3 text-sm"
      >
        <option value="all">Wszystkie przedmioty</option>
        {subjects?.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
    </label>
  );
}