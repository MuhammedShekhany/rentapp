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
  user_name: string;
  paid_total: number;
  remaining: number;
};

type PaymentType = {
  pay_id: number;
  or_id: number;
  pay_total: number;
  pay_date: string;
  or_no: number;
  or_cus_name: string;
  or_total: number;
  remaining: number;
  user_name: string;
};

type SpendType = {
  sp_id: number;
  sp_total: number;
  sp_date: string;
  sp_detail: string;
};

type UserType = {
  br_id: string;
};

type FilterType = "daily" | "monthly" | "yearly";
type ViewModeType = "all" | "payments" | "remaining" | "spend";

export default function OrderReportPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [spend, setSpend] = useState<SpendType[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [viewMode, setViewMode] = useState<ViewModeType>("all");

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

  const loadData = async () => {
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

    setOrders(data.order || []);
    setPayments(data.payments || []);
    setSpend(data.spend || []);

    setLoading(false);
  };

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) return router.replace("/login");

    setUser(JSON.parse(session));
  }, []);

  useEffect(() => {
    if (user?.br_id) loadData();
  }, [user, filterType, selectedDate, selectedMonth, selectedYear]);

  // ================= CALC =================
  const totalOrders = useMemo(
    () => orders.reduce((s, i) => s + Number(i.or_total || 0), 0),
    [orders]
  );

  const totalPaid = useMemo(
    () => payments.reduce((s, i) => s + Number(i.pay_total || 0), 0),
    [payments]
  );

  const totalSpend = useMemo(
    () => spend.reduce((s, i) => s + Number(i.sp_total || 0), 0),
    [spend]
  );

  const remaining = totalOrders - totalPaid;
  const finalBalance = totalPaid - totalSpend;

  const format = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="min-h-screen bg-gray-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">تقرير الطلبات</h1>
          <button
            onClick={() => router.back()}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            رجوع
          </button>
        </div>

        {/* FILTER */}
        <div className="bg-white p-4 rounded-xl flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="border p-2 rounded-lg"
          >
            <option value="daily">يومي</option>
            <option value="monthly">شهري</option>
            <option value="yearly">سنوي</option>
          </select>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl">المبيعات<br />{format(totalOrders)}</div>
          <div className="bg-white p-4 rounded-xl">المقبوضات<br />{format(totalPaid)}</div>
          <div className="bg-white p-4 rounded-xl">المتبقي<br />{format(remaining)}</div>
          <div className="bg-white p-4 rounded-xl">المصاريف<br />{format(totalSpend)}</div>
          <div className="bg-black text-white p-4 rounded-xl">الصافي<br />{format(finalBalance)}</div>
        </div>

        {/* ================= ORDERS TABLE ================= */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="font-bold mb-3">الطلبات</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th>رقم</th>
                <th>الزبون</th>
                <th>الإجمالي</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.or_id} className="border-b">
                  <td>#{o.or_no}</td>
                  <td>{o.or_cus_name}</td>
                  <td>{format(o.or_total)}</td>
                  <td>{format(o.paid_total)}</td>
                  <td className="text-red-600">{format(o.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= PAYMENTS TABLE ================= */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="font-bold mb-3">الدفعات</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50">
                <th>رقم الطلب</th>
                <th>الزبون</th>
                <th>الدفعة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.pay_id} className="border-b">
                  <td>#{p.or_no}</td>
                  <td>{p.or_cus_name}</td>
                  <td className="text-blue-600">{format(p.pay_total)}</td>
                  <td>{p.pay_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= SPEND TABLE ================= */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="font-bold mb-3">المصاريف</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-50">
                <th>التفاصيل</th>
                <th>المبلغ</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {spend.map((s) => (
                <tr key={s.sp_id} className="border-b">
                  <td>{s.sp_detail}</td>
                  <td className="text-red-600">{format(s.sp_total)}</td>
                  <td>{s.sp_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}