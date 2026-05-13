"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ProductType = {
  pro_id: string;
  pro_name: string;
  pro_price: number;
};

type DetailType = {
  pro_id: string;
  pro_name: string;
  ord_qt: number;
  ord_price: number;
  ord_total: number;
};

type GatType = {
  or_gat_id: string;
  or_gat_name: string;
};

export default function AddOrderPage() {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);

  const [or_date, setOrDate] = useState(new Date().toISOString().split("T")[0]);
  const [or_note, setOrNote] = useState("");
  const [or_cus_name, setOrCusName] = useState("");
  const [or_cus_phone, setOrCusPhone] = useState("");
  const [or_cus_phone2, setOrCusPhone2] = useState("");
  const [or_delivery] = useState("0");
  const [or_receipt] = useState("0");
  const [or_preparing] = useState("0");
  const [or_prepare_date, setOrPrepareDate] = useState("");
  const [or_date_reserve, setOrDateReserve] = useState("");
  const [or_vip, setOrVip] = useState(false);
  const [or_gat_id, setOrGatId] = useState("");
  const [br_id, setBrId] = useState("");
  const [user_id, setUserId] = useState("");

  const [products, setProducts] = useState<ProductType[]>([]);
  const [gats, setGats] = useState<GatType[]>([]);

  const [inlineSearch, setInlineSearch] = useState("");
  const [showInlineList, setShowInlineList] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [details, setDetails] = useState<DetailType[]>([]);
  const [loading, setLoading] = useState(false);

  // ── load session + products + gats ──
  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) return router.push("/login");
    const user = JSON.parse(session);
    setUserId(user.user_id);
    setBrId(user.br_id);

    fetch("/api/product")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.product); })
      .catch(console.error);

    fetch("/api/order/or_gat")
      .then((r) => r.json())
      .then((d) => { if (d.success) setGats(d.gats); })
      .catch(console.error);
  }, [router]);

  // ── close inline dropdown on outside click ──
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (inlineRef.current && !inlineRef.current.contains(e.target as Node))
        setShowInlineList(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── close modal on outside click ──
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
        setModalSearch("");
      }
    };
    if (showModal) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showModal]);

  // ── lock body scroll when modal open ──
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  const inlineFiltered = useMemo(() => {
    if (!inlineSearch.trim()) return products;
    return products.filter((p) =>
      p.pro_name.toLowerCase().includes(inlineSearch.toLowerCase())
    );
  }, [inlineSearch, products]);

  const modalFiltered = useMemo(() => {
    if (!modalSearch.trim()) return products;
    return products.filter((p) =>
      p.pro_name.toLowerCase().includes(modalSearch.toLowerCase())
    );
  }, [modalSearch, products]);

  const addProduct = (product: ProductType, fromModal = false) => {
    setDetails((prev) => {
      const exist = prev.find((d) => d.pro_id === product.pro_id);
      if (exist) {
        return prev.map((d) =>
          d.pro_id === product.pro_id
            ? { ...d, ord_qt: d.ord_qt + 1, ord_total: (d.ord_qt + 1) * d.ord_price }
            : d
        );
      }
      return [...prev, {
        pro_id: product.pro_id,
        pro_name: product.pro_name,
        ord_qt: 1,
        ord_price: Number(product.pro_price),
        ord_total: Number(product.pro_price),
      }];
    });
    if (fromModal) { setShowModal(false); setModalSearch(""); }
    else { setInlineSearch(""); setShowInlineList(false); }
  };

  const removeProduct = (pro_id: string) =>
    setDetails((prev) => prev.filter((d) => d.pro_id !== pro_id));

  const updateQty = (index: number, value: number) => {
    const qty = Math.max(1, value || 1);
    setDetails((prev) =>
      prev.map((d, i) => i === index ? { ...d, ord_qt: qty, ord_total: qty * d.ord_price } : d)
    );
  };

  const total = details.reduce((sum, item) => sum + Number(item.ord_total || 0), 0);

  const handleSave = async () => {
    if (!or_date || !user_id || !br_id || details.length === 0)
      return alert("يرجى تعبئة جميع الحقول وإضافة منتج واحد على الأقل");
    setLoading(true);
    try {
      const now = new Date();
      const time = now.toTimeString().split(" ")[0];
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          or_date: `${or_date} ${time}`,
          or_total: total,
          or_delivery, or_receipt, or_preparing,
          or_note, or_cus_name, or_cus_phone,
          or_cus_phone2,
          or_prepare_date: or_prepare_date || null,
          or_date_reserve: or_date_reserve || null,
          or_vip: or_vip ? 1 : 0,
          or_gat_id: or_gat_id || null,
          br_id, user_id, details,
        }),
      });
      const data = await res.json();
      if (data.success) { alert("تم حفظ الطلب بنجاح"); router.push("/br_admin/order"); }
      else alert(data.message || "فشل الحفظ");
    } catch (err) {
      console.error(err);
      alert("خطأ في السيرفر");
    } finally {
      setLoading(false);
    }
  };

  const s = styles;

  return (
    <div style={s.page} dir="rtl">
      <style>{globalStyles}</style>

      {/* ── HEADER ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div>
            <p style={s.headerSub}>إدارة المبيعات</p>
            <h1 style={s.headerTitle}>إضافة طلب جديد</h1>
          </div>
          <div style={s.dateBadge}>
            {new Date().toLocaleDateString("ar-IQ", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </div>
        </div>
      </header>

      <div style={s.body}>

        {/* ── CUSTOMER INFO ── */}
        <section style={s.card}>
          <div style={s.cardHeader}>
            <div style={{ ...s.iconBox, background: "#e0f2fe" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <h2 style={s.cardTitle}>معلومات الزبون</h2>
          </div>
          <div style={s.grid4}>
            <div style={s.fieldGroup}>
              <label style={s.label}>اسم الزبون</label>
              <input placeholder="أدخل اسم الزبون" value={or_cus_name} onChange={(e) => setOrCusName(e.target.value)} style={s.input} className="inp" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>رقم الهاتف</label>
              <input placeholder="07xx-xxx-xxxx" value={or_cus_phone} onChange={(e) => setOrCusPhone(e.target.value)} style={s.input} className="inp" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>رقم الهاتف 2</label>
              <input placeholder="07xx-xxx-xxxx" value={or_cus_phone2} onChange={(e) => setOrCusPhone2(e.target.value)} style={s.input} className="inp" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>تاريخ الطلب</label>
              <input type="date" value={or_date} onChange={(e) => setOrDate(e.target.value)} style={s.input} className="inp" />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>ملاحظة</label>
              <textarea
                placeholder="ملاحظات اختيارية..."
                value={or_note}
                onChange={(e) => setOrNote(e.target.value)}
                style={{
                  ...s.input,
                  minHeight: "90px",
                  resize: "vertical",
                  paddingTop: "12px",
                  lineHeight: "1.7",
                }}
                className="inp"
              />
            </div>
          </div>
        </section>

        {/* ── EXTRA INFO ── */}
        <section style={s.card}>
          <div style={s.cardHeader}>
            <div style={{ ...s.iconBox, background: "#f3e8ff" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={s.cardTitle}>معلومات إضافية</h2>
          </div>

          <div style={s.grid4}>

            {/* or_prepare_date */}
            <div style={s.fieldGroup}>
              <label style={s.label}>تاريخ التحضير</label>
              <input
                type="date"
                value={or_prepare_date}
                onChange={(e) => setOrPrepareDate(e.target.value)}
                style={s.input}
                className="inp"
              />
            </div>

            {/* or_date_reserve */}
            <div style={s.fieldGroup}>
              <label style={s.label}>تاريخ الحجز</label>
              <input
                type="date"
                value={or_date_reserve}
                onChange={(e) => setOrDateReserve(e.target.value)}
                style={s.input}
                className="inp"
              />
            </div>

            {/* or_gat_id dropdown */}
            <div style={s.fieldGroup}>
              <label style={s.label}>المجموعة (or_gat)</label>
              <select
                value={or_gat_id}
                onChange={(e) => setOrGatId(e.target.value)}
                style={s.select}
                className="inp"
              >
                <option value="">— اختر مجموعة —</option>
                {gats.map((g) => (
                  <option key={g.or_gat_id} value={g.or_gat_id}>
                    {g.or_gat_name}
                  </option>
                ))}
              </select>
            </div>

            {/* or_vip toggle */}
            <div style={s.fieldGroup}>
              <label style={s.label}>طلب VIP</label>
              <div
                onClick={() => setOrVip((v) => !v)}
                style={{
                  ...s.vipToggle,
                  background: or_vip ? "#0369a1" : "#f1f5f9",
                  border: or_vip ? "1.5px solid #0369a1" : "1.5px solid #e2e8f0",
                }}
                className="vip-toggle"
              >
                <div
                  style={{
                    ...s.vipKnob,
                    transform: or_vip ? "translateX(-26px)" : "translateX(0)",
                    background: or_vip ? "#fff" : "#cbd5e1",
                  }}
                />
                <span
                  style={{
                    ...s.vipLabel,
                    color: or_vip ? "#fff" : "#94a3b8",
                    marginRight: or_vip ? "8px" : "0",
                    marginLeft: or_vip ? "0" : "8px",
                  }}
                >
                  {or_vip ? "✦ VIP" : "عادي"}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* ── ORDER DETAILS ── */}
        <section style={s.card}>
          <div style={s.cardHeader}>
            <div style={{ ...s.iconBox, background: "#fef9c3" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#854d0e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h2 style={s.cardTitle}>تفاصيل الطلب</h2>
            {details.length > 0 && <span style={s.badge}>{details.length} منتج</span>}
          </div>

          {/* SEARCH ROW */}
          <div style={s.searchRow}>
            <div style={s.inlineSearchWrap} ref={inlineRef}>
              <svg style={s.inlineSearchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="ابحث وأضف منتجاً مباشرة..."
                value={inlineSearch}
                onChange={(e) => { setInlineSearch(e.target.value); setShowInlineList(true); }}
                onFocus={() => setShowInlineList(true)}
                style={s.inlineInput}
                className="inp"
              />
              {inlineSearch && (
                <button onClick={() => { setInlineSearch(""); setShowInlineList(false); }} style={s.inlineClear}>✕</button>
              )}
              {showInlineList && (
                <div style={s.inlineDropdown}>
                  {inlineFiltered.length === 0 ? (
                    <div style={s.dropNoResult}>لا توجد نتائج</div>
                  ) : (
                    inlineFiltered.map((p) => {
                      const inCart = details.find((d) => d.pro_id === p.pro_id);
                      return (
                        <div
                          key={p.pro_id}
                          onClick={() => addProduct(p, false)}
                          style={inCart ? { ...s.dropItem, ...s.dropItemActive } : s.dropItem}
                          className="drop-item"
                        >
                          <span style={s.dropName}>{p.pro_name}</span>
                          <div style={s.dropRight}>
                            {inCart && <span style={s.dropCartTag}>× {inCart.ord_qt}</span>}
                            <span style={s.dropPrice}>{Number(p.pro_price).toLocaleString()} IQD</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setShowModal(true)} style={s.addBtn} className="add-btn" title="عرض قائمة المنتجات">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              عرض الكل
            </button>
          </div>

          {/* TABLE */}
          {details.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyCircle}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <p style={s.emptyTitle}>لا توجد منتجات بعد</p>
              <p style={s.emptyHint}>ابحث في الحقل أعلاه أو اضغط "عرض الكل" لتصفح القائمة</p>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={{ ...s.th, textAlign: "right" }}>#</th>
                    <th style={{ ...s.th, textAlign: "right" }}>المنتج</th>
                    <th style={s.th}>الكمية</th>
                    <th style={s.th}>سعر الوحدة</th>
                    <th style={s.th}>المجموع</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => (
                    <tr key={d.pro_id} className="trow">
                      <td style={{ ...s.td, color: "#94a3b8", width: "40px", textAlign: "center" }}>{i + 1}</td>
                      <td style={{ ...s.td, fontWeight: 600, color: "#1e293b" }}>{d.pro_name}</td>
                      <td style={{ ...s.td, width: "140px" }}>
                        <div style={s.qtyRow}>
                          <button onClick={() => updateQty(i, d.ord_qt - 1)} style={s.qtyBtn} className="qty-btn">−</button>
                          <input
                            type="number" min={1} value={d.ord_qt}
                            onChange={(e) => updateQty(i, Number(e.target.value))}
                            style={s.qtyInput} className="inp"
                          />
                          <button onClick={() => updateQty(i, d.ord_qt + 1)} style={s.qtyBtn} className="qty-btn">+</button>
                        </div>
                      </td>
                      <td style={{ ...s.td, textAlign: "center", color: "#64748b" }}>
                        {Number(d.ord_price).toLocaleString()}
                      </td>
                      <td style={{ ...s.td, textAlign: "center", fontWeight: 700, color: "#0369a1" }}>
                        {Number(d.ord_total).toLocaleString()}
                      </td>
                      <td style={{ ...s.td, textAlign: "center", width: "50px" }}>
                        <button onClick={() => removeProduct(d.pro_id)} style={s.delBtn} className="del-btn">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={s.totalBar}>
                <div>
                  <p style={s.totalLabel}>المجموع الكلي</p>
                  <p style={s.totalSub}>
                    {details.reduce((sum, d) => sum + d.ord_qt, 0)} قطعة · {details.length} منتج
                  </p>
                </div>
                <div style={s.totalAmount}>
                  {Number(total).toLocaleString()}
                  <span style={s.totalCur}> IQD</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── ACTIONS ── */}
        <div style={s.actions}>
          <button onClick={handleSave} disabled={loading} style={s.btnSave} className="btn-save">
            {loading ? (
              <><span className="spinner" style={s.spinner} /> جاري الحفظ...</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                حفظ الطلب
              </>
            )}
          </button>
          <button onClick={() => router.push("/br_admin/order")} style={s.btnCancel} className="btn-cancel">
            إلغاء
          </button>
        </div>
      </div>

      {/* ══ PRODUCT PICKER MODAL ══ */}
      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal} ref={modalRef}>
            <div style={s.modalHeader}>
              <div>
                <h3 style={s.modalTitle}>قائمة المنتجات</h3>
                <p style={s.modalSub}>{products.length} منتج متاح</p>
              </div>
              <button
                onClick={() => { setShowModal(false); setModalSearch(""); }}
                style={s.modalClose}
                className="modal-close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={s.modalSearchWrap}>
              <svg style={s.modalSearchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                autoFocus
                placeholder="ابحث عن منتج..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                style={s.modalInput}
                className="inp"
              />
              {modalSearch && (
                <button onClick={() => setModalSearch("")} style={s.clearBtn}>✕</button>
              )}
            </div>
            <div style={s.productGrid}>
              {modalFiltered.length === 0 ? (
                <div style={s.noResult}>
                  <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>لا توجد نتائج</p>
                </div>
              ) : (
                modalFiltered.map((p) => {
                  const inCart = details.find((d) => d.pro_id === p.pro_id);
                  return (
                    <div
                      key={p.pro_id}
                      onClick={() => addProduct(p, true)}
                      style={inCart ? { ...s.productCard, ...s.productCardActive } : s.productCard}
                      className="product-card"
                    >
                      <div style={{ ...s.productIconWrap, background: inCart ? "#e0f2fe" : "#f1f5f9" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                          stroke={inCart ? "#0369a1" : "#94a3b8"} strokeWidth="1.5" strokeLinecap="round">
                          <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                          <polyline points="16 3 12 7 8 3" />
                        </svg>
                      </div>
                      <p style={{ ...s.productName, color: inCart ? "#0369a1" : "#1e293b" }}>{p.pro_name}</p>
                      <p style={s.productPrice}>{Number(p.pro_price).toLocaleString()} IQD</p>
                      {inCart && <div style={s.inCartBadge}>✓ في السلة ({inCart.ord_qt})</div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", backgroundColor: "#f0f4f8", fontFamily: "'Tajawal','Cairo',sans-serif", color: "#1e293b" },

  header: { background: "#fff", borderBottom: "1px solid #e8edf2", padding: "20px 32px", position: "sticky" as const, top: 0, zIndex: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" },
  headerInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" },
  headerSub: { fontSize: "11px", color: "#0369a1", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, margin: "0 0 4px" },
  headerTitle: { fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 },
  dateBadge: { background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1", padding: "7px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500 },

  body: { maxWidth: "1200px", margin: "0 auto", padding: "28px 32px", display: "flex", flexDirection: "column" as const, gap: "18px" },

  card: { background: "#fff", border: "1px solid #e8edf2", borderRadius: "14px", padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  cardHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" },
  iconBox: { width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardTitle: { fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: 0, flex: 1 },
  badge: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },

  searchRow: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" },

  inlineSearchWrap: { position: "relative" as const, flex: 1 },
  inlineSearchIcon: { position: "absolute" as const, right: "13px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const },
  inlineInput: { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "11px 38px 11px 36px", fontSize: "14px", color: "#1e293b", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit", transition: "all 0.18s" },
  inlineClear: { position: "absolute" as const, left: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px", padding: "3px 6px", borderRadius: "4px" },

  inlineDropdown: { position: "absolute" as const, top: "calc(100% + 5px)", right: 0, left: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", maxHeight: "240px", overflowY: "auto" as const, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" },
  dropItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", cursor: "pointer", borderBottom: "1px solid #f8fafc", transition: "background 0.14s" },
  dropItemActive: { background: "#f0f9ff" },
  dropName: { fontSize: "14px", fontWeight: 500, color: "#1e293b" },
  dropRight: { display: "flex", alignItems: "center", gap: "8px" },
  dropCartTag: { background: "#0369a1", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "12px" },
  dropPrice: { fontSize: "13px", fontWeight: 600, color: "#0369a1" },
  dropNoResult: { padding: "18px", textAlign: "center" as const, color: "#94a3b8", fontSize: "14px" },

  addBtn: { display: "flex", alignItems: "center", gap: "6px", background: "#0369a1", color: "#fff", border: "none", borderRadius: "10px", padding: "11px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" as const },

  grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "14px" },
  fieldGroup: { display: "flex", flexDirection: "column" as const, gap: "5px" },
  label: { fontSize: "12px", fontWeight: 600, color: "#64748b", letterSpacing: "0.04em" },
  input: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "9px", padding: "10px 13px", color: "#1e293b", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" as const, transition: "all 0.18s", fontFamily: "inherit" },
  select: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "9px", padding: "10px 13px", color: "#1e293b", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" as const, transition: "all 0.18s", fontFamily: "inherit", cursor: "pointer", appearance: "none" as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "left 12px center" },

  // VIP toggle
  vipToggle: { display: "flex", alignItems: "center", borderRadius: "9px", padding: "8px 12px", cursor: "pointer", transition: "all 0.22s", userSelect: "none" as const, minHeight: "42px", position: "relative" as const },
  vipKnob: { width: "18px", height: "18px", borderRadius: "50%", transition: "all 0.22s", flexShrink: 0 },
  vipLabel: { fontSize: "13px", fontWeight: 700, transition: "all 0.22s" },

  emptyState: { display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "40px 20px", gap: "10px" },
  emptyCircle: { width: "60px", height: "60px", background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px" },
  emptyTitle: { fontSize: "15px", fontWeight: 600, color: "#94a3b8", margin: 0 },
  emptyHint: { fontSize: "13px", color: "#cbd5e1", margin: 0, textAlign: "center" as const },

  tableWrap: { overflowX: "auto" as const },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { padding: "10px 14px", fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase" as const, textAlign: "center" as const, background: "#f8fafc", borderBottom: "1px solid #e8edf2", borderTop: "1px solid #e8edf2" },
  td: { padding: "13px 14px", fontSize: "14px", verticalAlign: "middle" as const, borderBottom: "1px solid #f1f5f9" },

  qtyRow: { display: "flex", alignItems: "center", gap: "5px", justifyContent: "center" },
  qtyBtn: { width: "26px", height: "26px", background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", borderRadius: "6px", cursor: "pointer", fontSize: "15px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 },
  qtyInput: { width: "46px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#1e293b", fontSize: "13px", fontWeight: 700, padding: "4px 5px", textAlign: "center" as const, outline: "none", fontFamily: "inherit" },
  delBtn: { width: "28px", height: "28px", background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48", borderRadius: "7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", transition: "all 0.15s" },

  totalBar: { marginTop: "16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { fontSize: "13px", fontWeight: 600, color: "#475569", margin: "0 0 2px" },
  totalSub: { fontSize: "12px", color: "#94a3b8", margin: 0 },
  totalAmount: { fontSize: "26px", fontWeight: 800, color: "#0369a1", letterSpacing: "-0.02em" },
  totalCur: { fontSize: "13px", fontWeight: 500, color: "#38bdf8" },

  actions: { display: "flex", gap: "10px" },
  btnSave: { display: "flex", alignItems: "center", gap: "8px", background: "#0369a1", color: "#fff", border: "none", borderRadius: "10px", padding: "13px 28px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.18s", boxShadow: "0 2px 10px rgba(3,105,161,0.22)", fontFamily: "inherit" },
  btnCancel: { background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "13px 22px", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit" },
  spinner: { width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" },

  overlay: { position: "fixed" as const, inset: 0, background: "rgba(15,23,42,0.3)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modal: { background: "#fff", borderRadius: "18px", width: "100%", maxWidth: "700px", maxHeight: "82vh", display: "flex", flexDirection: "column" as const, boxShadow: "0 20px 60px rgba(0,0,0,0.14)", overflow: "hidden" },
  modalHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 22px 0", flexShrink: 0 },
  modalTitle: { fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 3px" },
  modalSub: { fontSize: "12px", color: "#94a3b8", margin: 0 },
  modalClose: { width: "34px", height: "34px", background: "#f1f5f9", border: "none", borderRadius: "8px", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 },
  modalSearchWrap: { position: "relative" as const, padding: "14px 22px", flexShrink: 0 },
  modalSearchIcon: { position: "absolute" as const, right: "36px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const },
  modalInput: { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "11px 40px", fontSize: "14px", color: "#1e293b", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit", transition: "all 0.18s" },
  clearBtn: { position: "absolute" as const, left: "36px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px", padding: "2px 6px" },

  productGrid: { overflowY: "auto" as const, padding: "4px 22px 22px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "10px", flex: 1 },
  productCard: { background: "#f8fafc", border: "1.5px solid #e8edf2", borderRadius: "12px", padding: "15px 13px", cursor: "pointer", transition: "all 0.18s", display: "flex", flexDirection: "column" as const, gap: "5px" },
  productCardActive: { background: "#f0f9ff", border: "1.5px solid #7dd3fc" },
  productIconWrap: { width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2px" },
  productName: { fontSize: "13px", fontWeight: 700, margin: 0, lineHeight: 1.4 },
  productPrice: { fontSize: "12px", color: "#64748b", fontWeight: 500, margin: 0 },
  inCartBadge: { background: "#0369a1", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", alignSelf: "flex-start" as const, marginTop: "3px" },
  noResult: { gridColumn: "1 / -1", textAlign: "center" as const, padding: "32px" },
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }

  .inp:focus {
    border-color: #7dd3fc !important;
    background: #fff !important;
    box-shadow: 0 0 0 3px rgba(125,211,252,0.15) !important;
  }
  .inp::placeholder { color: #cbd5e1; }

  .drop-item:hover { background: #f0f9ff !important; }

  .add-btn:hover { background: #0284c7 !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(3,105,161,0.28) !important; }

  .trow:hover td { background: #fafcff; }

  .qty-btn:hover { background: #e0f2fe !important; color: #0369a1 !important; border-color: #7dd3fc !important; }

  .del-btn:hover { background: #ffe4e6 !important; border-color: #fda4af !important; }

  .btn-save:hover:not(:disabled) { background: #0284c7 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(3,105,161,0.3) !important; }
  .btn-cancel:hover { background: #f8fafc !important; border-color: #cbd5e1 !important; }

  .modal-close:hover { background: #e2e8f0 !important; color: #1e293b !important; }

  .product-card:hover { border-color: #7dd3fc !important; background: #f0f9ff !important; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(3,105,161,0.09); }

  .vip-toggle:hover { opacity: 0.88; }

  .spinner { animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #f8fafc; }
  ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #7dd3fc; }

  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
`;