"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import heic2any from "heic2any";
import imageCompression from "browser-image-compression";

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

export default function AddProductPage() {
  const router = useRouter();

  const [pro_name, setProName] = useState("");
  const [pro_price, setProPrice] = useState("");
  const [rawPrice, setRawPrice] = useState("");

  const [pro_gat_id, setProGatId] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [categories, setCategories] = useState<CategoryType[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
   const [user, setUser] =
          useState<UserType | null>(null);

  
  

  // ======================
  // تحميل المستخدم + التصنيفات
  // ======================
  useEffect(() => {
          const session =
              localStorage.getItem(
                  "userSession"
              );
  
          if (!session) {
              router.replace("/login");
              return;
          }
  
          const parsedUser: UserType =
              JSON.parse(session);
  
          setUser(parsedUser);
  
         
      }, [router]);
  
  
      useEffect(() => {
      if (user?.br_id) {
        loadCategories();
      }
    }, [user]);

  const loadCategories = async () => {
    try {
      const res = await fetch(`/api/pro_gat?br_id=${user!.br_id}`);
      const data = await res.json();

      if (data.success) {
        setCategories(data.pro_gat || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ======================
  // تنسيق السعر
  // ======================
  const handlePriceChange = (value: string) => {
    const numeric = value.replace(/\D/g, "");

    setRawPrice(numeric);

    setProPrice(
      numeric ? Number(numeric).toLocaleString() : ""
    );
  };

  // ======================
  // رفع الصورة
  // ======================
const handleUpload = async (file: File) => {
  try {
    let uploadFile: File = file;

    const ext = file.name.split(".").pop()?.toLowerCase();

    // =========================
    // 1. Convert HEIC → JPG
    // =========================
    if (
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      ext === "heic" ||
      ext === "heif"
    ) {
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.85,
      });

      uploadFile = new File(
        [convertedBlob as Blob],
        file.name.replace(/\.(heic|heif)$/i, ".jpg"),
        {
          type: "image/jpeg",
        }
      );
    }

    // =========================
    // 2. Compress Image
    // =========================
    uploadFile = await imageCompression(uploadFile, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.8,
    });

    // =========================
    // 3. Upload to server
    // =========================
    const formData = new FormData();
    formData.append("file", uploadFile);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Upload failed");
    }

    return data.url;
  } catch (error) {
    console.error(error);
    throw new Error("فشل رفع الصورة");
  }
};

  // ======================
  // إضافة المنتج
  // ======================
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pro_name || !rawPrice || !pro_gat_id) {
      setMessage("يرجى ملء جميع الحقول");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const user = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      let imageName = "";

      if (imageFile) {
        imageName = await handleUpload(imageFile);
      }

      const res = await fetch("/api/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          pro_name,
          pro_price: Number(rawPrice),
          pro_gat_id,
          pro_img: imageName,
          user_id: user.user_id,
          br_id: user.br_id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        router.push("/br_admin/product");
      } else {
        setMessage(data.message || "حدث خطأ");
      }
    } catch (error: any) {
      setMessage(error.message || "خطأ في الخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-100 p-6 flex items-center justify-center"
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">



          {/* العنوان */}
          <h1 className="text-3xl font-bold text-right">
            إضافة منتج
          </h1>
          {/* رجوع */}
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-xl"
          >
            رجوع
          </button>

        </div>

        <form
          onSubmit={handleAdd}
          className="space-y-4"
        >

          {/* اسم المنتج */}
          <input
            type="text"
            value={pro_name}
            onChange={(e) =>
              setProName(e.target.value)
            }
            className="w-full border rounded-xl p-3 text-right"
            placeholder="اسم المنتج"
          />

          {/* التصنيف */}
          <select
            value={pro_gat_id}
            onChange={(e) =>
              setProGatId(e.target.value)
            }
            className="w-full border rounded-xl p-3 text-right"
          >
            <option value="">
              اختر التصنيف
            </option>

            {categories.map((c) => (
              <option
                key={c.pro_gat_id}
                value={c.pro_gat_id}
              >
                {c.pro_gat_name}
              </option>
            ))}
          </select>

          {/* السعر */}
          <input
            type="text"
            value={pro_price}
            onChange={(e) =>
              handlePriceChange(e.target.value)
            }
            className="w-full border rounded-xl p-3 text-right"
            placeholder="السعر"
          />

          {/* رفع الصورة */}
          <div>

            <label className="block mb-2 font-medium text-right">
              صورة المنتج
            </label>

            <input
              type="file"
              id="productImg"
              className="hidden"
               accept="image/*,.heic,.heif"
              onChange={(e) =>
                setImageFile(
                  e.target.files?.[0] || null
                )
              }
            />

            {/* الصورة بالمنتصف */}
            <div className="flex flex-row items-center justify-center gap-3">

              {/* الصورة */}
              <div
                className="w-35 h-35 border rounded-full overflow-hidden cursor-pointer flex items-center justify-center text-center"
                onClick={() =>
                  document
                    .getElementById("productImg")
                    ?.click()
                }
              >
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "لا توجد صورة"
                )}
              </div>

              {/* زر الحذف */}
              {imageFile && (
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="bg-red-500 text-white px-3 py-1 rounded-xl"
                >
                  حذف
                </button>
              )}

            </div>

          </div>

          {/* الرسالة */}
          {message && (
            <p className="text-red-500 text-right">
              {message}
            </p>
          )}

          {/* الأزرار */}
          <div className="flex gap-3">

            {/* حفظ يسار */}
            <button
              type="submit"
              disabled={loading}
               className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl flex-1 transition-colors duration-200"
            >
              {loading
                ? "جاري الحفظ..."
                : "حفظ المنتج"}
            </button>



          </div>

        </form>

      </div>
    </div>

    
  );
}