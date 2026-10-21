import { COUNT_CHOICES, EMPTY_SCOPE, type CustomTestScope } from "../../api/customTest";
import type { TestCatalog } from "../../api/tests";
import { pluralizePl } from "../../lib/plural";

/** Rozdział aktu prawnego, w którym jest co rozwiązywać. */
export interface TreeSection {
  id: number;
  name: string;
  questionCount: number;
}

/** Akt prawny (albo zagadnienie), w którym jest co rozwiązywać, z rozdziałami (pusta lista, gdy akt ich nie ma). */
export interface TreeAct {
  id: number;
  name: string;
  questionCount: number;
  sections: TreeSection[];
}

/**
 * Pozycja najwyższego poziomu drzewa: dziedzina (użytkownik aplikacji) albo przedmiot (`course`, Student). Akty prawne
 * Studenta są takie same jak aplikacji (te same numery i rozdziały), tylko pogrupowane w przedmioty; ten sam akt może być
 * w dwóch przedmiotach i wtedy jest jednym wyborem.
 */
export interface TreeGroup {
  id: number;
  name: string;
  questionCount: number;
  acts: TreeAct[];
  /** Prawda dla przedmiotu Studenta; `id` jest wtedy numerem przedmiotu, a nie dziedziny. */
  course?: boolean;
}

/**
 * Wybór użytkownika: akty prawne zaznaczone w całości (z pytaniami bez rozdziału włącznie) i rozdziały zaznaczone osobno.
 * Akt zaznaczony w całości nie ma w `sections` swoich rozdziałów (tak pilnują tego funkcje poniżej).
 */
export interface Selection {
  acts: ReadonlySet<number>;
  sections: ReadonlySet<number>;
}

export const NOTHING: Selection = { acts: new Set(), sections: new Set() };

export type CheckState = "checked" | "partial" | "unchecked";

/** Czy drzewo składa się z przedmiotów Studenta (a nie z dziedzin). */
export function isCourseTree(tree: readonly TreeGroup[]): boolean {
  return tree.length > 0 && tree.every((group) => group.course === true);
}

function toTreeAct(act: { id: number; name: string; questionCount: number; sections?: readonly TreeSection[] }): TreeAct {
  return {
    id: act.id,
    name: act.name,
    questionCount: act.questionCount,
    sections: (act.sections ?? []).filter((section) => section.questionCount > 0),
  };
}

/**
 * Drzewo do wyboru: tylko pozycje, w których można teraz coś rozwiązać (według katalogu Testów, czyli z uwzględnieniem
 * puli, zawężenia i wybranego źródła). Student wybiera z przedmiotów, użytkownik aplikacji z dziedzin; w obu przypadkach
 * liśćmi są akty prawne z rozdziałami. Puste pozycje pominięto, bo nie dałyby żadnego pytania.
 */
export function buildTree(catalog: TestCatalog | undefined): TreeGroup[] {
  if (!catalog) return [];
  const fields = Array.isArray(catalog.fields) ? catalog.fields : [];
  if (catalog.courses.length > 0) {
    const byId = new Map(fields.flatMap((field) => field.acts).map((act) => [act.id, act] as const));
    return catalog.courses
      .map((course) => ({
        id: course.id,
        name: course.name,
        questionCount: course.questionCount,
        course: true,
        acts: course.actIds.flatMap((id) => {
          const act = byId.get(id);
          return act && act.questionCount > 0 ? [toTreeAct(act)] : [];
        }),
      }))
      .filter((course) => course.questionCount > 0 && course.acts.length > 0);
  }
  return fields
    .map((field) => ({
      id: field.id,
      name: field.name,
      questionCount: field.questionCount,
      acts: field.acts.filter((act) => act.questionCount > 0).map(toTreeAct),
    }))
    .filter((field) => field.acts.length > 0);
}

