"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  const phoneNumber = "+9647700000000";

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-pink-50 to-white text-gray-800"
      dir="rtl"
    >
      {/* HEADER / BRAND */}
      <div className="w-full py-4 px-6 flex justify-between items-center border-b bg-white/60 backdrop-blur">
        <div className="font-bold text-pink-600 text-xl">Codespace</div>
        <div className="text-sm text-gray-500">
          نظام فساتين الزفاف
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="max-w-6xl mx-auto px-6 pt-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold text-pink-600"
        >
          نظام تأجير فساتين الزفاف
        </motion.h1>

        <p className="mt-2 text-sm text-gray-500">
          مدعوم من شركة <span className="font-bold text-pink-600">Codespace</span>
        </p>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          نظام حديث وسريع وسهل لإدارة تأجير فساتين الزفاف، الحجوزات،
          العملاء والمدفوعات — في مكان واحد.
        </p>

        {/* BUTTONS */}
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-pink-600 text-white rounded-xl shadow hover:bg-pink-700"
          >
            ابدأ الآن
          </button>

 

          <a
            href={`tel:${phoneNumber}`}
            className="px-6 py-3 bg-green-600 text-white rounded-xl shadow hover:bg-green-700"
          >
            اتصل الآن
          </a>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-6xl mx-auto px-6 mt-20 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "إدارة الفساتين",
            desc: "إضافة وتعديل وتنظيم فساتين الزفاف مع الصور والأسعار.",
          },
          {
            title: "نظام الحجز",
            desc: "حجز الفساتين للعملاء مع تتبع التواريخ والحالة.",
          },
          {
            title: "المدفوعات والتقارير",
            desc: "متابعة المدفوعات، المبالغ المتبقية، والتقارير اليومية.",
          },
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white rounded-2xl shadow border"
          >
            <h3 className="text-xl font-semibold text-pink-600">
              {f.title}
            </h3>
            <p className="mt-2 text-gray-600">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* IMAGE SECTION */}
      <div className="max-w-6xl mx-auto px-6 mt-20">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <img
            src="/wedding-dress.jpg"
            className="rounded-2xl shadow-lg object-cover w-full h-[350px]"
            alt="فستان زفاف"
          />

          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              إدارة أنيقة وبسيطة
            </h2>

            <p className="mt-4 text-gray-600">
              إدارة متجر الفساتين أو مشروع التأجير الخاص بك بنظام حديث
              مصمم للسرعة والجمال وسهولة التحكم.
            </p>

            <ul className="mt-4 space-y-2 text-gray-700">
              <li>✔ 👗 إدارة الفساتين بسهولة</li>
              <li>✔ ادارة حسابات</li>
              <li>✔ 💰 تتبع المدفوعات</li>
              <li>✔ 📊 تقارير يومية وشهرية </li>
              <li>✔ 👤 إدارة العملاء</li>
              <li>✔ 🔍 بحث وتصنيف سريع</li>          
              <li>✔ يعمل على الهاتف (PWA)</li>
              <li>✔ طباعة الفواتير والإيصالات</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-24 bg-pink-600 text-white py-16 text-center">
        <h2 className="text-3xl font-bold">
          ابدأ إدارة فساتينك اليوم
        </h2>

        <p className="mt-2 text-pink-100">
          نظام بسيط، سريع، واحترافي لإدارة التأجير.
        </p>


         <p className="mt-2 text-pink-100">
         اتصل الان 07701244448
        </p>


        
      </div>

      {/* FOOTER */}
      <div className="text-center py-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} نظام تأجير فساتين الزفاف — جميع الحقوق محفوظة لدى{" "}
        <span className="font-bold text-pink-600">Codespace</span>
      </div>
    </div>
  );
}