export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Our Line in Time
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Personal and family memory preservation platform
        </p>
        <div className="space-x-4">
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/auth/register"
            className="inline-block px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Get Started
          </a>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>Status: Foundation deployment test</p>
          <p>API Health: <span id="api-status">Checking...</span></p>
        </div>
      </div>
    </div>
  );
}