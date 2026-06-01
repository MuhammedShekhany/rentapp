"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type CategoryType = {
  pro_gat_id: number;
  pro_gat_name: string;
};
type UserType = {
    user_id: string;
    user_name: string;
    user_fullname: string;
    user_role: string;
    br_id: string;
    br_name?: string;
};


export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const pro_id = params.pro_id as string;

  const [pro_name, setProName] = useState("");
  const [pro_price, setProPrice] = useState("");
  const [rawPrice, setRawPrice] = useState("");

  const [pro_img, setProImg] = useState<string>("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const [pro_gat_id, setProGatId] = useState("");
  const [categories, setCategories] = useState<CategoryType[]>([]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [user, setUser] =
            useState<UserType | null>(null);

  // ======================
  // PRICE FORMAT
  // ======================
  const handlePriceChange = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    setRawPrice(numeric);
    setProPrice(numeric ? Number(numeric).toLocaleString() : "");
  };

  // ======================
  // LOAD CATEGORIES
  // ======================
  const loadCategories = async (br_id: string) => {
    const res =await fetch(`/api/pro_gat?br_id=${br_id}`);
    const data = await res.json();

    if (data.success) {
      setCategories(data.pro_gat || []);
    }
  };

  // ======================
  // LOAD PRODUCT
  // ======================

useEffect(() => {
        const user = JSON.parse(localStorage.getItem("userSession") || "{}");

      

        setUser(user);
        
        loadProduct();
      loadCategories(user.br_id);


       
    },[router, pro_id]);




     const loadProduct = async () => {
      try {
        setPageLoading(true);

        const res = await fetch(`/api/product/${pro_id}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (data.success) {
          const item = data.product;

          setProName(item.pro_name || "");

          const price = item.pro_price?.toString() || "";
          setRawPrice(price);
          setProPrice(price ? Number(price).toLocaleString() : "");

          setProImg(item.pro_img || "");
          setProGatId(item.pro_gat_id || "");
        } else {
          alert(data.message || "Product not found");
          router.push("/br_admin/product");
        }
      } catch (error) {
        router.push("/br_admin/product");
      } finally {
        setPageLoading(false);
      }
    };

  // ======================
  // UPLOAD IMAGE
  // ======================
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data.success) throw new Error("Upload failed");

    return data.url;
  };

  // ======================
  // UPDATE PRODUCT
  // ======================
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      let finalImage = pro_img;

      if (newImageFile) {
        finalImage = await handleUpload(newImageFile);
      }

      const res = await fetch(`/api/product/${pro_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pro_name,
          pro_price: Number(rawPrice),
          pro_img: finalImage,
          pro_gat_id,
          user_id: user.user_id,
          br_id: user.br_id,
        }),
      });

      const result = await res.json();

      if (result.success) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        router.push("/br_admin/product");
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">

        {/* HEADER (same as add page) */}
        <div className="flex items-center justify-between mb-6">

          

          <h1 className="text-3xl font-bold text-right">
            تعديل المنتج
          </h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-xl"
          >
            رجوع
          </button>

        </div>

        <form onSubmit={handleUpdate} className="space-y-4">

          

          {/* NAME */}
          <input
            value={pro_name}
            onChange={(e) => setProName(e.target.value)}
            className="w-full border rounded-xl p-3 text-right"
            placeholder="اسم المنتج"
          />

          {/* CATEGORY */}
          <select
            value={pro_gat_id}
            onChange={(e) => setProGatId(e.target.value)}
            className="w-full border rounded-xl p-3 text-right"
          >
            <option value="">اختر التصنيف</option>
            {categories.map((c) => (
              <option key={c.pro_gat_id} value={c.pro_gat_id}>
                {c.pro_gat_name}
              </option>
            ))}
          </select>

          {/* PRICE */}
          <input
            value={pro_price}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="w-full border rounded-xl p-3 text-right"
            placeholder="السعر"
          />


          {/* IMAGE */}
          <div>
            <label className="block mb-2 font-medium text-right">
              صورة المنتج
            </label>

            <input
              type="file"
              id="imgInput"
              className="hidden"
              accept="image/*"
              onChange={(e) =>
                setNewImageFile(e.target.files?.[0] || null)
              }
            />

            <div className="flex flex-col items-center gap-3">

              <div
                className="w-28 h-28 border rounded-full overflow-hidden cursor-pointer flex items-center justify-center"
                onClick={() =>
                  document.getElementById("imgInput")?.click()
                }
              >
                {newImageFile ? (
                  <img
                    src={URL.createObjectURL(newImageFile)}
                    className="w-full h-full object-cover"
                  />
                ) : pro_img ? (
                  <img
                    src={pro_img}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "No Image"
                )}
              </div>

              {(newImageFile || pro_img) && (
                <button
                  type="button"
                  onClick={() => {
                    setNewImageFile(null);
                    setProImg("");
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded-xl"
                >
                  حذف
                </button>
              )}

            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3">

            <button
              type="submit"
              className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-xl flex-1"
            >
              {loading ? "جاري التحديث..." : "تحديث المنتج"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}