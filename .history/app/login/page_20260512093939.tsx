"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

type BranchType = {
  br_id: string;
  br_name: string;
  br_phone: string;
  br_add: string;
  br_logo: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const br_id = searchParams.get("br_id");

  const [branch, setBranch] = useState<BranchType | null>(null);

  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("branchData");

    if (data) {
      const parsed = JSON.parse(data);

      // تأكد أن الفرع المخزن هو نفسه الموجود بالرابط
      if (!br_id || parsed.br_id !== br_id) {
        localStorage.removeItem("branchData");
        setBranch(null);
        return;
      }

      setBranch(parsed);
    }
  }, [br_id]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!br_id) {
      setMessage("رابط الفرع غير صحيح");
      return;
    }

    if (!userName || !userPassword) {
      setMessage("يرجى ملء جميع الحقول");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: userName,
          user_password: userPassword,
          br_id: br_id,
        }),
      });

      const data = await res.json();

      // المستخدم غير موجود أو كلمة المرور خطأ أو ليس ضمن هذا الفرع
      if (!data.success) {
        setMessage(
          data.message || "اسم المستخدم أو كلمة المرور أو الفرع غير صحيح"
        );
        return;
      }

      const userData = data.user;

      // تأكد أن المستخدم تابع لنفس الفرع
      if (userData.br_id !== br_id) {
        setMessage("هذا المستخدم لا يتبع لهذا الفرع");
        return;
      }

      // حفظ الجلسة
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userSession", JSON.stringify(userData));

      // حفظ بيانات الفرع
      if (branch) {
        localStorage.setItem("branchData", JSON.stringify(branch));
      }

      // التوجيه حسب الدور
      if (userData.user_role === "admin") {
        router.push("/admin");
      } else if (userData.user_role === "br_admin") {
        router.push("/br_admin");
      } else if (userData.user_role === "br_ass") {
        router.push("/br_ass");
      } else if (userData.user_role === "br_user") {
        router.push("/br_user");
      } else {
        setMessage("لا يوجد صلاحية لهذا المستخدم");
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      setMessage("خطأ في الخادم");
    } finally {
      setLoading(false);
    }
  };

  const getLogoUrl = (logo: string | undefined) => {
    if (!logo) return "/placeholder.png";

    if (logo.startsWith("http")) return logo;

    return `/${logo.replace(/^\/+/, "")}`;
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-100 flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        {/* الشعار */}
        <div className="flex flex-col items-center mb-6">

          {branch?.br_logo ? (
            <div className="w-28 h-28 rounded-full border-4 border-black overflow-hidden mb-4">
              <Image
                src={getLogoUrl(branch.br_logo)}
                alt={branch?.br_name || "شعار الفرع"}
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-28 h-28 bg-gray-200 rounded-full border-4 border-black mb-4 flex items-center justify-center text-gray-500">
              شعار
            </div>
          )}

          <h1 className="text-2xl font-bold text-center">
            {branch?.br_name || "تسجيل الدخول"}
          </h1>

        </div>

        {/* الفورم */}
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
            <p className="text-red-600 text-sm text-center">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-xl p-3 font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>

        </form>
      </div>
    </div>
  );
}