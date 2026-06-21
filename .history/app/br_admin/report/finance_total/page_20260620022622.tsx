"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type OrderType = {
  or_id: number;
  or_total: number;
  remaining: number;
};

type PaymentType = {
  pay_id: number;
  pay_total: number;
};

type SpendType = {
  sp_id: number;
  sp_total: number;
};

type FilterType = "daily" | "monthly" | "yearly";

export default function OrderReportPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [spend, setSpend] = useState<SpendType[]>([]);

  const [filterType, setFilterType] = useState<FilterType>("daily");

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
    let query = `type=${filterType}`;

    if (filterType === "daily") query += `&date=${selectedDate}`;
    if (filterType === "monthly") query += `&month=${selectedMonth}`;
    if (filterType === "yearly") query += `&year=${selectedYear}`;

    const res = await fetch(`/api/report/order?${query}`);
    const data = await res.json();

    if (data.success) {
      setOrders(data.order || []);
      setPayments(data.payments || []);
      setSpend(data.spend || []);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType, selectedDate, selectedMonth, selectedYear]);

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

  // ✅ GLOBAL REMAINING (your request)
  const totalRemainingSum = useMemo(() => {
    return totalOrdersSum - totalPaidSum;
  }, [totalOrdersSum, totalPaidSum]);

  // or safer (based on orders table):
  const totalRemainingSafe = useMemo(() => {
    return orders.reduce((s, o) => s + Number(o.remaining || 0), 0);
  }, [orders]);

  const previousBalance = 0;

  const finalBalance = useMemo(() => {
    return previousBalance + totalPaidSum - totalSpendSum;
  }, [previousBalance, totalPaidSum, totalSpendSum]);

  const format = (n: number) => Number(n || 0).toLocaleString("en-US");

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">

      {/* FILTER */}
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

      {/* CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">

        <div className="bg-white p-4 rounded-xl shadow">
          مبيعات<br />
          <b>{format(totalOrdersSum)}</b>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          المقبوضات<br />
          <b className="text-blue-600">{format(totalPaidSum)}</b>
        </div>

        {/* ✅ NEW: Remaining */}
        <div className="bg-white p-4 rounded-xl shadow">
          المتبقي<br />
          <b className="text-orange-600">{format(totalRemainingSum)}</b>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          المصاريف<br />
          <b className="text-red-600">{format(totalSpendSum)}</b>
        </div>

        <div className="bg-black text-white p-4 rounded-xl shadow">
          الرصيد النهائي<br />
          <b>{format(finalBalance)}</b>
        </div>

      </div>

      {/* DEBUG INFO */}
      <div className="mt-4 text-sm text-gray-600">
        Safe Remaining: {format(totalRemainingSafe)}
      </div>

    </div>
  );
}