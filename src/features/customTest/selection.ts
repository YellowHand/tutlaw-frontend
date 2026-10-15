import { COUNT_CHOICES, type CustomTestScope } from "../../api/customTest";
import type { TestCatalog } from "../../api/tests";
import { pluralizePl } from "../../lib/plural";

/** Akt prawny albo przedmiot, w którym jest co rozwiązywać. */
export interface TreeSubject {
  id: number;
  name: string;
  questionCount: number;
}

/** Rodzaj (kategoria) z pytaniami. Własny test łączy źródła w obrębie aktu prawnego, więc drzewo ma tylko dwa poziomy. */
export interface TreeCategory {
  id: number;
  name: string;
  questionCount: number;
  subjects: TreeSubject[];
}

export type CheckState = "checked" | "partial" | "unchecked";

/**
 * Drzewo do wyboru: tylko rodzaje i akty prawne, w których można teraz coś rozwiązać (według katalogu Testów, czyli
 * z uwzględnieniem filtra pochodzenia i nieodblokowanych rozdziałów). Puste pozycje pominięto, bo nie dałyby żadnego pytania.
 */
export function buildTree(catalog: TestCatalog | undefined): TreeCategory[] {
  return (catalog?.categories ?? [])
    .map((category) => ({
      id: category.id,
      name: category.name,
      questionCount: category.questionCount,
      subjects: category.subjects
        .filter((subject) => subject.questionCount > 0)
        .map((subject) => ({ id: subject.id, name: subject.name, questionCount: subject.questionCount })),
    }))
    .filter((category) => category.subjects.length > 0);
}

export function allSubjectIds(tree: readonly TreeCategory[]): Set<number> {
  return new Set(tree.flatMap((category) => category.subjects.map((subject) => subject.id)));
}

export function categoryState(category: TreeCategory, selected: ReadonlySet<number>): CheckState {
  const chosen = category.subjects.filter((subject) => selected.has(subject.id)).length;
  if (chosen === 0) return "unchecked";
  return chosen === category.subjects.length ? "checked" : "partial";
}

/** Kliknięcie rodzaju: zaznaczony w całości odznacza wszystkie jego akty, w pozostałych przypadkach zaznacza wszystkie. */
export function toggleCategory(category: TreeCategory, selected: ReadonlySet<number>): Set<number> {
  const next = new Set(selected);
  const clear = categoryState(category, selected) === "checked";
  for (const subject of category.subjects) {
    if (clear) next.delete(subject.id);
    else next.add(subject.id);
  }
  return next;
}

export function toggleSubject(id: number, selected: ReadonlySet<number>): Set<number> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Zostawia w wyborze tylko akty, które nadal są w drzewie (np. po zmianie filtra pochodzenia znikają puste działy). */
export function restrictToTree(tree: readonly TreeCategory[], ids: Iterable<number>): Set<number> {
  const known = allSubjectIds(tree);
  return new Set(Array.from(ids).filter((id) => known.has(id)));
}

/**
 * Zakres do wysłania na serwer. Rodzaj zaznaczony w całości idzie jako rodzaj, częściowy jako jego zaznaczone akty.
 * Gdy zaznaczono wszystko, lista jest pusta, a serwer bierze cały materiał (też działy dodane w międzyczasie).
 */
export function toScope(tree: readonly TreeCategory[], selected: ReadonlySet<number>): CustomTestScope {
  const everything = tree.every((category) => categoryState(category, selected) === "checked");
  const categoryIds: number[] = [];
  const subjectIds: number[] = [];
  if (!everything) {
    for (const category of tree) {
      const state = categoryState(category, selected);
      if (state === "checked") categoryIds.push(category.id);
      else if (state === "partial") {
        subjectIds.push(...category.subjects.filter((s) => selected.has(s.id)).map((s) => s.id));
      }
    }
  }
  return { categoryIds, subjectIds };
}

/** Czy zaznaczono cokolwiek (pusty wybór nie ma sensu: serwer wziąłby wtedy cały materiał). */
export function hasSelection(tree: readonly TreeCategory[], selected: ReadonlySet<number>): boolean {
  return tree.some((category) => categoryState(category, selected) !== "unchecked");
}

export function isEverythingSelected(tree: readonly TreeCategory[], selected: ReadonlySet<number>): boolean {
  return tree.length > 0 && tree.every((category) => categoryState(category, selected) === "checked");
}

