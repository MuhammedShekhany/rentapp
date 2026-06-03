"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BranchType = {
  br_id: string;
  br_name: string;
  br_phone: string;
  br_add: string;
  createat: string;
  br_logo: string;
  br_header?: string;
};

export default function BranchPage() {
  const router = useRouter();
  const [branch, setBranch] = useState<BranchType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBranch = async () => {
    try {
      const res = await fetch("/api/branch", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setBranch(data.branch);
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

    loadBranch();
  }, [router]);

  const handleDelete = async (br_id: string) => {
    const ok = confirm("هل أنت متأكد من حذف هذا الفرع؟");
    if (!ok) return;

    try {
      const res = await fetch(`/api/branch/${br_id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        loadBranch();
      } else {
        alert(data.message || "فشل الحذف");
      }
    } catch (error) {
      console.error(error);
      alert("خطأ في السيرفر");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">الفروع</h1>
            <p className="text-gray-600 mt-1">إدارة جميع بيانات الفروع</p>
          </div>

          <button
            onClick={() => router.push("/admin/branch/add")}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            + إضافة فرع
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              جاري التحميل...
            </div>
          ) : branch.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا يوجد فروع
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">

                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">المعرف</th>
                    <th className="p-4">الاسم</th>
                    <th className="p-4">الهاتف</th>
                    <th className="p-4">العنوان</th>
                    <th className="p-4">تاريخ الإنشاء</th>
                    <th className="p-4">الشعار</th>
                    <th className="p-4">الهيدر</th>
                    <th className="p-4">الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {branch.map((item) => (
                    <tr key={item.br_id} className="border-b">

                      <td className="p-4">{item.br_id}</td>

                      <td className="p-4 font-semibold">
                        {item.br_name}
                      </td>

                      <td className="p-4">{item.br_phone}</td>

                      <td className="p-4">{item.br_add}</td>

                      <td className="p-4">
                        {item.createat
                          ? new Date(item.createat).toLocaleDateString()
                          : "-"}
                      </td>

                      {/* LOGO */}
                      <td className="p-4">
                        {item.br_logo ? (
                          <img
                            src={item.br_logo}
                            className="w-16 h-16 object-cover rounded-full border"
                            alt="logo"
                          />
                        ) : (
                          <span className="text-gray-400">لا يوجد</span>
                        )}
                      </td>

                      {/* HEADER */}
                      <td className="p-4">
                        {item.br_header ? (
                          <img
                            src={item.br_header}
                            className="w-28 h-16 object-cover rounded-xl border"
                            alt="header"
                          />
                        ) : (
                          <span className="text-gray-400">لا يوجد</span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">

                          <button
                            onClick={() =>
                              router.push(`/admin/branch/edit/${item.br_id}`)
                            }
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                          >
                            تعديل
                          </button>

                          <button
                            onClick={() => handleDelete(item.br_id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg"
                          >
                            حذف
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

        {/* BACK */}
        <button
          onClick={() => router.push("/admin")}
          className="mt-6 bg-gray-800 text-white px-5 py-3 rounded-xl"
        >
          ← الرجوع إلى الإدارة
        </button>

      </div>
    </div>
  );
}