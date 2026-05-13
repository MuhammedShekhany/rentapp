"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowRight, Crown, Phone, Calendar, Clock3 } from "lucide-react";

type OrderType = {
  or_id: number;
  or_date: string;
  or_total: number;

  or_cus_name: string;
  or_cus_phone: string;
  or_cus_phone2?: string;

  or_note: string;

  or_prepare_date?: string;
  or_date_reserve?: string;

  or_vip?: number;

  or_gat_name?: string;

  br_name?: string;
  br_header?: string;
};

type DetailType = {
  ord_id: number;
  pro_name: string;
  ord_qt: number;
  ord_price: number;
  ord_total: number;
};

type PaymentType = {
  pay_id: number;
  pay_total: number;
  pay_date: string;
  pay_detail: string;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

export default function PrintOrderPage() {
  const params = useParams();
  const router = useRouter();
  const or_id = params.or_id as string;

  const [order, setOrder] = useState<OrderType | null>(null);
  const [details, setDetails] = useState<DetailType[]>([]);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/order/${or_id}`);
      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
        setDetails(data.details || []);
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.error(e);
      alert("خطأ في السيرفر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (or_id) loadData();
  }, [or_id]);

  const totalPaid = payments.reduce(
    (sum, p) => sum + Number(p.pay_total || 0),
    0
  );

  const remaining = Number(order?.or_total || 0) - totalPaid;

  if (loading) {
    return <div className="p-10 text-center">جارٍ التحميل...</div>;
  }

  if (!order) {
    return (
      <div className="p-10 text-center text-red-600">
        لم يتم العثور على الطلب
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @page {
          size: A5 portrait;
          margin: 8mm;
        }

        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          .card {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 p-4" dir="rtl">

        {/* BUTTONS */}
        <div className="no-print flex gap-3 mb-4">

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl"
          >
            <Printer size={18} />
            طباعة
          </button>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white border px-5 py-3 rounded-xl"
          >
            <ArrowRight size={18} />
            رجوع
          </button>

        </div>


        

        {/* CARD */}
        <div className="card max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">

{order.br_header && (
    <div className="mb-2 flex justify-center">
      <img
        src={order.br_header}
        alt="branch header"
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
  )}


          

          {/* HEADER */}
          <div className="border-b pb-4 mb-2 relative min-h-[40px]">

  {/* Left */}
  <div className="absolute right-0 top-1/2 -translate-y-1/2">
    <h1 className="text-[16px] font-bold">
      رقم وصل : {order.or_id}
    </h1>
  </div>

  {/* Center VIP */}
  {Number(order.or_vip) === 1 && (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="inline-flex items-center gap-1 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
        <Crown size={14} />
        VIP
      </div>
    </div>
  )}

  {/* Right */}
  <div className="absolute left-0 top-1/2 -translate-y-1/2">
    <b>{order.or_gat_name || "-"}</b>
  </div>

</div>
          {/* INFO */}
          <div className="flex justify-between items-start gap-4 c leading-5 mb-1">

            {/* RIGHT SIDE */}
            <div>
              <div>
                <b>الســـيد : </b> {order.or_cus_name}
              </div>

              <div>
                <b>الهاتف : </b> {order.or_cus_phone} - {order.or_cus_phone2}
              </div>
            </div>

            {/* LEFT SIDE */}
            <div className="text-left">

              <div>
                {formatDate(order.or_date)}
              </div>

              <div>
                <b>تاريخ التحضير :  </b>{" "}
                {order.or_prepare_date
                  ? new Date(order.or_prepare_date)
                    .toISOString()
                    .split("T")[0]
                  : "-"}
              </div>

              <div>
                <b>تاريخ الحجــــز :  </b>{" "}
                {order.or_date_reserve
                  ? new Date(order.or_date_reserve)
                    .toISOString()
                    .split("T")[0]
                  : "-"}
              </div>

            </div>

          </div>
          {/* DETAILS */}
          <div className=" mb-1">

  <h2 className=" bg-red-50 text-[16px] font-black text-gray-800 ">
    تفاصيل الطلب
  </h2>

</div>

          <table className="w-full text-sm border mb-2">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">المنتج</th>
                <th className="p-2 border">الكمية</th>
                <th className="p-2 border">المجموع</th>
              </tr>
            </thead>

            <tbody>
              {details.map((d) => (
                <tr key={d.ord_id}>
                  <td className="p-2 border">{d.pro_name}</td>
                  <td className="p-2 border text-center">{d.ord_qt}</td>
                  <td className="p-2 border text-center">
                    {Number(d.ord_total).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* NOTE */}
          {order.or_note && (
            <div className="mb-2 ">
              <h2 className="font-bold mb-2">ملاحظات</h2>
              <div className="bg-red-50 border p-3">
                {order.or_note}
              </div>
            </div>
          )}


          {/* TOTALS */}
          <div className="border-t pt-2 text-sm">

            <div className="text-black-600 font-bold text-[16px]">
              <span>الإجمالي : </span>
              <span>{Number(order.or_total).toLocaleString()}</span>
              <span>  دينار </span>
            </div>

            <div className="text-green-600 font-bold text-[16px]">
              
              <span>واصــــل : </span>
              <span>{totalPaid.toLocaleString()}</span>
              <span>  دينار </span>
            </div>

            <div className="text-red-600 font-bold text-[16px]">
              <span>المتبقـي : </span>
              <span>{remaining.toLocaleString()}</span>
              <span>  دينار </span>
            </div>

          </div>


          {/* TERMS (NEW - COMPACT) */}
          <div className="mb-1">
            <h2 className="font-bold mb-1 bg-blue-50 text-[14px]">ملاحظات</h2>

            

            <div className=" rounded-lg text-[12px] leading-5 space-y-1">



      

              <p>
             * يتم استلام البدلة بعد الساعة الرابعة عصراً وإعادتها قبل العاشرة والنصف صباح اليوم الثاني . 
              </p>

              <p>
               * العربون لا يرجع لأي سبب كان .
              </p>

              <p>
               * عند إتلاف البدلة أو تمزيقها تغرم قيمة البدلة كاملة .
              </p>

              <p>
               * يجب جلب البطاقة التموينية وبطاقة السكن وتسديد المتبقي إن وجد .
              </p>

              <p>
               * يتم دفع نصف المبلغ كعربون والباقي عند الاستلام .
              </p>

            </div>
          </div>


        </div>
      </div>
    </>
  );
}