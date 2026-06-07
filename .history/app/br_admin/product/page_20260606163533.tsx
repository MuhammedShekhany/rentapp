"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type ProductType = {
  pro_id: number;
  pro_no?: number;
  pro_name: string;

  br_id: string;
  user_id: number;

  pro_price: number;

  pro_gat_id: number;
  pro_gat_name?: string;

  pro_img?: string;

  br_name?: string;
  user_name?: string;

  br_header?: string;
};

type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
  br_name?: string;
};

export default function ProductPage() {
  const router = useRouter();

  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [user, setUser] = useState<UserType | null>(null);

  const [search, setSearch] = useState(""); // 🔥 SEARCH

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // =========================
  // USER SESSION
  // =========================
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.replace("/login");
      return;
    }

    setUser(JSON.parse(session));
  }, [router]);

  // =========================
  // BASE PATH
  // =========================
  const basePath = useMemo(() => {
    if (!user) return "";

    return user.user_role === "br_admin"
      ? "/br_admin"
      : user.user_role === "br_ass"
        ? "/br_ass"
        : "/br_user";
  }, [user]);

  // =========================
  // LOAD PRODUCTS
  // =========================
  const loadProducts = async (br_id: string) => {
    try {
      setLoading(true);


      const res = await fetch(`/api/product?br_id=${user?.br_id}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setProducts(data.product || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error(error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.br_id) {
      loadProducts(user.br_id);
    }
  }, [user]);

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (pro_id: number) => {
    const ok = confirm("هل أنت متأكد من حذف هذا المنتج؟");
    if (!ok) return;

    try {
      setDeletingId(pro_id);

      const res = await fetch(`/api/product/${pro_id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (result.success) {
        alert("تم حذف المنتج بنجاح");

        setProducts((prev) =>
          prev.filter((item) => item.pro_id !== pro_id)
        );
      } else {
        alert(result.message || "فشل الحذف");
      }
    } catch (error) {
      console.error(error);
      alert("خطأ في السيرفر");
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // FILTER SEARCH
  // =========================
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const nameMatch =
        item.pro_name?.toLowerCase().includes(search.toLowerCase());

      const catMatch =
        item.pro_gat_name?.toLowerCase().includes(search.toLowerCase());

      return nameMatch || catMatch;
    });
  }, [products, search]);

  return (
    <div className="min-h-screen bg-slate-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-slate-800">
              المنتجات
            </h1>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  router.push("/br_admin/product/add")
                }
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl transition-colors duration-200"
              >
                + إضافة منتج
              </button>

              <button
                onClick={() => router.push(`${basePath}`)}
                className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-xl"
              >
                ← الرجوع
              </button>
            </div>
          </div>


          <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-col md:flex-row md:items-center gap-3">

            {/* SEARCH */}
            <div className="relative w-full">

              {/* ICON */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم المنتج أو التصنيف..."
                className="border p-2 pl-9 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* COUNT BADGE */}
            <div className="inline-flex items-center bg-black text-white rounded-full px-3 py-1 whitespace-nowrap">
              <span className="text-xs font-semibold">
                {filteredProducts.length} منتجات
              </span>
            </div>

          </div>

          {/* CONTENT */}
          {loading ? (
            <div className="text-center py-10 text-slate-500">
              جارٍ التحميل...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              لا توجد منتجات
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full border-collapse min-w-[1200px] text-right">

               <thead className="sticky top-0 z-20 bg-gray-50 border-b">
                  <tr className="bg-slate-100 text-slate-700">

                    <th className="p-4">رقم</th>
                    <th className="p-4">صورة المنتج</th>
                    <th className="p-4">اسم المنتج</th>
                    <th className="p-4">التصنيف</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4">المستخدم</th>

                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((item) => (
                    <>
                    <tr
                      key={item.pro_id}
                      className="hover:bg-slate-50 transition"
                    >

                      {/* ID */}
                      <td className="p-4">{item.pro_no}</td>

                      {/* IMAGE */}
                      <td className="p-4">
                        {item.pro_img ? (
                          <img
                            src={item.pro_img}
                            alt={item.pro_name}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.pro_img) {
    setPreviewImage(item.pro_img);
  }
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
                            className="w-35 h-35 object-cover rounded-xl border"

                          />
                        ) : (
                          <div className="text-slate-400">
                            لا يوجد
                          </div>
                        )}
                      </td>

                      {/* NAME */}
                      <td className="p-4 font-semibold">
                        {item.pro_name}
                      </td>

                      {/* CATEGORY */}
                      <td className="p-4">
                        {item.pro_gat_name || "لا يوجد"}
                      </td>

                      {/* PRICE */}
                      <td className="p-4 font-semibold text-green-700">
                        {Number(item.pro_price).toLocaleString()}
                      </td>

                      {/* USER */}
                      <td className="p-4">
                        {item.user_name || "لا يوجد"}
                      </td>






                     

                    </tr>

                     {/* ACTIONS */}
                     <tr className="border-b bg-gray-50">
                        <td colSpan={16} className="p-3">
                          <div className="flex flex-row flex-nowrap gap-2 items-center justify-start">


                          <button
                            onClick={() =>
                              router.push(
                                `/br_admin/product/edit/${item.pro_id}`
                              )
                            }
                            className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                          >
                            تحديث
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(item.pro_id)
                            }
                            disabled={deletingId === item.pro_id}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                          >
                            {deletingId === item.pro_id
                              ? "جارٍ الحذف..."
                              : "حذف"}
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
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: "absolute",
              top: -15,
              right: -15,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "none",
              background: "#ef4444",
              color: "#fff",
              fontSize: 24,
              cursor: "pointer",
              fontWeight: "bold",
              zIndex: 10000,
            }}
          >
            ×
          </button>

          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 12,
              objectFit: "contain",
              background: "#fff",
              display: "block",
            }}
          />
        </div>
      </div>
    )
  }
    </div>
    
  );

  
}