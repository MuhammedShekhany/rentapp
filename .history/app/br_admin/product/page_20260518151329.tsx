"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type ProductType = {
  pro_id: number;
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
  const loadProducts = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/product", { cache: "no-store" });
      const data = await res.json();

      if (data.success) setProducts(data.product || []);
      else setProducts([]);
    } catch (error) {
      console.error(error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

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
  // FILTER
  // =========================
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const q = search.toLowerCase();
      return (
        item.pro_name?.toLowerCase().includes(q) ||
        item.pro_gat_name?.toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  return (
    <div className="min-h-screen bg-slate-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold">المنتجات</h1>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/br_admin/product/add")}
              className="bg-black text-white px-4 py-2 rounded-xl"
            >
              + إضافة
            </button>

            <button
              onClick={() => router.push(basePath)}
              className="bg-gray-200 px-4 py-2 rounded-xl"
            >
              رجوع
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..."
          className="w-full border p-2 rounded-lg mb-4"
        />

        {/* =========================
            LOADING
        ========================= */}
        {loading ? (
          <div className="text-center py-10">جارٍ التحميل...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10">لا توجد منتجات</div>
        ) : (
          <>
            {/* =========================
                DESKTOP TABLE
            ========================= */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[1000px] text-right border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3">رقم</th>
                    <th className="p-3">صورة</th>
                    <th className="p-3">اسم</th>
                    <th className="p-3">تصنيف</th>
                    <th className="p-3">سعر</th>
                    <th className="p-3">مستخدم</th>
                    <th className="p-3">إجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((item) => (
                    <tr key={item.pro_id} className="border-b">
                      <td className="p-3">{item.pro_id}</td>

                      <td className="p-3">
                        <img
                          src={item.pro_img || "/no-image.png"}
                          className="w-14 h-14 object-cover rounded-lg border"
                        />
                      </td>

                      <td className="p-3 font-semibold">
                        {item.pro_name}
                      </td>

                      <td className="p-3">
                        {item.pro_gat_name || "—"}
                      </td>

                      <td className="p-3 text-green-700 font-bold">
                        {Number(item.pro_price).toLocaleString()}
                      </td>

                      <td className="p-3">{item.user_name || "—"}</td>

                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/br_admin/product/edit/${item.pro_id}`
                            )
                          }
                          className="bg-amber-500 text-white px-3 py-1 rounded"
                        >
                          تعديل
                        </button>

                        <button
                          onClick={() => handleDelete(item.pro_id)}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          {deletingId === item.pro_id
                            ? "..."
                            : "حذف"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* =========================
                MOBILE CARDS
            ========================= */}
            <div className="md:hidden space-y-4">
              {filteredProducts.map((item) => (
                <div
                  key={item.pro_id}
                  className="bg-gray-50 rounded-xl shadow p-4 flex gap-4"
                >
                  <img
                    src={item.pro_img || "/no-image.png"}
                    className="w-16 h-16 rounded-lg object-cover border"
                  />

                  <div className="flex-1">
                    <div className="font-bold">
                      {item.pro_name}
                    </div>

                    <div className="text-sm text-gray-500">
                      {item.pro_gat_name || "—"}
                    </div>

                    <div className="text-green-700 font-semibold">
                      {Number(item.pro_price).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/br_admin/product/edit/${item.pro_id}`
                        )
                      }
                      className="bg-amber-500 text-white px-2 py-1 text-xs rounded"
                    >
                      تعديل
                    </button>

                    <button
                      onClick={() => handleDelete(item.pro_id)}
                      className="bg-red-600 text-white px-2 py-1 text-xs rounded"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}