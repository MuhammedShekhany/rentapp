"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type BranchType = {
  br_id: string;
  br_name: string;
  br_img_url: string;
};

export default function ScanPage() {
  const router = useRouter();
  const params = useParams();
  const br_id = params.br_id as string;

  const [branch, setBranch] = useState<BranchType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranch = async () => {
      try {
        const res = await fetch(`/api/branch/${br_id}`);
        const data = await res.json();

        if (res.ok) {
          setBranch(data);
          setLoading(false);

          setTimeout(() => {
            router.replace(`/comment/${br_id}`);
          }, 2000);
        } else {
          setTimeout(() => {
            router.replace(`/comment/${br_id}`);
          }, 1500);
        }
      } catch (error) {
        console.error("Failed to load branch:", error);

        setTimeout(() => {
          router.replace(`/comment/${br_id}`);
        }, 1500);
      }
    };

    if (br_id) {
      loadBranch();
    }
  }, [br_id, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center px-6">
      <div className="text-center">
        {loading ? (
          <>
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-white/30 border-t-white animate-spin mb-6"></div>
            <h1 className="text-3xl font-bold">Loading...</h1>
          </>
        ) : (
          <>
            <img
              src={branch?.br_img_url || "/default-logo.png"}
              alt={branch?.br_name || "Branch"}
              className="w-28 h-28 mx-auto rounded-full object-cover shadow-2xl border-4 border-white/30 mb-6"
            />

            <h1 className="text-4xl font-bold">
              {branch?.br_name || "Welcome"}
            </h1>
          </>
        )}
      </div>
    </div>
  );
}