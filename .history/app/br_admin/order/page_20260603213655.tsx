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

  or_gat_id: number;
  or_gat_name: string;

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
  br_name?: string;
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
  // LOAD ORDERS
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

  const now = new Date();

  const currentMonth = now.toISOString().slice(0, 7);

  setMonth(currentMonth);

  // ❌ REMOVE THIS LINE
  // loadOrders(currentMonth);

}, [router]);



  // ✅ BASE PATH (FIXED)
  const basePath = useMemo(() => {
    if (!user) return "";

    return user.user_role === "br_admin"
      ? "/br_admin"
      : user.user_role === "br_ass"
        ? "/br_ass"
        : "/br_user";
  }, [user]);

  // ======================
  // RELOAD ON MONTH CHANGE
  // ======================
  useEffect(() => {
  if (user?.br_id && month) {
    loadOrders(month);
  }
}, [user, month]);

  // ======================
  // SCROLL BUTTON
  // ======================
  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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




  const toggleDelayed = async (or_id: number, current: number) => {
    try {
      setUpdatingId(or_id);

      const res = await fetch(`/api/order/${or_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          or_delayed: current == 1 ? 0 : 1,
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
      alert("Server error");

    } finally {
      setUpdatingId(null);
    }
  };






  const updateTamin = async (or_id: number, currentTamin: string) => {
    const newTamin = prompt("أدخل التأمين", currentTamin || "");

    if (newTamin === null) return;

    try {
      setUpdatingId(or_id);

      const res = await fetch(`/api/order/${or_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tamin: newTamin,
        }),
      });

      const data = await res.json();

      if (data.success) {
        loadOrders(month);
      } else {
        alert(data.message || "فشل تحديث التأمين");
      }

    } catch (error) {

      console.error(error);

      alert("خطأ في السيرفر");

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
      (item.or_cus_phone2 || "").includes(text) ||
      (item.or_gat_name || "").toLowerCase().includes(text)
    );
  });



  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">

      <div className="max-w-[1900px] mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <div>
            <h1 className="text-3xl font-bold">
              الطلبات
            </h1>

            <p className="text-gray-600 mt-1">
              إدارة جميع بيانات الطلبات
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">

            <button
              onClick={() => router.push("/br_admin/order/add")}
              className="bg-black text-white px-5 py-3 rounded-xl"
            >
              + إضافة طلب
            </button>

            <button
              onClick={() => router.push(`${basePath}`)}
              className="bg-gray-800 text-white px-5 py-3 rounded-xl"
            >
              ← الرجوع
            </button>

          </div>

        </div>

        {/* SEARCH + MONTH */}
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-2 flex-col md:flex-row">

          <input
            type="text"
            placeholder="بحث (رقم الطلب / اسم / هاتف / بوابة)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded-lg w-full"
          />

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border p-2 rounded-lg"
          />

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              جارٍ التحميل...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد نتائج
            </div>
          ) : (
            <div className="overflow-auto max-h-[75vh]">

              <table className="w-full text-right text-sm">

                <thead className="sticky top-0 z-20 bg-gray-50 border-b">

                  <tr>

                    <th className="p-4">رقم</th>



                    <th className="p-4">العميل</th>

                    <th className="p-4">الهاتف</th>

                    <th className="p-4">هاتف ثاني</th>

                    <th className="p-4">المجموع</th>

                    <th className="p-4">المدفوع</th>

                    <th className="p-4">المتبقي</th>

                    <th className="p-4">VIP</th>

                    <th className="p-4">تاريخ الطلب</th>
                    <th className="p-4">تاريخ الحجز </th>
                    <th className="p-4">تاريخ استرجاع </th>
                    <th className="p-4">تاريخ التحضير </th>
                    
                    <th className="p-4">التأمين</th>

                    <th className="p-4">الملاحظة</th>

                    <th className="p-4">المستخدم</th>

                    <th className="p-4">الإجراءات</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredOrders.map((item) => (
                    <>
                    <tr
                      key={item.or_id}
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="p-4 font-semibold">
                        #{item.or_id}
                      </td>


                      <td className="p-4">
                        {item.or_cus_name || "-"}
                      </td>

                      <td className="p-4">
                        {item.or_cus_phone || "-"}
                      </td>

                      <td className="p-4">
                        {item.or_cus_phone2 || "-"}
                      </td>

                      <td className="p-4 font-bold text-blue-700">
                        {formatNumber(item.or_total)}
                      </td>

                      <td className="p-4 text-green-700 font-semibold">
                        {formatNumber(item.paid_total)}
                      </td>

                      <td className="p-4 text-red-700 font-semibold">
                        {formatNumber(item.remaining)}
                      </td>

                      <td className="p-4">
                        {item.or_vip == 1 ? "VIP" : "-"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {new Date(item.or_date).toLocaleString("en-GB")}
                      </td>




                      <td className="p-4 whitespace-nowrap">
                        {item.or_date_reserve
                          ? new Date(item.or_date_reserve).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {item.or_date_reserve
                          ? new Date(new Date(item.or_date_reserve).setDate(new Date(item.or_date_reserve).getDate() + 1))
                            .toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="p-4 whitespace-nowrap">

                        {item.or_prepare_date
                          ? new Date(item.or_prepare_date).toLocaleDateString("en-GB")
                          : "-"}

                      </td>
                      

                      <td className="p-4">
                        {item.tamin || "-"}
                      </td>

                      <td className="p-4 max-w-[220px]">

                        <div className="truncate" >
                          {item.or_note || "-"}
                        </div>

                      </td>

                      <td className="p-4">
                        {item.user_fullname || "-"}
                      </td>

                      

                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="p-4">

                        <div className="flex gap-2 flex-wrap">

                          <button
                            onClick={() =>
                              router.push(`/br_admin/order/edit/${item.or_id}`)
                            }
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                          >
                            تعديل
                          </button>

                          <button
                            onClick={() => handleDelete(item.or_id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg"
                          >
                            حذف
                          </button>

                          <button
                            onClick={() =>
                              router.push(`/br_admin/order/payment/${item.or_id}`)
                            }
                            className="bg-amber-500 text-white px-4 py-2 rounded-lg"
                          >
                            الدفع
                          </button>

                          <button
                            onClick={() =>
                              router.push(`/br_admin/order/print/${item.or_id}`)
                            }
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                          >
                            طباعة
                          </button>

                          <button
                            disabled={updatingId === item.or_id}
                            onClick={() => toggleDelayed(item.or_id, item.or_delayed)}
                            className={`px-4 py-2 rounded-lg text-white ${item.or_delayed == 1
                              ? "bg-red-600"
                              : "bg-orange-600"
                              }`}
                          >
                            {updatingId === item.or_id
                              ? "جاري التحديث..."
                              : item.or_delayed == 1
                                ? "مؤجل"
                                : "تأجيل"}
                          </button>

                          <button
                            disabled={updatingId === item.or_id}
                            onClick={() => updateTamin(item.or_id, item.tamin)}
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg"
                          >
                            تأمين
                          </button>

                        </div>

                      </td>

                    </tr>

</>


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
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          className="fixed bottom-6 left-6 bg-black text-white px-4 py-3 rounded-full shadow-lg"
        >
          ↑ للأعلى
        </button>
      )}

    </div>
  );
}