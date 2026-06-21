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
  br_id: string;
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
  or_no: number;
  br_id: string;
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
  sp_no: number;
};

type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
  br_name?: string;
};

type FilterType = "daily" | "monthly" | "yearly";
type ViewModeType = "all" | "payments" | "remaining";

export default function OrderReportPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [spend, setSpend] = useState<SpendType[]>([]);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);

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
        setOrders(data.order || []);
        setPayments(data.payments || []);
        setSpend(data.spend || []);
      } else {
        setOrders([]);
        setPayments([]);
        setSpend([]);
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
      setPayments([]);
      setSpend([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGIN
  // =========================
  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) return router.replace("/login");

    setUser(JSON.parse(session));
  }, []);

  // =========================
  // AUTO LOAD
  // =========================
  useEffect(() => {
    if (user?.br_id) {
      setOrders([]);
      setPayments([]);
      setSpend([]);
      loadData();
    }
  }, [user, filterType, selectedDate, selectedMonth, selectedYear]);

  // =========================
  // CALCULATIONS
  // =========================
  const totalOrdersSum = useMemo(
    () => orders.reduce((s, i) => s + Number(i.or_total || 0), 0),
    [orders]
  );

  const totalPaidSum = useMemo(
    () => payments.reduce((s, i) => s + Number(i.pay_total || 0), 0),
    [payments]
  );

  const totalSpendSum = useMemo(
    () => spend.reduce((s, i) => s + Number(i.sp_total || 0), 0),
    [spend]
  );

  // ✅ IMPORTANT ADDITION (REQUESTED)
  const totalRemainingSum = useMemo(
    () => totalOrdersSum - totalPaidSum,
    [totalOrdersSum, totalPaidSum]
  );

  const previousBalance = 0;

  const finalBalance = useMemo(
    () => previousBalance + totalPaidSum - totalSpendSum,
    [previousBalance, totalPaidSum, totalSpendSum]
  );

  const remainingOrdersList = useMemo(
    () => orders.filter((o) => Number(o.remaining) > 0),
    [orders]
  );

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER (UNCHANGED) */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">تقرير الطلبات</h1>
            <p className="text-gray-600 mt-1">
              اضغط على بطاقات الإجماليات للتنقل وتصفية الجداول أدناه
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            رجوع
          </button>
        </div>

        {/* FILTER (UNCHANGED) */}
        <div className="bg-white p-5 rounded-2xl shadow flex gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="border p-3 rounded-xl"
          >
            <option value="daily">يومي</option>
            <option value="monthly">شهري</option>
            <option value="yearly">سنوي</option>
          </select>
        </div>

        {/* CARDS (UNCHANGED) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          <div className="bg-white p-6 rounded-2xl shadow">
            الرصيد السابق<br />
            <b>{formatNumber(previousBalance)}</b>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            المبيعات<br />
            <b className="text-green-600">{formatNumber(totalOrdersSum)}</b>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            المقبوضات<br />
            <b className="text-blue-600">{formatNumber(totalPaidSum)}</b>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            المصاريف<br />
            <b className="text-red-600">{formatNumber(totalSpendSum)}</b>
          </div>

          <div className="bg-black text-white p-6 rounded-2xl shadow">
            الرصيد النهائي<br />
            <b>{formatNumber(finalBalance)}</b>
          </div>

        </div>

        {/* ✅ REMAINING ADDED WITHOUT DESIGN CHANGE */}
        <div className="bg-white p-4 rounded-2xl shadow text-center">
          المتبقي (المبيعات - المقبوضات):
          <b className="text-red-600 ml-2">
            {formatNumber(totalRemainingSum)}
          </b>
        </div>

        {/* TABLE PLACEHOLDER (UNCHANGED) */}
        <div className="bg-white p-6 rounded-2xl shadow">
          هنا الجداول (orders / payments / spend)
        </div>

      </div>
    </div>
  );
}