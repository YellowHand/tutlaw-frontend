import { actGroups } from "../tests/groups";
import { useTestCatalog } from "../tests/hooks";

interface ActFilterProps {
  value: number | undefined;
  onChange: (actId: number | undefined) => void;
}

/** Wybór aktu prawnego z puli użytkownika (akty pogrupowane jak w Testach: w dziedziny, a u Studenta w przedmioty). */
export function ActFilter({ value, onChange }: ActFilterProps) {
  const { data } = useTestCatalog();
  const groups = actGroups(data);

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
        {groups.map((group) => (
          <optgroup key={group.id} label={group.name}>
            {group.acts.map((act) => (
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
