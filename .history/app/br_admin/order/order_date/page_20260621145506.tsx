"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type OrderType = {
  or_id: number;
  or_no: number;
  or_date: string;
  or_total: number;
  or_note?: string;
  or_cus_name?: string;
  or_cus_phone?: string;
  or_cus_phone2?: string;
  or_prepare_date?: string;
  or_date_reserve?: string;
  or_receipt_date?: string;
  user_fullname: string;
  or_vip: number;
  br_id: string;
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

export default function OrderPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTop, setShowTop] = useState(false);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [user, setUser] = useState<UserType | null>(null);

  // ⭐ SCROLL REF
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  // ======================
  // LOAD ORDERS
  // ======================
  const loadOrders = async (
    branchId: string,
    from?: string,
    to?: string
  ) => {
    try {
      setLoading(true);

      let url = `/api/order/date_range?br_id=${branchId}`;

      if (from && to) {
        url += `&from_date=${from}&to_date=${to}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data?.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
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

  // ======================
  // FIRST LOAD
  // ======================
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.replace("/login");
      return;
    }

    const parsedUser: UserType = JSON.parse(session);
    setUser(parsedUser);

    const today = new Date().toISOString().slice(0, 10);
    setFromDate(today);
    setToDate(today);
  }, [router]);

  // ======================
  // SAVE SCROLL
  // ======================
  const handleScroll = () => {
    if (!scrollRef.current) return;

    sessionStorage.setItem(
      "orders_scroll",
      String(scrollRef.current.scrollTop)
    );
  };

  // ======================
  // RESTORE SCROLL
  // ======================
  useEffect(() => {
    if (loading) return;

    const saved = sessionStorage.getItem("orders_scroll");

    if (!saved) return;

    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = Number(saved);
      }
    });
  }, [loading, orders.length]);

  // ======================
  // RELOAD ON DATE CHANGE
  // ======================
  useEffect(() => {
    if (user?.br_id && fromDate && toDate) {
      loadOrders(user.br_id, fromDate, toDate);
    }
  }, [user, fromDate, toDate]);

  // ======================
  // DELETE
  // ======================
  const handleDelete = async (or_id: number) => {
    const ok = confirm("هل أنت متأكد؟");
    if (!ok) return;

    try {
      const res = await fetch(`/api/order/${or_id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        loadOrders(user!.br_id, fromDate, toDate);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ======================
  // FILTER
  // ======================
  const filteredOrders = orders.filter((item) => {
    const text = search.toLowerCase();

    return (
      item.or_id.toString().includes(text) ||
      (item.or_cus_name || "").toLowerCase().includes(text) ||
      (item.or_cus_phone || "").includes(text)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">الحجوزات</h1>
          <button
            onClick={() => router.back()}
            className="bg-gray-800 text-white px-5 py-3 rounded-xl"
          >
            رجوع
          </button>
        </div>

        {/* SEARCH */}
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-3">
          <input
            className="border p-2 rounded-lg flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث"
          />

          <input
            type="date"
            className="border p-2 rounded-lg"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <input
            type="date"
            className="border p-2 rounded-lg"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow">

          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : (
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="overflow-auto max-h-[75vh]"
            >
              <table className="w-full text-sm text-right">

                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="p-3">رقم</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">الهاتف</th>
                    <th className="p-3">المجموع</th>
                    <th className="p-3">المدفوع</th>
                    <th className="p-3">المتبقي</th>
                    <th className="p-3">التاريخ</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((item) => (
                    <tr key={item.or_id} className="border-b hover:bg-gray-50">
                      <td className="p-3">#{item.or_no}</td>
                      <td className="p-3">{item.or_cus_name}</td>
                      <td className="p-3">{item.or_cus_phone}</td>
                      <td className="p-3">{formatNumber(item.or_total)}</td>
                      <td className="p-3">{formatNumber(item.paid_total)}</td>
                      <td className="p-3">{formatNumber(item.remaining)}</td>
                      <td className="p-3">
                        {new Date(item.or_date).toLocaleDateString("en-GB")}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>

      </div>

      {/* BACK TO TOP */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 bg-black text-white px-4 py-3 rounded-full"
        >
          ↑
        </button>
      )}
    </div>
  );
}