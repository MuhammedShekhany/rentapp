"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type OrderType = {
  or_id: number;
  or_date: string;
  or_total: number;
  or_cus_name: string;
  or_cus_phone: string;
  or_cus_phone2: string;
  or_delivery: number;
  or_receipt: number;
  or_preparing: number;
  or_note: string;
  br_id: number;
  user_id: number;
  createat: string;
  or_prepare_date: string;
  or_vip: number;
  or_delayed: number;
  or_date_reserve: string;
  or_gat_id: number;
  or_gat_name: string;
  user_name: string;
  paid_total: number;
  remaining: number;
};

type OrderGroupType = {
  or_gat_id: number;
  or_gat_name: string;
  total: number;
  paid: number;
  remaining: number;
  count: number;
};

type FilterType =
  | "daily"
  | "monthly"
  | "yearly";

export default function OrderReportPage() {
  const router = useRouter();

  // =========================
  // STATES
  // =========================

  const [groups, setGroups] =
    useState<OrderGroupType[]>(
      []
    );

  const [orders, setOrders] =
    useState<OrderType[]>([]);

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

  const loadData = async () => {
    try {
      setLoading(true);

      let query =
        `type=${filterType}`;

      // DAILY

      if (
        filterType === "daily"
      ) {
        query += `&date=${selectedDate}`;
      }

      // MONTHLY

      if (
        filterType ===
        "monthly"
      ) {
        query += `&month=${selectedMonth}`;
      }

      // YEARLY

      if (
        filterType === "yearly"
      ) {
        query += `&year=${selectedYear}`;
      }

      // ====================
      // REPORT API
      // ====================

      const res =
        await fetch(
          `/api/report/order?${query}`
        );

      const data =
        await res.json();

      if (
        data.success
      ) {
        setGroups(
          data.data || []
        );

        setOrders(
          data.order || []
        );
      } else {
        setGroups([]);
        setOrders([]);
      }
    } catch (error) {
      console.error(error);

      setGroups([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FIRST LOAD
  // =========================

  useEffect(() => {
    const session =
      localStorage.getItem(
        "userSession"
      );

    if (!session) {
      router.push(
        "/login"
      );
      return;
    }

    loadData();
  }, []);

  // =========================
  // AUTO RELOAD
  // =========================

  useEffect(() => {
    loadData();
  }, [
    filterType,
    selectedDate,
    selectedMonth,
    selectedYear,
  ]);

  // =========================
  // TOTALS
  // =========================

  const totalOrders =
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

  const totalPaid =
    useMemo(() => {
      return groups.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.paid || 0
          ),
        0
      );
    }, [groups]);

  const totalRemaining =
    useMemo(() => {
      return groups.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.remaining || 0
          ),
        0
      );
    }, [groups]);

  // =========================
  // FILTERED ORDERS
  // =========================

  const filteredRows =
    useMemo(() => {
      if (
        !selectedGroupId
      )
        return [];

      return orders.filter(
        (o) =>
          Number(
            o.or_gat_id
          ) ===
          Number(
            selectedGroupId
          )
      );
    }, [
      orders,
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
              تقرير الطلبات
            </h1>

            <p className="text-gray-600 mt-1">
              تحليل الطلبات حسب المجموعة
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

        {/* TOTALS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* TOTAL */}

          <div className="bg-white rounded-2xl shadow p-6">

            <div className="text-gray-500 text-sm">
              إجمالي الطلبات
            </div>

            <div className="text-4xl font-bold text-green-600 mt-3">

              {formatNumber(
                totalOrders
              )}

            </div>

          </div>

          {/* PAID */}

          <div className="bg-white rounded-2xl shadow p-6">

            <div className="text-gray-500 text-sm">
              المدفوع
            </div>

            <div className="text-4xl font-bold text-blue-600 mt-3">

              {formatNumber(
                totalPaid
              )}

            </div>

          </div>

          {/* REMAINING */}

          <div className="bg-white rounded-2xl shadow p-6">

            <div className="text-gray-500 text-sm">
              المتبقي
            </div>

            <div className="text-4xl font-bold text-red-600 mt-3">

              {formatNumber(
                totalRemaining
              )}

            </div>

          </div>

        </div>

        {/* GROUPS */}

        <div className="bg-white rounded-2xl shadow p-5">

          <h2 className="text-lg font-bold mb-4">
            المجموعات
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-2">

            {groups.map(
              (g) => (
                <div
                  key={
                    g.or_gat_id
                  }
                  onClick={() =>
                    setSelectedGroupId(
                      g.or_gat_id
                    )
                  }
                  className={`min-w-[260px] cursor-pointer rounded-2xl border p-5 transition
                  ${
                    selectedGroupId ===
                    g.or_gat_id
                      ? "bg-green-100 border-green-500"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >

                  <div className="text-sm text-gray-500">
                    المجموعة
                  </div>

                  <div className="text-xl font-bold mt-2">
                    {
                      g.or_gat_name
                    }
                  </div>

                  <div className="mt-4">

                    <div className="text-sm text-gray-500">
                      الإجمالي
                    </div>

                    <div className="text-2xl font-bold text-green-600">

                      {formatNumber(
                        g.total
                      )}

                    </div>

                  </div>

                  <div className="mt-3">

                    <div className="text-sm text-gray-500">
                      المدفوع
                    </div>

                    <div className="text-xl font-bold text-blue-600">

                      {formatNumber(
                        g.paid
                      )}

                    </div>

                  </div>

                  <div className="mt-3">

                    <div className="text-sm text-gray-500">
                      المتبقي
                    </div>

                    <div className="text-xl font-bold text-red-600">

                      {formatNumber(
                        g.remaining
                      )}

                    </div>

                  </div>

                  <div className="text-sm text-gray-500 mt-4">

                    عدد الطلبات:
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
                      الزبون
                    </th>

                    <th className="p-4 text-right">
                      الهاتف 1
                    </th>

                    <th className="p-4 text-right">
                      الهاتف 2
                    </th>

                    <th className="p-4 text-right">
                      الإجمالي
                    </th>

                    <th className="p-4 text-right">
                      المدفوع
                    </th>

                    <th className="p-4 text-right">
                      المتبقي
                    </th>

                    

                    <th className="p-4 text-right">
                      VIP
                    </th>
                    <th className="p-4 text-right">
                      نوع الطلب
                    </th>
                    <th className="p-4 text-right">
                      تاريخ التحضير
                    </th>

                    <th className="p-4 text-right">
                      تاريخ الحجز
                    </th>
                    <th className="p-4 text-right">
                      الملاحظات
                    </th>

                     <th className="p-4 text-right">
                      المستخدم
                    </th>
                    <th className="p-4 text-right">
                      الإجراءات
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredRows.map(
                    (item) => (
                      <tr
                        key={
                          item.or_id
                        }
                        className="border-b hover:bg-gray-50"
                      >

                        <td className="p-4 font-semibold">
                          #
                          {
                            item.or_id
                          }
                        </td>

                        <td className="p-4">

                          {new Date(
                            item.or_date
                          ).toLocaleDateString(
                            "en-GB"
                          )}

                        </td>

                        <td className="p-4 font-semibold">

                          {
                            item.or_cus_name
                          }

                        </td>

                        <td className="p-4">

                          {
                            item.or_cus_phone
                          }

                        </td>

                        <td className="p-4">

                          {item.or_cus_phone2 ||
                            "-"}

                        </td>

                        <td className="p-4 font-bold text-green-600">

                          {formatNumber(
                            item.or_total
                          )}

                        </td>

                        <td className="p-4 font-bold text-blue-600">

                          {formatNumber(
                            item.paid_total
                          )}

                        </td>

                        <td className="p-4 font-bold text-red-600">

                          {formatNumber(
                            item.remaining
                          )}

                        </td>

                        <td className="p-4">

                          {item.or_vip === 1
                            ? "VIP"
                            : "-"}

                        </td>

                        <td className="p-4">

                          {item.or_gat_name}

                        </td>

                        <td className="p-4">

                          {item.or_prepare_date
                            ? new Date(
                                item.or_prepare_date
                              ).toLocaleDateString(
                                "en-GB"
                              )
                            : "-"}

                        </td>

                        <td className="p-4">

                          {item.or_date_reserve
                            ? new Date(
                                item.or_date_reserve
                              ).toLocaleDateString(
                                "en-GB"
                              )
                            : "-"}

                        </td>
                        <td className="p-4">

                          {item.or_note ||
                            "-"}

                        </td>

                        <td className="p-4">

                          {item.user_name ||
                            "-"}

                        </td>

                        <td className="p-4 no-print">
                          <button
                            onClick={() => router.push(`/br_admin/order/print/${item.or_id}`)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
                          >
                            تفاصيل
                          </button>
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