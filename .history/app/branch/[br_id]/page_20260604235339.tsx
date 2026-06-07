"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BranchPage() {
  const params = useParams();
  const router = useRouter();
  const br_id = params.br_id as string;

  useEffect(() => {
    const loadBranch = async () => {
      try {
        const res = await fetch(`/api/branch-check?br_id=${br_id}`);
        const data = await res.json();

        if (!data.success) {
          alert(data.message || "Branch not found");
          return;
        }

        // save branch locally for login page
        localStorage.setItem("branchData", JSON.stringify(data.branch));

        if (data.subscriptionActive) {
          router.push(`/login?br_id=${br_id}`);
        } else {
          router.push(`/expired?br_id=${br_id}`);
        }
      } catch (error) {
        console.error(error);
        alert("Server error");
      }
    };

    if (br_id) {
      loadBranch();
    }
  }, [br_id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-medium text-gray-700">Loading branch...</p>
      </div>
    </div>
  );
}