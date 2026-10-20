import { COUNT_CHOICES, type CustomTestScope } from "../../api/customTest";
import type { TestCatalog } from "../../api/tests";
import { pluralizePl } from "../../lib/plural";

/** Akt prawny (albo zagadnienie), w którym jest co rozwiązywać. */
export interface TreeAct {
  id: number;
  name: string;
  questionCount: number;
}

/**
 * Pozycja najwyższego poziomu drzewa. U użytkownika aplikacji to dziedzina z aktami prawnymi (własny test łączy źródła
 * w obrębie aktu, więc są tylko dwa poziomy). U Studenta to przedmiot (`course`): jego jedyny „akt" ma ten sam numer
 * co przedmiot, dzięki czemu cały wybór działa tak samo, a ekran pokazuje płaską listę przedmiotów.
 */
export interface TreeField {
  id: number;
  name: string;
  questionCount: number;
  acts: TreeAct[];
  /** Prawda dla przedmiotu Studenta; `id` jest wtedy numerem przedmiotu, a nie dziedziny. */
  course?: boolean;
  /** Akty prawne przedmiotu (do odtworzenia wyboru z zapisanego testu); tylko dla `course`. */
  actIds?: number[];
}

export type CheckState = "checked" | "partial" | "unchecked";

/** Czy drzewo składa się z przedmiotów Studenta (a nie z dziedzin i aktów). */
export function isCourseTree(tree: readonly TreeField[]): boolean {
  return tree.length > 0 && tree.every((field) => field.course === true);
}

/**
 * Drzewo do wyboru: tylko pozycje, w których można teraz coś rozwiązać (według katalogu Testów, czyli z uwzględnieniem
 * puli, zawężenia i filtra źródeł). Student wybiera przedmioty, użytkownik aplikacji dziedziny i akty prawne. Puste
 * pozycje pominięto, bo nie dałyby żadnego pytania.
 */
export function buildTree(catalog: TestCatalog | undefined): TreeField[] {
  if (catalog && catalog.courses.length > 0) {
    return catalog.courses
      .filter((course) => course.questionCount > 0)
      .map((course) => ({
        id: course.id,
        name: course.name,
        questionCount: course.questionCount,
        course: true,
        actIds: course.actIds,
        acts: [{ id: course.id, name: course.name, questionCount: course.questionCount }],
      }));
  }
  return (catalog?.fields ?? [])
    .map((field) => ({
      id: field.id,
      name: field.name,
      questionCount: field.questionCount,
      acts: field.acts
        .filter((act) => act.questionCount > 0)
        .map((act) => ({ id: act.id, name: act.name, questionCount: act.questionCount })),
    }))
    .filter((field) => field.acts.length > 0);
}

export function allActIds(tree: readonly TreeField[]): Set<number> {
  return new Set(tree.flatMap((field) => field.acts.map((act) => act.id)));
}

export function fieldState(field: TreeField, selected: ReadonlySet<number>): CheckState {
  const chosen = field.acts.filter((act) => selected.has(act.id)).length;
  if (chosen === 0) return "unchecked";
  return chosen === field.acts.length ? "checked" : "partial";
}

/** Kliknięcie dziedziny: zaznaczona w całości odznacza wszystkie jej akty, w pozostałych przypadkach zaznacza wszystkie. */
export function toggleField(field: TreeField, selected: ReadonlySet<number>): Set<number> {
  const next = new Set(selected);
  const clear = fieldState(field, selected) === "checked";
  for (const act of field.acts) {
    if (clear) next.delete(act.id);
    else next.add(act.id);
  }
  return next;
}

export function toggleAct(id: number, selected: ReadonlySet<number>): Set<number> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Zostawia w wyborze tylko akty, które nadal są w drzewie (np. po zmianie puli znikają puste dziedziny). */
export function restrictToTree(tree: readonly TreeField[], ids: Iterable<number>): Set<number> {
  const known = allActIds(tree);
  return new Set(Array.from(ids).filter((id) => known.has(id)));
}

/**
 * Zakres do wysłania na serwer. Dziedzina zaznaczona w całości idzie jako dziedzina, częściowa jako jej zaznaczone akty.
 * Gdy zaznaczono wszystko, lista jest pusta, a serwer bierze całą pulę (też akty dodane w międzyczasie).
 */
export function toScope(tree: readonly TreeField[], selected: ReadonlySet<number>): CustomTestScope {
  const everything = tree.every((field) => fieldState(field, selected) === "checked");
  const fieldIds: number[] = [];
  const actIds: number[] = [];
  if (isCourseTree(tree)) {
    // Student: wybrane przedmioty (przedmiot zastępuje wszystkie swoje akty); wszystkie = cała pula.
    const courseIds = everything ? [] : tree.filter((field) => selected.has(field.id)).map((field) => field.id);
    return { fieldIds, actIds, courseIds };
  }
  if (!everything) {
    for (const field of tree) {
      const state = fieldState(field, selected);
      if (state === "checked") fieldIds.push(field.id);
      else if (state === "partial") {
        actIds.push(...field.acts.filter((s) => selected.has(s.id)).map((s) => s.id));
      }
    }
  }
  return { fieldIds, actIds, courseIds: [] };
}

