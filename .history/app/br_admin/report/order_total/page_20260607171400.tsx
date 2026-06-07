"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

type OrderType = {
  or_id: number;
  or_no: number;
  or_date: string;
  or_total: number;
  or_cus_name: string;
  or_cus_phone: string;
  or_delivery: string;
  or_receipt: string;
  or_preparing: string;
  or_note: string;
  br_name: string;
  user_name: string;
  paid_total: number;
  remaining: number;
};

type SpendType = {
  sp_id: number;
  sp_total: number;
  sp_date: string;
  sp_detail: string;
  br_id: number;
  user_id: number;
  br_name: string;
  user_name: string;
};

type FilterType = "daily" | "weekly" | "monthly";

export default function OrderReportPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [spends, setSpends] = useState<SpendType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("daily");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );

  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().split("T")[0];
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, spendsRes] = await Promise.all([
        fetch("/api/order"),
        fetch("/api/spend"),
      ]);
      const ordersData = await ordersRes.json();
      const spendsData = await spendsRes.json();

      if (ordersData.success) setOrders(ordersData.orders || []);
      else setOrders([]);

      if (spendsData.success) setSpends(spendsData.spend || []);
      else setSpends([]);
    } catch (error) {
      console.error(error);
      setOrders([]);
      setSpends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) { router.push("/login"); return; }
    const user = JSON.parse(session);
    if (user.user_role !== "br_admin") { router.push("/dashboard"); return; }
    loadData();
  }, [router]);

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toISOString().split("T")[0];
  };

  const applyDateFilter = <T extends { or_date?: string; sp_date?: string }>(
    items: T[],
    dateKey: "or_date" | "sp_date"
  ): T[] => {
    if (!items.length) return [];
    if (filterType === "daily") {
      return items.filter(
        (item) =>
          new Date(item[dateKey] as string).toISOString().split("T")[0] === selectedDate
      );
    }
    if (filterType === "monthly") {
      return items.filter((item) => {
        const d = new Date(item[dateKey] as string);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return ym === selectedMonth;
      });
    }
    if (filterType === "weekly") {
      const start = new Date(selectedWeekStart);
      const end = new Date(selectedWeekStart);
      end.setDate(start.getDate() + 6);
      return items.filter((item) => {
        const d = new Date(item[dateKey] as string);
        const onlyDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return onlyDate >= start && onlyDate <= end;
      });
    }
    return items;
  };

  const filteredOrders = useMemo(
    () => applyDateFilter(orders, "or_date"),
    [orders, filterType, selectedDate, selectedMonth, selectedWeekStart]
  );

  const filteredSpends = useMemo(
    () => applyDateFilter(spends, "sp_date"),
    [spends, filterType, selectedDate, selectedMonth, selectedWeekStart]
  );

  const totalOrders = filteredOrders.length;
  const totalSales = filteredOrders.reduce((s, i) => s + Number(i.or_total || 0), 0);
  const totalPaid = filteredOrders.reduce((s, i) => s + Number(i.paid_total || 0), 0);
  const totalRemaining = filteredOrders.reduce((s, i) => s + Number(i.remaining || 0), 0);
  const totalSpend = filteredSpends.reduce((s, i) => s + Number(i.sp_total || 0), 0);

  const pieData = [
    { name: "مدفوع", value: totalPaid },
    { name: "متبقي", value: totalRemaining },
  ];
  const COLORS = ["#16a34a", "#dc2626"];

  const combinedPieData = [
    { name: "مدفوع", value: totalPaid },
    { name: "مصروفات", value: totalSpend },
  ];
  const COMBINED_COLORS = ["#16a34a", "#f59e0b"];

  const formatNumber = (num: number) => Number(num).toLocaleString("en-US");

  const total = totalPaid + totalRemaining;
  const paidPercent = total ? (totalPaid / total) * 100 : 0;
  const remainingPercent = total ? (totalRemaining / total) * 100 : 0;

  const combinedTotal = totalPaid + totalSpend;
  const paidPct = combinedTotal ? (totalPaid / combinedTotal) * 100 : 0;
  const spendPct = combinedTotal ? (totalSpend / combinedTotal) * 100 : 0;
  const netResult = totalPaid - totalSpend;

  const filterLabel =
    filterType === "daily" ? "يومي" : filterType === "weekly" ? "أسبوعي" : "شهري";

  const periodLabel = () => {
    if (filterType === "daily") return selectedDate;
    if (filterType === "monthly") return selectedMonth;
    if (filterType === "weekly") {
      const end = new Date(selectedWeekStart);
      end.setDate(end.getDate() + 6);
      return `${selectedWeekStart} → ${end.toISOString().split("T")[0]}`;
    }
    return "";
  };

  const handlePrint = () => window.print();

  return (
    <>
      {/* ── Print Styles ── */}
      <style>{`
        @media print {
          /* hide browser chrome */
          @page { margin: 12mm; }

          /* hide buttons / filter / tabs */
          .no-print { display: none !important; }

          /* show both tables always */
          .print-show { display: block !important; }

          /* reset backgrounds so cards render */
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body { background: white !important; }

          /* break tables nicely */
          table { page-break-inside: auto; }
          tr    { page-break-inside: avoid; }

          /* chart containers need a fixed height */
          .recharts-wrapper { page-break-inside: avoid; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">تقرير الطلبات</h1>
              <p className="text-gray-600 mt-1">تحليل المبيعات والمدفوعات والمصروفات</p>
              {/* period shown in print */}
              <p className="text-gray-400 text-sm mt-0.5">
                {filterLabel} — {periodLabel()}
              </p>
            </div>

            <div className="flex gap-3 no-print">
              {/* Print button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
                طباعة
              </button>

              <button
                onClick={() => router.back()}
                className="bg-gray-800 text-white px-5 py-3 rounded-xl hover:bg-gray-900 transition"
              >
                رجوع
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 no-print">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 min-w-[140px]">
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  نوع التقرير
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="w-full border border-gray-200 bg-gray-50 text-gray-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="daily">يومي</option>
                  <option value="weekly">أسبوعي</option>
                  <option value="monthly">شهري</option>
                </select>
              </div>

              <div className="flex-1 min-w-[160px]">
                <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {filterType === "daily" ? "التاريخ" : filterType === "weekly" ? "بداية الأسبوع" : "الشهر"}
                </label>
                {filterType === "daily" && (
                  <input type="date" value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                )}
                {filterType === "weekly" && (
                  <input type="date" value={selectedWeekStart}
                    onChange={(e) => setSelectedWeekStart(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                )}
                {filterType === "monthly" && (
                  <input type="month" value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                )}
              </div>

              <button
                onClick={loadData}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all shadow-sm whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                </svg>
                تحديث
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow">
              <div className="text-gray-500 text-sm">عدد الطلبات</div>
              <div className="text-2xl font-bold mt-1">{totalOrders}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow">
              <div className="text-gray-500 text-sm">إجمالي المبيعات</div>
              <div className="text-2xl font-bold mt-1">{formatNumber(totalSales)}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow">
              <div className="text-gray-500 text-sm">المدفوعات</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{formatNumber(totalPaid)}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow">
              <div className="text-gray-500 text-sm">المصروفات</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{formatNumber(totalSpend)}</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Chart 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">توزيع المدفوعات</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{filterLabel}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto mb-1" />
                  <div className="text-xs text-emerald-600 font-medium mb-0.5">المدفوع</div>
                  <div className="text-lg font-bold text-emerald-700">{formatNumber(totalPaid)}</div>
                  <div className="text-sm font-bold text-emerald-600 mt-1">{paidPercent.toFixed(1)}%</div>
                </div>
                <div className="bg-rose-50 rounded-xl p-4 text-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400 mx-auto mb-1" />
                  <div className="text-xs text-rose-500 font-medium mb-0.5">المتبقي</div>
                  <div className="text-lg font-bold text-rose-600">{formatNumber(totalRemaining)}</div>
                  <div className="text-sm font-bold text-rose-600 mt-1">{remainingPercent.toFixed(1)}%</div>
                </div>
              </div>

              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "13px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">الإجمالي الكلي</span>
                <span className="text-xl font-bold text-gray-800">{formatNumber(totalPaid + totalRemaining)}</span>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">المدفوع مقابل المصروفات</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{filterLabel}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto mb-1" />
                  <div className="text-xs text-emerald-600 font-medium mb-0.5">مدفوع</div>
                  <div className="text-lg font-bold text-emerald-700">{formatNumber(totalPaid)}</div>
                  <div className="text-sm font-bold text-emerald-600 mt-1">{paidPct.toFixed(1)}%</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mx-auto mb-1" />
                  <div className="text-xs text-amber-600 font-medium mb-0.5">مصروفات</div>
                  <div className="text-lg font-bold text-amber-700">{formatNumber(totalSpend)}</div>
                  <div className="text-sm font-bold text-amber-600 mt-1">{spendPct.toFixed(1)}%</div>
                </div>
              </div>

              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={combinedPieData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {combinedPieData.map((_, index) => (
                        <Cell key={index} fill={COMBINED_COLORS[index]} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "13px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">مدفوع - مصروفات</span>
                <span className={`text-xl font-bold ${netResult >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatNumber(netResult)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Orders Table (always visible in print) ── */}
          <div className="bg-white rounded-2xl shadow overflow-hidden print-show">
            <div className="p-6 border-b font-bold text-lg flex items-center justify-between">
              <span>الطلبات</span>
              <span className="text-sm text-gray-400 no-print">({filteredOrders.length})</span>
            </div>
            {loading ? (
              <div className="p-10 text-center text-gray-500">جاري التحميل...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-10 text-center text-gray-500">لا توجد طلبات</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-4 text-right">الرقم</th>
                      <th className="p-4 text-right">التاريخ</th>
                      <th className="p-4 text-right">العميل</th>
                      <th className="p-4 text-right">الإجمالي</th>
                      <th className="p-4 text-right">مدفوع</th>
                      <th className="p-4 text-right">متبقي</th>
                      <th className="p-4 text-right no-print">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((item) => (
                      <tr key={item.or_id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-semibold text-gray-700">#{item.or_no}</td>
                        <td className="p-4 text-gray-600">{formatDate(item.or_date)}</td>
                        <td className="p-4 font-medium text-gray-800">{item.or_cus_name || "—"}</td>
                        <td className="p-4 font-semibold text-gray-900">{formatNumber(item.or_total)}</td>
                        <td className="p-4 font-semibold text-green-600">{formatNumber(item.paid_total)}</td>
                        <td className="p-4 font-semibold text-red-600">{formatNumber(item.remaining)}</td>
                        <td className="p-4 no-print">
                          <button
                            onClick={() => router.push(`/br_admin/order/print/${item.or_id}`)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
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

          {/* ── Spend Table (always visible in print) ── */}
          <div className="bg-white rounded-2xl shadow overflow-hidden print-show">
            <div className="p-6 border-b font-bold text-lg flex items-center justify-between">
              <span>المصروفات</span>
              <span className="text-amber-600 text-base font-bold">الإجمالي: {formatNumber(totalSpend)}</span>
            </div>
            {loading ? (
              <div className="p-10 text-center text-gray-500">جاري التحميل...</div>
            ) : filteredSpends.length === 0 ? (
              <div className="p-10 text-center text-gray-500">لا توجد مصروفات</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-4 text-right">الرقم</th>
                      <th className="p-4 text-right">التاريخ</th>
                      <th className="p-4 text-right">المبلغ</th>
                      <th className="p-4 text-right">التفاصيل</th>
                      <th className="p-4 text-right">المستخدم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSpends.map((item) => (
                      <tr key={item.sp_id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-semibold text-gray-700">#{item.sp_id}</td>
                        <td className="p-4 text-gray-600">{formatDate(item.sp_date)}</td>
                        <td className="p-4 font-semibold text-amber-600">{formatNumber(item.sp_total)}</td>
                        <td className="p-4 text-gray-600">{item.sp_detail || "—"}</td>
                        <td className="p-4 text-gray-600">{item.user_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}