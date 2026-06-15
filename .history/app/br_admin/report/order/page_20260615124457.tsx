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
  or_vip: number;
};

type PaymentType = {
  pay_id: number;
  pay_no: number;
  pay_date: string;
  pay_total: number;
  or_id: number;
};

type UserType = {
  br_id: string;
  user_name: string;
};

type FilterType = "daily" | "monthly" | "yearly";

export default function OrderReportPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);

  const [filterType, setFilterType] = useState<FilterType>("monthly");

  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    if (!user?.br_id) return;

    setLoading(true);

    let query = `br_id=${user.br_id}&type=${filterType}&month=${selectedMonth}`;

    const res = await fetch(`/api/report/order?${query}`);
    const data = await res.json();

    if (data.success) {
      setOrders(data.order || []);
      setPayments(data.payments || []);
    } else {
      setOrders([]);
      setPayments([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) return router.replace("/login");

    setUser(JSON.parse(session));
  }, []);

  useEffect(() => {
    if (user?.br_id) loadData();
  }, [user, filterType, selectedMonth]);

  // =========================
  // UI
  // =========================
  return (
    <div className="p-4 bg-gray-100 min-h-screen" dir="rtl">

      <div className="max-w-7xl mx-auto space-y-6">

        {/* FILTER */}
        <div className="bg-white p-4 rounded-xl flex gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="border p-2 rounded"
          >
            <option value="daily">يومي</option>
            <option value="monthly">شهري</option>
            <option value="yearly">سنوي</option>
          </select>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        {/* ================= ORDERS TABLE ================= */}
        <div className="bg-white rounded-xl shadow overflow-hidden">

          <div className="p-4 font-bold bg-gray-50">
            جدول الطلبات
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">العميل</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3">المدفوع</th>
                <th className="p-3">المتبقي</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o.or_id} className="border-b">
                  <td className="p-3">#{o.or_no}</td>
                  <td className="p-3">{o.or_cus_name}</td>
                  <td className="p-3 text-green-600 font-bold">
                    {formatNumber(o.or_total)}
                  </td>
                  <td className="p-3 text-blue-600 font-bold">
                    {formatNumber(o.paid_total)}
                  </td>
                  <td className="p-3 text-red-600 font-bold">
                    {formatNumber(o.remaining)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= PAYMENTS TABLE ================= */}
        <div className="bg-white rounded-xl shadow overflow-hidden">

          <div className="p-4 font-bold bg-gray-50">
            جدول الدفعات
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">رقم السند</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">رقم الطلب</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p) => (
                <tr key={p.pay_id} className="border-b">
                  <td className="p-3">#{p.pay_no}</td>
                  <td className="p-3">
                    {new Date(p.pay_date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="p-3 text-blue-600 font-bold">
                    {formatNumber(p.pay_total)}
                  </td>
                  <td className="p-3">#{p.or_id}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

      </div>
    </div>
  );
}