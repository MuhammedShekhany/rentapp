"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type OrderType = {
  or_id: number;
  or_total: number;
  or_cus_name: string;
  or_cus_phone: string;
  br_name: string;
  user_name: string;
  br_id: string;
  user_id: string;
  paid_total: number;
  remaining: number;
};

type PaymentType = {
  pay_id: number;
  pay_total: number;
  pay_date: string;
  pay_detail: string;
};

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const or_id = params.or_id as string;

  const today = new Date().toISOString().split("T")[0];

  const [order, setOrder] = useState<OrderType | null>(null);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [newPayment, setNewPayment] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState("");
  const [payDate, setPayDate] = useState(today);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  // ======================
  // LOAD DATA (ORDER + PAYMENTS)
  // ======================
  const loadData = async () => {
    if (!or_id) return;

    try {
      setPageLoading(true);

      const session = localStorage.getItem("userSession");
      if (!session) {
        router.push("/login");
        return;
      }

      const [orderRes, paymentRes] = await Promise.all([
        fetch(`/api/order/${or_id}`),
        fetch(`/api/payment?or_id=${or_id}`),
      ]);

      const orderData = await orderRes.json();
      const paymentData = await paymentRes.json();

      if (orderData.success) {
        setOrder(orderData.order);
      } else {
        alert(orderData.message || "فشل تحميل الطلب");
      }

      if (paymentData.success) {
        setPayments(paymentData.payments || []);
      }

    } catch (err) {
      console.error(err);
      alert("فشل تحميل البيانات");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.push("/login");
      return;
    }

    loadData();
  }, [or_id]);

  // ======================
  // CALCULATIONS
  // ======================
  const totalPaid = payments.reduce(
    (sum, p) => sum + Number(p.pay_total || 0),
    0
  );

  const remaining = Number(order?.or_total || 0) - totalPaid;

  // ======================
  // SAVE PAYMENT
  // ======================
  const handleSavePayment = async () => {
    if (!newPayment || newPayment <= 0)
      return alert("أدخل مبلغ صحيح");

    if (!order) return alert("لم يتم تحميل الطلب");

    if (!editId && newPayment > remaining)
      return alert("المبلغ أكبر من المتبقي");

    const session = localStorage.getItem("userSession");
    if (!session) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(session);
    setLoading(true);

    try {
      let res;

      if (editId) {
        res = await fetch(`/api/payment/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pay_total: newPayment,
            pay_detail: paymentNote,
            pay_date: payDate,
          }),
        });
      } else {
        res = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            or_id: order.or_id,
            pay_total: newPayment,
            pay_detail: paymentNote,
            pay_date: payDate,
            br_id: user.br_id,
            user_id: user.user_id,
          }),
        });
      }

      const data = await res.json();
      if (!data.success) return alert(data.message || "فشل العملية");

      setNewPayment(0);
      setPaymentNote("");
      setPayDate(today);
      setEditId(null);

      loadData();
    } catch (err) {
      console.error(err);
      alert("خطأ في السيرفر");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: PaymentType) => {
    setEditId(p.pay_id);
    setNewPayment(p.pay_total);
    setPaymentNote(p.pay_detail);
    setPayDate(p.pay_date?.split("T")[0] || today);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;

    try {
      const res = await fetch(`/api/payment/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!data.success) return alert(data.message || "فشل الحذف");

      loadData();
    } catch (err) {
      console.error(err);
      alert("خطأ في السيرفر");
    }
  };

  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleDateString("en-GB") : "-";

  // ======================
  // LOADING UI
  // ======================
  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        جارٍ التحميل...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-red-600">الطلب غير موجود</div>
        <button
          onClick={() => router.back()}
          className="bg-gray-800 text-white px-5 py-2 rounded-lg"
        >
          رجوع
        </button>
      </div>
    );
  }

  // ======================
  // UI
  // ======================
  return (
    <div className="min-h-screen bg-gray-100 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مدفوعات الطلب</h1>
            <p>إدارة مدفوعات الطلب #{order.or_id}</p>
          </div>

          <button
            onClick={() => router.back()}
            className="bg-gray-800 text-white px-5 py-3 rounded-xl"
          >
            ← رجوع
          </button>
        </div>

        {/* Summary */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl">
            <div>مجموع الطلب</div>
            <div className="text-2xl font-bold">
              {formatNumber(order.or_total)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl">
            <div>المدفوع</div>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(totalPaid)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl">
            <div>المتبقي</div>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(remaining)}
            </div>
          </div>
        </div>

        {/* Add Payment */}
        <div className="bg-white p-6 rounded-xl space-y-4">
          <h2>{editId ? "تعديل الدفع" : "إضافة دفعة"}</h2>

          <input
            type="text"
            placeholder="المبلغ"
            value={newPayment ? newPayment.toLocaleString("en-US") : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (!isNaN(Number(raw))) {
                setNewPayment(Number(raw));
              }
            }}
            className="border p-3 rounded w-full"
          />

          <input
            placeholder="ملاحظة"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            className="border p-3 rounded w-full"
          />

          <input
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            className="border p-3 rounded w-full"
          />

          <button
            onClick={handleSavePayment}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl w-full"
          >
            {loading ? "جارٍ الحفظ..." : editId ? "تحديث" : "إضافة"}
          </button>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl overflow-hidden">
          <table className="w-full text-right">
              <thead className="sticky top-0 z-20 bg-gray-50 border-b">
              <tr>
                <th className="p-3">رقم</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">ملاحظة</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p) => (
                <tr key={p.pay_id} className="border-t">
                  <td className="p-3">{p.pay_id}</td>
                  <td className="p-3 text-green-600">
                    {formatNumber(p.pay_total)}
                  </td>
                  <td className="p-3">{formatDate(p.pay_date)}</td>
                  <td className="p-3">{p.pay_detail}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(p.pay_id)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}