/** Wszystkie akty drzewa (akt z dwóch przedmiotów tylko raz). */
export function allActs(tree: readonly TreeGroup[]): TreeAct[] {
  const seen = new Map<number, TreeAct>();
  for (const group of tree) {
    for (const act of group.acts) if (!seen.has(act.id)) seen.set(act.id, act);
  }
  return Array.from(seen.values());
}

/** Wybór „wszystko": każdy akt w całości (pytania bez rozdziału też). */
export function everything(tree: readonly TreeGroup[]): Selection {
  return { acts: new Set(allActs(tree).map((act) => act.id)), sections: new Set() };
}

export function actState(act: TreeAct, selection: Selection): CheckState {
  if (selection.acts.has(act.id)) return "checked";
  return act.sections.some((section) => selection.sections.has(section.id)) ? "partial" : "unchecked";
}

/** Dziedzina (przedmiot) jest zaznaczona, gdy wszystkie jej akty są w całości; częściowa, gdy cokolwiek w niej wybrano. */
export function groupState(group: TreeGroup, selection: Selection): CheckState {
  const states = group.acts.map((act) => actState(act, selection));
  if (states.every((state) => state === "checked")) return "checked";
  return states.every((state) => state === "unchecked") ? "unchecked" : "partial";
}

/** Ile rozdziałów aktu jest zaznaczonych osobno. */
export function chosenSections(act: TreeAct, selection: Selection): TreeSection[] {
  return act.sections.filter((section) => selection.sections.has(section.id));
}

function copy(selection: Selection): { acts: Set<number>; sections: Set<number> } {
  return { acts: new Set(selection.acts), sections: new Set(selection.sections) };
}

/** Kliknięcie aktu: zaznaczony w całości przestaje być wybrany; pozostałe stany (także częściowy) dają cały akt. */
export function toggleAct(act: TreeAct, selection: Selection): Selection {
  const next = copy(selection);
  if (next.acts.has(act.id)) {
    next.acts.delete(act.id);
  } else {
    next.acts.add(act.id);
    for (const section of act.sections) next.sections.delete(section.id);
  }
  return next;
}

/**
 * Kliknięcie rozdziału. Gdy cały akt był zaznaczony, wybór zawęża się do tego jednego rozdziału (pytania bez rozdziału
 * odpadają, bo należą tylko do całego aktu). Odznaczenie ostatniego rozdziału zdejmuje akt z wyboru.
 */
export function toggleSection(act: TreeAct, section: TreeSection, selection: Selection): Selection {
  const next = copy(selection);
  if (next.acts.has(act.id)) {
    next.acts.delete(act.id);
    next.sections.add(section.id);
  } else if (next.sections.has(section.id)) {
    next.sections.delete(section.id);
  } else {
    next.sections.add(section.id);
  }
  return next;
}

/** Kliknięcie dziedziny (przedmiotu): zaznaczona w całości odznacza wszystko w niej, w pozostałych przypadkach zaznacza całe akty. */
export function toggleGroup(group: TreeGroup, selection: Selection): Selection {
  const next = copy(selection);
  const clear = groupState(group, selection) === "checked";
  for (const act of group.acts) {
    if (clear) {
      next.acts.delete(act.id);
    } else {
      next.acts.add(act.id);
    }
    for (const section of act.sections) next.sections.delete(section.id);
  }
  return next;
}

/** Zaznacza w aktach tylko rozdziały z listy (puste odznacza wszystkie rozdziały aktu); akt przestaje być wybrany w całości. */
export function setActSections(act: TreeAct, ids: readonly number[], selection: Selection): Selection {
  const next = copy(selection);
  next.acts.delete(act.id);
  for (const section of act.sections) next.sections.delete(section.id);
  for (const id of ids) if (act.sections.some((section) => section.id === id)) next.sections.add(id);
  return next;
}

