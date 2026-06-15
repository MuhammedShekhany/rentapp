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
  // GLOBAL TOTALS (Static Top Cards)
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

  // =========================
  // DYNAMIC TOTAL FOR THE FILTERED DATA
  // =========================
  const filteredTotalSum = useMemo(
    () => filteredOrders.reduce((s, i) => s + Number(i.or_total || 0), 0),
    [filteredOrders]
  );

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
              عرض جميع الطلبات بدون مجموعات
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            رجوع
          </button>
        </div>

        {/* FILTER */}
        <div className="bg-white p-5 rounded-2xl shadow flex flex-wrap gap-4 items-end">
          <div>
            <label className="block mb-2 text-sm font-semibold">
              نوع التقرير
            </label>

            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as FilterType);
                setPaymentFilter("all"); 
              }}
              className="border p-3 rounded-xl"
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

        {/* TOTALS / INTERACTIVE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* All Orders Card */}
          <div 
            onClick={() => setPaymentFilter("all")}
            className={`bg-white rounded-2xl shadow p-6 cursor-pointer transition-all duration-200 border-2 ${
              paymentFilter === "all" ? "border-green-600 ring-2 ring-green-100" : "border-transparent hover:border-gray-300"
            }`}
          >
            <div className="text-gray-500 text-sm font-semibold">إجمالي الطلبات (عرض الكل)</div>
            <div className="text-4xl font-bold text-green-600 mt-3">
              {formatNumber(totalOrders)}
            </div>
          </div>

          {/* Paid Orders Card */}
          <div 
            onClick={() => setPaymentFilter("paid")}
            className={`bg-white rounded-2xl shadow p-6 cursor-pointer transition-all duration-200 border-2 ${
              paymentFilter === "paid" ? "border-blue-600 ring-2 ring-blue-100" : "border-transparent hover:border-gray-300"
            }`}
          >
            <div className="text-gray-500 text-sm font-semibold">المدفوع (المكتملة فقط)</div>
            <div className="text-4xl font-bold text-blue-600 mt-3">
              {formatNumber(totalPaid)}
            </div>
          </div>

          {/* Remaining Orders Card */}
          <div 
            onClick={() => setPaymentFilter("remaining")}
            className={`bg-white rounded-2xl shadow p-6 cursor-pointer transition-all duration-200 border-2 ${
              paymentFilter === "remaining" ? "border-red-600 ring-2 ring-red-100" : "border-transparent hover:border-gray-300"
            }`}
          >
            <div className="text-gray-500 text-sm font-semibold">المتبقي (الغير مدفوعة كاملة)</div>
            <div className="text-4xl font-bold text-red-600 mt-3">
              {formatNumber(totalRemaining)}
            </div>
          </div>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">

          {/* TABLE HEADER WITH DYNAMIC SUB-TOTALS */}
          <div className="p-5 border-b text-lg font-bold flex flex-wrap justify-between items-center gap-2 bg-gray-50">
            <div className="flex items-center gap-3">
              <span>
                {paymentFilter === "all" && "كل الطلبات"}
                {paymentFilter === "paid" && "الطلبات المدفوعة بالكامل"}
                {paymentFilter === "remaining" && "الطلبات المتبقي عليها مبالغ"}
              </span>
              <span className="text-xs bg-gray-200 text-gray-800 px-2.5 py-1 rounded-full font-medium">
                العدد: {filteredOrders.length}
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-medium">
                مجموع القيمة المباشرة: {formatNumber(filteredTotalSum)}
              </span>
            </div>
            
            {paymentFilter !== "all" && (
              <button 
                onClick={() => setPaymentFilter("all")} 
                className="text-sm bg-white border shadow-sm text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                إلغاء التصفية ×
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-10 text-center">جاري التحميل...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              لا توجد بيانات تطابق هذه التصفية
            </div>
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
                  {filteredOrders.map((item) => (
                    <tr key={item.or_id} className="border-b hover:bg-gray-50">

                      <td className="p-4 font-bold">#{item.or_no}</td>

                      <td className="p-4">
                        {new Date(item.or_date).toLocaleDateString("en-GB")}
                      </td>

                      <td className="p-4 font-semibold">
                        {item.or_cus_name}
                      </td>

                      <td className="p-4">
                        {item.or_cus_phone}
                      </td>

                      <td className="p-4 text-green-600 font-bold">
                        {formatNumber(item.or_total)}
                      </td>

                      <td className="p-4 text-blue-600 font-bold">
                        {formatNumber(item.paid_total)}
                      </td>

                      <td className="p-4 text-red-600 font-bold">
                        {formatNumber(item.remaining)}
                      </td>

                      <td className="p-4">
                        {item.or_vip === 1 ? "VIP" : "-"}
                      </td>

                      <td className="p-4">
                        {item.user_name}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() =>
                            router.push(`/br_admin/order/print/${item.or_id}`)
                          }
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                        >
                          تفاصيل
                        </button>
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