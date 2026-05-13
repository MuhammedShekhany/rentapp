"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductCategoryType = {
    pro_gat_id: number;
    pro_gat_name: string;

    br_name?: string;
    user_name?: string;
};

type UserType = {
    user_id: string;
    user_name: string;
    user_fullname: string;
    user_role: string;
    br_id: string;
    br_name?: string;
};

export default function ProductCategoryPage() {
    const router = useRouter();

    const [categories, setCategories] = useState<
        ProductCategoryType[]
    >([]);

    const [loading, setLoading] =
        useState(true);

    // 🔎 SEARCH
    const [search, setSearch] =
        useState("");

    const [user, setUser] =
        useState<UserType | null>(null);

    // ======================
    // BASE PATH
    // ======================

    const basePath = useMemo(() => {
        if (!user) return "";

        return user.user_role === "br_admin"
            ? "/br_admin"
            : user.user_role === "br_ass"
                ? "/br_ass"
                : "/br_user";
    }, [user]);

    // ======================
    // LOAD DATA
    // ======================

    const loadCategories = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                "/api/pro_gat"
            );

            const data = await res.json();

            if (data.success) {
                setCategories(data.pro_gat);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error(error);

            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    // ======================
    // FIRST LOAD
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

        loadCategories();
    }, [router]);

    // ======================
    // DELETE
    // ======================

    const handleDelete = async (
        pro_gat_id: number
    ) => {
        const ok = confirm(
            "هل أنت متأكد من حذف المجموعة؟"
        );

        if (!ok) return;

        try {
            const res = await fetch(
                `/api/pro_gat/${pro_gat_id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await res.json();

            if (data.success) {
                loadCategories();
            } else {
                alert(
                    data.message || "فشل الحذف"
                );
            }
        } catch (error) {
            console.error(error);

            alert("خطأ في السيرفر");
        }
    };

    // ======================
    // FILTER
    // ======================

    const filteredCategories =
        categories.filter((item) => {
            const text =
                search.toLowerCase();

            if (!text) return true;

            return (
                item.pro_gat_id
                    .toString()
                    .includes(text) ||
                (
                    item.pro_gat_name || ""
                )
                    .toLowerCase()
                    .includes(text)
            );
        });

    return (
        <div
            className="min-h-screen bg-gray-100 p-4 md:p-6"
            dir="rtl"
        >
            <div className="max-w-7xl mx-auto">
                {/* HEADER */}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">
                            مجموعات المنتجات
                        </h1>

                        <p className="text-gray-600 mt-1">
                            عرض جميع مجموعات
                            المنتجات
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() =>
                                router.push(
                                    "/br_admin/pro_gat/add"
                                )
                            }
                            className="bg-black text-white px-5 py-3 rounded-xl"
                        >
                            + إضافة مجموعة
                        </button>

                        <button
                            onClick={() =>
                                router.push(
                                    `${basePath}`
                                )
                            }
                            className="bg-gray-800 text-white px-5 py-3 rounded-xl"
                        >
                            ← الرجوع
                        </button>
                    </div>
                </div>

                {/* FILTER */}

                <div className="bg-white p-4 rounded-xl shadow mb-4">
                    <input
                        type="text"
                        placeholder="بحث (رقم المجموعة / اسم المجموعة)"
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        className="border p-2 rounded-lg w-full"
                    />
                </div>

                {/* TABLE */}

                <div className="bg-white rounded-2xl shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">
                            جارٍ التحميل...
                        </div>
                    ) : filteredCategories.length ===
                        0 ? (
                        <div className="p-8 text-center text-gray-500">
                            لا توجد بيانات
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-4">
                                            الرقم
                                        </th>

                                        <th className="p-4">
                                            اسم المجموعة
                                        </th>

                                        <th className="p-4">
                                            المستخدم
                                        </th>

                                        <th className="p-4">
                                            الإجراءات
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredCategories.map(
                                        (item) => (
                                            <tr
                                                key={
                                                    item.pro_gat_id
                                                }
                                                className="border-b hover:bg-gray-50"
                                            >
                                                {/* ID */}

                                                <td className="p-4 font-semibold">
                                                    #
                                                    {
                                                        item.pro_gat_id
                                                    }
                                                </td>

                                                {/* NAME */}

                                                <td className="p-4">
                                                    {item.pro_gat_name || "-"}
                                                </td>

                                                {/* USER */}

                                                <td className="p-4">
                                                    {item.user_name ||
                                                        "-"}
                                                </td>

                                                {/* ACTIONS */}

                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() =>
                                                                router.push(
                                                                    `/br_admin/pro_gat/edit/${item.pro_gat_id}`
                                                                )
                                                            }
                                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                                                        >
                                                            تعديل
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.pro_gat_id
                                                                )
                                                            }
                                                            className="bg-red-600 text-white px-4 py-2 rounded-lg"
                                                        >
                                                            حذف
                                                        </button>
                                                    </div>
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