"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SpendGroupType = {
  sp_gat_id: number;
  sp_gat_name: string;
  total_amount: number;
  total_count: number;
};

type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
  br_name?: string;
};

type FilterType = "daily" | "monthly" | "yearly";

export default function SpendReportPage() {
  const router = useRouter();

  // =========================
  // STATES
  // =========================
  const [groups, setGroups] = useState<SpendGroupType[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [filterType, setFilterType] = useState<FilterType>("daily");

  const [user, setUser] = useState<UserType | null>(null);

  // =========================
  // DATE STATES
  // =========================
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
  );

  const [selectedMonth, setSelectedMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async (br_id: string) => {
    try {
      setLoading(true);

      let query = `type=${filterType}`;

      if (filterType === "daily") {
        query += `&date=${selectedDate}`;
      }

      if (filterType === "monthly") {
        query += `&month=${selectedMonth}`;
      }

      if (filterType === "yearly") {
        query += `&year=${selectedYear}`;
      }

      query += `&br_id=${br_id}`;

      const res = await fetch(`/api/report/spend?${query}`);
      const data = await res.json();

      if (data.success) {
        setGroups(data.data || []);
      } else {
        setGroups([]);
      }
    } catch (err) {
      console.error(err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SESSION + RELOAD
  // =========================
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.push("/login");
      return;
    }

    const parsed: UserType = JSON.parse(session);

    if (!parsed?.br_id) {
      router.push("/login");
      return;
    }

    setUser(parsed);
    loadData(parsed.br_id);
  }, [filterType, selectedDate, selectedMonth, selectedYear]);

  // =========================
  // TOTAL
  // =========================
  const totalSpend = useMemo(() => {
    return groups.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  }, [groups]);

  // =========================
  // FILTERED ROWS (no API needed anymore)
  // =========================
  const selectedGroup = groups.find(
    (g) => g.sp_gat_id === selectedGroupId
  );

  // =========================
  // FORMAT
  // =========================
  const formatNumber = (num: number) =>
    Number(num || 0).toLocaleString("en-US");

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">تقرير المصروفات</h1>
            <p className="text-gray-600 mt-1">تحليل المصروفات حسب المجموعة</p>
          </div>

          <button
            onClick={() => router.back()}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            رجوع
          </button>
        </div>

        {/* FILTER */}
        <div className="bg-white p-5 rounded-2xl shadow flex flex-wrap gap-4 items-end">

          <div>
            <label className="block mb-2 text-sm font-semibold">نوع التقرير</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="border p-3 rounded-xl"
            >
              <option value="daily">يومي</option>
              <option value="monthly">شهري</option>
              <option value="yearly">سنوي</option>
            </select>
          </div>

          {filterType === "daily" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border p-3 rounded-xl"
            />
          )}

          {filterType === "monthly" && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border p-3 rounded-xl"
            />
          )}

          {filterType === "yearly" && (
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border p-3 rounded-xl w-[140px]"
            />
          )}
        </div>

        {/* TOTAL */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-gray-500 text-sm">إجمالي المصروفات</div>
          <div className="text-4xl font-bold text-amber-600 mt-3">
            {formatNumber(totalSpend)}
          </div>
        </div>

        {/* GROUPS */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-lg font-bold mb-4">المجموعات</h2>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {groups.map((g) => (
              <div
                key={g.sp_gat_id}
                onClick={() => setSelectedGroupId(g.sp_gat_id)}
                className={`min-w-[220px] cursor-pointer rounded-2xl border p-5 transition
                ${
                  selectedGroupId === g.sp_gat_id
                    ? "bg-amber-100 border-amber-500"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="text-sm text-gray-500">المجموعة</div>

                <div className="text-xl font-bold mt-2">
                  {g.sp_gat_name}
                </div>

                <div className="mt-4 text-2xl font-bold text-amber-600">
                  {formatNumber(g.total_amount)}
                </div>

                <div className="text-sm text-gray-500 mt-2">
                  عدد العمليات: {g.total_count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DETAILS */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-lg font-bold mb-4">تفاصيل المجموعة</div>

          {!selectedGroup ? (
            <div className="text-center text-gray-500 p-10">
              اختر مجموعة لعرض التفاصيل
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xl font-bold">
                {selectedGroup.sp_gat_name}
              </div>

              <div className="text-gray-600">
                إجمالي: {formatNumber(selectedGroup.total_amount)}
              </div>

              <div className="text-gray-600">
                عدد العمليات: {selectedGroup.total_count}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}