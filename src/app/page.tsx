import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 items-center">
      <h1 className="text-3xl font-bold text-center">Welcome to Go Tracker</h1>
      <p className="text-lg text-center max-w-2xl">
        Track your bowel movements with this simple, intuitive app. Log your movements, view trends, and get reminders.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <Link 
          href="/log" 
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium text-center hover:bg-blue-700 transition-colors"
        >
          Log a Movement
        </Link>
        <Link 
          href="/dashboard" 
          className="px-6 py-3 border border-gray-300 rounded-md font-medium text-center hover:bg-gray-50 transition-colors"
        >
          View Dashboard
        </Link>
      </div>
    </div>
  );
}
