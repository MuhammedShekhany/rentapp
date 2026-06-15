import React, { useState, useEffect } from "react";
import { Calendar, DollarSign, ShoppingBag, ArrowRightLeft, FileText } from "lucide-react";

type FilterType = "daily" | "monthly" | "yearly";

export default function AdminDashboard() {
  // Filter States
  const [type, setType] = useState<FilterType>("monthly");
  const [brId, setBrId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // 2026-06-15
  const [month, setMonth] = useState("2026-06");
  const [year, setYear] = useState("2026");

  // API Data States
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "payments">("orders");
  const [summary, setSummary] = useState({ total_orders_revenue: 0, total_payments_collected: 0 });
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);

  // Fetch Data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type, br_id: brId });
      if (type === "daily" && date) params.append("date", date);
      if (type === "monthly" && month) params.append("month", month);
      if (type === "yearly" && year) params.append("year", year);

      const response = await fetch(`/api/reports?${params.toString()}`);
      const resData = await response.json();

      if (resData.success) {
        setOrders(resData.orders);
        setPayments(resData.payments);
        setSummary(resData.summary);
      }
    } catch (error) {
      console.error("Failed fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch data whenever any filter changes
  useEffect(() => {
    fetchData();
  }, [type, brId, date, month, year]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financial Overview</h1>
            <p className="text-sm text-gray-500">Track and manage transactions, orders, and sales performance.</p>
          </div>
          
          {/* CONTROL FILTERS */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            {/* Branch Input */}
            <input
              type="text"
              placeholder="Branch ID (Optional)"
              value={brId}
              onChange={(e) => setBrId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
            />

            {/* Type Selector */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FilterType)}
              className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>

            {/* Dynamic Date Inputs */}
            {type === "daily" && (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {type === "monthly" && (
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {type === "yearly" && (
              <input
                type="number"
                min="2020"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
              />
            )}
          </div>
        </div>

        {/* SUMMARY CARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Total New Orders */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Booked Order Volume</span>
              <h3 className="text-2xl font-bold text-gray-900">${summary.total_orders_revenue.toLocaleString()}</h3>
              <p className="text-xs text-gray-400">Value of new items ordered this period</p>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          {/* Total Payments Collected */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payments Collected</span>
              <h3 className="text-2xl font-bold text-emerald-600">${summary.total_payments_collected.toLocaleString()}</h3>
              <p className="text-xs text-gray-400">Total liquid cash processed this period</p>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* DATA TABLE WRAPPER */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tab Selection */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 px-4 pt-3 gap-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === "orders" 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <FileText className="w-4 h-4" />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === "payments" 
                  ? "border-blue-600 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Payments ({payments.length})
            </button>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="py-24 text-center text-sm text-gray-400 font-medium animate-pulse">
              Loading report matrix...
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* ORDERS TABLE */}
              {activeTab === "orders" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold uppercase text-gray-400 tracking-wider">
                      <th className="px-6 py-3.5">Order No</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Total Bill</th>
                      <th className="px-6 py-3.5">Amount Paid</th>
                      <th className="px-6 py-3.5">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {orders.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No orders recorded for this period.</td></tr>
                    ) : (
                      orders.map((item: any) => (
                        <tr key={item.or_id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 font-semibold text-gray-900">#{item.or_no}</td>
                          <td className="px-6 py-4 text-gray-500">{new Date(item.or_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-800">{item.or_cus_name || "Guest Customer"}</div>
                          </td>
                          <td className="px-6 py-4 font-medium">${Number(item.or_total).toFixed(2)}</td>
                          <td className="px-6 py-4 text-emerald-600 font-medium">${Number(item.paid_total).toFixed(2)}</td>
                          <td className="px-6 py-4 font-semibold">
                            <span className={item.remaining > 0 ? "text-amber-600" : "text-gray-400"}>
                              ${Number(item.remaining).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* PAYMENTS TABLE */}
              {activeTab === "payments" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold uppercase text-gray-400 tracking-wider">
                      <th className="px-6 py-3.5">Payment ID</th>
                      <th className="px-6 py-3.5">Payment Date</th>
                      <th className="px-6 py-3.5">Associated Order</th>
                      <th className="px-6 py-3.5">Customer Name</th>
                      <th className="px-6 py-3.5">Amount Deposited</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {payments.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No payments processed during this period.</td></tr>
                    ) : (
                      payments.map((pay: any) => (
                        <tr key={pay.pay_id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 font-medium text-gray-500">PAY-{pay.pay_id}</td>
                          <td className="px-6 py-4 text-gray-500">{new Date(pay.pay_date).toLocaleString()}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">#{pay.or_no || "N/A"}</td>
                          <td className="px-6 py-4 text-gray-700">{pay.or_cus_name || "—"}</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">${Number(pay.pay_total).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}