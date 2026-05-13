"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName || !userPassword) {
      setMessage("يرجى ملء جميع الحقول");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/login_admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName,
          user_password: userPassword,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(data.message || "فشل تسجيل الدخول");
        return;
      }

      const userData = data.user;

      // =========================
      // حفظ الجلسة
      // =========================
      const session = {
        user_id: userData.user_id,
        user_name: userData.user_name,
        user_fullname: userData.user_fullname,
        user_role: userData.user_role,
        login_time: new Date().toISOString(),
      };

      localStorage.setItem("userSession", JSON.stringify(session));

      // =========================
      // التوجيه حسب الدور
      // =========================
      if (userData.user_role === "admin") {
        router.push("/admin");
        return;
      }

      if (userData.user_role === "br_admin") {
        router.push("/br_admin");
        return;
      }

      setMessage("غير مصرح بالدخول");

    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setMessage("خطأ في الخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-2xl font-bold text-center mb-6">
          تسجيل الدخول
        </h1>

        <form className="space-y-4" onSubmit={handleLogin}>

          <input
            type="text"
            placeholder="اسم المستخدم"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-black text-right"
          />

          <input
            type="password"
            placeholder="كلمة المرور"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-black text-right"
          />

          {message && (
            <p className="text-red-600 text-sm text-center">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-xl p-3 font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "جاري تسجيل الدخول..." : "دخول"}
          </button>

        </form>

      </div>
    </div>
  );
}