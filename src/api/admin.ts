import { api } from "./axiosInstance";
import type { PageResponse } from "./pagination";
import type { TrackKind } from "./tracks";

/*
 * Panel administratora (`/api/admin/**`, tylko rola ADMIN). Aplikacje, przedmioty Studenta, akty prawne z rozdziałami
 * i ich przypisaniami oraz arkusze egzaminów. Terminy egzaminów mają osobne endpointy (`api/examTerms.ts`).
 */

export interface AdminOverview {
  applications: number;
  courses: number;
  fields: number;
  acts: number;
  hiddenActs: number;
  sections: number;
  sheets: number;
  hiddenSheets: number;
  questions: number;
  hiddenQuestions: number;
  newReports: number;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await api.get<AdminOverview>("/api/admin/overview");
  return res.data;
}

// ---------- aplikacje ----------

export interface AdminTrack {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  kind: TrackKind;
  sortOrder: number;
  /** Akty przypisane do aplikacji. Dla Studenta pusta lista: jego akty biorą się z przedmiotów. */
  actIds: number[];
  sheetCount: number;
  /** Ilu użytkowników wybrało tę aplikację. */
  userCount: number;
  examDate: string | null;
}

export interface TrackInput {
  name: string;
  shortName: string;
  sortOrder?: number;
}

export async function getAdminTracks(): Promise<AdminTrack[]> {
  const res = await api.get<AdminTrack[]>("/api/admin/tracks");
  return res.data;
}

export async function createAdminTrack(input: TrackInput): Promise<AdminTrack> {
  const res = await api.post<AdminTrack>("/api/admin/tracks", input);
  return res.data;
}

export async function updateAdminTrack(id: number, input: TrackInput): Promise<AdminTrack> {
  const res = await api.put<AdminTrack>(`/api/admin/tracks/${id}`, input);
  return res.data;
}

export async function deleteAdminTrack(id: number): Promise<void> {
  await api.delete(`/api/admin/tracks/${id}`);
}

export async function setAdminTrackActs(id: number, actIds: number[]): Promise<AdminTrack> {
  const res = await api.put<AdminTrack>(`/api/admin/tracks/${id}/acts`, { actIds });
  return res.data;
}

// ---------- przedmioty Studenta ----------

export interface AdminCourse {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
  actIds: number[];
  /** Ilu użytkowników wybrało ten przedmiot. */
  userCount: number;
}

export interface CourseInput {
  name: string;
  sortOrder?: number;
}

export async function getAdminCourses(): Promise<AdminCourse[]> {
  const res = await api.get<AdminCourse[]>("/api/admin/courses");
  return res.data;
}

export async function createAdminCourse(input: CourseInput): Promise<AdminCourse> {
  const res = await api.post<AdminCourse>("/api/admin/courses", input);
  return res.data;
}

export async function updateAdminCourse(id: number, input: CourseInput): Promise<AdminCourse> {
  const res = await api.put<AdminCourse>(`/api/admin/courses/${id}`, input);
  return res.data;
}

export async function deleteAdminCourse(id: number): Promise<void> {
  await api.delete(`/api/admin/courses/${id}`);
}

export async function setAdminCourseActs(id: number, actIds: number[]): Promise<AdminCourse> {
  const res = await api.put<AdminCourse>(`/api/admin/courses/${id}/acts`, { actIds });
  return res.data;
}

// ---------- akty prawne ----------

export type ActKind = "ACT" | "TOPIC";

export interface AdminField {
  id: number;
  name: string;
  sortOrder: number;
  actCount: number;
}

export interface AdminAct {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  fieldId: number;
  fieldName: string;
  kind: ActKind;
  sortOrder: number;
  hidden: boolean;
  questionCount: number;
  hiddenQuestionCount: number;
  sectionCount: number;
  trackIds: number[];
  courseIds: number[];
}

/** Skrócona pozycja aktu do list wyboru (przypisywanie do aplikacji i przedmiotów). */
export interface AdminActOption {
  id: number;
  name: string;
  shortName: string;
  fieldId: number;
  fieldName: string;
  kind: ActKind;
  hidden: boolean;
}

export interface ActInput {
  fieldId: number;
  name: string;
  shortName?: string;
  kind?: ActKind;
  sortOrder?: number;
}

/** Filtry listy aktów. Pusty filtr = bez ograniczenia. */
export interface ActFilter {
  query?: string;
  fieldId?: number;
  kind?: ActKind;
  hidden?: boolean;
  trackId?: number;
  courseId?: number;
  /** Tylko akty, które nie są przypisane do żadnej aplikacji ani przedmiotu. */
  unassigned?: boolean;
  page?: number;
  size?: number;
}

export async function getAdminFields(): Promise<AdminField[]> {
  const res = await api.get<AdminField[]>("/api/admin/fields");
  return res.data;
}

