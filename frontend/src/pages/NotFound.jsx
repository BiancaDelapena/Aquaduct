// NotFound.jsx
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <h1 className="text-9xl font-bold text-brand-500">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-white/90">
        Page Not Found
      </h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="mt-6 px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition"
      >
        Back to Home
      </a>
    </div>
  );
}