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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);

  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [viewMode, setViewMode] = useState<ViewModeType>("all");

  // لإدخال قيمة المصاريف يدوياً
  const [spendAmount, setSpendAmount] = useState<number>(0);

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
  // CALCULATIONS & COUNTS
  // =========================
  const totalOrdersSum = useMemo(
    () => orders.reduce((s, i) => s + Number(i.or_total || 0), 0),
    [orders]
  );

  const totalPaidSum = useMemo(
    () => payments.reduce((s, i) => s + Number(i.pay_total || 0), 0),
    [payments]
  );

  // المتبقي الكلي = إجمالي المبيعات - إجمالي المدفوعات المستلمة
  const totalRemainingSum = useMemo(
    () => totalOrdersSum - totalPaidSum,
    [totalOrdersSum, totalPaidSum]
  );

  const remainingOrdersList = useMemo(
    () => orders.filter((o) => Number(o.remaining) > 0),
    [orders]
  );

  const previousBalance = 0; // لاحقاً تجيبه من API

  const finalBalance = useMemo(() => {
    return previousBalance + totalPaidSum - spendAmount;
  }, [previousBalance, totalPaidSum, spendAmount]);

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">تقرير الطلبات</h1>
            <p className="text-gray-600 mt-1">
              اضغط على بطاقات الإجماليات للتنقل وتصفية الجداول أدناه
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors"
          >
            رجوع
          </button>
        </div>

        {/* FILTER & INPUTS */}
        <div className="bg-white p-5 rounded-2xl shadow flex flex-wrap gap-4 items-end">
          <div>
            <label className="block mb-2 text-sm font-semibold">نوع التقرير</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="border p-3 rounded-xl bg-gray-50"
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
              className="border p-3 rounded-xl bg-gray-50"
            />
          )}

          {filterType === "monthly" && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border p-3 rounded-xl bg-gray-50"
            />
          )}

          {filterType === "yearly" && (
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border p-3 rounded-xl w-[140px] bg-gray-50"
            />
          )}

          {/* مدخل المصاريف المضافة حديثاً */}
          <div className="md:mr-auto">
            <label className="block mb-2 text-sm font-semibold text-red-600">
              تسجيل المصاريف للفترة الحالية
            </label>
            <input
              type="number"
              placeholder="0"
              value={spendAmount === 0 ? "" : spendAmount}
              onChange={(e) => setSpendAmount(Number(e.target.value))}
              className="border p-3 rounded-xl w-[180px] bg-red-50/50 focus:bg-white text-red-700 font-bold outline-none border-red-200 focus:border-red-500 transition-all"
            />
          </div>
        </div>

        {/* INTERACTIVE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

          {/* Previous Balance */}
          <div className="rounded-2xl shadow p-5 bg-white border">
            <div className="text-sm text-gray-500">الرصيد السابق</div>
            <div className="text-2xl font-bold text-gray-700 mt-2">
              {formatNumber(previousBalance)}
            </div>
          </div>

          {/* Total Orders */}
          <div 
            onClick={() => setViewMode("all")}
            className={`rounded-2xl shadow p-5 border cursor-pointer transition-all duration-200 ${viewMode === "all" ? "bg-green-50 border-green-500 ring-2 ring-green-200" : "bg-white hover:bg-gray-50"}`}
          >
            <div className="text-sm text-gray-500">إجمالي المبيعات</div>
            <div className="text-2xl font-bold text-green-600 mt-2">
              {formatNumber(totalOrdersSum)}
            </div>
          </div>

          {/* Payments */}
          <div 
            onClick={() => setViewMode("payments")}
            className={`rounded-2xl shadow p-5 border cursor-pointer transition-all duration-200 ${viewMode === "payments" ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200" : "bg-white hover:bg-gray-50"}`}
          >
            <div className="text-sm text-gray-500">المقبوضات</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {formatNumber(totalPaidSum)}
            </div>
          </div>

          {/* Total Remaining */}
          <div 
            onClick={() => setViewMode("remaining")}
            className={`rounded-2xl shadow p-5 border cursor-pointer transition-all duration-200 ${viewMode === "remaining" ? "bg-orange-50 border-orange-500 ring-2 ring-orange-200" : "bg-white hover:bg-gray-50"}`}
          >
            <div className="text-sm text-gray-500">المتبقي الكلي</div>
            <div className="text-2xl font-bold text-orange-600 mt-2">
              {formatNumber(totalRemainingSum)}
            </div>
          </div>

          {/* Spend */}
          <div className="rounded-2xl shadow p-5 bg-white border-red-100 border">
            <div className="text-sm text-gray-500">المصاريف</div>
            <div className="text-2xl font-bold text-red-600 mt-2">
              {formatNumber(spendAmount)}
            </div>
          </div>

          {/* Final Balance */}
          <div className="rounded-2xl shadow p-5 bg-black text-white">
            <div className="text-sm text-gray-300">الرصيد النهائي</div>
            <div className="text-2xl font-bold mt-2">
              {formatNumber(finalBalance)}
            </div>
          </div>

        </div>

        {/* DATA CONTAINER */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="p-5 border-b text-lg font-bold flex justify-between items-center">
            <span>
              {viewMode === "all" && "سجل كافة تفاصيل الطلبات الجديدة"}
              {viewMode === "payments" && "سجل عمليات الدفع المجمعة حسب رقم المعاملة"}
              {viewMode === "remaining" && "كشف الطلبات المتبقي عليها مبالغ مالية"}
            </span>
            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              عرض: {viewMode === "all" ? orders.length : viewMode === "payments" ? payments.length : remainingOrdersList.length} سجل
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">جاري التحميل...</div>
          ) : (
            <>
              {/* VIEW: ALL ORDERS OR REMAINING ORDERS */}
              {(viewMode === "all" || viewMode === "remaining") && (
                (() => {
                  const targetList = viewMode === "all" ? orders : remainingOrdersList;
                  return targetList.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">لا توجد سجلات طلبات مخصصة لهذه الفترة الزمنية</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-4 text-right">الرقم</th>
                            <th className="p-4 text-right">التاريخ</th>
                            <th className="p-4 text-right">الزبون</th>
                            <th className="p-4 text-right">الهاتف</th>
                            <th className="p-4 text-right">الإجمالي</th>
                            <th className="p-4 text-right">المدفوع</th>
                            <th className="p-4 text-right">المتبقي</th>
                            <th className="p-4 text-right">VIP</th>
                            <th className="p-4 text-right">المستخدم</th>
                            <th className="p-4 text-right">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {targetList.map((item) => (
                            <tr key={item.or_id} className="border-b hover:bg-gray-50/80 transition-colors">
                              <td className="p-4 font-bold">#{item.or_no}</td>
                              <td className="p-4">
                                {new Date(item.or_date).toLocaleDateString("en-GB")}
                              </td>
                              <td className="p-4 font-semibold">{item.or_cus_name}</td>
                              <td className="p-4">{item.or_cus_phone}</td>
                              <td className="p-4 text-green-600 font-bold">{formatNumber(item.or_total)}</td>
                              <td className="p-4 text-blue-600 font-bold">{formatNumber(item.paid_total)}</td>
                              <td className="p-4 text-red-600 font-bold">{formatNumber(item.remaining)}</td>
                              <td className="p-4">{item.or_vip === 1 ? <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-bold">VIP</span> : "-"}</td>
                              <td className="p-4 text-gray-600">{item.user_name}</td>
                              <td className="p-4">
                                <button
                                  onClick={() => router.push(`/br_admin/order/detail/${item.or_id}`)}
                                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                  تفاصيل
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}

              {/* VIEW: PAYMENTS */}
              {viewMode === "payments" && (
                payments.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">لا توجد دفعات مالية مسجلة لهذه المدة</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="p-4 text-right">رقم الطلب</th>
                          <th className="p-4 text-right">تاريخ الدفعة</th>
                          <th className="p-4 text-right">اسم الزبون</th>
                          <th className="p-4 text-right">إجمالي الفاتورة الأصلية</th>
                          <th className="p-4 text-right text-blue-700">المبلغ المدفوع (المستلم الآن)</th>
                          <th className="p-4 text-right">المتبقي الكلي للطلب</th>
                          <th className="p-4 text-right">الموظف</th>
                          <th className="p-4 text-right">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((item) => (
                          <tr key={item.pay_id} className="border-b hover:bg-blue-50/30 transition-colors">
                            <td className="p-4 font-bold">#{item.or_no}</td>
                            <td className="p-4 text-xs text-gray-600">
                              {new Date(item.pay_date).toLocaleDateString("en-GB")}
                            </td>
                            <td className="p-4 font-semibold">{item.or_cus_name}</td>
                            <td className="p-4 text-gray-700 font-medium">{formatNumber(item.or_total)}</td>
                            <td className="p-4 text-blue-600 font-extrabold bg-blue-50/50">{formatNumber(item.pay_total)}</td>
                            <td className="p-4 text-red-600 font-bold">{formatNumber(item.remaining)}</td>
                            <td className="p-4 text-gray-600">{item.user_name}</td>
                            <td className="p-4">
                              <button
                                onClick={() => router.push(`/br_admin/order/detail/${item.or_id}`)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
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
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}