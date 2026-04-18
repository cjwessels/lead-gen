import { Link } from "react-router-dom";
import { useState } from "react";

const lessons = [
  {
    title: "Dashboard Overview",
    description: "Understand your KPIs and activity flow.",
    steps: [
      "Review key metrics",
      "Check recent activity",
      "Understand lead flow"
    ],
    link: "/app"
  },
  {
    title: "Lead Search",
    description: "Find and qualify new leads.",
    steps: [
      "Enter search criteria",
      "Review results",
      "Save qualified leads"
    ],
    link: "/app/search"
  },
  {
    title: "Pipeline",
    description: "Manage your sales flow.",
    steps: [
      "Move leads between stages",
      "Update statuses",
      "Track conversions"
    ],
    link: "/app/pipeline"
  }
];

export default function HelpPage() {
  const [completed, setCompleted] = useState<string[]>([]);

  const toggleComplete = (title: string) => {
    setCompleted(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Interactive Help & Training</h1>

      {lessons.map((lesson) => (
        <div key={lesson.title} className="border p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold">{lesson.title}</h2>
          <p className="text-sm text-gray-500">{lesson.description}</p>

          <ul className="mt-3 space-y-1">
            {lesson.steps.map((step, i) => (
              <li key={i}>✅ {step}</li>
            ))}
          </ul>

          <div className="flex items-center gap-4 mt-4">
            <Link
              to={lesson.link}
              className="text-blue-500 underline"
            >
              Go to this section
            </Link>

            <button
              onClick={() => toggleComplete(lesson.title)}
              className="px-3 py-1 border rounded"
            >
              {completed.includes(lesson.title)
                ? "Completed"
                : "Mark Complete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}