"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

type SpendGatType = {
  sp_gat_id: number;
  sp_gat_name: string;
  br_id: string;
};
type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
  br_name?: string;
};

export default function AddSpendPage() {
  const router = useRouter();

  const [sp_total, setSpTotal] = useState<string>("0");

  const [sp_date, setSpDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [sp_detail, setSpDetail] = useState("");

  // ✅ NEW
  const [sp_gat_id, setSpGatId] = useState("");

  const [spGats, setSpGats] = useState<
    SpendGatType[]
  >([]);

  const [br_id, setBrId] = useState("");
  const [user_id, setUserId] = useState("");

  const [loading, setLoading] =
    useState(false);


    const [user, setUser] = useState<UserType | null>(null);

  // ======================
  // FORMAT NUMBER
  // ======================

  const formatNumber = (value: string) => {
    const num = Number(
      value.replace(/,/g, "") || 0
    );

    return num.toLocaleString("en-US");
  };

  // ======================
  // LOAD SESSION + GROUPS
  // ======================

  useEffect(() => {
    const session =
      localStorage.getItem("userSession");

    if (!session) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(session);

    const parsedUser: UserType = JSON.parse(session);
  
      setUser(parsedUser);


    setUserId(user.user_id);
    setBrId(user.br_id);

    loadSpendGroups();
  }, [router]);

  // ======================
  // LOAD SPEND GROUPS
  // ======================

  const loadSpendGroups = async () => {
    try {
      const res = await fetch(`/api/spend_gat?br_id=${user!.br_id}`);

      const data = await res.json();

      if (data.success) {
        setSpGats(data.spend_gat);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ======================
  // SAVE
  // ======================

  const handleSave = async () => {
    const amount = Number(
      sp_total.replace(/,/g, "")
    );

    if (
      !amount ||
      !sp_date ||
      !br_id ||
      !user_id
    ) {
      return alert(
        "يرجى تعبئة جميع الحقول المطلوبة"
      );
    }

    setLoading(true);

    try {
      const res = await fetch(
        "/api/spend",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            sp_total: amount,

            sp_date,

            sp_detail,

            // ✅ NEW
            sp_gat_id:
              sp_gat_id || null,

            br_id,

            user_id,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert(
          "تم إضافة المصروف بنجاح"
        );

        router.push(
          "/br_admin/spend"
        );
      } else {
        alert(
          data.message ||
            "فشل إضافة المصروف"
        );
      }
    } catch (error) {
      console.error(error);

      alert("خطأ في السيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-100 p-4 md:p-6"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER */}

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            إضافة مصروف
          </h1>

          <p className="text-gray-600 mt-1">
            إنشاء سجل مصروف جديد
          </p>
        </div>

        {/* FORM */}

        <div className="bg-white rounded-2xl shadow p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* TOTAL */}

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                المبلغ
              </label>

              <input
                type="text"
                value={formatNumber(
                  sp_total
                )}
                onChange={(e) => {
                  const raw =
                    e.target.value.replace(
                      /,/g,
                      ""
                    );

                  if (
                    !isNaN(Number(raw))
                  ) {
                    setSpTotal(raw);
                  }
                }}
                className="border p-3 rounded-xl w-full focus:ring-1 focus:ring-blue-400 outline-none"
                placeholder="أدخل المبلغ"
              />
            </div>

            {/* DATE */}

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                التاريخ
              </label>

              <input
                type="date"
                value={sp_date}
                onChange={(e) =>
                  setSpDate(
                    e.target.value
                  )
                }
                className="border p-3 rounded-xl w-full focus:ring-1 focus:ring-blue-400 outline-none"
              />
            </div>

            {/* ✅ SPEND GROUP */}

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                مجموعة المصروف
              </label>

              <select
                value={sp_gat_id}
                onChange={(e) =>
                  setSpGatId(
                    e.target.value
                  )
                }
                className="border p-3 rounded-xl w-full focus:ring-1 focus:ring-blue-400 outline-none bg-white"
              >
                <option value="">
                  اختر مجموعة المصروف
                </option>

                {spGats.map((item) => (
                  <option
                    key={
                      item.sp_gat_id
                    }
                    value={
                      item.sp_gat_id
                    }
                  >
                    {
                      item.sp_gat_name
                    }
                  </option>
                ))}
              </select>
            </div>

            {/* DETAIL */}

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                التفاصيل
              </label>

              <textarea
                value={sp_detail}
                onChange={(e) =>
                  setSpDetail(
                    e.target.value
                  )
                }
                className="border p-3 rounded-xl w-full focus:ring-1 focus:ring-blue-400 outline-none"
                rows={4}
                placeholder="أدخل تفاصيل المصروف"
              />
            </div>

          </div>

          {/* BUTTONS */}

          <div className="flex gap-3 mt-6">

            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading
                ? "جاري الحفظ..."
                : "حفظ المصروف"}
            </button>

            <button
              onClick={() =>
                router.push(
                  "/br_admin/spend"
                )
              }
              className="bg-gray-800 text-white px-6 py-3 rounded-xl shadow hover:bg-gray-900 transition"
            >
              إلغاء
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}