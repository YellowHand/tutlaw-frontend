import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { ROUTES } from "../../config/routes";
import { cn } from "../../lib/cn";
import { pluralizePl } from "../../lib/plural";
import type { LimitIssue } from "./newQuestionsLimit";

const LINK = "underline underline-offset-2 hover:text-fg";

/**
 * Uczciwa informacja o tempie nowych pytań. Gdy wystarczy podnieść własny limit, mówi to i prowadzi do Ustawień. Gdy
 * potrzeba więcej, niż da się rozsądnie robić dziennie, mówi wprost, że wszystkiego nie uda się zacząć na czas, zamiast
 * prosić o podniesienie limitu, które nic by nie dało.
 * `withSettingsLink: false` w Ustawieniach, gdzie link do nich byłby odsyłaniem do tego samego miejsca.
 */
export function LimitNotice({ issue, withSettingsLink = true, className }: { issue: LimitIssue; withSettingsLink?: boolean; className?: string }) {
  const needed = (n: number) => `${n} ${pluralizePl(n, { one: "nowego pytania", few: "nowych pytań", many: "nowych pytań" })}`;

  return (
    <p data-testid="limit-notice" data-kind={issue.kind} className={cn("flex items-start gap-2 text-sm text-warning", className)}>
      <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      {issue.kind === "raise" ? (
        <span>
          Żeby zdążyć, potrzeba {needed(issue.required)} dziennie, a Twój limit to {issue.limit}.{" "}
          {withSettingsLink ? (
            <>
              Zmień go w{" "}
              <Link to={ROUTES.account} className={LINK}>
                Ustawieniach
              </Link>{" "}
              albo wybierz limit automatyczny.
            </>
          ) : (
            "Podnieś go albo wybierz limit automatyczny."
          )}
        </span>
      ) : (
        <span>
          Wszystkich nowych pytań nie zdążysz zacząć przed ostatnimi dwoma tygodniami: trzeba by {needed(issue.required)} dziennie, a{" "}
          {issue.max} dziennie to rozsądne maksimum.{issue.auto ? ` Limit ustawiliśmy na ${issue.max}.` : ""} Zawęź pulę, np. w oknie{" "}
          <Link to={ROUTES.tests} className={LINK}>
            „Pula pytań” w Testach
          </Link>
          , albo skup się na tym, co najważniejsze.
        </span>
      )}
    </p>
  );
}
