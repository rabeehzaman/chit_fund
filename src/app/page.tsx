import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Chit Fund Management System
        </h1>
        <p className="text-gray-600 mb-6">
          A comprehensive application for managing chit fund operations, members, and collections.
        </p>
        <div className="space-y-3">
          <Link href="/chit-funds" className="block">
            <Button className="w-full">
              Enter System
            </Button>
          </Link>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>
            💼 Internal Management System
          </p>
        </div>
      </div>
    </div>
  );
}