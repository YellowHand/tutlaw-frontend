import { useLocation } from "react-router-dom";
import { isStudyPath } from "../../config/navigation";
import { useStudyTimeTracker } from "./useStudyTimeTracker";

/** Niewidoczny element szkieletu aplikacji: mierzy czas nauki na ekranach sesji i egzaminu. */
export function StudyTimeTracker() {
  const { pathname } = useLocation();
  useStudyTimeTracker(isStudyPath(pathname));
  return null;
}
