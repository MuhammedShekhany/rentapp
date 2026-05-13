"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Building2,
  Package,
  ShoppingCart,
  Wallet,
  BarChart3,
  CreditCard,
  ClipboardCheck,
  Truck,
  LogOut,
} from "lucide-react";

type UserType = {
  user_id: string;
  user_name: string;
  user_full_name: string;
  user_role: string;
  br_id: string;
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

  useEffect(() => {
    const session = localStorage.getItem("userSession");

    if (!session) {
      router.push("/login_admin");
      return;
    }

    const parsedUser = JSON.parse(session);

    if (parsedUser.user_role !== "admin") {
      router.push("/login_admin");
      return;
    }

    setUser(parsedUser);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    router.push("/login_admin");
  };

  const cards: CardItem[] = [
    {
      title: "المستخدمين",
      desc: "إدارة المستخدمين",
      path: "/admin/user",
      icon: <Users size={28} />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "الفروع",
      desc: "إدارة الفروع",
      path: "/admin/branch",
      icon: <Building2 size={28} />,
      color: "from-cyan-500 to-blue-600",
    },
    {
      title: "الاشتراكات",
      desc: "إدارة الاشتراكات",
      path: "/admin/sub",
      icon: <CreditCard size={28} />,
      color: "from-violet-500 to-purple-600",
    },
      ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-4 md:p-6">

      <div className="max-w-7xl mx-auto space-y-6">

        {/* الترحيب */}
        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-xl p-6 border border-white/50 text-right">

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">

            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <BarChart3 size={16} />
                لوحة الإدارة
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                أهلاً {user?.user_full_name || user?.user_name}
              </h1>

              <p className="text-gray-600">
                يمكنك إدارة النظام بالكامل من هنا
              </p>
            </div>

          </div>
        </div>

      
        {/* القائمة */}
        <div className="text-right">

          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            لوحة التحكم
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

            {cards.map((item, index) => (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className="bg-white/90 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition hover:-translate-y-1 text-right"
              >

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${item.color} text-white flex items-center justify-center mb-4`}>
                  {item.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-800">
                  {item.title}
                </h3>

                <p className="text-gray-600 mt-2">
                  {item.desc}
                </p>

                <div className="mt-4 text-blue-600 font-semibold">
                  فتح ←
                </div>

              </button>
            ))}

          </div>
        </div>

        {/* تسجيل خروج */}
        <div className="flex justify-start">

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