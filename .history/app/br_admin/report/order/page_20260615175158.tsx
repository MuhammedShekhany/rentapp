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
  br_id: number;
  or_no: number;
  or_cus_name: string;
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
type TabViewType = "orders" | "payments";

export default function OrderReportPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);

  // التحكم بالتبويب النشط (طلبات أم مدفوعات تفصيلية)
  const [activeTab, setActiveTab] = useState<TabViewType>("orders");

  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>("all");

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

      if (filterType === "daily") query += `&date=${selectedDate}`;
      if (filterType === "monthly") query += `&month=${selectedMonth}`;
      if (filterType === "yearly") query += `&year=${selectedYear}`;

      // يتم الاستدعاء من الـ API المحدث الذي يعيد الطلبات والمدفوعات معاً
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
    } catch (error) {
      console.error(error);
      setOrders([]);
      setPayments([]);
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
      setPayments([]);
      setLoading(true);
      loadData();
    }
  }, [user, filterType, selectedDate, selectedMonth, selectedYear]);

  // =========================
  // GLOBAL TOTALS
  // =========================
  const totalOrders = useMemo(
    () => orders.reduce((s, i) => s + Number(i.or_total || 0), 0),
    [orders]
  );

  // حساب المبالغ المقبوضة فعلياً من جدول المقبوضات التفصيلي المفلتر زمنياً
  const totalCollectedPayments = useMemo(
    () => payments.reduce((s, i) => s + Number(i.pay_total || 0), 0),
    [payments]
  );

  const totalRemaining = useMemo(
    () => orders.reduce((s, i) => s + Number(i.remaining || 0), 0),
    [orders]
  );

  // =========================
  // DYNAMIC FILTERED ORDERS
  // =========================
  const filteredOrders = useMemo(() => {
    if (paymentFilter === "paid") {
      return orders.filter((order) => Number(order.remaining || 0) === 0);
    }
    if (paymentFilter === "remaining") {
      return orders.filter((order) => Number(order.remaining || 0) > 0);
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
            <h1 className="text-3xl font-bold">الحسابات والتقارير الماليّة</h1>
            <p className="text-gray-600 mt-1">
              متابعة حركة المبيعات وتدفق المقبوضات النقدية يومي، شهري، وسنوي.
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="bg-black text-white px-5 py-3 rounded-xl font-medium hover:bg-gray-800 transition"
          >
            رجوع
          </button>
        </div>

        {/* CONTROLS & TABS FILTER */}
        <div className="bg-white p-5 rounded-2xl shadow flex flex-wrap gap-6 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                نوع التقرير
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as FilterType);
                  setPaymentFilter("all");
                }}
                className="border p-3 rounded-xl bg-gray-50 font-medium focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="daily">يومي</option>
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
            </div>

            {filterType === "daily" && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none"
              />
            )}

            {filterType === "monthly" && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none"
              />
            )}

            {filterType === "yearly" && (
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border p-3 rounded-xl bg-gray-50 w-[140px] focus:ring-2 focus:ring-green-500 outline-none"
              />
            )}
          </div>

          {/* تبويبات العرض (أزرار التحويل بين الجداول) */}
          <div className="flex bg-gray-100 p-1.5 rounded-xl border">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "orders"
                  ? "bg-white text-black shadow"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              جدول الطلبات ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "payments"
                  ? "bg-white text-black shadow"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              حركة الصندوق النقدية ({payments.length})
            </button>
          </div>
        </div>

        {/* TOTALS / INTERACTIVE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* الكرت الأول: إجمالي قيمة المبيعات المدخلة بالوقت المحدد */}
          <div
            onClick={() => {
              setActiveTab("orders");
              setPaymentFilter("all");
            }}
            className={`bg-white rounded-2xl shadow p-6 cursor-pointer transition-all duration-200 border-2 ${
              activeTab === "orders" && paymentFilter === "all"
                ? "border-green-600 ring-2 ring-green-100"
                : "border-transparent hover:border-gray-300"
            }`}
          >
            <div className="text-gray-500 text-sm font-semibold">إجمالي الطلبات (المبيعات المحجوزة)</div>
            <div className="text-4xl font-bold text-green-600 mt-3">
              {formatNumber(totalOrders)}
            </div>
          </div>

          {/* الكرت الثاني: مجموع النقد المستلم فعلياً (جدول الصندوق) خلال الوقت المحدد */}
          <div
            onClick={() => {
              setActiveTab("payments");
            }}
            className={`bg-white rounded-2xl shadow p-6 cursor-pointer transition-all duration-200 border-2 ${
              activeTab === "payments"
                ? "border-blue-600 ring-2 ring-blue-100"
                : "border-transparent hover:border-gray-300"
            }`}
          >
            <div className="text-gray-500 text-sm font-semibold">المقبوضات النقدية الكلية (الكاش المستلم)</div>
            <div className="text-4xl font-bold text-blue-600 mt-3">
              {formatNumber(totalCollectedPayments)}
            </div>
          </div>

          {/* الكرت الثالث: المبالغ المتبقية في ذمة الزبائن */}
          <div
            onClick={() => {
              setActiveTab("orders");
              setPaymentFilter("remaining");
            }}
            className={`bg-white rounded-2xl shadow p-6 cursor-pointer transition-all duration-200 border-2 ${
              activeTab === "orders" && paymentFilter === "remaining"
                ? "border-red-600 ring-2 ring-red-100"
                : "border-transparent hover:border-gray-300"
            }`}
          >
            <div className="text-gray-500 text-sm font-semibold">الديون والمتبقي (غير مدفوعة بالكامل)</div>
            <div className="text-4xl font-bold text-red-600 mt-3">
              {formatNumber(totalRemaining)}
            </div>
          </div>

        </div>

        {/* MAIN DATA SECTION */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">

          {/* dynamic sub-totals bar */}
          <div className="p-5 border-b text-lg font-bold flex flex-wrap justify-between items-center gap-2 bg-gray-50">
            <div className="flex items-center gap-3">
              <span>
                {activeTab === "orders" && paymentFilter === "all" && "سجل مبيعات الطلبات الشامل"}
                {activeTab === "orders" && paymentFilter === "paid" && "الطلبات المسواة (المدفوعة بالكامل)"}
                {activeTab === "orders" && paymentFilter === "remaining" && "الطلبات المعلقة ماليًا (الديون)"}
                {activeTab === "payments" && "حركة المقبوضات التفصيلية (الكاش الوارد)"}
              </span>
              <span className="text-xs bg-gray-200 text-gray-800 px-2.5 py-1 rounded-full font-medium">
                العدد الحالي: {activeTab === "orders" ? filteredOrders.length : payments.length}
              </span>
            </div>

            {activeTab === "orders" && paymentFilter !== "all" && (
              <button
                onClick={() => setPaymentFilter("all")}
                className="text-sm bg-white border shadow-sm text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                إلغاء التصفية ×
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500 font-medium">جاري تحميل البيانات وضبط الجداول...</div>
          ) : activeTab === "orders" ? (
            
            /* ==========================================
               1. جدول الطلبات الرسمي
               ========================================== */
            filteredOrders.length === 0 ? (
              <div className="p-10 text-center text-gray-500">لا توجد سجلات مبيعات تطابق هذه التصفية</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-4 text-right">رقم الطلب</th>
                      <th className="p-4 text-right">التاريخ</th>
                      <th className="p-4 text-right">الزبون</th>
                      <th className="p-4 text-right">الهاتف</th>
                      <th className="p-4 text-right">الإجمالي</th>
                      <th className="p-4 text-right">المدفوع الكلي</th>
                      <th className="p-4 text-right">المتبقي</th>
                      <th className="p-4 text-right">VIP</th>
                      <th className="p-4 text-right">المستخدم</th>
                      <th className="p-4 text-right">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((item) => (
                      <tr key={item.or_id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-4 font-bold">#{item.or_no}</td>
                        <td className="p-4 text-gray-600">
                          {new Date(item.or_date).toLocaleDateString("en-GB")}
                        </td>
                        <td className="p-4 font-semibold">{item.or_cus_name || "زبون عابر"}</td>
                        <td className="p-4 text-gray-600">{item.or_cus_phone || "—"}</td>
                        <td className="p-4 text-green-600 font-bold">{formatNumber(item.or_total)}</td>
                        <td className="p-4 text-blue-600 font-bold">{formatNumber(item.paid_total)}</td>
                        <td className="p-4 text-red-600 font-bold">
                          {Number(item.remaining) > 0 ? formatNumber(item.remaining) : "0"}
                        </td>
                        <td className="p-4">
                          {item.or_vip === 1 ? (
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-md font-bold">VIP</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-4 text-gray-600">{item.user_name}</td>
                        <td className="p-4">
                          <button
                            onClick={() => router.push(`/br_admin/order/print/${item.or_id}`)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-purple-700 transition"
                          >
                            تفاصيل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            
            /* ==========================================
               2. جدول حركات المدفوعات (الصندوق النقدى) المحدث
               ========================================== */
            payments.length === 0 ? (
              <div className="p-10 text-center text-gray-500">لم يتم قبض مبالغ نقدية خلال هذه المدة المطلوبة.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-4 text-right">رقم السند الدفع</th>
                      <th className="p-4 text-right">تاريخ وتوقيت الدفع</th>
                      <th className="p-4 text-right">مرتبط بالطلب رقم</th>
                      <th className="p-4 text-right">اسم الزبون</th>
                      <th className="p-4 text-right">المبلغ المستلم الكاش</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pay) => (
                      <tr key={pay.pay_id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-4 font-mono text-gray-500">PAY-{pay.pay_id}</td>
                        <td className="p-4 text-gray-600">
                          {new Date(pay.pay_date).toLocaleString("en-GB", { hour12: true })}
                        </td>
                        <td className="p-4 font-bold text-gray-900">#{pay.or_no || "N/A"}</td>
                        <td className="p-4 font-medium">{pay.or_cus_name || "زبون مجهول"}</td>
                        <td className="p-4 text-emerald-600 font-extrabold text-base">
                          {formatNumber(pay.pay_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

        </div>

      </div>
    </div>
  );
}