import { useEffect, useState } from "react";
import { api } from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";

export function DashboardPlaceholder() {
  const [email, setEmail] = useState("");
  const { logout } = useAuth();

  useEffect(() => {
    api.get("/api/me").then((res) => setEmail(res.data.email));
  }, []);

  return (
    <div className="p-10">
      <p>Zalogowano jako: {email}</p>
      <button onClick={logout} className="mt-4 bg-red-600 text-white rounded p-2">
        Wyloguj się
      </button>
    </div>
  );
}