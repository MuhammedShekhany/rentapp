"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

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
  tamin: string;
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

export default function OrderPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTop, setShowTop] = useState(false);

  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [user, setUser] = useState<UserType | null>(null);

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  // ======================
  // LOAD ORDERS
  // ======================
  const loadOrders = async (selectedMonth?: string) => {
    try {
      setLoading(true);

      if (!user?.br_id) return;

      let url = `/api/order?br_id=${user.br_id}`;

      if (selectedMonth) {
        url += `&month=${selectedMonth}`;
      }

      const res = await fetch(url, { cache: "no-store" });
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
  // FIRST LOAD
  // ======================
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.replace("/login");
      return;
    }

    const parsedUser: UserType = JSON.parse(session);
    setUser(parsedUser);

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    setMonth(currentMonth);
  }, [router]);

  // ======================
  // RELOAD ON MONTH CHANGE
  // ======================
  useEffect(() => {
    if (user?.br_id && month) {
      loadOrders(month);
    }
  }, [user, month]);

  // ======================
  // FILTER
  // ======================
  const filteredOrders = orders.filter((item) => {
    const text = search.toLowerCase();

    return (
      item.or_id.toString().includes(text) ||
      (item.or_cus_name || "").toLowerCase().includes(text) ||
      (item.or_cus_phone || "").includes(text) ||
      (item.or_cus_phone2 || "").includes(text) ||
      (item.or_gat_name || "").toLowerCase().includes(text)
    );
  });

  // ======================
  // TOTALS (DASHBOARD)
  // ======================
  const totalOrdersAmount = useMemo(() => {
    return filteredOrders.reduce((sum, item) => {
      return sum + (Number(item.or_total) || 0);
    }, 0);
  }, [filteredOrders]);

  const averageOrder = useMemo(() => {
    return filteredOrders.length
      ? totalOrdersAmount / filteredOrders.length
      : 0;
  }, [filteredOrders, totalOrdersAmount]);

  const basePath = useMemo(() => {
    if (!user) return "";

    return user.user_role === "br_admin"
      ? "/br_admin"
      : user.user_role === "br_ass"
        ? "/br_ass"
        : "/br_user";
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-[1900px] mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">الطلبات</h1>
            <p className="text-gray-600 mt-1">إدارة جميع بيانات الطلبات</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => router.push("/br_admin/order/add")}
              className="bg-black text-white px-5 py-3 rounded-xl"
            >
              + إضافة طلب
            </button>

            <button
              onClick={() => router.push(`${basePath}`)}
              className="bg-gray-800 text-white px-5 py-3 rounded-xl"
            >
              ← الرجوع
            </button>
          </div>
        </div>

        {/* SEARCH + MONTH */}
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-2 flex-col md:flex-row">
          <input
            type="text"
            placeholder="بحث (رقم الطلب / اسم / هاتف / بوابة)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded-lg w-full"
          />

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border p-2 rounded-lg"
          />
        </div>

        {/* DASHBOARD CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500 text-sm">عدد الطلبات</p>
            <p className="text-2xl font-bold text-blue-700">
              {filteredOrders.length}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500 text-sm">إجمالي المبيعات</p>
            <p className="text-2xl font-bold text-green-700">
              {formatNumber(totalOrdersAmount)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500 text-sm">متوسط الطلب</p>
            <p className="text-2xl font-bold text-purple-700">
              {formatNumber(averageOrder)}
            </p>
          </div>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">جارٍ التحميل...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">لا توجد نتائج</div>
          ) : (
            <div className="overflow-auto max-h-[75vh]">
              <table className="w-full text-right text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">رقم</th>
                    <th className="p-4">العميل</th>
                    <th className="p-4">المجموع</th>
                    <th className="p-4">المدفوع</th>
                    <th className="p-4">المتبقي</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((item) => (
                    <tr key={item.or_id} className="hover:bg-gray-50">
                      <td className="p-4">#{item.or_no}</td>
                      <td className="p-4">{item.or_cus_name}</td>

                      <td className="p-4 text-blue-700 font-bold">
                        {formatNumber(item.or_total)}
                      </td>

                      <td className="p-4 text-green-700 font-bold">
                        {formatNumber(item.paid_total)}
                      </td>

                      <td className="p-4 text-red-700 font-bold">
                        {formatNumber(item.remaining)}
                      </td>
                    </tr>
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