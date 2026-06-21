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

  const scrollRef = useRef<HTMLDivElement>(null);

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  // ======================
  // LOAD ORDERS
  // ======================
  const loadOrders = async (branchId: string, from?: string, to?: string) => {
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
  // INIT USER + DATES
  // ======================
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.replace("/login");
      return;
    }

    const parsedUser: UserType = JSON.parse(session);
    setUser(parsedUser);

    const savedFrom = localStorage.getItem("order_from");
    const savedTo = localStorage.getItem("order_to");

    const today = new Date().toISOString().slice(0, 10);

    setFromDate(savedFrom || today);
    setToDate(savedTo || today);
  }, [router]);

  // ======================
  // SAVE DATES
  // ======================
  useEffect(() => {
    if (fromDate && toDate) {
      localStorage.setItem("order_from", fromDate);
      localStorage.setItem("order_to", toDate);
    }
  }, [fromDate, toDate]);

  // ======================
  // LOAD DATA
  // ======================
  useEffect(() => {
    if (user?.br_id && fromDate && toDate) {
      loadOrders(user.br_id, fromDate, toDate);
    }
  }, [user, fromDate, toDate]);

  // ======================
  // SCROLL SAVE
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
    if (!scrollRef.current) return;

    const saved = sessionStorage.getItem("orders_scroll");
    if (!saved) return;

    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = Number(saved);
      }
    });
  }, [loading]);

  // ======================
  // BACK TO TOP BUTTON
  // ======================
  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ======================
  // DELETE ORDER
  // ======================
  const handleDelete = async (or_id: number) => {
    const ok = confirm("هل أنت متأكد من حذف هذا الطلب؟");
    if (!ok) return;

    try {
      const res = await fetch(`/api/order/${or_id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        loadOrders(user!.br_id, fromDate, toDate);
      } else {
        alert(data.message || "فشل الحذف");
      }
    } catch (error) {
      console.error(error);
      alert("خطأ في السيرفر");
    }
  };

  // ======================
  // SEARCH FILTER
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">الحجوزات</h1>
            <p className="text-gray-600">إدارة جميع بيانات الحجوزات</p>
          </div>

          <button
            onClick={() => router.back()}
            className="bg-gray-800 text-white px-5 py-3 rounded-xl"
          >
            ← الرجوع
          </button>
        </div>

        {/* FILTER */}
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow">
            <p className="text-gray-500 text-xs">إجمالي</p>
            <p className="text-xl font-bold text-blue-700">
              {filteredOrders.length}
            </p>
          </div>

          <input
            type="text"
            placeholder="بحث"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded-lg w-full"
          />

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded-lg"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded-lg"
          />
        </div>

        {/* TABLE */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="bg-white rounded-2xl shadow overflow-auto max-h-[70vh]"
        >
          {loading ? (
            <div className="p-8 text-center">جارٍ التحميل...</div>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="p-4">رقم</th>
                  <th className="p-4">العميل</th>
                  <th className="p-4">الهاتف</th>
                  <th className="p-4">المجموع</th>
                  <th className="p-4">المدفوع</th>
                  <th className="p-4">المتبقي</th>
                  <th className="p-4">VIP</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">المستخدم</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((item) => (
                  <>
                    <tr key={item.or_id}>
                      <td className="p-4">#{item.or_no}</td>
                      <td className="p-4">{item.or_cus_name || "-"}</td>
                      <td className="p-4">{item.or_cus_phone || "-"}</td>
                      <td className="p-4">{formatNumber(item.or_total)}</td>
                      <td className="p-4">{formatNumber(item.paid_total)}</td>
                      <td className="p-4">{formatNumber(item.remaining)}</td>
                      <td className="p-4">
                        {item.or_vip == 1 ? "VIP" : "-"}
                      </td>
                      <td className="p-4">
                        {new Date(item.or_date).toLocaleString()}
                      </td>
                      <td className="p-4">{item.user_fullname}</td>
                    </tr>

                    <tr>
                      <td colSpan={9} className="p-3">
                        <button
                          onClick={() => {
                            if (scrollRef.current) {
                              sessionStorage.setItem(
                                "orders_scroll",
                                String(scrollRef.current.scrollTop)
                              );
                            }

                            router.push(
                              `/br_admin/order/detail/${item.or_id}`
                            );
                          }}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                        >
                          تفاصيل
                        </button>
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* TOP BUTTON */}
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