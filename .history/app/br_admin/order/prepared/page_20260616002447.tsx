"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CookingPot,
  PackageCheck,
  PackageX,
} from "lucide-react";

type OrderType = {
  or_id: number;
  or_no: number;
  or_date: string;
  or_total: number;

  or_cus_name: string;
  or_cus_phone: string;
  or_cus_phone2: string;

  or_delivery: number;
  or_receipt: number;
  or_preparing: number;
  or_delayed: number;

  or_note: string;

  or_prepare_date: string;
  or_date_reserve: string;

  or_vip: number;

  or_gat_id: number;
  or_gat_name: string;

  br_id: number;
  user_id: number;

  br_name: string;
  user_fullname: string;

  paid_total: number;
  remaining: number;

  createat: string;
};

type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
  br_name?: string;
};

export default function PreparedPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [user, setUser] = useState<UserType | null>(null);

  // ✅ SEARCH STATE
  const [search, setSearch] = useState("");

  // ======================
  // FILTER ORDERS (SEARCH)
  // ======================
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;

    const s = search.toLowerCase();

    return orders.filter((o) => {
      return (
        o.or_no.toString().includes(s) ||
        o.or_cus_name?.toLowerCase().includes(s) ||
        o.or_cus_phone?.includes(s) ||
        o.or_cus_phone2?.includes(s) ||
        o.user_fullname?.toLowerCase().includes(s)
      );
    });
  }, [orders, search]);

  // ======================
  // COUNTS (BASED ON FILTERED)
  // ======================
  const preparedCount = useMemo(() => {
    return filteredOrders.filter((o) => o.or_preparing == 1).length;
  }, [filteredOrders]);

  const notPreparedCount = useMemo(() => {
    return filteredOrders.filter((o) => o.or_preparing != 1).length;
  }, [filteredOrders]);

  // ======================
  // LOAD ORDERS
  // ======================
  const loadOrders = async (br_id: string) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/order/prepared?br_id=${br_id}`);
      const data = await res.json();

      if (data?.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error(error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // TOGGLE PREPARING
  // ======================
  const togglePreparing = async (or_id: number, current: number) => {
    try {
      setUpdatingId(or_id);

      const res = await fetch(`/api/order/${or_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          or_preparing: current == 1 ? 0 : 1,
        }),
      });

      const data = await res.json();

      if (data.success) {
        loadOrders(user!.br_id);
      } else {
        alert(data.message || "فشل التحديث");
      }
    } catch (error) {
      console.error(error);
      alert("خطأ في السيرفر");
    } finally {
      setUpdatingId(null);
    }
  };

  // ======================
  // LOGIN
  // ======================
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.replace("/login");
      return;
    }

    const parsedUser: UserType = JSON.parse(session);
    setUser(parsedUser);

    loadOrders(parsedUser.br_id);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <div>
            <h1 className="text-3xl font-bold">الطلبات الجاهزة</h1>
            <p className="text-gray-600 mt-1">تغيير حالة التحضير</p>
          </div>

          <button
            onClick={() => router.back()}
            className="bg-black text-white px-5 py-3 rounded-xl hover:opacity-90 transition"
          >
            ← رجوع
          </button>
        </div>

        {/* ✅ SEARCH (same design style, simple input) */}
        <div className="mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث: رقم الطلب، اسم العميل، الهاتف..."
            className="w-full md:w-1/2 p-3 rounded-xl border bg-white shadow-sm focus:outline-none focus:ring"
          />
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          <div className="bg-white rounded-2xl shadow p-5 border-r-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">الطلبات الجاهزة</p>
                <h2 className="text-3xl font-bold text-green-600">
                  {preparedCount}
                </h2>
              </div>
              <PackageCheck size={34} className="text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5 border-r-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">الطلبات غير الجاهزة</p>
                <h2 className="text-3xl font-bold text-red-600">
                  {notPreparedCount}
                </h2>
              </div>
              <PackageX size={34} className="text-red-600" />
            </div>
          </div>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">

          {loading ? (
            <div className="p-8 text-center text-gray-500">جارٍ التحميل...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد طلبات
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-right text-sm min-w-[1700px]">

                <thead className="sticky top-0 z-20 bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">رقم الطلب</th>
                    <th className="p-4">التاريخ والوقت</th>
                    <th className="p-4">العميل</th>
                    <th className="p-4">الهاتف</th>
                    <th className="p-4">هاتف ثاني</th>
                    <th className="p-4">المجموع</th>
                    <th className="p-4">المدفوع</th>
                    <th className="p-4">المتبقي</th>
                    <th className="p-4">VIP</th>
                    <th className="p-4">تاريخ الحجز</th>
                    <th className="p-4">تاريخ التحضير</th>
                    <th className="p-4">تاريخ استرجاع</th>
                    <th className="p-4">المستخدم</th>
                    <th className="p-4">الملاحظات</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((item) => (
                    <>
                      <tr key={item.or_id} className="hover:bg-gray-50 transition">

                        <td className="p-4 font-semibold">#{item.or_no}</td>

                        <td className="p-4 whitespace-nowrap">
                          {new Date(item.or_date).toLocaleString("en-GB")}
                        </td>

                        <td className="p-4">{item.or_cus_name || "-"}</td>
                        <td className="p-4">{item.or_cus_phone || "-"}</td>
                        <td className="p-4">{item.or_cus_phone2 || "-"}</td>

                        <td className="p-4 font-semibold">
                          {Number(item.or_total).toLocaleString()}
                        </td>

                        <td className="p-4 text-green-600 font-semibold">
                          {Number(item.paid_total).toLocaleString()}
                        </td>

                        <td className="p-4 text-red-600 font-semibold">
                          {Number(item.remaining).toLocaleString()}
                        </td>

                        <td className="p-4">
                          {item.or_vip == 1 ? "VIP" : "-"}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          {item.or_date_reserve
                            ? new Date(item.or_date_reserve).toLocaleDateString("en-GB")
                            : "-"}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          {item.or_prepare_date
                            ? new Date(item.or_prepare_date).toLocaleDateString("en-GB")
                            : "-"}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          {item.or_date_reserve
                            ? new Date(
                                new Date(item.or_date_reserve).setDate(
                                  new Date(item.or_date_reserve).getDate() + 1
                                )
                              ).toLocaleDateString("en-GB")
                            : "-"}
                        </td>

                        <td className="p-4">{item.user_fullname || "-"}</td>

                        <td className="p-4 max-w-[220px] truncate">
                          {item.or_note || "-"}
                        </td>

                        <td className="p-4">
                          {item.or_preparing == 1 ? (
                            <span className="flex items-center gap-2 text-green-600 font-bold">
                              <CheckCircle2 size={18} /> جاهز
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-orange-600 font-bold">
                              <CookingPot size={18} /> قيد التحضير
                            </span>
                          )}
                        </td>

                      </tr>

                      <tr className="border-b bg-gray-50">
                        <td colSpan={16} className="p-3">
                          <div className="flex gap-2">

                            <button
                              disabled={updatingId === item.or_id}
                              onClick={() =>
                                togglePreparing(item.or_id, item.or_preparing)
                              }
                              className={`px-4 py-2 rounded-lg text-white ${
                                item.or_preparing == 1
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                            >
                              {updatingId === item.or_id
                                ? "جاري التحديث..."
                                : item.or_preparing == 1
                                ? "جاهز"
                                : "غير جاهز"}
                            </button>

                            <button
                              onClick={() =>
                                router.push(`/br_admin/order/detail/${item.or_id}`)
                              }
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                            >
                              تفاصيل
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