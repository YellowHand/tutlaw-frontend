import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/subjects" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="max-w-5xl mx-auto flex justify-between items-center p-6">
        <span className="text-xl font-bold">Tutlaw</span>
        <div className="flex gap-4">
          <Link to="/login" className="border border-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-5">Zaloguj się</Link>
          <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Zarejestruj się
          </Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto text-center py-20 px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Ucz się prawa mądrzej, nie więcej
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Fiszki, algorytm powtórek i statystyki postępu stworzone specjalnie
          pod program studiów prawniczych. Zacznij od Prawoznawstwa.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
            Zarejestruj się za darmo
          </Link>
          <Link to="/login" className="border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50">
            Mam już konto
          </Link>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Notatki i podręczniki to za mało</h2>
          <p className="text-gray-600">
            Przeczytanie definicji raz nie wystarczy, żeby zapamiętać ją na egzamin.
            Tutlaw wykorzystuje algorytm FSRS – ten sam rodzaj systemu powtórek
            co w Anki – żeby pokazywać Ci dokładnie to, co zaraz zapomnisz, zanim
            to się stanie.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold text-center mb-10">Co dostajesz</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard
            title="Fiszki z cytatami"
            description="Każda definicja opatrzona numerem strony z podręcznika – ucz się z dokładnym odniesieniem do źródła."
          />
          <FeatureCard
            title="Algorytm FSRS"
            description="Nowoczesny system powtórek, który dopasowuje się do Twojego tempa zapamiętywania każdego pojęcia osobno."
          />
          <FeatureCard
            title="Statystyki i słabe punkty"
            description="Zobacz dokładnie, które pojęcia wymagają więcej uwagi, zamiast zgadywać przed egzaminem."
          />
          <FeatureCard
            title="Zbudowane pod program UG"
            description="Treści dopasowane do sylabusu, wykładów i wymagań konkretnych wykładowców."
          />
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Stworzone przez studenta prawa, dla studentów prawa</h2>
          <p className="text-gray-600">
            Zacząłem od Prawoznawstwa na pierwszym semestrze – kolejne przedmioty
            (Historia prawa, Prawo rzymskie, Prawo konstytucyjne) w drodze.
          </p>
        </div>
      </section>

      <section className="py-20 text-center px-6">
        <h2 className="text-2xl font-bold mb-6">Dołącz i zacznij się uczyć mądrzej</h2>
        <Link to="/register" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
          Zarejestruj się za darmo
        </Link>
      </section>

      <footer className="text-center text-sm text-gray-400 py-6 border-t">
        Tutlaw © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}