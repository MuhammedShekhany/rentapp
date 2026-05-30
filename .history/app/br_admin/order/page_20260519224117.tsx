"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type OrderType = {
  or_id: number;
  or_date: string;
  or_total: number;

  or_cus_name: string;
  or_cus_phone: string;
  or_cus_phone2: string;

  or_delivery: number;
  or_receipt: number;
  or_preparing: number;
  or_delayed: number;

  or_note: string;

  or_prepare_date: string;
  or_date_reserve: string;

  tamin: string;
  or_vip: number;

  br_id: number;
  user_id: number;

  br_name: string;
  user_fullname: string;

  paid_total: number;
  remaining: number;

  createat: string;
};

type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
};

export default function OrderPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTop, setShowTop] = useState(false);

  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [user, setUser] = useState<UserType | null>(null);

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  // ======================
  // LOAD USER
  // ======================
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.replace("/login");
      return;
    }

    const parsedUser: UserType = JSON.parse(session);
    setUser(parsedUser);

    const currentMonth = new Date().toISOString().slice(0, 7);
    setMonth(currentMonth);
  }, [router]);

  // ======================
  // LOAD ORDERS (BRANCH SAFE)
  // ======================
  const loadOrders = async (selectedMonth?: string) => {
    try {
      setLoading(true);

      if (!user?.br_id) return;

      let url = `/api/order?br_id=${user.br_id}`;

      if (selectedMonth) {
        url += `&month=${selectedMonth}`;
      }

      const res = await fetch(url, {
        cache: "no-store",
      });

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
  // LOAD WHEN READY
  // ======================
  useEffect(() => {
    if (user?.br_id && month) {
      loadOrders(month);
    }
  }, [user, month]);

  // ======================
  // BASE PATH
  // ======================
  const basePath = useMemo(() => {
    if (!user) return "";

    return user.user_role === "br_admin"
      ? "/br_admin"
      : user.user_role === "br_ass"
      ? "/br_ass"
      : "/br_user";
  }, [user]);

  // ======================
  // DELETE
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
        loadOrders(month);
      } else {
        alert(data.message || "فشل الحذف");
      }
    } catch (error) {
      console.error(error);
      alert("خطأ في السيرفر");
    }
  };

  // ======================
  // TOGGLE DELAYED
  // ======================
  const toggleDelayed = async (or_id: number, current: number) => {
    try {
      setUpdatingId(or_id);

      const res = await fetch(`/api/order/${or_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          or_delayed: current === 1 ? 0 : 1,
        }),
      });

      const data = await res.json();

      if (data.success) {
        loadOrders(month);
      } else {
        alert(data.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
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
      (item.or_cus_phone || "").includes(text) ||
      (item.or_cus_phone2 || "").includes(text)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4" dir="rtl">

      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <div className="flex justify-between mb-4">
          <h1 className="text-3xl font-bold">الطلبات</h1>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/br_admin/order/add")}
              className="bg-black text-white px-4 py-2 rounded"
            >
              + إضافة
            </button>

            <button
              onClick={() => router.push(basePath)}
              className="bg-gray-700 text-white px-4 py-2 rounded"
            >
              رجوع
            </button>
          </div>
        </div>

        {/* SEARCH + MONTH */}
        <div className="bg-white p-3 rounded shadow flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="border p-2 w-full"
          />

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border p-2"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white mt-4 rounded shadow overflow-x-auto">

          {loading ? (
            <div className="p-6 text-center">جارٍ التحميل...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-6 text-center">لا توجد بيانات</div>
          ) : (
            <table className="w-full text-right">

              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">رقم</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">المجموع</th>
                  <th className="p-3">المدفوع</th>
                  <th className="p-3">المتبقي</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((item) => (
                  <tr key={item.or_id} className="border-b">

                    <td className="p-3">#{item.or_id}</td>

                    <td className="p-3">{item.or_cus_name}</td>

                    <td className="p-3">{item.or_cus_phone}</td>

                    <td className="p-3 text-blue-600 font-bold">
                      {formatNumber(item.or_total)}
                    </td>

                    <td className="p-3 text-green-600">
                      {formatNumber(item.paid_total)}
                    </td>

                    <td className="p-3 text-red-600">
                      {formatNumber(item.remaining)}
                    </td>

                    <td className="p-3 flex gap-2">

                      <button
                        onClick={() =>
                          router.push(`/br_admin/order/edit/${item.or_id}`)
                        }
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        تعديل
                      </button>

                      <button
                        onClick={() => handleDelete(item.or_id)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        حذف
                      </button>

                      <button
                        onClick={() =>
                          toggleDelayed(item.or_id, item.or_delayed)
                        }
                        className="bg-orange-600 text-white px-3 py-1 rounded"
                      >
                        تأجيل
                      </button>

                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          )}

        </div>

      </div>
    </div>
  );
}