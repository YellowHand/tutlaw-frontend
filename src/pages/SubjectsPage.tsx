import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSubjects, type Subject } from "../api/subjects";

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    getSubjects().then(setSubjects);
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">Twoje przedmioty</h1>
      <ul className="flex flex-col gap-3">
        {subjects.map((subject) => (
          <li key={subject.id} className="border rounded p-4 flex justify-between items-center">
            <span>{subject.name}</span>
            <Link to={`/subjects/${subject.id}/chapters`} className="text-blue-600 underline">
              Zobacz rozdziały
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}