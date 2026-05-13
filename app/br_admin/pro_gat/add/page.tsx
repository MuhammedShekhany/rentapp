"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddProductCategoryPage() {
  const router = useRouter();

  const [pro_gat_name, setProGatName] =
    useState("");

  const [br_id, setBrId] =
    useState("");

  const [user_id, setUserId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // ======================
  // LOAD SESSION
  // ======================

  useEffect(() => {
    const session =
      localStorage.getItem(
        "userSession"
      );

    if (!session) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(session);

    setUserId(user.user_id);

    setBrId(user.br_id);
  }, [router]);

  // ======================
  // SAVE
  // ======================

  const handleSave = async () => {
    if (
      !pro_gat_name ||
      !br_id ||
      !user_id
    ) {
      return alert(
        "يرجى تعبئة جميع الحقول المطلوبة"
      );
    }

    setLoading(true);

    try {
      const res = await fetch(
        "/api/pro_gat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            pro_gat_name,

            br_id,

            user_id,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert(
          "تم إضافة المجموعة بنجاح"
        );

        router.push(
          "/br_admin/pro_gat"
        );
      } else {
        alert(
          data.message ||
            "فشل إضافة المجموعة"
        );
      }

    } catch (error) {

      console.error(error);

      alert("خطأ في السيرفر");

    } finally {

      setLoading(false);

    }
  };

  return (
    <div
      className="min-h-screen bg-gray-100 p-4 md:p-6"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER */}

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            إضافة مجموعة منتجات
          </h1>

          <p className="text-gray-600 mt-1">
            إنشاء مجموعة منتجات جديدة
          </p>
        </div>

        {/* FORM */}

        <div className="bg-white rounded-2xl shadow p-6">

          <div className="grid grid-cols-1 gap-4">

            {/* NAME */}

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                اسم المجموعة
              </label>

              <input
                type="text"
                value={pro_gat_name}
                onChange={(e) =>
                  setProGatName(
                    e.target.value
                  )
                }
                className="border p-3 rounded-xl w-full focus:ring-1 focus:ring-blue-400 outline-none"
                placeholder="أدخل اسم المجموعة"
              />
            </div>

          </div>

          {/* BUTTONS */}

          <div className="flex gap-3 mt-6">

            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading
                ? "جاري الحفظ..."
                : "حفظ المجموعة"}
            </button>

            <button
              onClick={() =>
                router.push(
                  "/br_admin/pro_gat"
                )
              }
              className="bg-gray-800 text-white px-6 py-3 rounded-xl shadow hover:bg-gray-900 transition"
            >
              إلغاء
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}