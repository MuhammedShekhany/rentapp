"use client";

import { useEffect, useState } from "react";
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

  // QR VALUE STATE
  const [qrValue, setQrValue] = useState("");

  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(session);

    if (parsedUser.user_role !== "br_ass") {
      router.push("/dashboard");
      return;
    }

    setUser(parsedUser);
  }, [router]);

  // BUILD QR LINK SAFELY
  useEffect(() => {
    if (user?.br_id) {
      setQrValue(`${window.location.origin}/branch/${user.br_id}`);
    }
  }, [user]);

  // ✅ UPDATED LOGOUT
  const handleLogout = () => {
    const branchId = user?.br_id;

    localStorage.removeItem("userSession");
    localStorage.removeItem("branchData");

    if (branchId) {
      router.push(`/branch/${branchId}`);
    } else {
      router.push("/login");
    }
  };

  const cards: CardItem[] = [
  {
    title: "المنتجات",
    desc: "إدارة المنتجات",
    path: "/br_admin/product",
    icon: <Package size={28} />,
    color: "from-orange-500 to-amber-600",
  },
  {
    title: "الطلبات الحجوزات",
    desc: "إدارة الطلبات الحجوزات",
    path: "/br_admin/order/order_user",
    icon: <ShoppingCart size={28} />,
    color: "from-pink-500 to-rose-600",
  },

  {
    title: "المصاريف",
    desc: "إدارة المصاريف",
    path: "/br_admin/spend",
    icon: <Wallet size={28} />,
    color: "from-red-500 to-orange-600",
  },

  {
    title: "الطلبات الحجوزات المؤجل",
    desc: "إدارة الطلبات الحجوزات المؤجل",
    path: "/br_admin/order/delay",
    icon: <Clock3 size={28} />,
    color: "from-pink-500 to-rose-600",
  },
  {
    title: "تقرير الحجوزات",
    desc: "حالات الحجوزات",
    path: "/br_admin/order/order_date",
    icon: <BarChart3 size={28} />,
    color: "from-fuchsia-500 to-pink-600",
  },
  {
    title: "التحضير",
    desc: "حالات التحضير",
    path: "/br_admin/order/prepared",
    icon: <ClipboardCheck size={28} />,
    color: "from-fuchsia-500 to-pink-600",
  },
  {
    title: "تسليم",
    desc: "حالات التوصيل",
    path: "/br_admin/order/delivered",
    icon: <Truck size={28} />,
    color: "from-lime-500 to-green-600",
  },
  {
    title: " VIP التوصيل",
    desc: "حالات التوصيل",
    path: "/br_admin/order/vip",
    icon: <Crown size={28} />,
    color: "from-lime-500 to-green-600",
  },

  {
    title: "أسترجاع",
    desc: "حالات أسترجاع",
    path: "/br_admin/order/receipt",
    icon: <ClipboardCheck size={28} />,
    color: "from-yellow-500 to-orange-500",
  },
];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4 md:p-6"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* WELCOME */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur rounded-3xl shadow-xl p-6">

            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <BarChart3 size={16} />
              لوحة التحكم
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              أهلاً {user?.user_fullname}
            </h1>

            <p className="text-gray-600">
              إدارة النظام بالكامل
            </p>

            <div className="mt-4">
              <div className="bg-blue-100 px-4 py-2 rounded-xl inline-block text-blue-700">
                الفرع: {user?.br_name || "-"}
              </div>
            </div>

          </div>

          {/* QR CARD */}
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl p-6 flex flex-col items-center">

            <div className="flex items-center gap-2 font-bold mb-4">
              <QrCode size={20} />
              QR الفرع
            </div>

            <div className="bg-white p-4 rounded-xl border shadow">
              <QRCodeCanvas
                value={qrValue || "loading"}
                size={150}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="mt-3 text-sm text-gray-500">رابط الفرع</p>

            <p className="text-xs text-blue-600 break-all text-center mt-1">
              {qrValue}
            </p>

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
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} text-white flex items-center justify-center mb-4`}
              >
                {item.icon}
              </div>

              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </button>
          ))}

        </div>

        {/* LOGOUT */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>

      </div>
    </div>
  );
}