import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600">
            Sign in to your Our Line in Time account
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <LoginForm />
        </div>

        <div className="text-center">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}