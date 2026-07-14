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

  const [showPassword, setShowPassword] = useState(false);

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
      setMessage("يرجى تعبئة جميع الحقول المطلوبة");
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
        setMessage(data.message || "فشل الإضافة");
      }
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "خطأ في السيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-100 p-6 flex items-center justify-center"
      dir="rtl"
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">إضافة مستخدم</h1>

        <form onSubmit={handleAdd} className="space-y-4">

          {/* USERNAME */}
          <div>
            <label className="block mb-1 font-medium">اسم المستخدم</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="أدخل اسم المستخدم"
            />
          </div>

          {/* PASSWORD WITH EYE ICON */}
          <div>
            <label className="block mb-1 font-medium">كلمة المرور</label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                className="w-full border rounded-xl p-3 pl-12"
                placeholder="أدخل كلمة المرور"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
              >
                {showPassword ? (
                  // Eye Off
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-6.94" />
                    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a18.45 18.45 0 0 1-2.18 3.19" />
                    <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Eye
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* FULL NAME */}
          <div>
            <label className="block mb-1 font-medium">الاسم الكامل</label>
            <input
              type="text"
              value={userFullname}
              onChange={(e) => setUserFullname(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="أدخل الاسم الكامل"
            />
          </div>

          {/* BRANCH */}
          <div>
            <label className="block mb-1 font-medium">الفرع</label>
            <select
              value={brId}
              onChange={(e) => setBrId(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              <option value="">اختر الفرع</option>
              {branches.map((item) => (
                <option key={item.br_id} value={item.br_id}>
                  {item.br_name}
                </option>
              ))}
            </select>
          </div>

          {/* ROLE */}
          <div>
            <label className="block mb-1 font-medium">الدور</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
                <option value="">اختر الدور</option>
            <option value="admin">مدير عام</option>
            <option value="br_admin">مدير فرع</option>
            <option value="br_ass">معاون فرع</option>
            <option value="br_user">مستخدم</option>
            <option value="br_maker">الخياط</option>
            </select>
          </div>

          {/* MESSAGE */}
          {message && (
            <p className="text-red-600 text-sm font-medium">{message}</p>
          )}

          {/* BUTTONS */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? "جاري الحفظ..." : "حفظ المستخدم"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/user")}
              className="bg-gray-300 text-black px-6 py-3 rounded-xl"
            >
              إلغاء
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}