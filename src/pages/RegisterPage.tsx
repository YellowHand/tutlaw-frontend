import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axiosInstance";

export function RegisterPage() {
  const [privateEmail, setPrivateEmail] = useState("");
  const [universityEmail, setUniversityEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/auth/register", { privateEmail, universityEmail, password });
      navigate("/check-email");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Rejestracja nie powiodła się");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-6">Rejestracja</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="email" placeholder="Mail prywatny" value={privateEmail}
          onChange={(e) => setPrivateEmail(e.target.value)} className="border rounded p-2" required />
        <input type="email" placeholder="Mail uczelniany" value={universityEmail}
          onChange={(e) => setUniversityEmail(e.target.value)} className="border rounded p-2" required />
        <input type="password" placeholder="Hasło (min. 8 znaków)" value={password}
          onChange={(e) => setPassword(e.target.value)} className="border rounded p-2" required minLength={8} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white rounded p-2">Zarejestruj się</button>
      </form>
    </div>
  );
}