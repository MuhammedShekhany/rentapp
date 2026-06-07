"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type ProductType = {
  pro_id: number;
  pro_no?: number; // ✅ ADDED
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
  const [search, setSearch] = useState("");
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

      const res = await fetch(`/api/product?br_id=${br_id}`, {
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
  // SEARCH FILTER
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
                onClick={() => router.push("/br_admin/product/add")}
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl"
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

          {/* SEARCH */}
          <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المنتج أو التصنيف..."
              className="border p-2 rounded-lg w-full outline-none"
            />

            <div className="bg-black text-white px-3 py-1 rounded-full flex items-center">
              {filteredProducts.length} منتجات
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="text-center py-10">جارٍ التحميل...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10">لا توجد منتجات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-right">

                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">رقم المنتج</th>
                    <th className="p-4">الصورة</th>
                    <th className="p-4">الاسم</th>
                    <th className="p-4">التصنيف</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4">المستخدم</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((item) => (
                    <React.Fragment key={item.pro_id}>
                      <tr className="hover:bg-slate-50">

                        {/* PRO NO */}
                        <td className="p-4 font-bold text-blue-600">
                          #{item.pro_no}
                        </td>

                        {/* IMAGE */}
                        <td className="p-4">
                          {item.pro_img ? (
                            <img
                              src={item.pro_img}
                              alt={item.pro_name}
                              onClick={() =>
                                setPreviewImage(item.pro_img || null)
                              }
                              className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                            />
                          ) : (
                            "لا يوجد"
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
                        <td className="p-4 text-green-700 font-bold">
                          {Number(item.pro_price).toLocaleString()}
                        </td>

                        {/* USER */}
                        <td className="p-4">
                          {item.user_name || "لا يوجد"}
                        </td>
                      </tr>

                      {/* ACTIONS */}
                      <tr className="bg-gray-50">
                        <td colSpan={10} className="p-3">
                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                router.push(
                                  `/br_admin/product/edit/${item.pro_id}`
                                )
                              }
                              className="px-4 py-2 bg-amber-500 text-white rounded-lg"
                            >
                              تحديث
                            </button>

                            <button
                              onClick={() => handleDelete(item.pro_id)}
                              disabled={deletingId === item.pro_id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg"
                            >
                              {deletingId === item.pro_id
                                ? "جارٍ الحذف..."
                                : "حذف"}
                            </button>

                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>
      </div>

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center"
        >
          <img
            src={previewImage}
            className="max-w-[90vw] max-h-[90vh] rounded-xl"
          />
        </div>
      )}
    </div>
  );
}