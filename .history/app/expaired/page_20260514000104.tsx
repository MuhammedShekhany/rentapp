"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type BranchType = {
  br_id: string;
  br_name: string;
  br_phone: string;
  br_add: string;
  br_logo: string;
};

// 1. Create a separate component for the internal logic
function ExpiredContent() {
  const searchParams = useSearchParams();
  const br_id = searchParams.get("br_id"); // Get the ID from the hook

  const [branch, setBranch] = useState<BranchType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = localStorage.getItem("branchData");
      if (data) {
        const parsed: BranchType = JSON.parse(data);
        setBranch(parsed);
      }
    } catch (err) {
      console.error("Error reading branchData:", err);
      setBranch(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="text-6xl mb-4">⚠️</div>

      <h1 className="text-2xl font-bold text-red-600 mb-3">
        Subscription Expired
      </h1>

      <p className="text-gray-700 mb-2">
        This branch subscription is not active.
      </p>

      {br_id && (
        <p className="text-sm text-gray-500 mb-4">
          Branch ID: {br_id}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading branch info...</p>
      ) : (
        <>
          {branch?.br_name && (
            <p className="text-lg font-semibold text-gray-800">{branch.br_name}</p>
          )}
          {branch?.br_phone && (
            <p className="text-sm text-gray-600 mt-2">{branch.br_phone}</p>
          )}
          {branch?.br_add && (
            <p className="text-sm text-gray-600 mt-1">{branch.br_add}</p>
          )}
        </>
      )}
    </div>
  );
}

// 2. The main export just provides the Suspense context
export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <ExpiredContent />
      </Suspense>
    </div>
  );
}