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

type PaymentType = {
  pay_id: number;
  or_id: number;
  pay_total: number;
  pay_date: string;
  pay_method: string;
  br_id: number;
};

type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
};

type FilterType = "daily" | "monthly" | "yearly";
type ViewMode = "orders" | "payments" | "remaining";

export default function OrderReportPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);

  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [viewMode, setViewMode] = useState<ViewMode>("orders");

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
  const loadData = async () => {
    try {
      if (!user?.br_id) return;

      setLoading(true);

      let query = `br_id=${user.br_id}&type=${filterType}`;

      if (filterType === "daily") query += `&date=${selectedDate}`;
      if (filterType === "monthly") query += `&month=${selectedMonth}`;
      if (filterType === "yearly") query += `&year=${selectedYear}`;

      const res = await fetch(`/api/report/order?${query}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setOrders(data.orders || []);
        setPayments(data.payments || []);
      } else {
        setOrders([]);
        setPayments([]);
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // USER LOAD
  // =========================
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.replace("/login");
      return;
    }

    setUser(JSON.parse(session));
  }, []);

  // =========================
  // AUTO LOAD
  // =========================
  useEffect(() => {
    if (user?.br_id) {
      loadData();
    }
  }, [user, filterType, selectedDate, selectedMonth, selectedYear]);

  // =========================
  // GROUP PAYMENTS BY ORDER
  // =========================
  const paymentsByOrder = useMemo(() => {
    const map: Record<number, number> = {};

    payments.forEach((p) => {
      map[p.or_id] = (map[p.or_id] || 0) + Number(p.pay_total);
    });

    return map;
  }, [payments]);

  // =========================
  // FILTERED DATA
  // =========================
  const remainingOrders = useMemo(
    () => orders.filter((o) => Number(o.remaining) > 0),
    [orders]
  );

  const currentOrders =
    viewMode === "remaining"
      ? remainingOrders
      : orders;

  // =========================
  // TOTALS
  // =========================
  const totalOrders = useMemo(
    () => orders.reduce((s, i) => s + Number(i.or_total || 0), 0),
    [orders]
  );

  const totalPaid = useMemo(
    () => payments.reduce((s, i) => s + Number(i.pay_total || 0), 0),
    [payments]
  );

  const totalRemaining = useMemo(
    () => orders.reduce((s, i) => s + Number(i.remaining || 0), 0),
    [orders]
  );

  const formatNumber = (n: number) =>
    Number(n || 0).toLocaleString("en-US");

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">تقرير الطلبات</h1>

          <button
            onClick={() => router.back()}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            رجوع
          </button>
        </div>

        {/* FILTER */}
        <div className="bg-white p-5 rounded-2xl shadow flex gap-4 flex-wrap">

          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as FilterType)
            }
            className="border p-3 rounded-xl"
          >
            <option value="daily">يومي</option>
            <option value="monthly">شهري</option>
            <option value="yearly">سنوي</option>
          </select>

          {filterType === "daily" && (
            <input type="date" value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border p-3 rounded-xl"
            />
          )}

          {filterType === "monthly" && (
            <input type="month" value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border p-3 rounded-xl"
            />
          )}

          {filterType === "yearly" && (
            <input type="number" value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border p-3 rounded-xl w-[140px]"
            />
          )}
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div
            onClick={() => setViewMode("orders")}
            className={`bg-white p-6 rounded-2xl shadow cursor-pointer ${viewMode === "orders" ? "ring-2 ring-green-500" : ""}`}
          >
            <div>الطلبات</div>
            <div className="text-3xl font-bold">{orders.length}</div>
            <div>{formatNumber(totalOrders)}</div>
          </div>

          <div
            onClick={() => setViewMode("payments")}
            className={`bg-white p-6 rounded-2xl shadow cursor-pointer ${viewMode === "payments" ? "ring-2 ring-blue-500" : ""}`}
          >
            <div>المدفوعات</div>
            <div className="text-3xl font-bold">{payments.length}</div>
            <div>{formatNumber(totalPaid)}</div>
          </div>

          <div
            onClick={() => setViewMode("remaining")}
            className={`bg-white p-6 rounded-2xl shadow cursor-pointer ${viewMode === "remaining" ? "ring-2 ring-red-500" : ""}`}
          >
            <div>المتبقي</div>
            <div className="text-3xl font-bold">{remainingOrders.length}</div>
            <div>{formatNumber(totalRemaining)}</div>
          </div>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">

          <div className="p-5 border-b font-bold text-lg">
            {viewMode === "orders" && "كل الطلبات"}
            {viewMode === "payments" && "كل المدفوعات"}
            {viewMode === "remaining" && "الطلبات المتبقية"}
          </div>

          {loading ? (
            <div className="p-10 text-center">جاري التحميل...</div>
          ) : viewMode === "payments" ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4">رقم الطلب</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">الطريقة</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.pay_id}>
                    <td className="p-4">#{p.or_id}</td>
                    <td className="p-4">{p.pay_date}</td>
                    <td className="p-4">{formatNumber(p.pay_total)}</td>
                    <td className="p-4">{p.pay_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4">الرقم</th>
                  <th className="p-4">الزبون</th>
                  <th className="p-4">الإجمالي</th>
                  <th className="p-4">المدفوع</th>
                  <th className="p-4">المتبقي</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((o) => (
                  <tr key={o.or_id}>
                    <td className="p-4">#{o.or_no}</td>
                    <td className="p-4">{o.or_cus_name}</td>
                    <td className="p-4">{formatNumber(o.or_total)}</td>
                    <td className="p-4">
                      {formatNumber(paymentsByOrder[o.or_id] || 0)}
                    </td>
                    <td className="p-4">{formatNumber(o.remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>

      </div>
    </div>
  );
}