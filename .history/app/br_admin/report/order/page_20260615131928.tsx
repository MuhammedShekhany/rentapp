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

  // ✅ ADD ONLY THIS
  payments?: {
    pay_id: number;
    pay_no: number;
    pay_date: string;
    pay_total: number;
  }[];
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
type PaymentFilterType = "all" | "paid" | "remaining";

export default function OrderReportPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);

  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>("all");

  // ✅ NEW: expand control
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

      let query = `br_id=${user.br_id}`;
      query += `&type=${filterType}`;

      if (filterType === "daily") {
        query += `&date=${selectedDate}`;
      }

      if (filterType === "monthly") {
        query += `&month=${selectedMonth}`;
      }

      if (filterType === "yearly") {
        query += `&year=${selectedYear}`;
      }

      const res = await fetch(`/api/report/order?${query}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setOrders(data.order || []);
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

  // =========================
  // FIRST LOAD
  // =========================
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.replace("/login");
      return;
    }

    const parsedUser: UserType = JSON.parse(session);
    setUser(parsedUser);
  }, []);

  // =========================
  // AUTO RELOAD
  // =========================
  useEffect(() => {
    if (user?.br_id) {
      setOrders([]);
      setLoading(true);
      loadData();
    }
  }, [user, filterType, selectedDate, selectedMonth, selectedYear]);

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

  const filteredOrders = useMemo(() => {
    if (paymentFilter === "paid") {
      return orders.filter((o) => Number(o.remaining) === 0);
    }
    if (paymentFilter === "remaining") {
      return orders.filter((o) => Number(o.remaining) > 0);
    }
    return orders;
  }, [orders, paymentFilter]);

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">تقرير الطلبات</h1>
            <p className="text-gray-600 mt-1">عرض جميع الطلبات</p>
          </div>

          <button
            onClick={() => router.back()}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            رجوع
          </button>
        </div>

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

          {filterType === "daily" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border p-3 rounded-xl"
            />
          )}

          {filterType === "monthly" && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border p-3 rounded-xl"
            />
          )}

          {filterType === "yearly" && (
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border p-3 rounded-xl w-[140px]"
            />
          )}
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow">
            إجمالي: {formatNumber(totalOrders)}
          </div>
          <div className="bg-white p-5 rounded-xl shadow">
            مدفوع: {formatNumber(totalPaid)}
          </div>
          <div className="bg-white p-5 rounded-xl shadow">
            متبقي: {formatNumber(totalRemaining)}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">العميل</th>
                <th className="p-4">الإجمالي</th>
                <th className="p-4">المدفوع</th>
                <th className="p-4">المتبقي</th>
                <th className="p-4">إجراء</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((item) => (
                <>
                  <tr key={item.or_id} className="border-b">
                    <td className="p-4">#{item.or_no}</td>
                    <td className="p-4">{item.or_cus_name}</td>
                    <td className="p-4 text-green-600">
                      {formatNumber(item.or_total)}
                    </td>
                    <td className="p-4 text-blue-600">
                      {formatNumber(item.paid_total)}
                    </td>
                    <td className="p-4 text-red-600">
                      {formatNumber(item.remaining)}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === item.or_id ? null : item.or_id
                          )
                        }
                        className="bg-purple-600 text-white px-3 py-1 rounded"
                      >
                        تفاصيل
                      </button>
                    </td>
                  </tr>

                  {/* PAYMENT HISTORY */}
                  {expandedId === item.or_id && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 p-4">

                        <div className="bg-white border rounded-xl p-4">

                          <div className="font-bold mb-3">
                            Payment History
                          </div>

                          {item.payments?.length ? (
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="p-2">رقم</th>
                                  <th className="p-2">التاريخ</th>
                                  <th className="p-2">المبلغ</th>
                                </tr>
                              </thead>

                              <tbody>
                                {item.payments.map((p) => (
                                  <tr key={p.pay_id} className="border-b">
                                    <td className="p-2">#{p.pay_no}</td>
                                    <td className="p-2">
                                      {new Date(p.pay_date).toLocaleDateString("en-GB")}
                                    </td>
                                    <td className="p-2 text-blue-600">
                                      {formatNumber(p.pay_total)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-gray-500">
                              لا توجد دفعات
                            </div>
                          )}

                        </div>

                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}