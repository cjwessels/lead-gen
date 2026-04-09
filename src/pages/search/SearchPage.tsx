import { useState } from "react";
import axios from "axios";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    const res = await axios.post("/api/places-search", { query });
    setResults(res.data.places || []);
  };

  return (
    <div className="p-6">
      <input
        className="border p-2 w-full"
        placeholder="Search e.g. panel beaters Johannesburg"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={search} className="mt-2 bg-black text-white px-4 py-2">
        Search
      </button>

      <div className="mt-4 space-y-2">
        {results.map((r, i) => (
          <div key={i} className="border p-3 rounded">
            <h3>{r.displayName?.text}</h3>
            <p>{r.formattedAddress}</p>
            <p>{r.rating}</p>
          </div>
        ))}
      </div>
    </div>
  );
}