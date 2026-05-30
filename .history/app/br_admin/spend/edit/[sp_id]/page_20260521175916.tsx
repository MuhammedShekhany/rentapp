"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type SpendGatType = {
  sp_gat_id: number;
  sp_gat_name: string;
};
type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
  br_name?: string;
};

export default function EditSpendPage() {
  const router = useRouter();
  const params = useParams();
  const sp_id = params.sp_id as string;

  const [sp_total, setSpTotal] = useState("0");
  const [sp_date, setSpDate] = useState("");
  const [sp_detail, setSpDetail] = useState("");

  const [sp_gat_id, setSpGatId] = useState("");
  const [spGats, setSpGats] = useState<SpendGatType[]>([]);

  const [br_id, setBrId] = useState("");
  const [user_id, setUserId] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

   const [user, setUser] = useState<UserType | null>(null);

  const formatNumber = (value: string) => {
    const num = Number(value.replace(/,/g, "") || 0);
    return num.toLocaleString("en-US");
  };

  // ======================
  // SESSION + LOAD
  // ======================
  useEffect(() => {
  const session = localStorage.getItem("userSession");

  if (!session) {
    router.push("/login");
    return;
  }

  const parsedUser: UserType = JSON.parse(session);

  setBrId(parsedUser.br_id || "");
  setUserId(parsedUser.user_id || "");

  loadSpend();
  loadGroups(parsedUser.br_id); // ✅ مهم
}, [router, sp_id]);


  useEffect(() => {
    if (user?.br_id) {
      loadGroups();
    }
  }, [user]);


  // ======================
  // LOAD GROUPS
  // ======================
  const loadGroups = async (br_id: string) => {
  try {
    const res = await fetch(`/api/spend_gat?br_id=${br_id}`);
    const data = await res.json();

    if (data.success) {
      setSpGats(data.spend_gat || []);
    }
  } catch (err) {
    console.error(err);
  }
};

  // ======================
  // LOAD SPEND
  // ======================
  const loadSpend = async () => {
    try {
      setPageLoading(true);

      const res = await fetch(`/api/spend/${sp_id}`);
      const data = await res.json();

      if (data.success) {
        const s = data.spend;

        //console.log("DEBUG DATA =>", JSON.stringify(data, null, 2));


        setSpTotal(String(s.sp_total ?? "0"));
        setSpDate(
          s.sp_date
            ? new Date(s.sp_date).toLocaleDateString("en-CA")
            : ""
        );
        setSpDetail(s.sp_detail ?? "");

        setSpGatId(String(s.sp_gat_id ?? ""));
        setBrId(String(s.br_id ?? ""));
        setUserId(String(s.user_id ?? ""));
      } else {
        router.push("/br_admin/spend");
      }
    } finally {
      setPageLoading(false);
    }
  };

  // ======================
  // UPDATE
  // ======================
  const handleUpdate = async () => {
    const amount = Number(sp_total.replace(/,/g, ""));

    if (!amount || !sp_date || !br_id || !user_id) {
      return alert("يرجى تعبئة الحقول");
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/spend/${sp_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sp_total: amount,
          sp_date,
          sp_detail,
          sp_gat_id: sp_gat_id || null,
          br_id,
          user_id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/br_admin/spend");
      } else {
        alert(data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl">

        <h1 className="text-2xl font-bold mb-4">تعديل المصروف</h1>

        {/* TOTAL */}
        <div className="mb-3">
          <label>المبلغ</label>
          <input
            value={formatNumber(sp_total)}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              if (!isNaN(Number(raw))) setSpTotal(raw);
            }}
            className="w-full border p-3 rounded-xl"
          />
        </div>

        {/* DATE */}
        <div className="mb-3">
          <label>التاريخ</label>
          <input
            type="date"
            value={sp_date}
            onChange={(e) => setSpDate(e.target.value)}
            className="w-full border p-3 rounded-xl"
          />
        </div>

        {/* GROUP FIXED */}
        <div className="mb-3">
          <label>المجموعة</label>


          <select
            value={sp_gat_id || ""}
            onChange={(e) => setSpGatId(e.target.value)}
            className="w-full border p-3 rounded-xl bg-white"
          >
            <option value="">اختر المجموعة</option>

            {spGats.map((g) => (
              <option
                key={g.sp_gat_id}
                value={String(g.sp_gat_id)}
              >
                {g.sp_gat_name}
              </option>
            ))}
          </select>
        </div>

        {/* DETAIL */}
        <div className="mb-3">
          <label>التفاصيل</label>
          <textarea
            value={sp_detail}
            onChange={(e) => setSpDetail(e.target.value)}
            className="w-full border p-3 rounded-xl"
            rows={4}
          />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            {loading ? "جاري..." : "تحديث"}
          </button>

          <button
            onClick={() => router.push("/br_admin/spend")}
            className="bg-gray-800 text-white px-6 py-3 rounded-xl"
          >
            إلغاء
          </button>
        </div>

      </div>
    </div>
  );
}