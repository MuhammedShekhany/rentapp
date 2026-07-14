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

  const [showPassword, setShowPassword] = useState(false);

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
        setMessage("المستخدم غير موجود");
      }
    } catch (error) {
      console.error(error);
      setMessage("خطأ في تحميل البيانات");
    } finally {
      setPageLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName || !userPassword || !userFullName || !brId || !userRole) {
      setMessage("يرجى تعبئة جميع الحقول");
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
          user_fullname: userFullName,
          br_id: brId,
          user_role: userRole,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/user");
      } else {
        setMessage(data.message || "فشل التحديث");
      }
    } catch (error) {
      console.error(error);
      setMessage("خطأ في السيرفر");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100" dir="rtl">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-lg">

        <h1 className="text-3xl font-bold mb-6">تعديل المستخدم</h1>

        <form onSubmit={handleUpdate} className="space-y-4">

          {/* USERNAME */}
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="اسم المستخدم"
            className="w-full border rounded-xl p-3"
          />

          {/* PASSWORD WITH EYE */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full border rounded-xl p-3 pl-12"
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

          {/* FULL NAME */}
          <input
            value={userFullName}
            onChange={(e) => setUserFullName(e.target.value)}
            placeholder="الاسم الكامل"
            className="w-full border rounded-xl p-3"
          />

          {/* BRANCH */}
          <select
            value={brId}
            onChange={(e) => setBrId(e.target.value)}
            className="w-full border rounded-xl p-3"
          >
            <option value="">اختر الفرع</option>
            {branches.map((b) => (
              <option key={b.br_id} value={b.br_id}>
                {b.br_name}
              </option>
            ))}
          </select>

          {/* ROLE */}
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

          {/* MESSAGE */}
          {message && <p className="text-red-600">{message}</p>}

          {/* BUTTONS */}
          <div className="flex gap-3 pt-2">

            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-3 rounded-xl"
            >
              {loading ? "جاري التحديث..." : "تحديث المستخدم"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/user")}
              className="bg-gray-300 px-6 py-3 rounded-xl"
            >
              إلغاء
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}