/** Zostawia w wyborze tylko to, co nadal jest w drzewie (np. po zmianie źródła znikają akty bez pytań z tego źródła). */
export function restrictToTree(tree: readonly TreeGroup[], selection: Selection): Selection {
  const acts = allActs(tree);
  const knownActs = new Set(acts.map((act) => act.id));
  const sectionAct = new Map<number, number>();
  for (const act of acts) for (const section of act.sections) sectionAct.set(section.id, act.id);
  const nextActs = new Set(Array.from(selection.acts).filter((id) => knownActs.has(id)));
  const nextSections = new Set(
    Array.from(selection.sections).filter((id) => {
      const actId = sectionAct.get(id);
      return actId !== undefined && !nextActs.has(actId);
    })
  );
  return { acts: nextActs, sections: nextSections };
}

/** Czy zaznaczono cokolwiek (pusty wybór nie ma sensu: serwer wziąłby wtedy całą pulę). */
export function hasSelection(selection: Selection): boolean {
  return selection.acts.size > 0 || selection.sections.size > 0;
}

/** Czy wybrano całą pulę: każdy akt w całości (częściowy wybór rozdziałów to nie cała pula). */
export function isEverythingSelected(tree: readonly TreeGroup[], selection: Selection): boolean {
  const acts = allActs(tree);
  return acts.length > 0 && acts.every((act) => selection.acts.has(act.id));
}

/**
 * Zakres do wysłania na serwer. Dziedzina (przedmiot) zaznaczona w całości idzie jako dziedzina (przedmiot), pozostałe akty
 * zaznaczone w całości jako akty, a rozdziały osobno. Gdy zaznaczono wszystko, wszystkie listy są puste, a serwer bierze
 * całą pulę (też akty dodane w międzyczasie i pytania bez aktu w drzewie).
 */
export function toScope(tree: readonly TreeGroup[], selection: Selection): CustomTestScope {
  if (isEverythingSelected(tree, selection)) return EMPTY_SCOPE;

  const courses = isCourseTree(tree);
  const fieldIds: number[] = [];
  const courseIds: number[] = [];
  const covered = new Set<number>();
  for (const group of tree) {
    if (groupState(group, selection) !== "checked") continue;
    (courses ? courseIds : fieldIds).push(group.id);
    for (const act of group.acts) covered.add(act.id);
  }
  const actIds = allActs(tree)
    .filter((act) => selection.acts.has(act.id) && !covered.has(act.id))
    .map((act) => act.id);
  const sectionIds = allActs(tree).flatMap((act) =>
    act.sections.filter((section) => selection.sections.has(section.id)).map((section) => section.id)
  );
  return { fieldIds, actIds, courseIds, sectionIds };
}

/**
 * „XIX. Przestępstwa przeciwko życiu i zdrowiu" → „XIX". Nazwa rozdziału zaczyna się od jego numeru (rzymskiego albo
 * arabskiego); gdy go nie ma, zostaje cała nazwa.
 */
export function sectionShortLabel(name: string): string {
  const match = /^((?:[IVXLCDM]+|\d+)[a-z]?)\s*[.)]\s/.exec(name.trim());
  return match ? match[1] : name.trim();
}