/** „Cały materiał", „Kodeks karny", „Kodeks karny i Kodeks cywilny" albo „5 pozycji w 2 rodzajach". */
export function describeSelection(tree: readonly TreeCategory[], selected: ReadonlySet<number>): string {
  if (!hasSelection(tree, selected)) return "Nic nie wybrano";
  if (isEverythingSelected(tree, selected)) return "Cały materiał";
  const chosen = tree.flatMap((category) => category.subjects.filter((subject) => selected.has(subject.id)));
  if (chosen.length <= 2) return chosen.map((subject) => subject.name).join(" i ");
  const categories = tree.filter((category) => categoryState(category, selected) !== "unchecked").length;
  const positions = pluralizePl(chosen.length, { one: "pozycja", few: "pozycje", many: "pozycji" });
  const kinds = categories === 1 ? "rodzaju" : "rodzajach";
  return `${chosen.length} ${positions} w ${categories} ${kinds}`;
}

/**
 * Odtwarza zaznaczenie z zakresu zapisanego testu (rodzaje i akty prawne). Pozycje, których już nie ma w drzewie
 * (np. po zmianie filtra pochodzenia), odpadają. Zakres pusty = cały materiał. Zwraca też liczbę pominiętych pozycji.
 */
export function selectionFromScope(
  tree: readonly TreeCategory[],
  categoryIds: readonly number[],
  subjectIds: readonly number[]
): { selected: Set<number>; missing: number } {
  if (categoryIds.length === 0 && subjectIds.length === 0) return { selected: allSubjectIds(tree), missing: 0 };
  const selected = new Set<number>();
  let missing = 0;
  for (const categoryId of categoryIds) {
    const category = tree.find((c) => c.id === categoryId);
    if (!category) missing += 1;
    else category.subjects.forEach((subject) => selected.add(subject.id));
  }
  const known = allSubjectIds(tree);
  for (const subjectId of subjectIds) {
    if (known.has(subjectId)) selected.add(subjectId);
    else missing += 1;
  }
  return { selected, missing };
}

/** Jedna z liczb pytań do wyboru. `sends` to liczba wysyłana na serwer (przy „Wszystkie" może być większa od `count`). */
export interface CountOption {
  key: string;
  label: string;
  /** Ile pytań dostanie użytkownik. */
  count: number;
  sends: number;
  all: boolean;
}

/**
 * Liczby pytań do pokazania przy `available` dostępnych pytaniach: tylko takie, które się mieszczą (10, 20, 50, 100, 150).
 * Gdy wszystkich pytań jest mniej niż 10, jest jedna możliwość: „Wszystkie (N)". Gdy jest ich więcej niż 10, ale mniej niż 150
 * i nie wypada to na żadną z liczb, dodajemy „Wszystkie (N)" na końcu (serwer da wtedy tyle, ile jest).
 */
export function countOptions(available: number): CountOption[] {
  if (available <= 0) return [];
  if (available < COUNT_CHOICES[0]) {
    return [{ key: "all", label: `Wszystkie (${available})`, count: available, sends: available, all: true }];
  }
  const options: CountOption[] = COUNT_CHOICES.filter((choice) => choice <= available).map((choice) => ({
    key: String(choice),
    label: String(choice),
    count: choice,
    sends: choice,
    all: false,
  }));
  const max = COUNT_CHOICES[COUNT_CHOICES.length - 1];
  if (available <= max && !COUNT_CHOICES.includes(available)) {
    const sends = COUNT_CHOICES.find((choice) => choice >= available) ?? max;
    options.push({ key: "all", label: `Wszystkie (${available})`, count: available, sends, all: true });
  }
  return options;
}

/** Liczba pytań, którą proponujemy, gdy użytkownik nic jeszcze nie wybrał. */
const DEFAULT_COUNT = 20;

/**
 * Które z dostępnych opcji jest wybrane. Zapamiętana liczba, a gdy jej nie ma, najbliższa jej od dołu (łącznie z „Wszystkie (N)"):
 * kto prosił o 100 pytań, a jest ich 35, dostaje „Wszystkie (35)". Bez zapamiętanego wyboru proponujemy 20. Dla małego zakresu
 * zawsze jedyne „Wszystkie".
 */
export function pickCountOption(options: readonly CountOption[], wanted: number | "all" | null): CountOption | null {
  if (options.length === 0) return null;
  if (wanted === "all") {
    const all = options.find((o) => o.all);
    if (all) return all;
  }
  const target = typeof wanted === "number" ? wanted : DEFAULT_COUNT;
  const fits = options.filter((o) => o.count <= target);
  if (fits.length === 0) return options[0];
  return fits.reduce((best, o) => (o.count > best.count ? o : best));
}