/** Czy zaznaczono cokolwiek (pusty wybór nie ma sensu: serwer wziąłby wtedy całą pulę). */
export function hasSelection(tree: readonly TreeField[], selected: ReadonlySet<number>): boolean {
  return tree.some((field) => fieldState(field, selected) !== "unchecked");
}

export function isEverythingSelected(tree: readonly TreeField[], selected: ReadonlySet<number>): boolean {
  return tree.length > 0 && tree.every((field) => fieldState(field, selected) === "checked");
}

/**
 * „Cała pula", „Kodeks karny", „Kodeks karny i Kodeks cywilny", „5 pozycji w 2 dziedzinach" albo, u Studenta,
 * „Prawo karne i Prawo cywilne" i „3 przedmioty".
 */
export function describeSelection(tree: readonly TreeField[], selected: ReadonlySet<number>): string {
  if (!hasSelection(tree, selected)) return "Nic nie wybrano";
  if (isEverythingSelected(tree, selected)) return "Cała pula";
  const chosen = tree.flatMap((field) => field.acts.filter((act) => selected.has(act.id)));
  if (chosen.length <= 2) return chosen.map((act) => act.name).join(" i ");
  if (isCourseTree(tree)) {
    return `${chosen.length} ${pluralizePl(chosen.length, { one: "przedmiot", few: "przedmioty", many: "przedmiotów" })}`;
  }
  const fieldCount = tree.filter((field) => fieldState(field, selected) !== "unchecked").length;
  const positions = pluralizePl(chosen.length, { one: "pozycja", few: "pozycje", many: "pozycji" });
  const kinds = fieldCount === 1 ? "dziedzinie" : "dziedzinach";
  return `${chosen.length} ${positions} w ${fieldCount} ${kinds}`;
}

/**
 * Odtwarza zaznaczenie z zakresu zapisanego testu (dziedziny, akty prawne i przedmioty). Pozycje, których już nie ma w
 * drzewie (np. po zmianie puli albo ścieżki), odpadają. Zakres pusty = cała pula. Zwraca też liczbę pominiętych pozycji.
 * Zapisany test przechowuje akty wybranych przedmiotów w `actIds`, więc przy zmianie ścieżki da się je odtworzyć:
 * Student dostaje przedmioty, które obejmują te akty, a użytkownik aplikacji same akty.
 */
export function selectionFromScope(
  tree: readonly TreeField[],
  fieldIds: readonly number[],
  actIds: readonly number[],
  courseIds: readonly number[] = []
): { selected: Set<number>; missing: number } {
  if (fieldIds.length === 0 && actIds.length === 0 && courseIds.length === 0) {
    return { selected: allActIds(tree), missing: 0 };
  }
  const selected = new Set<number>();
  let missing = 0;
  if (isCourseTree(tree)) {
    for (const courseId of courseIds) {
      if (tree.some((field) => field.id === courseId)) selected.add(courseId);
      else missing += 1;
    }
    // Test ułożony z aktów (np. na ścieżce aplikacji): wybieramy przedmioty, które te akty obejmują.
    // Akty przedmiotów wybranych wprost są już w `actIds`, więc dla nich pomijamy to, co i tak zaznaczono.
    const coveredByChosen = new Set(tree.filter((field) => selected.has(field.id)).flatMap((field) => field.actIds ?? []));
    for (const actId of actIds) {
      if (coveredByChosen.has(actId)) continue;
      const covering = tree.filter((field) => field.actIds?.includes(actId));
      if (covering.length === 0) missing += 1;
      else covering.forEach((field) => selected.add(field.id));
    }
    // Dziedzin nie da się odtworzyć z przedmiotów.
    missing += fieldIds.length;
    return { selected, missing };
  }
  // Test ułożony z przedmiotów, a teraz użytkownik wybiera akty: akty przedmiotów są w `actIds`, same przedmioty odpadają.
  if (courseIds.length > 0 && actIds.length === 0 && fieldIds.length === 0) {
    return { selected: allActIds(tree), missing: courseIds.length };
  }
  for (const fieldId of fieldIds) {
    const field = tree.find((c) => c.id === fieldId);
    if (!field) missing += 1;
    else field.acts.forEach((act) => selected.add(act.id));
  }
  const known = allActIds(tree);
  for (const actId of actIds) {
    if (known.has(actId)) selected.add(actId);
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
