"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// ─── TYPES ───────────────────────────────────────────────
type DetailType = {
    pro_id: string;
    pro_name: string;
    ord_qt: number;
    ord_price: number;
    ord_total: number;
};

type PaymentType = {
    pay_total: number;
    pay_date: string;
    pay_note?: string;
};

type OrderType = {
    or_id: number;
    or_date: string;
    or_total: number;
    or_note?: string;
    or_cus_name?: string;
    or_cus_phone?: string;
    or_cus_phone2?: string;
    or_prepare_date?: string;
    or_date_reserve?: string;
    or_receipt_date?: string;
    or_vip: number;
    br_id: string;
    details: DetailType[];
    payments: PaymentType[];
};

type BranchType = {
    br_name: string;
    br_header?: string;
    br_phone?: string;
    br_address?: string;
};

// ─── HELPERS ─────────────────────────────────────────────
const fmtDate = (val?: string | null) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("ar-IQ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

const fmtDateTime = (val?: string | null) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleString("ar-IQ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

// ─── COMPONENT ───────────────────────────────────────────
export default function PrintOrderPage() {
    const params = useParams();
    const orderId = params?.or_id as string;

    const [order, setOrder] = useState<OrderType | null>(null);
    const [branch, setBranch] = useState<BranchType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
      const router = useRouter();

    // ── FETCH ──
    useEffect(() => {
        if (!orderId) {
            setError("لم يتم تحديد رقم الطلب");
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const orderRes = await fetch(`/api/order/${orderId}`).then((r) => r.json());
                if (!orderRes.success) {
                    setError(orderRes.message || "فشل تحميل الطلب");
                    setLoading(false);
                    return;
                }

                const o: OrderType = orderRes.order;
                // Normalise details/payments — support both nested and top-level
                o.details = orderRes.details ?? o.details ?? [];
                o.payments = orderRes.payments ?? o.payments ?? [];
                setOrder(o);

                const brRes = await fetch(`/api/branch/${o.br_id}`).then((r) => r.json());
                if (brRes.success) setBranch(brRes.branch);
            } catch {
                setError("خطأ في السيرفر");
            } finally {
                setLoading(false);
            }
        })();
    }, [orderId]);

    // ── AUTO PRINT ──
    // useEffect(() => {
    //     if (!loading && order) {
    //         const t = setTimeout(() => window.print(), 700);
    //         return () => clearTimeout(t);
    //     }
    // }, [loading, order]);

    // ── DERIVED ──
    // ── DERIVED ──
const totalPaid = Number((order as any)?.paid_total ?? 0);

const remaining = Number((order as any)?.remaining ?? 0);
    // ── STATES ──
    if (loading)
        return (
            <div className="state-screen">
                <div className="spinner-ring" />
                <span>جاري التحميل…</span>
            </div>
        );

    if (error || !order)
        return (
            <div className="state-screen error">
                ⚠️ {error || "لم يتم العثور على الطلب"}
            </div>
        );

    return (
        <>
            <style>{css}</style>

            {/* ── SCREEN TOOLBAR (hidden on print) ── */}
            <div className="toolbar no-print">
                <div className="toolbar-inner">
                    <span className="toolbar-id">وصل رقم #{order.or_id}</span>
                    <div className="toolbar-actions">
                        <button className="btn-print" onClick={() => window.print()}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                            </svg>
                            طباعة
                        </button>
                        <button className="btn-close" onClick={() => router.back()}>✕ إغلاق</button>
                    </div>
                </div>
            </div>

            {/* ── A5 RECEIPT ── */}
            <div className="a5-page" dir="rtl">

                {/* BRANCH BANNER */}
                {branch?.br_header ? (
                    <div className="banner-wrap">
                        <img src={branch.br_header} alt={branch.br_name} className="banner-img" />
                    </div>
                ) : (
                    <div className="banner-placeholder">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>{branch?.br_name || "المحل"}</span>
                    </div>
                )}

                {/* META BAR */}
                <div className="meta-bar">
                    <div className="meta-item">
                        <span className="meta-lbl">رقم الوصل :</span>
                        <span className="meta-val bold-l">{order.or_id}</span>
                    </div>
                    <div className="meta-center">
                        {order.or_vip ? <span className="vip-pill">👑 VIP</span> : null}
                    </div>

                </div>

                <div className="hr-dash" />





                {/* CUSTOMER + DATES */}
                <div className="info-grid">

                    <div className="info-block">

                        <div className="info-row">
                            <span className="ikey">السيد :</span>
                            <span className="ival name">{order.or_cus_name || "—"}</span>
                        </div>
                        {order.or_cus_phone && (
                            <div className="info-row">
                                <span className="ikey">هاتف 1 :</span>
                                <span className="ival">{order.or_cus_phone}</span>
                            </div>
                        )}
                        {order.or_cus_phone2 && (
                            <div className="info-row">
                                <span className="ikey">هاتف 2 :</span>
                                <span className="ival">{order.or_cus_phone2}</span>
                            </div>
                        )}
                    </div>

                    <div className="info-block dates-block">
                        {order.or_date && (
                            <div className="info-row">
                                <span className="ikey">تاريخ الطلب :</span>
                                <span className="ival">{fmtDateTime(order.or_date)}</span>
                            </div>
                        )}
                        {order.or_date_reserve && (
                            <div className="info-row">
                                <span className="ikey">تاريخ الحجز :</span>
                                <span className="ival">{fmtDate(order.or_date_reserve)}</span>
                            </div>
                        )}
                        {order.or_date_reserve && (
                            <div className="info-row">
                                <span className="ikey">تاريخ استرجاع :</span>
                                <span className="ival">
                                    {order.or_date_reserve
                                        ? (() => {
                                            const d = new Date(order.or_date_reserve);
                                            d.setDate(d.getDate() + 1);
                                            return fmtDate(d.toISOString());
                                        })()
                                        : "—"}
                                </span>
                            </div>
                        )}

                    </div>

                </div>

                <div className="hr-dash" />

                {/* ORDER DETAILS TABLE */}
                <div className="sec-title" style={{ margin: "4px 0" }}>تفاصيل الطلب</div>
                <table className="tbl">
                    <thead>
                        <tr>
                            <th className="th-c th-sm">#</th>
                            <th className="th-r">المنتج</th>
                            <th className="th-c">السعر</th>
                            <th className="th-c">الكمية</th>
                            <th className="th-c">المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.details.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="td-empty">لا توجد منتجات</td>
                            </tr>
                        ) : (
                            order.details.map((d, i) => (
                                <tr key={i} className={i % 2 === 0 ? "tr-even" : ""}>
                                    <td className="td-c td-muted">{i + 1}</td>
                                    <td className="td-r td-bold">{d.pro_name}</td>
                                    <td className="td-c">{Number(d.ord_price).toLocaleString()}</td>
                                    <td className="td-c">{d.ord_qt}</td>
                                    <td className="td-c td-bold">{Number(d.ord_total).toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="hr-dash" style={{ marginTop: 16 }} />

                {/* TOTALS */}
                <div className="totals-wrap">
                    <div className="total-line">
                        <span className="tkey">الإجمالي :</span>
                        <span className="tval">{Number(order.or_total).toLocaleString()} دينار</span>
                    </div >
                    <div className="hr-dash" style={{ margin: "0px 0" }} />

                    <div className="total-line">
                        <span className="tkey">واصــــــل : </span>
                        <span className="tval green">{Number(totalPaid).toLocaleString()} دينار</span>
                    </div>
                    <div className="hr-dash" style={{ margin: "0px 0" }} />
                    <div className="total-line">
                        <span className="tkey tkey-lg">المتبقي : </span>
                        <span className="tval tval-lg red">{Number(remaining).toLocaleString()} دينار</span>
                    </div>
                </div>


                {/* NOTES */}
                {order.or_note && (
                    <>
                    <div className="hr-dash" />
                    <div style={{ marginTop: "10px" }}>
                        
                        <div className="sec-title">ملاحظات</div>
                        <p className="note-txt">{order.or_note}</p>
                        </div>
                    </>
                    
                )}

                {/* POLICY */}
                <div className="hr-dash" />
                <div className="policy">
                    <p>* يتم استلام البدلة بعد الساعة الرابعة عصراً وإعادتها قبل العاشرة والنصف صباح اليوم الثاني.</p>
                    <p>* العربون لا يرجع لأي سبب كان.</p>
                    <p>* عند إتلاف البدلة أو تمزيقها تغرم قيمة البدلة كاملة.</p>
                    <p>* يجب جلب البطاقة التموينية وبطاقة السكن وتسديد المتبقي إن وجد.</p>
                    <p>* يتم دفع نصف المبلغ كعربون والباقي عند الاستلام.</p>
                </div>

                {/* SIGNATURES */}

                <div className="sig-box">
                    <div className="sig-line" />
                    <span className="sig-lbl">توقيع </span>
                </div>
            </div>
        </>
    );
}

// ─── CSS ─────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  font-family: 'Tajawal', sans-serif;
  background: #d1d5db;
  color: #111827;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── LOADING / ERROR ── */
.state-screen {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 12px; height: 100vh;
  font-size: 14px; color: #6b7280;
  font-family: 'Tajawal', sans-serif;
}
.state-screen.error { color: #dc2626; }
.spinner-ring {
  width: 28px; height: 28px;
  border: 3px solid #e5e7eb;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── SCREEN TOOLBAR ── */
.toolbar {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 20px;
  position: sticky; top: 0; z-index: 99;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.toolbar-inner {
  max-width: 600px; margin: 0 auto;
  display: flex; align-items: center;
  justify-content: space-between; gap: 12px;
}
.toolbar-id {
  font-size: 13px; font-weight: 700; color: #374151;
  background: #f3f4f6; padding: 4px 12px;
  border-radius: 20px; border: 1px solid #e5e7eb;
}
.toolbar-actions { display: flex; gap: 8px; }
.btn-print {
  display: flex; align-items: center; gap: 6px;
  background: #111827; color: #fff;
  border: none; border-radius: 8px;
  padding: 8px 18px; font-size: 13px; font-weight: 700;
  font-family: 'Tajawal', sans-serif;
  cursor: pointer; transition: background 0.15s;
}
.btn-print:hover { background: #374151; }
.btn-close {
  background: #f9fafb; color: #374151;
  border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 8px 14px; font-size: 13px; font-weight: 600;
  font-family: 'Tajawal', sans-serif;
  cursor: pointer; transition: background 0.15s;
}
.btn-close:hover { background: #e5e7eb; }

/* ── A5 PAGE ── */
.a5-page {
  width: 148mm;
  min-height: 210mm;
  background: #fff;
  margin: 20px auto 40px;
  border-radius: 3px;
  box-shadow: 0 6px 32px rgba(0,0,0,0.18);
  overflow: hidden;
  border: 1px solid #e5e7eb;
  font-size: 10.5px;
  line-height: 1.5;

  /* --- ADD THESE --- */
  padding-left: 4mm;   /* Equal space on left */
  padding-right: 4mm;  /* Equal space on right */
  box-sizing: border-box; /* Crucial: keeps width at exactly 148mm */
}

/* BANNER */
.banner-wrap {
  width: 100%; max-height: 170px;
  overflow: hidden; border-bottom: 1px solid #f3f4f6;
}
.banner-img { width: 100%; object-fit: cover; display: block; }
.banner-placeholder {
  width: 100%; height: 44px; background: #f9fafb;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 11px; color: #9ca3af;
}

/* META BAR */
.meta-bar {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 7px 14px 5px; background: #fafafa;
}
.meta-item { display: flex; flex-direction: row; align-items: center; gap: 6px; }
.meta-item-left { align-items: flex-end; }
.meta-center { display: flex; align-items: center; }
.meta-lbl { font-size: 12px; color: #9ca3af; font-weight: 600; letter-spacing: 0.04em; }
.meta-val { font-size: 11px; color: #111827; font-weight: 600; }
.bold-xl { font-size: 15px !important; font-weight: 800 !important; }

.vip-pill {
  background: #fef3c7; border: 1px solid #fcd34d;
  color: #92400e; font-size: 9px; font-weight: 800;
  padding: 2px 10px; border-radius: 999px; letter-spacing: 0.04em;
}

/* DIVIDER */
.hr-dash {
  border: none; border-top: 1px dashed #d1d5db;
  margin: 0 14px;
}

/* INFO GRID */
.info-grid {
  display: grid; grid-template-columns: 2fr 1fr;
  padding: 8px 14px; gap: 12px; background: #fafafa;
}
.info-block { display: flex; flex-direction: column; gap: 5px; }
.dates-block { border-right: 1px dashed #e5e7eb; padding-right: 12px;  padding-left: 8px;}
.block-title {
  font-size: 14px; font-weight: 800; color: #9ca3af;
  letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 2px;
}
.info-row { display: flex; gap: 4px; align-items: center; }

.ikey {
  font-size: 12px; color: #6b7280; font-weight: 700;
  white-space: nowrap; min-width: 70px; flex-shrink: 0;
}
.ival { font-size: 12px; color: #111827; font-weight: 600; }
.ival.name { font-size: 12px; font-weight: 800; }

/* SECTION TITLE */
.sec-title {
  font-size: 14px; font-weight: 800; color: #cf4343;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 6px 14px 3px;
}

/* TABLE */
.tbl { width: 100%; border-collapse: collapse; }
.tbl thead tr { background: #ec1cad; }
.tbl th {
  padding: 5px 10px; font-size: 12px; font-weight: 700;
  color: #ffffff; text-align: center;
  border-top: 1.5px solid #e5e7eb;
  border-bottom: 1.5px solid #e5e7eb;
  letter-spacing: 0.04em;
}
.tbl td {
  padding: 5px 10px; font-size: 12px; color: #111827;
  border-bottom: 1px solid #f3f4f6; vertical-align: middle;
}
.th-c { text-align: center !important; }
.th-r { text-align: right !important; }
.th-sm { width: 24px; }
.td-c { text-align: center; }
.td-r { text-align: right; }
.td-bold { font-weight: 700; }
.td-muted { color: #9ca3af; }
.td-empty { text-align: center; padding: 14px; color: #9ca3af; font-size: 10px; }
.tr-even td { background: #bbb6b6; }
.green { color: #16a34a !important; }
.red { color: #dc2626 !important; }

/* TOTALS */
.totals-wrap {
  padding: 7px 14px 6px;
  display: flex; flex-direction: column; gap: 5px;
}
.total-line { display: flex; align-items: center; gap: 4px; }
.tkey { font-size: 11px; color: #374151; font-weight: 600; white-space: nowrap; }
.tkey-lg { font-size: 12px !important; font-weight: 800 !important; }
.tdots {
  flex: 1; border-bottom: 1px dotted #d1d5db;
  margin: 0 4px 2px; min-width: 20px;
}
.tval { font-size: 11px; color: #111827; font-weight: 700; white-space: nowrap; }
.tval-lg { font-size: 14px !important; font-weight: 800 !important; }

/* NOTE */
.note-txt {
  padding: 4px 14px 8px;
  font-size: 10px; color: #374151; line-height: 1.7;
}

/* POLICY */
.policy { padding: 5px 14px 8px; }
.policy p { font-size: 9px; color: #6b7280; line-height: 1.9; }

/* SIGNATURES */
.sig-row {
  display: flex; justify-content: space-between;
  padding: 10px 24px 16px; gap: 24px;
}
.sig-box{
    width:220px;
    text-align:center;
    margin-right:auto; /* move to left side */
}
.sig-line { width: 100%; height: 1px; background: #d1d5db; }
.sig-lbl { font-size: ١٢px; color: #020711; font-weight: 600; }

/* ── PRINT ── */
@media print {
  @page {
    size: A5 portrait;
    margin: 0mm;
  }

  html, body {
    background: #fff !important;
    width: 148mm;
  }

  .no-print { display: none !important; }

  .a5-page {
    width: 148mm !important;
    min-height: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
  }

  .hr-dash { border-top-color: #bbb !important; }
  .tr-even td { background: #f7f7f7 !important; }
  .tbl thead tr { background: #efefef !important; }
  .info-grid, .meta-bar, .banner-placeholder { background: #f9f9f9 !important; }
}

/* scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
`;