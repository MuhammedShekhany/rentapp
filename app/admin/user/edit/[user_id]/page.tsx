"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type BranchType = {
  br_id: string;
  br_name: string;
};

type UserType = {
  user_id: string;
  user_name: string;
  user_password: string;
  user_fullname: string;
  br_id: string;
  user_role: string;
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.user_id as string;

  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [brId, setBrId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [branches, setBranches] = useState<BranchType[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const session = localStorage.getItem("userSession");
    if (!session) {
      router.push("/login");
      return;
    }

    loadPageData();
  }, [id, router]);

  const loadPageData = async () => {
    setPageLoading(true);
    setMessage("");

    try {
      const [branchRes, userRes] = await Promise.all([
        fetch("/api/branch"),
        fetch(`/api/user/${id}`),
      ]);

      const branchData = await branchRes.json();
      const userData = await userRes.json();

      console.log("Branch Data:", branchData);
      console.log("User Data:", userData);

      if (branchData.success) {
        setBranches(branchData.branch || []);
      }

      if (userData.success && userData.user) {
        const u: UserType = userData.user;

        setUserName(u.user_name || "");
        setUserPassword(u.user_password || "");
        setUserFullName(u.user_fullname || "");
        setBrId(String(u.br_id || ""));
        setUserRole(u.user_role || "");
      } else {
        setMessage("User not found");
      }
    } catch (error) {
      console.error("Load error:", error);
      setMessage("Server error while loading data");
    } finally {
      setPageLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName || !userPassword || !userFullName || !brId || !userRole) {
      
      setMessage("Please fill all fields");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/user/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName,
          user_password: userPassword,
          user_full_name: userFullName,
          br_id: brId,
          user_role: userRole,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/user");
      } else {
        setMessage(data.message || "Update failed");
      }
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Server error while updating");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Edit User</h1>

        <form onSubmit={handleUpdate} className="space-y-4">
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Username"
            className="w-full border rounded-xl p-3"
          />

          <input
            type="password"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            placeholder="Password"
            className="w-full border rounded-xl p-3"
          />

          <input
            value={userFullName}
            onChange={(e) => setUserFullName(e.target.value)}
            placeholder="Full Name"
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

          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="w-full border rounded-xl p-3"
          >
            <option value="">Select Role</option>
            <option value="admin">admin</option>
            <option value="manager">br_admin</option>
            <option value="staff">user</option>
          </select>

          {message && <p className="text-red-600">{message}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-black text-white px-6 py-3 rounded-xl"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update User"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/user")}
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