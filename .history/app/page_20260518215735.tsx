"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white text-gray-800">

      {/* HERO SECTION */}
      <div className="max-w-6xl mx-auto px-6 pt-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold text-pink-600"
        >
          Wedding Dress Rental System
        </motion.h1>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          A modern, fast, and easy system to manage wedding dress rentals,
          bookings, customers, and payments — all in one place.
        </p>

        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-pink-600 text-white rounded-xl shadow hover:bg-pink-700"
          >
            Get Started
          </button>

          <button
            onClick={() => router.push("/products")}
            className="px-6 py-3 border border-pink-600 text-pink-600 rounded-xl hover:bg-pink-50"
          >
            View Dresses
          </button>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-6xl mx-auto px-6 mt-20 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Dress Management",
            desc: "Add, edit, and organize wedding dresses with images and prices.",
          },
          {
            title: "Booking System",
            desc: "Reserve dresses for customers with date tracking and status.",
          },
          {
            title: "Payments & Reports",
            desc: "Track payments, remaining balances, and daily income reports.",
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
            alt="Wedding Dress"
          />

          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Elegant & Simple Management
            </h2>
            <p className="mt-4 text-gray-600">
              Manage your bridal shop or rental business with a modern system
              designed for speed, beauty, and control.
            </p>

            <ul className="mt-4 space-y-2 text-gray-700">
              <li>✔ Multi-branch support</li>
              <li>✔ Fast search & filtering</li>
              <li>✔ Mobile friendly (PWA ready)</li>
              <li>✔ Print invoices & receipts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-24 bg-pink-600 text-white py-16 text-center">
        <h2 className="text-3xl font-bold">
          Start Managing Your Dresses Today
        </h2>
        <p className="mt-2 text-pink-100">
          Simple. Fast. Professional rental system.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="mt-6 px-8 py-3 bg-white text-pink-600 font-semibold rounded-xl hover:bg-gray-100"
        >
          Enter System
        </button>
      </div>

      {/* FOOTER */}
      <div className="text-center py-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} Wedding Dress Rental System
      </div>
    </div>
  );
}