import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const [privateEmail, setPrivateEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post("/api/auth/login", { privateEmail, password });
      login(res.data.accessToken);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Logowanie nie powiodło się");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-6">Logowanie</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="email" placeholder="Mail prywatny" value={privateEmail}
          onChange={(e) => setPrivateEmail(e.target.value)} className="border rounded p-2" required />
        <input type="password" placeholder="Hasło" value={password}
          onChange={(e) => setPassword(e.target.value)} className="border rounded p-2" required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white rounded p-2">Zaloguj się</button>
      </form>
    </div>
  );
}