"use client";

import { useEffect, useState,useMemo } from "react";
import { useRouter } from "next/navigation";

type SpendType = {
  sp_id: number;
  sp_no: number;
  sp_total: number;
  sp_date: string;
  sp_detail: string;

  br_name: string;
  user_name: string;

  sp_gat_name: string;
};
type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
  br_name?: string;
};

export default function SpendPage() {
  const router = useRouter();

  const [spends, setSpends] = useState<SpendType[]>([]);
  const [loading, setLoading] = useState(true);

  // 📅 month (API filter)
  const [month, setMonth] = useState("");

  // 🔎 search (UI filter)
  const [search, setSearch] = useState("");

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

    const [user, setUser] = useState<UserType | null>(null);

  // ======================
  // LOAD DATA
  // ======================

  const loadSpends = async (m?: string) => {
    try {
      setLoading(true);

      let url = "/api/spend";

      if (m) {
        url += `?month=${m}`;
      }

      const res = await fetch(
  `/api/spend?month=${month}&br_id=${user!.br_id}`
)

      const data = await res.json();

      if (data.success) {
        setSpends(data.spend);
      } else {
        setSpends([]);
      }
    } catch (error) {
      console.error(error);

      setSpends([]);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // FIRST LOAD
  // ======================

// ✅ BASE PATH (FIXED)
    const basePath = useMemo(() => {
      if (!user) return "";
  
      return user.user_role === "br_admin"
        ? "/br_admin"
        : user.user_role === "br_ass"
        ? "/br_ass"
        : "/br_user";
    }, [user]);



  useEffect(() => {
      const session = localStorage.getItem("userSession");
  
      if (!session) {
        router.replace("/login");
        return;
      }
  
      const parsedUser: UserType = JSON.parse(session);
  
      setUser(parsedUser);

    const now = new Date();

    const currentMonth = now
      .toISOString()
      .slice(0, 7);

    setMonth(currentMonth);
  }, [router]);

  // ======================
  // MONTH CHANGE
  // ======================

  useEffect(() => {

    if (user?.br_id) {
    if (month) {
      loadSpends(month);
    }
  }
  }, [month]);

  // ======================
  // DELETE
  // ======================

  const handleDelete = async (
    sp_id: number
  ) => {
    const ok = confirm(
      "هل أنت متأكد من حذف هذا المصروف؟"
    );

    if (!ok) return;

    try {
      const res = await fetch(
        `/api/spend/${sp_id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (data.success) {
        loadSpends(month);
      } else {
        alert(data.message || "فشل الحذف");
      }
    } catch (error) {
      console.error(error);

      alert("خطأ في السيرفر");
    }
  };

  // ======================
  // UI FILTER
  // ======================

  const filteredSpends = spends.filter(
    (item) => {
      const text = search.toLowerCase();

      if (!text) return true;

      return (
        item.sp_id
          .toString()
          .includes(text) ||

        (item.sp_detail || "")
          .toLowerCase()
          .includes(text) ||

        (item.sp_gat_name || "")
          .toLowerCase()
          .includes(text)
      );
    }
  );

  return (
    <div
      className="min-h-screen bg-gray-100 p-4 md:p-6"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <div>

            <h1 className="text-3xl font-bold">
              المصروفات
            </h1>

            <p className="text-gray-600 mt-1">
              عرض المصروفات حسب الشهر
            </p>

          </div>

          <div className="flex gap-2">

            <button
              onClick={() =>
                router.push(
                  "/br_admin/spend/add"
                )
              }
              className="bg-black text-white px-5 py-3 rounded-xl"
            >
              + إضافة مصروف
            </button>

            <button
              onClick={() => router.push(`${basePath}`)}
              className="bg-gray-800 text-white px-5 py-3 rounded-xl"
            >
              ← الرجوع
            </button>

          </div>

        </div>

        {/* FILTER CARD */}

        <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-col md:flex-row gap-3 md:items-center">

          {/* MONTH */}

          <input
            type="month"
            value={month}
            onChange={(e) =>
              setMonth(e.target.value)
            }
            className="border p-2 rounded-lg"
          />

          {/* SEARCH */}

          <input
            type="text"
            placeholder="بحث (رقم المصروف / التفاصيل / المجموعة)"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border p-2 rounded-lg w-full"
          />

        </div>

        {/* TABLE */}

        <div className="bg-white rounded-2xl shadow overflow-hidden">

          {loading ? (

            <div className="p-8 text-center text-gray-500">
              جارٍ التحميل...
            </div>

          ) : filteredSpends.length === 0 ? (

            <div className="p-8 text-center text-gray-500">
              لا توجد بيانات
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-right text-sm">

                <thead className="sticky top-0 z-20 bg-gray-50 border-b">

                  <tr>

                    <th className="p-4">
                      الرقم
                    </th>

                    <th className="p-4">
                      التاريخ
                    </th>

                    <th className="p-4">
                      المبلغ
                    </th>

                    <th className="p-4">
                      المجموعة
                    </th>

                    <th className="p-4">
                      التفاصيل
                    </th>

                    <th className="p-4">
                      المستخدم
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredSpends.map((item) => (
                    <>

                    <tr
                      key={item.sp_id}
                      className="hover:bg-gray-50"
                    >

                      {/* ID */}

                      <td className="p-4 font-semibold">
                        #{item.sp_id}
                      </td>

                      {/* DATE */}

                      <td className="p-4">

                        {new Date(
                          item.sp_date
                        ).toLocaleDateString(
                          "en-GB"
                        )}

                      </td>

                      {/* TOTAL */}

                      <td className="p-4 font-semibold text-blue-700">

                        {formatNumber(
                          item.sp_total
                        )}

                      </td>

                      {/* GROUP */}

                      <td className="p-4">

                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">

                          {item.sp_gat_name ||
                            "-"}

                        </span>

                      </td>

                      {/* DETAIL */}

                      <td className="p-4">

                        {item.sp_detail || "-"}

                      </td>

                      {/* USER */}

                      <td className="p-4">

                        {item.user_name || "-"}

                      </td>

                     

                    </tr>

                     {/* ACTIONS */}

                      <tr className="border-b bg-gray-50">
                        <td colSpan={16} className="p-3">
                          <div className="flex flex-row flex-nowrap gap-2 items-center justify-start">


                          <button
                            onClick={() =>
                              router.push(
                                `/br_admin/spend/edit/${item.sp_id}`
                              )
                            }
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                          >
                            تعديل
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                item.sp_id
                              )
                            }
                            className="bg-red-600 text-white px-4 py-2 rounded-lg"
                          >
                            حذف
                          </button>

                        </div>

                      </td>
                      </tr>
                    </>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>
    </div>
  );
}