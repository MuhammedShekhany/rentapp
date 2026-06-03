"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SubscriptionType = {
  sub_id: number;
  sub_s_date: string;
  sub_e_date: string;
  sub_amount: string;
  br_id: string;
  user_id: string;
  br_name?: string;
  user_name?: string;
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) {
      router.push("/login");
      return;
    }

    loadSubscriptions();
  }, [router]);

  const loadSubscriptions = async () => {
    try {
      const res = await fetch("/api/sub");
      const data = await res.json();

      if (data.success) {
        setSubscriptions(data.subscription || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("هل أنت متأكد من حذف هذا الاشتراك؟");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/sub/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        loadSubscriptions();
      } else {
        alert(data.message || "فشل الحذف");
      }
    } catch (error) {
      console.error(error);
      alert("خطأ في السيرفر");
    }
  };

  if (loading) return <p className="p-6 text-xl font-semibold">جاري التحميل...</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-100" dir="rtl">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-6">
        
        {/* Top Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">الاشتراكات</h1>

          <div className="flex gap-3">

            <button
              onClick={() => router.push("/admin")}
              className="bg-gray-300 text-black px-5 py-3 rounded-xl hover:bg-gray-400 transition"
            >
              الرجوع إلى الإدارة
            </button>

            <button
              onClick={() => router.push("/admin/sub/add")}
              className="bg-black text-white px-5 py-3 rounded-xl hover:opacity-90 transition"
            >
              إضافة اشتراك
            </button>

          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right">

            <thead>
              <tr className="bg-gray-200">
                <th className="p-3">المعرف</th>
                <th className="p-3">تاريخ البداية</th>
                <th className="p-3">تاريخ النهاية</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">الفرع</th>
                <th className="p-3">المستخدم</th>
                <th className="p-3">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.sub_id} className="border-b">

                  <td className="p-3">{s.sub_id}</td>
                  <td className="p-3">{s.sub_s_date?.slice(0, 10)}</td>
                  <td className="p-3">{s.sub_e_date?.slice(0, 10)}</td>
                  <td className="p-3">{s.sub_amount}</td>
                  <td className="p-3">{s.br_name || s.br_id}</td>
                  <td className="p-3">{s.user_name || s.user_id}</td>

                  <td className="p-3 flex gap-2 justify-end">

                    <button
                      onClick={() => router.push(`/admin/sub/edit/${s.sub_id}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:opacity-90 transition"
                    >
                      تعديل
                    </button>

                    <button
                      onClick={() => handleDelete(s.sub_id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl hover:opacity-90 transition"
                    >
                      حذف
                    </button>

                  </td>

                </tr>
              ))}
            </tbody>

          </table>

          {subscriptions.length === 0 && (
            <p className="text-center py-6 text-gray-500">
              لا يوجد اشتراكات
            </p>
          )}
        </div>
      </div>
    </div>
  );
}