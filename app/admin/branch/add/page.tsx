"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddBranchPage() {
  const router = useRouter();

  const [brName, setBrName] = useState("");
  const [brPhone, setBrPhone] = useState("");
  const [brAdd, setBrAdd] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) return router.push("/login");

    const user = JSON.parse(session);
    if (user.user_role !== "admin") router.push("/dashboard");
  }, [router]);

const handleUpload = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message || "Upload failed");
  }

  return data.url;
};

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brName || !brPhone || !brAdd) {
      setMessage("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      let logoUrl = "";
      let headerUrl = "";

      if (logoFile) logoUrl = await handleUpload(logoFile);
      if (headerFile) headerUrl = await handleUpload(headerFile);

      const res = await fetch("/api/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          br_name: brName,
          br_phone: brPhone,
          br_add: brAdd,
          br_logo: logoUrl,
          br_header: headerUrl, // ✅
        }),
      });

      const data = await res.json();

      if (data.success) router.push("/admin/branch");
      else setMessage(data.message || "Add failed");
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Add Branch</h1>

        <form onSubmit={handleAdd} className="space-y-4">

          <input
            type="text"
            value={brName}
            onChange={(e) => setBrName(e.target.value)}
            className="w-full border rounded-xl p-3"
            placeholder="Branch name"
          />

          <input
            type="text"
            value={brPhone}
            onChange={(e) => setBrPhone(e.target.value)}
            className="w-full border rounded-xl p-3"
            placeholder="Phone"
          />

          <input
            type="text"
            value={brAdd}
            onChange={(e) => setBrAdd(e.target.value)}
            className="w-full border rounded-xl p-3"
            placeholder="Address"
          />

          {/* Logo */}
          <div>
            <label className="block mb-1 font-medium">Logo</label>
            <input
              type="file"
              id="logoInput"
              className="hidden"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />

            <div className="flex gap-4">
              <div
                className="w-28 h-28 border rounded-full overflow-hidden cursor-pointer flex items-center justify-center"
                onClick={() => document.getElementById("logoInput")?.click()}
              >
                {logoFile ? (
                  <img
                    src={URL.createObjectURL(logoFile)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "No Image"
                )}
              </div>

              {logoFile && (
                <button
                  type="button"
                  onClick={() => setLogoFile(null)}
                  className="bg-red-500 text-white px-3 py-1 rounded-xl"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Header */}
          <div>
            <label className="block mb-1 font-medium">Header</label>

            <input
              type="file"
              id="headerInput"
              className="hidden"
              onChange={(e) => setHeaderFile(e.target.files?.[0] || null)}
            />

            <div className="flex gap-4">
              <div
                className="w-40 h-24 border rounded-xl overflow-hidden cursor-pointer flex items-center justify-center"
                onClick={() => document.getElementById("headerInput")?.click()}
              >
                {headerFile ? (
                  <img
                    src={URL.createObjectURL(headerFile)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "No Header"
                )}
              </div>

              {headerFile && (
                <button
                  type="button"
                  onClick={() => setHeaderFile(null)}
                  className="bg-red-500 text-white px-3 py-1 rounded-xl"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {message && <p className="text-red-500">{message}</p>}

          <button className="bg-black text-white px-6 py-3 rounded-xl">
            {loading ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}