/** Lista rozdziałów do jednej linii: „XIX", „XIX i XXXV", „XIX, XXXV i XXXVII", a przy większej liczbie „7 rozdziałów". */
function describeSections(sections: readonly TreeSection[]): string {
  const labels = sections.map((section) => sectionShortLabel(section.name));
  if (sections.length > 3) {
    return `${sections.length} ${pluralizePl(sections.length, { one: "rozdział", few: "rozdziały", many: "rozdziałów" })}`;
  }
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} i ${labels[labels.length - 1]}`;
}

/**
 * Opis wyboru do podsumowania: „Cała pula", „Kodeks karny", „Kodeks karny, rozdziały XIX i XXXV", „Kodeks karny; Kodeks cywilny"
 * albo, przy większej liczbie pozycji, „5 pozycji w 2 dziedzinach" (Student: „3 przedmioty").
 */
export function describeSelection(tree: readonly TreeGroup[], selection: Selection): string {
  if (!hasSelection(selection)) return "Nic nie wybrano";
  if (isEverythingSelected(tree, selection)) return "Cała pula";

  const parts: string[] = [];
  for (const act of allActs(tree)) {
    const state = actState(act, selection);
    if (state === "checked") {
      parts.push(act.name);
    } else if (state === "partial") {
      const chosen = chosenSections(act, selection);
      const word = chosen.length === 1 ? "rozdział" : "rozdziały";
      parts.push(
        chosen.length > 3 ? `${act.name}, ${describeSections(chosen)}` : `${act.name}, ${word} ${describeSections(chosen)}`
      );
    }
  }
  if (parts.length <= 2) return parts.join("; ");
  const groups = tree.filter((group) => groupState(group, selection) !== "unchecked").length;
  const positions = pluralizePl(parts.length, { one: "pozycja", few: "pozycje", many: "pozycji" });
  if (isCourseTree(tree)) {
    return `${parts.length} ${positions} w ${groups} ${groups === 1 ? "przedmiocie" : "przedmiotach"}`;
  }
  return `${parts.length} ${positions} w ${groups} ${groups === 1 ? "dziedzinie" : "dziedzinach"}`;
}

/**
 * Odtwarza wybór z zakresu zapisanego testu (dziedziny, przedmioty, akty i rozdziały). Pozycje, których już nie ma w
 * drzewie (np. po zmianie puli, ścieżki albo źródła), odpadają i są liczone w `missing`. Zakres pusty = cała pula.
 * Zapisany test przechowuje akty wybranych przedmiotów w `actIds`, więc po zmianie ścieżki da się je odtworzyć w obu
 * widokach; dziedzin nie da się odtworzyć z przedmiotów (i odwrotnie), o ile nie ma ich w drzewie.
 */
export function selectionFromScope(
  tree: readonly TreeGroup[],
  scope: CustomTestScope
): { selection: Selection; missing: number } {
  const { fieldIds, actIds, courseIds, sectionIds } = scope;
  if (fieldIds.length + actIds.length + courseIds.length + sectionIds.length === 0) {
    return { selection: everything(tree), missing: 0 };
  }

  const acts = new Set<number>();
  let missing = 0;
  const known = new Map(allActs(tree).map((act) => [act.id, act] as const));
  const courses = isCourseTree(tree);

  for (const id of fieldIds) {
    const group = tree.find((candidate) => candidate.id === id && candidate.course !== true);
    if (!group) missing += 1;
    else group.acts.forEach((act) => acts.add(act.id));
  }
  for (const id of courseIds) {
    const group = tree.find((candidate) => candidate.id === id && candidate.course === true);
    if (group) {
      group.acts.forEach((act) => acts.add(act.id));
    } else if (courses || actIds.length === 0) {
      // Test układany z przedmiotów, a teraz użytkownik aplikacji: jego akty są w `actIds`, same przedmioty odpadają
      // bez uwagi. Uwaga dotyczy tylko przedmiotu, którego nie ma, mimo że ten sam wybór jest teraz możliwy.
      missing += 1;
    }
  }
  for (const id of actIds) {
    if (known.has(id)) acts.add(id);
    else missing += 1;
  }

  const sections = new Set<number>();
  const sectionOwner = new Map<number, number>();
  for (const act of known.values()) for (const section of act.sections) sectionOwner.set(section.id, act.id);
  for (const id of sectionIds) {
    const owner = sectionOwner.get(id);
    if (owner === undefined) missing += 1;
    else if (!acts.has(owner)) sections.add(id);
  }
  return { selection: { acts, sections }, missing };
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
export const DEFAULT_COUNT = 20;

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

/**
 * Liczby pytań na stronie głównej Testów („Losuj z całej puli"): 10, 20, 50 i 100, ale tylko te, na które starcza pytań.
 * Gdy wszystkich pytań jest mniej niż 10, jest jedna możliwość: „Wszystkie (N)".
 */
export function hubCountOptions(available: number): CountOption[] {
  if (available <= 0) return [];
  return countOptions(available).filter((option) => option.all ? available < COUNT_CHOICES[0] : option.count <= 100);
}