export async function getAdminActs(filter: ActFilter): Promise<PageResponse<AdminAct>> {
  const params: Record<string, string | number | boolean> = {};
  if (filter.query?.trim()) params.query = filter.query.trim();
  if (filter.fieldId !== undefined) params.fieldId = filter.fieldId;
  if (filter.kind !== undefined) params.kind = filter.kind;
  if (filter.hidden !== undefined) params.hidden = filter.hidden;
  if (filter.trackId !== undefined) params.trackId = filter.trackId;
  if (filter.courseId !== undefined) params.courseId = filter.courseId;
  if (filter.unassigned) params.unassigned = true;
  if (filter.page !== undefined) params.page = filter.page;
  if (filter.size !== undefined) params.size = filter.size;
  const res = await api.get<PageResponse<AdminAct>>("/api/admin/acts", { params });
  return res.data;
}

export async function getAdminActOptions(): Promise<AdminActOption[]> {
  const res = await api.get<AdminActOption[]>("/api/admin/acts/options");
  return res.data;
}

export async function getAdminAct(id: number): Promise<AdminAct> {
  const res = await api.get<AdminAct>(`/api/admin/acts/${id}`);
  return res.data;
}

export async function createAdminAct(input: ActInput): Promise<AdminAct> {
  const res = await api.post<AdminAct>("/api/admin/acts", input);
  return res.data;
}

export async function updateAdminAct(id: number, input: ActInput): Promise<AdminAct> {
  const res = await api.put<AdminAct>(`/api/admin/acts/${id}`, input);
  return res.data;
}

export async function setAdminActHidden(id: number, hidden: boolean): Promise<AdminAct> {
  const res = await api.put<AdminAct>(`/api/admin/acts/${id}/hidden`, { hidden });
  return res.data;
}

export async function setAdminActAssignments(id: number, trackIds: number[], courseIds: number[]): Promise<AdminAct> {
  const res = await api.put<AdminAct>(`/api/admin/acts/${id}/assignments`, { trackIds, courseIds });
  return res.data;
}

export async function deleteAdminAct(id: number): Promise<void> {
  await api.delete(`/api/admin/acts/${id}`);
}

// ---------- rozdziały aktu ----------

export interface AdminSection {
  id: number;
  actId: number;
  name: string;
  sortOrder: number;
  questionCount: number;
  hiddenQuestionCount: number;
}

/** Każda operacja na rozdziałach zwraca pełną, aktualną listę rozdziałów aktu. */
export async function getAdminSections(actId: number): Promise<AdminSection[]> {
  const res = await api.get<AdminSection[]>(`/api/admin/acts/${actId}/sections`);
  return res.data;
}

export async function createAdminSection(actId: number, name: string): Promise<AdminSection[]> {
  const res = await api.post<AdminSection[]>(`/api/admin/acts/${actId}/sections`, { name });
  return res.data;
}

export async function createAdminSectionsBulk(actId: number, names: string[]): Promise<AdminSection[]> {
  const res = await api.post<AdminSection[]>(`/api/admin/acts/${actId}/sections/bulk`, { names });
  return res.data;
}

export async function reorderAdminSections(actId: number, ids: number[]): Promise<AdminSection[]> {
  const res = await api.put<AdminSection[]>(`/api/admin/acts/${actId}/sections/order`, { ids });
  return res.data;
}

export async function renameAdminSection(id: number, name: string): Promise<AdminSection[]> {
  const res = await api.put<AdminSection[]>(`/api/admin/sections/${id}`, { name });
  return res.data;
}

export async function deleteAdminSection(id: number): Promise<AdminSection[]> {
  const res = await api.delete<AdminSection[]>(`/api/admin/sections/${id}`);
  return res.data;
}

// ---------- arkusze egzaminów ----------

export interface AdminSheet {
  id: number;
  slug: string;
  name: string;
  trackId: number;
  /** Krótka nazwa aplikacji arkusza (z niej i z roku powstaje domyślna nazwa arkusza). */
  trackName: string;
  examYear: number;
  hidden: boolean;
  questionCount: number;
  hiddenQuestionCount: number;
}

export async function getAdminSheets(trackId?: number): Promise<AdminSheet[]> {
  const res = await api.get<AdminSheet[]>("/api/admin/sheets", { params: trackId !== undefined ? { trackId } : undefined });
  return res.data;
}

export async function createAdminSheet(trackId: number, examYear: number): Promise<AdminSheet> {
  const res = await api.post<AdminSheet>("/api/admin/sheets", { trackId, examYear });
  return res.data;
}

export async function updateAdminSheet(id: number, examYear: number, name?: string): Promise<AdminSheet> {
  const res = await api.put<AdminSheet>(`/api/admin/sheets/${id}`, { examYear, name: name?.trim() ? name.trim() : undefined });
  return res.data;
}

export async function setAdminSheetHidden(id: number, hidden: boolean): Promise<AdminSheet> {
  const res = await api.put<AdminSheet>(`/api/admin/sheets/${id}/hidden`, { hidden });
  return res.data;
}

export async function deleteAdminSheet(id: number): Promise<void> {
  await api.delete(`/api/admin/sheets/${id}`);
}
