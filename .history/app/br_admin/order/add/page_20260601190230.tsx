"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type ProductType = {
    pro_id: string;
    pro_name: string;
    pro_price: number;
    pro_img: string;
};

type DetailType = {
    pro_id: string;
    pro_name: string;
    ord_qt: number;
    ord_price: number;
    ord_total: number;
};



type BranchType = {
    br_name: string;
    br_header: string; // image path or URL
    br_phone?: string;
    br_address?: string;
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

    const [br_id, setBrId] = useState("");
    const [user_id, setUserId] = useState("");
    const [branch, setBranch] = useState<BranchType | null>(null);
    const [nextOrderId, setNextOrderId] = useState<number | null>(null);

    const [products, setProducts] = useState<ProductType[]>([]);


    const [inlineSearch, setInlineSearch] = useState("");
    const [showInlineList, setShowInlineList] = useState(false);
    const [modalSearch, setModalSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [details, setDetails] = useState<DetailType[]>([]);
    const [loading, setLoading] = useState(false);
    const [receipt_date, setReceiptDate] = useState("");

    const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null);


    

    useEffect(() => {
        const session = localStorage.getItem("userSession");
        if (!session) return router.push("/login");
        const user = JSON.parse(session);
        setUserId(user.user_id);
        setBrId(user.br_id);

        fetch(`/api/branch/${user.br_id}`)
            .then((r) => r.json())
            .then((d) => { if (d.success) setBranch(d.branch); })
            .catch(console.error);

        fetch(`/api/product?br_id=${user.br_id}`)
            .then((r) => r.json())
            .then((d) => { if (d.success) setProducts(d.product); })
            .catch(console.error);

        fetch("/api/order/next-id")
            .then((r) => r.json())
            .then((d) => { if (d.success) setNextOrderId(d.nextId); })
            .catch(() => setNextOrderId(null));
    }, [router]);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (inlineRef.current && !inlineRef.current.contains(e.target as Node))
                setShowInlineList(false);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

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

    useEffect(() => {
        document.body.style.overflow = showModal ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [showModal]);



    const updatePrice = (index: number, value: number) => {
        const price = Math.max(0, value || 0);

        setDetails((prev) =>
            prev.map((d, i) =>
                i === index
                    ? {
                        ...d,
                        ord_price: price,
                        ord_total: price * d.ord_qt,
                    }
                    : d
            )
        );
    };

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
            // 1. Check if product already exists in the cart (details)
            const existingIndex = prev.findIndex((d) => d.pro_id === product.pro_id);

            if (existingIndex > -1) {
                // 2. If it exists, create a new array with the updated item
                return prev.map((item, index) => {
                    if (index === existingIndex) {
                        const newQty = item.ord_qt + 1;
                        return {
                            ...item,
                            ord_qt: newQty,
                            ord_total: newQty * item.ord_price, // Recalculate total based on current price
                        };
                    }
                    return item;
                });
            }

            // 3. If it doesn't exist, add it as a new entry
            return [
                ...prev,
                {
                    pro_id: product.pro_id,
                    pro_name: product.pro_name,
                    ord_qt: 1,
                    ord_price: Number(product.pro_price),
                    ord_total: Number(product.pro_price),
                },
            ];
        });

        // Handle UI cleanup
        if (fromModal) {
            setShowModal(false);
            setModalSearch("");
        } else {
            setInlineSearch("");
            setShowInlineList(false);
        }
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

    const nowStr = new Date().toLocaleString("ar-IQ", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
    });

    return (
        <div style={s.page} dir="rtl">
            <style>{globalStyles}</style>

            {/* ── TOP ACTION BAR ── */}
            <div style={s.topBar}>
                <div style={s.topBarInner}>
                    <div style={s.topBarLeft}>
                        <button onClick={() => router.push("/br_admin/order")} style={s.backBtn} className="top-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            عودة
                        </button>
                    </div>
                    <div style={s.topBarRight}>
                        <button onClick={handleSave} disabled={loading} style={s.saveBtn} className="save-btn">
                            {loading ? (
                                <><span className="spinner" style={s.spinner} /> جاري الحفظ...</>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    حفظ الطلب
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── RECEIPT WRAPPER ── */}
            <div style={s.receiptOuter}>
                <div style={s.receipt}>

                    {/* ══ BRANCH BANNER ══ */}
                    {branch?.br_header ? (
                        <div style={s.bannerWrap}>
                            <img
                                src={branch.br_header}
                                alt={branch.br_name}
                                style={s.bannerImg}
                            />
                        </div>
                    ) : (
                        <div style={s.bannerPlaceholder}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span style={{ color: "#9ca3af", fontSize: 13 }}>صورة المحل</span>
                        </div>
                    )}



                    {/* ══ RECEIPT META ROW ══ */}
                    <div style={s.metaRow}>
                        <div style={s.metaLeft}>
                            <span style={s.metaLabel}>رقم وصل :</span>
                            <span style={s.metaValue}>{nextOrderId ?? "—"}</span>
                        </div>

                        {/* VIP */}
                        <div
                            onClick={() => setOrVip((v) => !v)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,

                                padding: "5px 10px",
                                borderRadius: 999,

                                cursor: "pointer",
                                userSelect: "none",
                                flexShrink: 0,

                                transition: "0.2s",

                                // Highlight when active
                                background: or_vip ? "#fef3c7" : "#f3f4f6",
                                border: or_vip
                                    ? "1px solid #f59e0b"
                                    : "1px solid #e5e7eb",

                                boxShadow: or_vip
                                    ? "0 0 0 2px rgba(245,158,11,0.15)"
                                    : "none",
                            }}
                        >
                            {/* Crown */}
                            <span
                                style={{
                                    fontSize: 15,
                                    transition: "0.2s",
                                    filter: or_vip ? "drop-shadow(0 0 3px #fbbf24)" : "grayscale(1)",
                                    opacity: or_vip ? 1 : 0.5,
                                }}
                            >
                                👑
                            </span>

                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                    color: or_vip ? "#92400e" : "#6b7280",
                                }}
                            >
                                {or_vip ? "VIP" : "عادي"}
                            </span>
                        </div>
                    </div>
                    <div style={s.divider} />




                    {/* ══ CUSTOMER + DATES SIDE BY SIDE ══ */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 320px",
                            gap: 16,
                            padding: "12px 20px",
                            background: "#fafafa",
                            borderTop: "1px dashed #d1d5db",
                        }}
                    >
                        {/* CUSTOMER SECTION */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            {/* CUSTOMER NAME */}
                            <div style={s.cusRow}>
                                <div style={s.cusField}>
                                    <span style={s.cusKey}>السـيد :</span>

                                    <input
                                        placeholder="اسم الزبون"
                                        value={or_cus_name}
                                        onChange={(e) => setOrCusName(e.target.value)}
                                        style={s.receiptInput}
                                        className="rinp"
                                    />
                                </div>
                            </div>

                            {/* PHONE 1 + 2 */}
                            <div style={s.cusRow}>
                                <div
                                    style={{
                                        ...s.cusField,
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        gap: 10,
                                    }}
                                >
                                    {/* PHONE 1 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            width: "100%",
                                        }}
                                    >
                                        <span style={s.cusKey}>الهاتف 1 :</span>

                                        <input
                                            placeholder="07xx-xxx-xxxx"
                                            value={or_cus_phone}
                                            onChange={(e) => setOrCusPhone(e.target.value)}
                                            style={s.receiptInput}
                                            className="rinp"
                                        />
                                    </div>

                                    {/* PHONE 2 */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            width: "100%",
                                        }}
                                    >
                                        <span style={s.cusKey}>الهاتف 2 :</span>

                                        <input
                                            placeholder="07xx-xxx-xxxx"
                                            value={or_cus_phone2}
                                            onChange={(e) => setOrCusPhone2(e.target.value)}
                                            style={s.receiptInput}
                                            className="rinp"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>





                        {/* DATES + EXTRA */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                            }}
                        >

                            {/* ORDER DATE */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 2,
                                }}
                            >
                                <label
                                    style={{
                                        ...s.extraLabel,
                                        fontSize: 11,
                                        whiteSpace: "nowrap",
                                        minWidth: 80,
                                    }}
                                >
                                    تاريخ الطلب
                                </label>

                                <input
                                    type="date"
                                    value={or_date}
                                    onChange={(e) => setOrDate(e.target.value)}
                                    style={{
                                        ...s.extraInput,
                                        padding: "4px 6px",
                                        height: 30,
                                        flex: 1,
                                    }}
                                />
                            </div>

                            {/* RESERVE DATE */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 2,
                                }}
                            >
                                <label
                                    style={{
                                        ...s.extraLabel,
                                        fontSize: 11,
                                        whiteSpace: "nowrap",
                                        minWidth: 80,
                                    }}
                                >
                                    تاريخ الحجز
                                </label>

                                <input
                                    type="date"
                                    value={or_date_reserve}
                                    onChange={(e) => {
                                        const val = e.target.value;

                                        setOrDateReserve(val);

                                        if (val) {
                                            const d = new Date(val);
                                            d.setDate(d.getDate() + 1); // +1 day

                                            const nextDay = d.toISOString().split("T")[0];

                                            setReceiptDate(nextDay);
                                        } else {
                                            setReceiptDate("");
                                        }
                                    }}
                                    style={{
                                        ...s.extraInput,
                                        padding: "4px 6px",
                                        height: 30,
                                        flex: 1,
                                    }}
                                />

                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <label style={{ fontSize: 11, minWidth: 80 }}>تاريخ الاستلام</label>

                                <input
                                    type="date"
                                    value={receipt_date}
                                    readOnly
                                    style={{
                                        ...s.extraInput,
                                        padding: "4px 6px",
                                        height: 30,
                                        flex: 1,
                                        background: "#f3f4f6",
                                    }}
                                />
                            </div>







                            {/* PREPARE DATE */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 2,
                                }}
                            >
                                <label
                                    style={{
                                        ...s.extraLabel,
                                        fontSize: 11,
                                        whiteSpace: "nowrap",
                                        minWidth: 80,
                                    }}
                                >
                                    تاريخ التحضير
                                </label>

                                <input
                                    type="date"
                                    value={or_prepare_date}
                                    onChange={(e) => setOrPrepareDate(e.target.value)}
                                    style={{
                                        ...s.extraInput,
                                        padding: "4px 6px",
                                        height: 30,
                                        flex: 1,
                                    }}
                                />
                            </div>



                        </div>





                    </div>




                    <div style={s.divider} />






                    {/* ══ ORDER DETAILS TABLE ══ */}
                    <div style={s.sectionTitle}>تفاصيل الطلب</div>

                    {/* Search Row */}
                    <div style={s.searchRow}>
                        <div style={s.inlineWrap} ref={inlineRef}>
                            <svg
                                style={s.searchIcon}
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#9ca3af"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>

                            <input
                                placeholder="ابحث عن منتج وأضفه..."
                                value={inlineSearch}
                                onChange={(e) => {
                                    setInlineSearch(e.target.value);
                                    setShowInlineList(true);
                                }}
                                onFocus={() => setShowInlineList(true)}
                                style={s.searchInput}
                                className="rinp"
                            />

                            {inlineSearch && (
                                <button
                                    onClick={() => {
                                        setInlineSearch("");
                                        setShowInlineList(false);
                                    }}
                                    style={s.clearX}
                                >
                                    ✕
                                </button>
                            )}







                            {/* add item from search bar */}

                            {showInlineList && (
                                <div style={s.dropdown}>
                                    {inlineFiltered.length === 0 ? (
                                        <div style={s.dropEmpty}>لا توجد نتائج</div>
                                    ) : (
                                        inlineFiltered.map((p) => {
                                            const inCart = details.find((d) => d.pro_id === p.pro_id);

                                            return (

                                                <div
                                                    key={p.pro_id}
                                                    onClick={() => addProduct(p, false)}
                                                    style={
                                                        inCart
                                                            ? { ...s.dropItem, background: "#f0fdf4" }
                                                            : s.dropItem
                                                    }
                                                    className="drop-item"
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 10,
                                                            flex: 1,
                                                            minWidth: 0,
                                                        }}
                                                    >

                                                        {/* in search product */}
                                                        {p.pro_img ? (
                                                            <img
                                                                src={p.pro_img}
                                                                alt={p.pro_name}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPreviewImage(p.pro_img);
                                                                }}
                                                                style={{
                                                                    width: 100,
                                                                    height: 100,
                                                                    borderRadius: 8,
                                                                    objectFit: "cover",
                                                                    flexShrink: 0,
                                                                    border: "1px solid #e5e7eb",
                                                                    cursor: "zoom-in",
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    width: 100,
                                                                    height: 100,
                                                                    borderRadius: 8,
                                                                    background: "#f3f4f6",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <svg
                                                                    width="400"
                                                                    height="400"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="#9ca3af"
                                                                    strokeWidth="1.5"
                                                                    strokeLinecap="round"
                                                                >
                                                                    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                                                                    <polyline points="16 3 12 7 8 3" />
                                                                </svg>
                                                            </div>
                                                        )}

                                                        <span
                                                            style={{
                                                                ...s.dropName,
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {p.pro_name}
                                                        </span>
                                                    </div>

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 6,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {inCart && (
                                                            <span style={s.inCartTag}>
                                                                × {inCart.ord_qt}
                                                            </span>
                                                        )}

                                                        <span style={s.dropPrice}>
                                                            {Number(p.pro_price).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>




                        <button
                            onClick={() => setShowModal(true)}
                            style={s.allBtn}
                            className="all-btn"
                        >
                            📦 كل المنتجات
                        </button>
                    </div>




                    {/* ══ TABLE ══ */}
                    <div style={s.tableWrap}>
                        <table style={s.table}>
                            <thead>
                                <tr style={{ background: "#f9fafb" }}>
                                    <th style={{ ...s.th, textAlign: "right" }}>المنتج</th>
                                    <th style={s.th}>السعر</th>
                                    <th style={s.th}>الكمية</th>
                                    <th style={s.th}>المجموع</th>
                                    <th style={s.th}></th>
                                </tr>
                            </thead>



                            <tbody>
                                {details.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={s.emptyRow}>
                                            <div style={s.emptyInner}>
                                                📦 <span>ابحث وأضف منتجاً</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    details.map((d, i) => (
                                        <tr key={d.pro_id} className="trow">
                                            {/* PRODUCT */}
                                            <td
                                                style={{
                                                    ...s.td,
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {d.pro_name}
                                            </td>

                                            {/* UNIT PRICE */}
                                            <td style={{ ...s.td, textAlign: "center" }}>
                                                {editingPriceIndex === i ? (
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={Number(d.ord_price).toLocaleString()}
                                                        autoFocus
                                                        onChange={(e) => {
                                                            const raw = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
                                                            updatePrice(i, Number(raw));
                                                        }}
                                                        onBlur={() => setEditingPriceIndex(null)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                setEditingPriceIndex(null);
                                                            }
                                                        }}
                                                        style={{
                                                            width: 80,
                                                            padding: "4px",
                                                            border: "1px solid #d1d5db",
                                                            borderRadius: 6,
                                                            textAlign: "center",
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        onClick={() => setEditingPriceIndex(i)}
                                                        style={{
                                                            cursor: "pointer",
                                                            fontWeight: 600,
                                                            color: "#111827",
                                                            padding: "4px 8px",
                                                            borderRadius: 6,
                                                        }}
                                                    >
                                                        {Number(d.ord_price).toLocaleString()}
                                                    </span>
                                                )}
                                            </td>

                                            {/* QTY */}
                                            <td style={{ ...s.td, width: 130 }}>
                                                <div style={s.qtyRow}>
                                                    <button
                                                        onClick={() => updateQty(i, d.ord_qt - 1)}
                                                        style={s.qtyBtn}
                                                    >
                                                        −
                                                    </button>

                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={d.ord_qt}
                                                        onChange={(e) =>
                                                            updateQty(i, Number(e.target.value))
                                                        }
                                                        style={s.qtyInput}
                                                        className="rinp"
                                                    />



                                                    <button
                                                        onClick={() => updateQty(i, d.ord_qt + 1)}
                                                        style={s.qtyBtn}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>

                                            {/* TOTAL PER ITEM */}
                                            <td
                                                style={{
                                                    ...s.td,
                                                    textAlign: "center",
                                                    fontWeight: 700,
                                                    color: "#111827",
                                                }}
                                            >
                                                {(
                                                    Number(d.ord_price) * Number(d.ord_qt)
                                                ).toLocaleString()}
                                            </td>

                                            {/* DELETE */}
                                            <td style={{ ...s.td, width: 40, textAlign: "center" }}>
                                                <button
                                                    onClick={() => removeProduct(d.pro_id)}
                                                    style={s.delBtn}
                                                    className="del-btn"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: 8, marginTop: 4 }}>
                    </div>



                    {/* ══ TOTALS SECTION (receipt style) ══ */}
                    {details.length > 0 && (
                        <div style={s.totalsSection}>
                            <div style={s.totalRow}>
                                <span style={s.totalKey}>الإجمالي :</span>
                                <span style={s.totalVal}>{Number(total).toLocaleString()} دينار</span>
                            </div>
                            <div style={{ ...s.totalRow, borderTop: "1px dashed #d1d5db", paddingTop: 8, marginTop: 4 }}>
                                <span style={s.totalKey}>واصـل :</span>
                                <span style={{ ...s.totalVal, color: "#16a34a" }}>0 دينار</span>
                            </div>


                            <div style={{ ...s.totalRow, borderTop: "1px dashed #d1d5db", paddingTop: 8, marginTop: 4 }}>
                                <span style={{ ...s.totalKey, fontWeight: 800 }}>المتبقي :</span>
                                <span style={{ ...s.totalVal, color: "#dc2626", fontWeight: 800, fontSize: 18 }}>
                                    {Number(total).toLocaleString()} دينار
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ══ NOTES ══ */}
                    <div style={s.notesSection}>
                        <div style={s.sectionTitle}>ملاحظات</div>
                        <textarea
                            placeholder="أدخل ملاحظات الطلب هنا..."
                            value={or_note}
                            onChange={(e) => setOrNote(e.target.value)}
                            style={s.noteArea}
                            className="rinp"
                        />
                    </div>

                    {/* ══ FIXED NOTES (policy) ══ */}
                    <div style={s.policyBox}>
                        <p style={s.policyLine}>* يتم استلام البدلة بعد الساعة الرابعة عصراً وإعادتها قبل العاشرة والنصف صباح اليوم الثاني.</p>
                        <p style={s.policyLine}>   * العربون لا يرجع لأي سبب كان .</p>
                        <p style={s.policyLine}>* عند إتلاف البدلة أو تمزيقها تغرم قيمة البدلة كاملة .</p>
                        <p style={s.policyLine}>* يجب جلب البطاقة التموينية وبطاقة السكن وتسديد المتبقي إن وجد .</p>
                        <p style={s.policyLine}>* يتم دفع نصف المبلغ كعربون والباقي عند الاستلام .</p>
                    </div>

                </div>
            </div>

            {/* ══ PRODUCT PICKER all ══ */}
            {showModal && (
                <div style={s.overlay}>
                    <div style={s.modal} ref={modalRef}>
                        <div style={s.modalHeader}>
                            <div>
                                <h3 style={s.modalTitle}>قائمة المنتجات</h3>
                                <p style={s.modalSub}>{products.length} منتج متاح</p>
                            </div>
                            <button onClick={() => { setShowModal(false); setModalSearch(""); }} style={s.modalClose} className="modal-close">
                                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div style={s.modalSearchWrap}>
                            <svg style={s.modalSearchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                autoFocus
                                placeholder="ابحث عن منتج..."
                                value={modalSearch}
                                onChange={(e) => setModalSearch(e.target.value)}
                                style={s.modalInput}
                                className="rinp"
                            />
                            {modalSearch && (
                                <button onClick={() => setModalSearch("")} style={s.clearBtn}>✕</button>
                            )}
                        </div>
                        <div style={s.productGrid}>
                            {modalFiltered.length === 0 ? (
                                <div style={s.noResult}><p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>لا توجد نتائج</p></div>
                            ) : (
                                modalFiltered.map((p) => {
                                    const inCart = details.find((d) => d.pro_id === p.pro_id);
                                    return (
                                        <div
                                            key={p.pro_id}
                                            onClick={() => addProduct(p, true)}
                                            style={
                                                inCart
                                                    ? { ...s.productCard, ...s.productCardActive }
                                                    : s.productCard
                                            }
                                            className="product-card"
                                        >
                                            <div
                                                style={{
                                                    ...s.productIcon,
                                                    background: inCart ? "#dbeafe" : "#f3f4f6",
                                                    overflow: "hidden",
                                                    width: 180,
                                                    height: 180,
                                                    borderRadius: 12,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {p.pro_img ? (
                                                    <img
                                                        src={p.pro_img}
                                                        alt={p.pro_name}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                ) : (
                                                    <svg
                                                        width="40"
                                                        height="40"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={inCart ? "#2563eb" : "#9ca3af"}
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                    >
                                                        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                                                        <polyline points="16 3 12 7 8 3" />
                                                    </svg>
                                                )}
                                            </div>

                                            <p
                                                style={{
                                                    ...s.productName,
                                                    color: inCart ? "#1d4ed8" : "#111827",
                                                    marginTop: 8,
                                                }}
                                            >
                                                {p.pro_name}
                                            </p>

                                            <p style={s.productPrice}>
                                                {Number(p.pro_price).toLocaleString()} IQD
                                            </p>

                                            {inCart && (
                                                <div style={s.inCartPill}>
                                                    ✓ في السلة ({inCart.ord_qt})
                                                </div>
                                            )}
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












const [previewImage, setPreviewImage] = useState<string | null>(null);


{
    previewImage && (
        <div
            onClick={() => setPreviewImage(null)}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 20,
            }}
        >
            <img
                src={previewImage}
                alt="Preview"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: "90%",
                    maxHeight: "90vh",
                    borderRadius: 12,
                    objectFit: "contain",
                    background: "#fff",
                }}
            />
        </div>
    )
}








// ─────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
    page: { minHeight: "100vh", background: "#e5e7eb", fontFamily: "'Tajawal','Cairo',sans-serif", color: "#111827" },

    // Top action bar
    topBar: { background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 24px", position: "sticky" as const, top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
    topBarInner: { maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" },
    topBarLeft: { display: "flex", gap: 8 },
    topBarRight: { display: "flex", gap: 8 },
    backBtn: { display: "flex", alignItems: "center", gap: 6, background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    saveBtn: { display: "flex", alignItems: "center", gap: 6, background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" },

    // Receipt
    receiptOuter: { maxWidth: 860, margin: "28px auto", padding: "0 16px 60px" },
    receipt: { background: "#fff", borderRadius: 4, boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #e5e7eb" },

    // Banner
    bannerWrap: { width: "100%", overflow: "hidden", maxHeight: 240, borderBottom: "1px solid #f3f4f6" },
    bannerImg: { width: "100%", objectFit: "cover" as const, display: "block" },
    bannerPlaceholder: { width: "100%", height: 160, background: "#f9fafb", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 8, borderBottom: "1px solid #f3f4f6" },

    // Meta row
    metaRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px 6px", background: "#fafafa" },
    metaLeft: { display: "flex", gap: 6, alignItems: "center" },
    metaRight: { display: "flex", gap: 6, alignItems: "center" },
    metaLabel: { fontSize: 12, color: "#6b7280", fontWeight: 600 },
    metaValue: { fontSize: 14, color: "#111827", fontWeight: 700 },
    vipBadgePill: { background: "#1a1a2e", color: "#fbbf24", padding: "3px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, letterSpacing: "0.05em" },

    divider: { border: "none", borderTop: "1px dashed #d1d5db", margin: "0 20px" },

    // Dates
    datesGrid: { padding: "8px 20px", display: "flex", flexDirection: "column" as const, gap: 4 },
    dateItem: { display: "flex", gap: 8, alignItems: "center" },
    dateKey: { fontSize: 12, color: "#6b7280", minWidth: 110 },
    dateLabel: { fontSize: 13, color: "#374151", fontWeight: 500 },

    // Customer
    customerSection: { padding: "12px 20px", display: "flex", flexDirection: "column" as const, gap: 8 },
    cusRow: { display: "flex", gap: 12 },
    cusField: { display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" as const },
    cusKey: { fontSize: 13, color: "#374151", fontWeight: 700, minWidth: 60, flexShrink: 0 },
    receiptInput: { flex: 1, minWidth: 120, border: "none", borderBottom: "1.5px solid #e5e7eb", padding: "5px 4px", fontSize: 14, color: "#111827", outline: "none", background: "transparent", fontFamily: "inherit", transition: "border-color 0.18s" },
    phoneSep: { color: "#9ca3af", fontSize: 16 },

    // Extra fields row
    extraRow: { padding: "12px 20px", display: "flex", gap: 12, flexWrap: "wrap" as const, background: "#fafafa", borderTop: "1px dashed #d1d5db" },
    extraField: { display: "flex", flexDirection: "column" as const, gap: 4, flex: "1 1 140px" },
    extraLabel: { fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.04em" },
    extraInput: { border: "1px solid #e5e7eb", borderRadius: 6, padding: "7px 10px", fontSize: 13, color: "#111827", background: "#fff", outline: "none", fontFamily: "inherit" },
    extraSelect: { border: "1px solid #e5e7eb", borderRadius: 6, padding: "7px 10px", fontSize: 13, color: "#111827", background: "#fff", outline: "none", fontFamily: "inherit", cursor: "pointer" },

    // VIP toggle
    vipToggle: { display: "flex", alignItems: "center", borderRadius: 8, padding: "7px 10px", cursor: "pointer", transition: "all 0.22s", userSelect: "none" as const, minHeight: 36, position: "relative" as const, border: "1px solid #e5e7eb" },
    vipKnob: { width: 16, height: 16, borderRadius: "50%", transition: "all 0.22s", flexShrink: 0 },
    vipTxt: { fontSize: 12, fontWeight: 800, transition: "all 0.22s", marginRight: 6 },

    // Order section
    sectionTitle: { fontSize: 13, fontWeight: 700, color: "#374151", padding: "10px 20px 6px", letterSpacing: "0.05em", textTransform: "uppercase" as const },

    // Search
    searchRow: { display: "flex", gap: 8, padding: "0 20px 10px", alignItems: "center" },
    inlineWrap: { position: "relative" as const, flex: 1 },
    searchIcon: { position: "absolute" as const, right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const },
    searchInput: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "9px 34px 9px 30px", fontSize: 13, color: "#111827", outline: "none", background: "#f9fafb", fontFamily: "inherit", boxSizing: "border-box" as const },
    clearX: { position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 12, padding: "2px 5px" },
    dropdown: { position: "absolute" as const, top: "calc(100% + 4px)", right: 0, left: 0, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, maxHeight: 220, overflowY: "auto" as const, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" },
    dropItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f9fafb", transition: "background 0.14s" },
    dropEmpty: { padding: 16, textAlign: "center" as const, color: "#9ca3af", fontSize: 13 },
    dropName: { fontSize: 13, fontWeight: 500, color: "#111827" },
    inCartTag: { background: "#111827", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 },
    dropPrice: { fontSize: 12, fontWeight: 600, color: "#374151" },
    allBtn: { display: "flex", alignItems: "center", gap: 5, background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" as const, transition: "all 0.18s" },

    // Table
    tableWrap: { overflowX: "auto" as const, padding: "0 20px" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "9px 12px", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.07em", textTransform: "uppercase" as const, textAlign: "center" as const, borderBottom: "2px solid #e5e7eb", borderTop: "2px solid #e5e7eb" },
    td: { padding: "11px 12px", fontSize: 13, verticalAlign: "middle" as const, borderBottom: "1px solid #f3f4f6", textAlign: "center" as const },
    emptyRow: { padding: "32px", textAlign: "center" as const },
    emptyInner: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 13 },
    qtyRow: { display: "flex", alignItems: "center", gap: 4, justifyContent: "center" },
    qtyBtn: { width: 24, height: 24, background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151", borderRadius: 5, cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" },
    qtyInput: { width: 40, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 5, color: "#111827", fontSize: 12, fontWeight: 700, padding: "3px 4px", textAlign: "center" as const, outline: "none", fontFamily: "inherit" },
    delBtn: { width: 26, height: 26, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", transition: "all 0.15s" },

    // Totals
    totalsSection: { padding: "14px 20px 8px", display: "flex", flexDirection: "column" as const, gap: 6, alignItems: "flex-start" },
    totalRow: { display: "flex", gap: 12, alignItems: "center", width: "100%" },
    totalKey: { fontSize: 13, fontWeight: 600, color: "#374151", minWidth: 80 },
    totalVal: { fontSize: 14, fontWeight: 700, color: "#111827" },

    // Notes
    notesSection: { padding: "8px 20px 12px" },
    noteArea: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#111827", background: "#f9fafb", outline: "none", fontFamily: "inherit", resize: "vertical" as const, minHeight: 80, boxSizing: "border-box" as const, lineHeight: 1.7 },

    // Policy
    policyBox: { padding: "10px 20px 20px", borderTop: "1px dashed #d1d5db" },
    policyLine: { fontSize: 11, color: "#6b7280", margin: "2px 0", lineHeight: 1.8 },

    spinner: { width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" },

    // Modal
    overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
    modal: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "82vh", display: "flex", flexDirection: "column" as const, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" },
    modalHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 20px 0", flexShrink: 0 },
    modalTitle: { fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 2px" },
    modalSub: { fontSize: 12, color: "#9ca3af", margin: 0 },
    modalClose: { width: 32, height: 32, background: "#f3f4f6", border: "none", borderRadius: 7, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    modalSearchWrap: { position: "relative" as const, padding: "12px 20px", flexShrink: 0 },
    modalSearchIcon: { position: "absolute" as const, right: 34, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const },
    modalInput: { width: "100%", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "10px 36px", fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" },
    clearBtn: { position: "absolute" as const, left: 34, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 12, padding: "2px 5px" },
    productGrid: { overflowY: "auto" as const, padding: "4px 20px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, flex: 1 },
    productCard: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px", cursor: "pointer", transition: "all 0.18s", flexDirection: "column" as const, gap: 4
    },
    productCardActive: { background: "#eff6ff", border: "1.5px solid #93c5fd" },
    productIcon: { width: 200, height: 200, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 },
    productName: { fontSize: 12, fontWeight: 700, margin: 0, lineHeight: 1.4 },
    productPrice: { fontSize: 11, color: "#6b7280", margin: 0 },
    inCartPill: { background: "#1d4ed8", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, alignSelf: "flex-start" as const, marginTop: 2 },
    noResult: { gridColumn: "1 / -1", textAlign: "center" as const, padding: 28 },
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }

  .rinp:focus {
    border-color: #111827 !important;
    background: #fff !important;
  }
  .rinp::placeholder { color: #d1d5db; }

  .drop-item:hover { background: #f9fafb !important; }

  .top-btn:hover { background: #f3f4f6 !important; }
  .save-btn:hover:not(:disabled) { background: #374151 !important; }

  .all-btn:hover { background: #374151 !important; }

  .trow:hover td { background: #f9fafb; }

  .qty-btn:hover { background: #dbeafe !important; border-color: #93c5fd !important; color: #1d4ed8 !important; }

  .del-btn:hover { background: #fee2e2 !important; border-color: #fca5a5 !important; }

  .modal-close:hover { background: #e5e7eb !important; color: #111827 !important; }

  .product-card:hover { border-color: #93c5fd !important; background: #eff6ff !important; transform: translateY(-1px); }

  .vip-toggle:hover { opacity: 0.85; }

  .spinner { animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #f9fafb; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

  @media (max-width: 600px) {
    .receipt { border-radius: 0 !important; }
  }
`;