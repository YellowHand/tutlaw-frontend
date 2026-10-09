import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="border-b bg-white">
      <div className="max-w-5xl mx-auto flex justify-between items-center p-4">
        <Link to="/subjects" className="text-xl font-bold">Tutlaw</Link>
        <div className="flex gap-4 items-center">
          <Link to="/subjects" className="text-gray-700 hover:text-blue-600">Przedmioty</Link>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Wyloguj się
          </button>
        </div>
      </div>
    </nav>
  );
}