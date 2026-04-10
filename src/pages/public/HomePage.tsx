export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">SaaSiFy Leads</h1>
      <p className="mt-2 text-gray-600">
        Find and convert leads faster with AI-powered prospecting
      </p>

      <div className="mt-6 flex gap-4">
        <a href="/signup" className="bg-black text-white px-6 py-2 rounded">
          Get Started
        </a>
        <a href="/login" className="border px-6 py-2 rounded">
          Login
        </a>
      </div>
    </div>
  );
}