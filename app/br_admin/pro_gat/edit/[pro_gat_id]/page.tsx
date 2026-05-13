"use client";

import { useEffect, useState } from "react";
import {
  useRouter,
  useParams,
} from "next/navigation";

export default function EditProductCategoryPage() {
  const router = useRouter();

  const params = useParams();

  const pro_gat_id =
    params.pro_gat_id as string;

  const [
    pro_gat_name,
    setProGatName,
  ] = useState("");

  const [br_id, setBrId] =
    useState("");

  const [user_id, setUserId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    pageLoading,
    setPageLoading,
  ] = useState(true);

  // ======================
  // SESSION + LOAD
  // ======================

  useEffect(() => {
    const session =
      localStorage.getItem(
        "userSession"
      );

    if (!session) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(session);

    setBrId(user.br_id || "");

    setUserId(user.user_id || "");

    loadCategory();

  }, [router, pro_gat_id]);

  // ======================
  // LOAD CATEGORY
  // ======================

  const loadCategory =
    async () => {
      try {
        setPageLoading(true);

        const res = await fetch(
          `/api/pro_gat/${pro_gat_id}`
        );

        const data =
          await res.json();

        if (data.success) {
          const c =
            data.pro_gat;

          setProGatName(
            c.pro_gat_name ??
              ""
          );

          setBrId(
            String(
              c.br_id ?? ""
            )
          );

          setUserId(
            String(
              c.user_id ?? ""
            )
          );

        } else {

          router.push(
            "/br_admin/pro_gat"
          );

        }

      } catch (error) {

        console.error(error);

      } finally {

        setPageLoading(false);

      }
    };

  // ======================
  // UPDATE
  // ======================

  const handleUpdate =
    async () => {
      if (
        !pro_gat_name ||
        !br_id ||
        !user_id
      ) {
        return alert(
          "يرجى تعبئة الحقول"
        );
      }

      setLoading(true);

      try {
        const res = await fetch(
          `/api/pro_gat/${pro_gat_id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              pro_gat_name,

              br_id,

              user_id,
            }),
          }
        );

        const data =
          await res.json();

        if (data.success) {

          router.push(
            "/br_admin/pro_gat"
          );

        } else {

          alert(data.message);

        }

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }
    };

  // ======================
  // LOADING
  // ======================

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-100 p-4"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl">

        <h1 className="text-2xl font-bold mb-4">
          تعديل مجموعة المنتجات
        </h1>

        {/* NAME */}

        <div className="mb-3">

          <label>
            اسم المجموعة
          </label>

          <input
            type="text"
            value={pro_gat_name}
            onChange={(e) =>
              setProGatName(
                e.target.value
              )
            }
            className="w-full border p-3 rounded-xl"
            placeholder="اسم المجموعة"
          />

        </div>

        {/* BUTTONS */}

        <div className="flex gap-3 mt-4">

          <button
            onClick={
              handleUpdate
            }
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            {loading
              ? "جاري..."
              : "تحديث"}
          </button>

          <button
            onClick={() =>
              router.push(
                "/br_admin/pro_gat"
              )
            }
            className="bg-gray-800 text-white px-6 py-3 rounded-xl"
          >
            إلغاء
          </button>

        </div>

      </div>
    </div>
  );
}