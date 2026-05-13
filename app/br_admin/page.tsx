"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingCart,
  Wallet,
  ClipboardCheck,
  Truck,
  LogOut,
  QrCode,
  BarChart3,
  Clock3,
  Crown,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

type UserType = {
  user_id: string;
  user_name: string;
  user_fullname: string;
  user_role: string;
  br_id: string;
  br_name?: string;
};

type CardItem = {
  title: string;
  desc: string;
  path: string;
  icon: React.ReactNode;
  color: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [qrValue, setQrValue] = useState("");

  // ✅ LOAD USER ONCE
  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.replace("/login");
      return;
    }

    const parsedUser: UserType = JSON.parse(session);

    setUser(parsedUser);

    
  }, [router]);

  // ✅ BASE PATH (FIXED)
  const basePath = useMemo(() => {
    if (!user) return "";

    return user.user_role === "br_admin"
      ? "/br_admin"
      : user.user_role === "br_ass"
      ? "/br_ass"
      : "/br_user";
  }, [user]);

  // QR CODE
  useEffect(() => {
    if (user?.br_id) {
      setQrValue(`${window.location.origin}/branch/${user.br_id}`);
    }
  }, [user]);

  // LOGOUT
  const handleLogout = () => {
    const branchId = user?.br_id;

    localStorage.removeItem("userSession");
    localStorage.removeItem("branchData");

    router.replace(branchId ? `/branch/${branchId}` : "/login");
  };

  // MENU CARDS
  const cards: CardItem[] = useMemo(
    () => [
      {
        title: "المنتجات",
        desc: "إدارة المنتجات",
        path: `${basePath}/product`,
        icon: <Package size={28} />,
        color: "from-orange-500 to-amber-600",
      },
      {
        title: "الطلبات الحجوزات",
        desc: "إدارة الطلبات الحجوزات",
        path: `${basePath}/order`,
        icon: <ShoppingCart size={28} />,
        color: "from-pink-500 to-rose-600",
      },
      {
        title: "المصاريف",
        desc: "إدارة المصاريف",
        path: `${basePath}/spend`,
        icon: <Wallet size={28} />,
        color: "from-red-500 to-orange-600",
      },
      {
        title: "استلام المدفوعات الحجوزات",
        desc: "إدارة استلام المدفوعات الحجوزات",
        path: `${basePath}/order_payment`,
        icon: <Wallet size={28} />,
        color: "from-red-500 to-orange-600",
      },
      {
        title: "اصناف المنتجات",
        desc: " إدارة اصناف المنتجات",
        path: `${basePath}/pro_gat`,
        icon: <Wallet size={28} />,
        color: "from-red-500 to-orange-600",
      },
      {
        title: "اصناف المصروفات",
        desc: "إدارة اصناف المصروفات",
        path: `${basePath}/spend_gat`,
        icon: <Wallet size={28} />,
        color: "from-red-500 to-orange-600",
      },
      {
        title: "تقرير المنتجات",
        desc: "إدارة تقرير المنتجات",
        path: `${basePath}/report/product_order`,
        icon: <Wallet size={28} />,
        color: "from-red-500 to-orange-600",
      },
      {
        title: "تقارير المصاريف",
        desc: "إدارة تقارير المصاريف",
        path: `${basePath}/report/spend`,
        icon: <BarChart3 size={28} />,
        color: "from-red-500 to-orange-600",
      },
      {
        title: "تقارير الحجوزات",
        desc: "عرض التقارير",
        path: `${basePath}/report/order`,
        icon: <ClipboardCheck size={28} />,
        color: "from-teal-500 to-cyan-600",
      },
      {
        title: "الطلبات المؤجل",
        desc: "إدارة الطلبات المؤجل",
        path: `${basePath}/order/delay`,
        icon: <Clock3 size={28} />,
        color: "from-pink-500 to-rose-600",
      },
      {
        title: "قائمة الحجوزات",
        desc: "حالات  قائمة الحجوزات",
        path: `${basePath}/order/order_date`,
        icon: <BarChart3 size={28} />,
        color: "from-fuchsia-500 to-pink-600",
      },
      {
        title: "التحضير",
        desc: "حالات التحضير",
        path: `${basePath}/order/prepared`,
        icon: <ClipboardCheck size={28} />,
        color: "from-fuchsia-500 to-pink-600",
      },
      {
        title: "تسليم",
        desc: "حالات التوصيل",
        path: `${basePath}/order/delivered`,
        icon: <Truck size={28} />,
        color: "from-lime-500 to-green-600",
      },
      {
        title: "VIP التوصيل",
        desc: "حالات التوصيل",
        path: `${basePath}/order/vip`,
        icon: <Crown size={28} />,
        color: "from-lime-500 to-green-600",
      },
      {
        title: "أسترجاع",
        desc: "حالات أسترجاع",
        path: `${basePath}/order/receipt`,
        icon: <ClipboardCheck size={28} />,
        color: "from-yellow-500 to-orange-500",
      },
    ],
    [basePath]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-white/80 backdrop-blur rounded-3xl shadow-xl p-6">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <BarChart3 size={16} />
              لوحة التحكم
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              أهلاً {user?.user_fullname}
            </h1>

            <p className="text-gray-600">إدارة النظام بالكامل</p>

            <div className="mt-4 bg-blue-100 px-4 py-2 rounded-xl inline-block text-blue-700">
              الفرع: {user?.br_name || "-"}
            </div>
          </div>

          {/* QR */}
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl p-6 flex flex-col items-center">
            <div className="flex items-center gap-2 font-bold mb-4">
              <QrCode size={20} />
              QR الفرع
            </div>

            <QRCodeCanvas value={qrValue || "loading"} size={150} level="H" includeMargin />

            <p className="mt-3 text-xs text-blue-600 break-all text-center">{qrValue}</p>
          </div>

        </div>

        {/* MENU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {cards.map((item, index) => (
            <button
              key={index}
              onClick={() => router.push(item.path)}
              className="bg-white/90 rounded-2xl shadow p-6 hover:shadow-xl transition text-right"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} text-white flex items-center justify-center mb-4`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </button>
          ))}
        </div>

        {/* LOGOUT */}
        <div className="flex justify-end">
          <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2">
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>

      </div>
    </div>
  );
}