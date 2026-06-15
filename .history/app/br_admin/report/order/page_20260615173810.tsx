"use client";

import { useEffect, useMemo, useState } from "react";
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
  or_note: string;
  br_id: number;
  user_id: number;
  createat: string;
  or_prepare_date: string;
  or_vip: number;
  or_delayed: number;
  or_date_reserve: string;
  user_name: string;
  paid_total: number;
  remaining: number;
};

type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
};

type FilterType = "daily" | "monthly" | "yearly";
type PaymentFilterType = "all" | "paid" | "remaining";

export default function OrderReportPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilterType>("all");

  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
  );

  const [selectedMonth, setSelectedMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const [selectedYear, setSelectedYear] = useState(
    String(today.getFullYear())
  );

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async (currentUser: UserType) => {
    try {
      setLoading(true);

      let query = `br_id=${currentUser.br_id}&type=${filterType}`;

      if (filterType === "daily") query += `&date=${selectedDate}`;
      if (filterType === "monthly") query += `&month=${selectedMonth}`;
      if (filterType === "yearly") query += `&year=${selectedYear}`;

      const res = await fetch(`/api/report/order?${query}`);
      const data = await res.json();

      if (data.success) {
        // ✅ FIXED HERE
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SESSION
  // =========================
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.replace("/login");
      return;
    }

    const parsed: UserType = JSON.parse(session);
    setUser(parsed);
    loadData(parsed);
  }, []);

  // reload when filters change
  useEffect(() => {
    if (user?.br_id) {
      loadData(user);
    }
  }, [filterType, selectedDate, selectedMonth, selectedYear]);

  // =========================
  // FILTERING
  // =========================
  const filteredOrders = useMemo(() => {
    if (paymentFilter === "paid") {
      return orders.filter((o) => Number(o.remaining) === 0);
    }
    if (paymentFilter === "remaining") {
      return orders.filter((o) => Number(o.remaining) > 0);
    }
    return orders;
  }, [orders, paymentFilter]);

  // =========================
  // TOTALS
  // =========================
  const totalOrders = useMemo(
    () => orders.reduce((s, i) => s + Number(i.or_total || 0), 0),
    [orders]
  );

  const totalPaid = useMemo(
    () => orders.reduce((s, i) => s + Number(i.paid_total || 0), 0),
    [orders]
  );

  const totalRemaining = useMemo(
    () => orders.reduce((s, i) => s + Number(i.remaining || 0), 0),
    [orders]
  );

  const format = (n: number) =>
    Number(n || 0).toLocaleString("en-US");

  return (
    <div className="min-h-screen bg-gray-100 p-4" dir="rtl">

      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">تقرير الطلبات</h1>

        <button
          onClick={() => router.back()}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          رجوع
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-xl mb-4 flex gap-3 flex-wrap">

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          className="border p-2 rounded"
        >
          <option value="daily">يومي</option>
          <option value="monthly">شهري</option>
          <option value="yearly">سنوي</option>
        </select>

        {filterType === "daily" && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 rounded"
          />
        )}

        {filterType === "monthly" && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border p-2 rounded"
          />
        )}

        {filterType === "yearly" && (
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border p-2 rounded w-32"
          />
        )}
      </div>

      {/* TOTALS */}
      <div className="grid grid-cols-3 gap-3 mb-4">

        <div
          onClick={() => setPaymentFilter("all")}
          className="bg-white p-4 rounded-xl cursor-pointer"
        >
          <div>الإجمالي</div>
          <div className="text-xl font-bold">{format(totalOrders)}</div>
        </div>

        <div
          onClick={() => setPaymentFilter("paid")}
          className="bg-white p-4 rounded-xl cursor-pointer"
        >
          <div>المدفوع</div>
          <div className="text-xl font-bold text-blue-600">
            {format(totalPaid)}
          </div>
        </div>

        <div
          onClick={() => setPaymentFilter("remaining")}
          className="bg-white p-4 rounded-xl cursor-pointer"
        >
          <div>المتبقي</div>
          <div className="text-xl font-bold text-red-600">
            {format(totalRemaining)}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl overflow-hidden">

        {loading ? (
          <div className="p-6 text-center">جاري التحميل...</div>
        ) : (
          <table className="w-full text-sm">

            <thead className="bg-gray-200">
              <tr>
                <th className="p-3">رقم</th>
                <th>التاريخ</th>
                <th>العميل</th>
                <th>الإجمالي</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
                <th>المستخدم</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.or_id} className="border-b">
                  <td className="p-3">#{o.or_no}</td>
                  <td>{o.or_date}</td>
                  <td>{o.or_cus_name}</td>
                  <td>{format(o.or_total)}</td>
                  <td className="text-blue-600">
                    {format(o.paid_total)}
                  </td>
                  <td className="text-red-600">
                    {format(o.remaining)}
                  </td>
                  <td>{o.user_name}</td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>

    </div>
  );
}