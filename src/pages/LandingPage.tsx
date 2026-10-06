import { useEffect, useState } from "react";
import { api } from "../api/axiosInstance";

export function LandingPage() {
  const [status, setStatus] = useState("sprawdzam...");

  useEffect(() => {
    api.get("actuator/health")
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus("BŁĄD POŁĄCZENIA"));
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Tutlaw</h1>
      <p>Status backendu: {status}</p>
    </div>
  );
}
