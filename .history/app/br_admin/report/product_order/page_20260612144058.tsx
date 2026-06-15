"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductType = {
  pro_id: number;
  pro_no: number;
  pro_name: string;
  pro_price: number;
  or_id: number;
  or_no: number;
  or_date: string;
  or_cus_name: string;
  ord_price: number;
  total_qt: number;
  total_amount: number;
  pro_gat_id: number;
};

type GatGroupType = {
  pro_gat_id: number;
  pro_gat_name: string;
  total: number;
  count: number;
  products: ProductType[];
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

export default function ProductGatReportPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<GatGroupType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("daily");

  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
  );

  const [selectedMonth, setSelectedMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const [selectedYear, setSelectedYear] = useState(
    String(today.getFullYear())
  );


    const [user, setUser] =
              useState<UserType | null>(null);

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async (br_id: string) => {
    try {
      setLoading(true);

      let query = `type=${filterType}`;

      if (filterType === "daily") query += `&date=${selectedDate}`;
      if (filterType === "monthly") query += `&month=${selectedMonth}`;
      if (filterType === "yearly") query += `&year=${selectedYear}`;
      query += `&br_id=${br_id}`;

      const res = await fetch(
        `/api/report/product_order?${query}`
      );

      const data = await res.json();

      if (data.success) {
        setGroups(data.data || []);

        if (data.data?.length > 0) {
          setSelectedGroupId(data.data[0].pro_gat_id);
        }
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.log(error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("userSession") || "{}");

      

        setUser(user);
    if (!user) {
      router.push("/login");
      return;
    }

    loadData(user.br_id);
  }, []);

  useEffect(() => {
    if (!user?.br_id) return;
    loadData(user.br_id);
  }, [filterType, selectedDate, selectedMonth, selectedYear]);

  // =========================
  // TOTAL SALES
  // =========================
  const totalAmount = useMemo(() => {
    return groups.reduce((sum, g) => sum + Number(g.total || 0), 0);
  }, [groups]);

  // =========================
  // TOTAL QUANTITY
  // =========================
  const totalQuantity = useMemo(() => {
    return groups.reduce((sum, g) => {
      return (
        sum +
        g.products.reduce(
          (s, p) => s + Number(p.total_qt || 0),
          0
        )
      );
    }, 0);
  }, [groups]);

  // =========================
  // PRODUCT SUMMARY (NEW)
  // =========================
  const productSummary = useMemo(() => {
    const map: Record<
      string,
      { name: string; qty: number }
    > = {};

    groups.forEach((g) => {
      g.products.forEach((p) => {
        if (!map[p.pro_name]) {
          map[p.pro_name] = {
            name: p.pro_name,
            qty: 0,
          };
        }

        map[p.pro_name].qty += Number(p.total_qt || 0);
      });
    });

    return Object.values(map).sort(
      (a, b) => b.qty - a.qty
    );
  }, [groups]);

  // =========================
  // FILTERED PRODUCTS
  // =========================
  const filteredProducts = useMemo(() => {
    const group = groups.find(
      (g) =>
        Number(g.pro_gat_id) ===
        Number(selectedGroupId)
    );
    console.log(filteredProducts);

    return group?.products || [];
  }, [groups, selectedGroupId]);

  const format = (n: number) =>
    Number(n || 0).toLocaleString("en-US");

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6" dir="rtl">

      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              تقرير المنتجات
            </h1>
            <p className="text-gray-600 mt-1">
              تحليل حسب المجموعات
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

          <div>
            <label className="block mb-2 text-sm font-semibold">
              نوع التقرير
            </label>

            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(
                  e.target.value as FilterType
                )
              }
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
              onChange={(e) =>
                setSelectedDate(e.target.value)
              }
              className="border p-3 rounded-xl"
            />
          )}

          {filterType === "monthly" && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value)
              }
              className="border p-3 rounded-xl"
            />
          )}

          {filterType === "yearly" && (
            <input
              type="number"
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(e.target.value)
              }
              className="border p-3 rounded-xl w-[140px]"
            />
          )}
        </div>

        {/* TOTAL CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="text-gray-500 text-sm">
              إجمالي المبيعات
            </div>
            <div className="text-4xl font-bold text-green-600 mt-3">
              {format(totalAmount)}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="text-gray-500 text-sm">
              إجمالي الكمية المباعة
            </div>
            <div className="text-4xl font-bold text-blue-600 mt-3">
              {format(totalQuantity)}
            </div>
          </div>

        </div>

        {/* PRODUCT CARDS (NEW) */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-lg font-bold mb-4">
            ملخص المنتجات (حسب الكمية)
          </h2>

          {productSummary.length === 0 ? (
            <div className="text-center text-gray-500 p-6">
              لا توجد بيانات
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

              {productSummary.map((p, i) => (
                <div
                  key={i}
                  className="border rounded-2xl p-4 bg-gray-50"
                >
                  <div className="text-sm text-gray-500">
                    المنتج
                  </div>

                  <div className="font-bold text-lg mt-1">
                    {p.name}
                  </div>

                  <div className="text-2xl font-bold text-blue-600 mt-3">
                    {p.qty}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    إجمالي الكمية
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>

        {/* GROUPS */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-lg font-bold mb-4">
            المجموعات
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-2">

            {groups.map((g) => (
              <div
                key={g.pro_gat_id}
                onClick={() =>
                  setSelectedGroupId(g.pro_gat_id)
                }
                className={`min-w-[220px] cursor-pointer rounded-2xl border p-5
                ${
                  selectedGroupId === g.pro_gat_id
                    ? "bg-green-100 border-green-500"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="text-sm text-gray-500">
                  المجموعة
                </div>

                <div className="text-xl font-bold mt-2">
                  {g.pro_gat_name}
                </div>

                <div className="mt-4 text-2xl font-bold text-green-600">
                  {format(g.total)}
                </div>

                <div className="text-sm text-gray-500 mt-2">
                  عدد العمليات: {g.count}
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">

          <div className="p-5 border-b text-lg font-bold">
            تفاصيل المنتجات
          </div>

          {loading ? (
            <div className="p-10 text-center">
              جاري التحميل...
            </div>
          ) : !selectedGroupId ? (
            <div className="p-10 text-center text-gray-500">
              اختر مجموعة
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              لا توجد بيانات
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-right">الطلب</th>
                    <th className="p-4 text-right">الزبون</th>
                    <th className="p-4 text-right">التاريخ</th>
                    <th className="p-4 text-right">المنتج</th>
                    <th className="p-4 text-right">السعر</th>
                    <th className="p-4 text-right">الكمية</th>
                    <th className="p-4 text-right">الإجمالي</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredProducts.map((p, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4 font-bold">
                        {p.or_no}
                      </td>
                      
                       <td className="p-4 font-semibold">
                        {p.or_cus_name}
                      </td>

                      <td className="p-4">
                        {new Date(p.or_date).toLocaleDateString("en-GB")}
                      </td>

                      <td className="p-4 font-semibold">
                        {p.pro_name}
                      </td>

                      <td className="p-4">
                        {format(p.ord_price)}
                      </td>

                      <td className="p-4">
                        {p.total_qt}
                      </td>

                      <td className="p-4 font-bold text-green-600">
                        {format(p.total_amount)}
                      </td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}