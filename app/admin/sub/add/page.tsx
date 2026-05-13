"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BranchType = {
  br_id: string;
  br_name: string;
};

type SessionUserType = {
  user_id: string;
  user_name: string;
  user_role: string;
  br_id: string;
};

export default function AddSubscriptionPage() {
  const router = useRouter();

  const [subSDate, setSubSDate] = useState("");
  const [subEDate, setSubEDate] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [brId, setBrId] = useState("");

  const [branches, setBranches] = useState<BranchType[]>([]);
  const [sessionUser, setSessionUser] = useState<SessionUserType | null>(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(session);
    setSessionUser(parsedUser);

    loadPageData();
  }, [router]);

  const loadPageData = async () => {
    setPageLoading(true);
    try {
      const branchRes = await fetch("/api/branch");
      const branchData = await branchRes.json();

      if (branchData.success) setBranches(branchData.branch || []);
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setPageLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subSDate || !subEDate || !subAmount || !brId) {
      return setMessage("Fill all fields");
    }

    if (!sessionUser?.user_id) {
      return setMessage("User session not found");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sub_s_date: subSDate,
          sub_e_date: subEDate,
          sub_amount: subAmount,
          br_id: brId,
          user_id: sessionUser.user_id, // auto from login
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/sub");
      } else {
        setMessage(data.message || "Add failed");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <p className="text-xl font-semibold p-6">Loading...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Add Subscription</h1>

        <form onSubmit={handleAdd} className="space-y-4">
          <input
            type="date"
            value={subSDate}
            onChange={(e) => setSubSDate(e.target.value)}
            className="w-full border rounded-xl p-3"
          />

          <input
            type="date"
            value={subEDate}
            onChange={(e) => setSubEDate(e.target.value)}
            className="w-full border rounded-xl p-3"
          />

          <input
            type="number"
            value={subAmount}
            onChange={(e) => setSubAmount(e.target.value)}
            placeholder="Amount"
            className="w-full border rounded-xl p-3"
          />

          <select
            value={brId}
            onChange={(e) => setBrId(e.target.value)}
            className="w-full border rounded-xl p-3"
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b.br_id} value={b.br_id}>
                {b.br_name}
              </option>
            ))}
          </select>

          {/* Optional display only */}
          <div className="bg-gray-100 border rounded-xl p-3 text-sm text-gray-700">
            Logged in as: <span className="font-semibold">{sessionUser?.user_name}</span>
          </div>

          {message && <p className="text-red-600">{message}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-black text-white px-6 py-3 rounded-xl"
              disabled={loading}
            >
              {loading ? "Saving..." : "Add Subscription"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/sub")}
              className="bg-gray-300 px-6 py-3 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}