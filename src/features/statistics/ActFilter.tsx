import { useTestCatalog } from "../tests/hooks";

interface ActFilterProps {
  value: number | undefined;
  onChange: (actId: number | undefined) => void;
}

/** Wybór aktu prawnego z puli użytkownika (akty pogrupowane w dziedziny; to samo drzewo co w Testach). */
export function ActFilter({ value, onChange }: ActFilterProps) {
  const { data } = useTestCatalog();
  const fields = data?.fields.filter((field) => field.acts.length > 0) ?? [];

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-fg-muted">Akt prawny:</span>
      <select
        value={value ?? "all"}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === "all" ? undefined : Number(raw));
        }}
        className="min-h-11 max-w-[16rem] rounded-xl border border-field bg-surface-2 px-3 text-sm"
      >
        <option value="all">Cała pula</option>
        {fields.map((field) => (
          <optgroup key={field.id} label={field.name}>
            {field.acts.map((act) => (
              <option key={act.id} value={act.id}>
                {act.shortName || act.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
