"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type SpendType = {
  sp_id: number;
  sp_no: number;
  sp_total: number;
  sp_date: string;
  sp_detail: string;
  sp_gat_id: number;
  sp_gat_name: string;
  user_name: string;
};

type SpendGroupType = {
  sp_gat_id: number;
  sp_gat_name: string;
  total: number;
  count: number;
};


type UserType = {
    user_id: string;
    user_name: string;
    user_fullname: string;
    user_role: string;
    br_id: string;
    br_name?: string;
};


type FilterType =
  | "daily"
  | "monthly"
  | "yearly";

export default function SpendReportPage() {
  const router = useRouter();

  // =========================
  // STATES
  // =========================

  const [groups, setGroups] =
    useState<SpendGroupType[]>(
      []
    );

  const [spends, setSpends] =
    useState<SpendType[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedGroupId, setSelectedGroupId] =
    useState<number | null>(
      null
    );

  const [filterType, setFilterType] =
    useState<FilterType>(
      "daily"
    );

  const [user, setUser] =
    useState<UserType | null>(null);

  // =========================
  // DATE STATES
  // =========================

  const today = new Date();

  const [selectedDate, setSelectedDate] =
    useState(
      today
        .toISOString()
        .split("T")[0]
    );

  const [selectedMonth, setSelectedMonth] =
    useState(
      `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}`
    );

  const [selectedYear, setSelectedYear] =
    useState(
      String(
        today.getFullYear()
      )
    );

 // =========================
  // LOAD DATA
  // =========================

  const loadData = async (br_id: string) => {
    try {
      setLoading(true);

      let query = `type=${filterType}`;

      // DAILY
      if (filterType === "daily") {
        query += `&date=${selectedDate}`;
      }

      // MONTHLY
      if (filterType === "monthly") {
        query += `&month=${selectedMonth}`;
      }

      // YEARLY
      if (filterType === "yearly") {
        query += `&year=${selectedYear}`;
      }

      query += `&br_id=${br_id}`;

      // طلب البيانات الموحد (المجموعات + التفاصيل بنفس الفلترة)
      const res = await fetch(`/api/report/spend?${query}`);
      const resultData = await res.json();

      if (resultData.success) {
        setGroups(resultData.data || []);
        setSpends(resultData.spend || []); // جلب تفاصيل هذا الشهر فقط
      } else {
        setGroups([]);
        setSpends([]);
      }
    } catch (error) {
      console.error(error);
      setGroups([]);
      setSpends([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 1. FIRST LOAD EFFECT: CHECK SESSION ONLY
  // ==========================================
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
  }, [router]);

  

  // ==========================================
  // 2. DATA LOAD EFFECT: DEPENDS ON FILTERS & USER
  // ==========================================
// ==========================================
  // EFFECT: DATA LOAD
  // ==========================================
  useEffect(() => {
    if (user?.br_id) {
      setSelectedGroupId(null); // تصفير المجموعة المختارة عند الانتقال لشهر آخر
      loadData(user.br_id);
    }
  }, [user, filterType, selectedDate, selectedMonth, selectedYear]);

  // =========================
  // TOTAL
  // =========================

  const totalSpend =
    useMemo(() => {
      return groups.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.total || 0
          ),
        0
      );
    }, [groups]);

  // =========================
  // FILTERED SPENDS
  // =========================

  const filteredRows =
    useMemo(() => {
      if (
        !selectedGroupId
      )
        return [];

      return spends.filter(
        (s) =>
          Number(
            s.sp_gat_id
          ) ===
          Number(
            selectedGroupId
          )
      );
    }, [
      spends,
      selectedGroupId,
    ]);

  // =========================
  // FORMAT
  // =========================

  const formatNumber = (
    num: number
  ) =>
    Number(
      num || 0
    ).toLocaleString(
      "en-US"
    );

  return (
    <div
      className="min-h-screen bg-gray-100 p-4 md:p-6"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="flex justify-between items-center">

          <div>

            <h1 className="text-3xl font-bold">
              تقرير المصروفات
            </h1>

            <p className="text-gray-600 mt-1">
              تحليل المصروفات حسب المجموعة
            </p>

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

          {/* TYPE */}

          <div>
            <label className="block mb-2 text-sm font-semibold">
              نوع التقرير
            </label>

            <select
              value={
                filterType
              }
              onChange={(
                e
              ) =>
                setFilterType(
                  e.target
                    .value as FilterType
                )
              }
              className="border p-3 rounded-xl"
            >
              <option value="daily">
                يومي
              </option>

              <option value="monthly">
                شهري
              </option>

              <option value="yearly">
                سنوي
              </option>

            </select>
          </div>

          {/* DAILY */}

          {filterType ===
            "daily" && (
            <div>
              <label className="block mb-2 text-sm font-semibold">
                التاريخ
              </label>

              <input
                type="date"
                value={
                  selectedDate
                }
                onChange={(
                  e
                ) =>
                  setSelectedDate(
                    e.target
                      .value
                  )
                }
                className="border p-3 rounded-xl"
              />
            </div>
          )}

          {/* MONTH */}

          {filterType ===
            "monthly" && (
            <div>
              <label className="block mb-2 text-sm font-semibold">
                الشهر
              </label>

              <input
                type="month"
                value={
                  selectedMonth
                }
                onChange={(
                  e
                ) =>
                  setSelectedMonth(
                    e.target
                      .value
                  )
                }
                className="border p-3 rounded-xl"
              />
            </div>
          )}

          {/* YEAR */}

          {filterType ===
            "yearly" && (
            <div>
              <label className="block mb-2 text-sm font-semibold">
                السنة
              </label>

              <input
                type="number"
                value={
                  selectedYear
                }
                onChange={(
                  e
                ) =>
                  setSelectedYear(
                    e.target
                      .value
                  )
                }
                className="border p-3 rounded-xl w-[140px]"
              />
            </div>
          )}

        </div>

        {/* TOTAL CARD */}

        <div className="bg-white rounded-2xl shadow p-6">

          <div className="text-gray-500 text-sm">
            إجمالي المصروفات
          </div>

          <div className="text-4xl font-bold text-amber-600 mt-3">

            {formatNumber(
              totalSpend
            )}

          </div>

        </div>

        {/* GROUP CARDS */}

        <div className="bg-white rounded-2xl shadow p-5">

          <h2 className="text-lg font-bold mb-4">
            المجموعات
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-2">

            {groups.map(
              (g) => (
                <div
                  key={
                    g.sp_gat_id
                  }
                  onClick={() =>
                    setSelectedGroupId(
                      g.sp_gat_id
                    )
                  }
                  className={`min-w-[220px] cursor-pointer rounded-2xl border p-5 transition
                  ${
                    selectedGroupId ===
                    g.sp_gat_id
                      ? "bg-amber-100 border-amber-500"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >

                  <div className="text-sm text-gray-500">
                    المجموعة
                  </div>

                  <div className="text-xl font-bold mt-2">
                    {
                      g.sp_gat_name
                    }
                  </div>

                  <div className="mt-4 text-2xl font-bold text-amber-600">

                    {formatNumber(
                      g.total
                    )}

                  </div>

                  <div className="text-sm text-gray-500 mt-2">

                    عدد العمليات:
                    {" "}
                    {g.count}

                  </div>

                </div>
              )
            )}

          </div>

        </div>

        {/* TABLE */}

        <div className="bg-white rounded-2xl shadow overflow-hidden">

          <div className="p-5 border-b text-lg font-bold">

            تفاصيل المجموعة

          </div>

          {loading ? (

            <div className="p-10 text-center">
              جاري التحميل...
            </div>

          ) : !selectedGroupId ? (

            <div className="p-10 text-center text-gray-500">

              اختر مجموعة لعرض التفاصيل

            </div>

          ) : filteredRows.length ===
            0 ? (

            <div className="p-10 text-center text-gray-500">

              لا توجد بيانات

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-gray-100">

                  <tr>

                    <th className="p-4 text-right">
                      الرقم
                    </th>

                    <th className="p-4 text-right">
                      التاريخ
                    </th>

                    <th className="p-4 text-right">
                      المبلغ
                    </th>

                    <th className="p-4 text-right">
                      التفاصيل
                    </th>

                    <th className="p-4 text-right">
                      المستخدم
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredRows.map(
                    (item) => (
                      <tr
                        key={
                          item.sp_id
                        }
                        className="border-b hover:bg-gray-50"
                      >

                        <td className="p-4 font-semibold">
                          #
                          {
                            item.sp_no
                          }
                        </td>

                        <td className="p-4">

                          {new Date(
                            item.sp_date
                          ).toLocaleDateString(
                            "en-GB"
                          )}

                        </td>

                        <td className="p-4 font-bold text-amber-600">

                          {formatNumber(
                            item.sp_total
                          )}

                        </td>

                        <td className="p-4">

                          {item.sp_detail ||
                            "-"}

                        </td>

                        <td className="p-4">

                          {item.user_name ||
                            "-"}

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>
    </div>
  );
}