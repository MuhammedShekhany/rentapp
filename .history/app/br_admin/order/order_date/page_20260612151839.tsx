"use client";

import { useEffect, useState } from "react";
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

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  // ======================
  // LOAD ORDERS (NEW API)
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
    console.log("URL:", url);

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
  // RELOAD ON DATE CHANGE
  // ======================
 useEffect(() => {
  if (user?.br_id && fromDate && toDate) {
   
    loadOrders(user.br_id, fromDate, toDate);
  }
}, [user, fromDate, toDate]);

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
        loadOrders(fromDate, toDate);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">الحجوزات</h1>
            <p className="text-gray-600 mt-1">إدارة جميع بيانات الحجوزات</p>
          </div>

          <button
            onClick={() => router.back()}
            className="bg-gray-800 text-white px-5 py-3 rounded-xl"
          >
            ← الرجوع
          </button>
        </div>

        {/* SEARCH + DATE RANGE */}
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-2 flex-col md:flex-row">

          <input
            type="text"
            placeholder="بحث (رقم الحجز / اسم / هاتف)"
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
            <div className="overflow-x-auto">

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
                    
                    <th className="p-4">التاريخ الطلب</th>
                    <th className="p-4">تاريخ الحجز </th>
                    <th className="p-4">تاريخ التحضير</th>
                    <th className="p-4">تاريخ استرجاع </th>

                    <th className="p-4">الملاحظة</th>

                    <th className="p-4">المستخدم</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredOrders.map((item) => (
                    <>
                   
                    <tr
                      key={item.or_id}
                      className="hover:bg-gray-50"
                    >

                      <td className="p-4 font-semibold">
                        #{item.or_no}
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
                          ? new Date(item.or_date_reserve).toLocaleString("en-GB")
                          : "-"}

                      </td>
                      <td className="p-4 whitespace-nowrap">

                        {item.or_prepare_date
                          ? new Date(item.or_prepare_date).toLocaleString("en-GB")
                          : "-"}

                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {item.or_date_reserve
                          ? new Date(new Date(item.or_date_reserve).setDate(new Date(item.or_date_reserve).getDate() + 1))
                            .toLocaleDateString("en-GB")
                          : "-"}
                      </td>

                      <td className="p-4 max-w-[220px]">

                        <div className="truncate">
                          {item.or_note || "-"}
                        </div>

                      </td>

                      <td className="p-4">
                        {item.user_fullname || "-"}
                      </td>

                      
                          

                    </tr>
                     <tr className="border-b bg-gray-50">
                        <td colSpan={16} className="p-3">
                          <div className="flex flex-row flex-nowrap gap-2 items-center justify-start">

                            <button
                            onClick={() =>
                              router.push(`/br_admin/order/print/${item.or_id}`)
                            }
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                          >
                           تفاصيل
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
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 bg-black text-white px-4 py-3 rounded-full shadow-lg"
        >
          ↑ للأعلى
        </button>
      )}
    </div>
  );
}