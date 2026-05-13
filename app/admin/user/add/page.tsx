"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BranchType = {
  br_id: string;
  br_name: string;
};

export default function AddUserPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userFullname, setUserFullname] = useState("");
  const [brId, setBrId] = useState("");
  const [userRole, setUserRole] = useState("");

  const [branches, setBranches] = useState<BranchType[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) return router.push("/login");

    const user = JSON.parse(session);
    if (user.user_role !== "admin") router.push("/dashboard");

    loadBranches();
  }, [router]);

  const loadBranches = async () => {
    try {
      const res = await fetch("/api/branch");
      const data = await res.json();

      if (data.success) {
        setBranches(data.branch);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName || !userPassword || !userFullname || !brId || !userRole) {
      setMessage("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName,
          user_password: userPassword,
          user_fullname: userFullname,
          br_id: brId,
          user_role: userRole,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/user");
      } else {
        setMessage(data.message || "Add failed");
      }
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Add User</h1>

        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">User Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="Enter user name"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              value={userFullname}
              onChange={(e) => setUserFullname(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Branch</label>
            <select
              value={brId}
              onChange={(e) => setBrId(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              <option value="">Select branch</option>
              {branches.map((item) => (
                <option key={item.br_id} value={item.br_id}>
                  {item.br_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Role</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              <option value="">Select role</option>
              <option value="admin">admin</option>
              <option value="manager">br_admin</option>
              <option value="staff">user</option>
            </select>
          </div>

          {message && (
            <p className="text-red-600 text-sm font-medium">{message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save User"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/user")}
              className="bg-gray-300 text-black px-6 py-3 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}