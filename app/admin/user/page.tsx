"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserType = {
  user_id: string;
  user_name: string;
  user_password: string;
  user_fullname: string;
  br_id: string;
  br_name: string;
  user_role: string;
  createat: string;
};

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(session);

    if (user.user_role !== "admin") {
      router.push("/dashboard");
      return;
    }

    loadUser();
  }, [router]);

  const handleDelete = async (user_id: string) => {
    const ok = confirm("Are you sure you want to delete this user?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/user/${user_id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        loadUser();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">User</h1>
            <p className="text-gray-600 mt-1">Manage all user data</p>
          </div>

          <button
            onClick={() => router.push("/admin/user/add")}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            + Add User
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : user.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No user found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">User Name</th>
                    <th className="p-4">Full Name</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Password</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {user.map((item) => (
                    <tr key={item.user_id} className="border-b">
                      <td className="p-4">{item.user_id}</td>
                      <td className="p-4 font-semibold">{item.user_name}</td>
                      <td className="p-4">{item.user_fullname}</td>
                      <td className="p-4">{item.br_name || "-"}</td>
                      <td className="p-4">{item.user_role}</td>
                      <td className="p-4">••••••••</td>
              
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              router.push(`/admin/user/edit/${item.user_id}`)
                            }
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(item.user_id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push("/admin")}
          className="mt-6 bg-gray-800 text-white px-5 py-3 rounded-xl"
        >
          ← Back to Admin
        </button>
      </div>
    </div>
  );
}