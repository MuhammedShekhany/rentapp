"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.br_id as string;

  const logoRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLInputElement>(null);

  const [brName, setBrName] = useState("");
  const [brPhone, setBrPhone] = useState("");
  const [brAdd, setBrAdd] = useState("");

  const [brLogo, setBrLogo] = useState("");
  const [brHeader, setBrHeader] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const session = localStorage.getItem("userSession");
    if (!session) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(session);
    if (user.user_role !== "admin") {
      router.push("/dashboard");
      return;
    }

    loadBranch();
  }, [router, id]);

  const loadBranch = async () => {
    try {
      setPageLoading(true);

      const res = await fetch(`/api/branch/${id}`);
      const data = await res.json();

      if (data.success && data.branch) {
        setBrName(data.branch.br_name || "");
        setBrPhone(data.branch.br_phone || "");
        setBrAdd(data.branch.br_add || "");
        setBrLogo(data.branch.br_logo || "");
        setBrHeader(data.branch.br_header || "");
      } else {
        setMessage(data.message || "Failed to load branch");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error while loading");
    } finally {
      setPageLoading(false);
    }
  };

  // ✅ FIXED UPLOAD (matches your API)
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brName || !brPhone || !brAdd) {
      setMessage("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      let uploadedLogoUrl = brLogo;
      let uploadedHeaderUrl = brHeader;

      if (logoFile) {
        uploadedLogoUrl = await handleUpload(logoFile);
      }

      if (headerFile) {
        uploadedHeaderUrl = await handleUpload(headerFile);
      }

      const res = await fetch(`/api/branch/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          br_name: brName,
          br_phone: brPhone,
          br_add: brAdd,
          br_logo: uploadedLogoUrl,
          br_header: uploadedHeaderUrl,
          old_logo: brLogo,
          old_header: brHeader,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/branch");
      } else {
        setMessage(data.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setBrLogo("");
  };

  const handleRemoveHeader = () => {
    setHeaderFile(null);
    setBrHeader("");
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Edit Branch</h1>

        <form onSubmit={handleUpdate} className="space-y-4">

          {/* NAME */}
          <input
            value={brName}
            onChange={(e) => setBrName(e.target.value)}
            className="w-full border p-3 rounded-xl"
            placeholder="Branch name"
          />

          {/* PHONE */}
          <input
            value={brPhone}
            onChange={(e) => setBrPhone(e.target.value)}
            className="w-full border p-3 rounded-xl"
            placeholder="Phone"
          />

          {/* ADDRESS */}
          <input
            value={brAdd}
            onChange={(e) => setBrAdd(e.target.value)}
            className="w-full border p-3 rounded-xl"
            placeholder="Address"
          />

          {/* LOGO */}
          <div>
            <label className="block mb-1 font-medium">Logo</label>

            <input
              ref={logoRef}
              type="file"
              className="hidden"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />

            <div className="flex gap-4">
              <div
                onClick={() => logoRef.current?.click()}
                className="w-28 h-28 border rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
              >
                {logoFile ? (
                  <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-cover" />
                ) : brLogo ? (
                  <img src={brLogo} className="w-full h-full object-cover" />
                ) : (
                  "No Image"
                )}
              </div>

              {(logoFile || brLogo) && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="bg-red-500 text-white px-3 py-1 rounded-xl"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* HEADER */}
          <div>
            <label className="block mb-1 font-medium">Header</label>

            <input
              ref={headerRef}
              type="file"
              className="hidden"
              onChange={(e) => setHeaderFile(e.target.files?.[0] || null)}
            />

            <div className="flex gap-4">
              <div
                onClick={() => headerRef.current?.click()}
                className="w-40 h-24 border rounded-xl overflow-hidden flex items-center justify-center cursor-pointer"
              >
                {headerFile ? (
                  <img src={URL.createObjectURL(headerFile)} className="w-full h-full object-cover" />
                ) : brHeader ? (
                  <img src={brHeader} className="w-full h-full object-cover" />
                ) : (
                  "No Header"
                )}
              </div>

              {(headerFile || brHeader) && (
                <button
                  type="button"
                  onClick={handleRemoveHeader}
                  className="bg-red-500 text-white px-3 py-1 rounded-xl"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {message && <p className="text-red-600">{message}</p>}

          <button className="bg-black text-white px-6 py-3 rounded-xl">
            {loading ? "Updating..." : "Update Branch"}
          </button>
        </form>
      </div>
    </div>
  );
}