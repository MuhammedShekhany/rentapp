"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type BranchType = {
  br_id: string;
  br_name: string;
  br_img: string;
};

export default function ScanPage() {
  const router = useRouter();
  const params = useParams();
  const br_id = params.br_id as string;

  const [branch, setBranch] = useState<BranchType | null>(null);
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (!br_id) return;

    const loadBranch = async () => {
      try {
        const res = await fetch(`/api/branch-check?br_id=${br_id}`);
        const data = await res.json();

        if (!data.success) {
          alert(data.message || "Branch not found");
          return;
        }

        const branchData: BranchType = data.branch;

        // 1. save + set state
        setBranch(branchData);
        localStorage.setItem("brsession", JSON.stringify(branchData));

        // 2. stop loading + show animation
        setLoading(false);

        // 3. fade in
        setTimeout(() => setFade(true), 100);

        // 4. redirect after 4 seconds
        setTimeout(() => {
          router.replace(`/comment/${br_id}`);
        }, 4000);

      } catch (error) {
        console.error(error);
      }
    };

    loadBranch();
  }, [br_id, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f7f3ee] via-white to-[#f0e6da] px-6">

      <div className="absolute h-[650px] w-[650px] rounded-full bg-[#8b5e3c]/10 blur-3xl" />

      <div
        className={`relative w-full max-w-md rounded-3xl border border-[#e6d5c3] bg-white/80 p-10 text-center shadow-2xl backdrop-blur-xl transition-all duration-700 ${
          fade ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {loading ? (
          <p className="text-[#8b5e3c]">جاري التحميل...</p>
        ) : (
          <div className="space-y-5">

            {/* LOGO */}
            <div className="relative mx-auto h-64 w-64">
              <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-[#e6d5c3] bg-white shadow-2xl">
                <img
                  src={branch?.br_img || "/uploadimages/3.jpg"}
                  alt={branch?.br_name || "Branch"}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* NAME */}
            <h1 className="text-4xl font-extrabold text-[#5a3e2b]">
              {branch?.br_name}
            </h1>

            <p className="text-[#7a5a45]">
              مرحباً بك في عالم القهوة ☕
            </p>

            <p className="text-sm text-[#9b7b66]">
              سيتم تحويلك خلال ثوانٍ...
            </p>

          </div>
        )}
      </div>
    </div>
  );
}