type BranchType = {
  br_id: string;
  br_name: string;
  br_phone: string;
  br_add: string;
  br_logo: string;
};

export default function ExpiredPage({
  searchParams,
}: {
  searchParams?: { br_id?: string };
}) {
  const br_id = searchParams?.br_id;

  // Optional: safe parsing for SSR (no hooks needed)
  let branch: BranchType | null = null;

  if (typeof window !== "undefined") {
    const data = localStorage.getItem("branchData");
    if (data) {
      try {
        branch = JSON.parse(data);
      } catch (e) {
        branch = null;
      }
    }
  }

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">

        <div className="text-6xl mb-4">⚠️</div>

        <h1 className="text-2xl font-bold text-red-600 mb-3">
          Subscription Expired
        </h1>

        <p className="text-gray-700 mb-2">
          This branch subscription is not active.
        </p>

        {br_id && (
          <p className="text-sm text-gray-500 mb-4">
            Branch ID: {br_id}
          </p>
        )}

        {branch?.br_name && (
          <p className="text-lg font-semibold text-gray-800">
            {branch.br_name}
          </p>
        )}

        {branch?.br_phone && (
          <p className="text-sm text-gray-600 mt-2">
            {branch.br_phone}
          </p>
        )}

        {branch?.br_add && (
          <p className="text-sm text-gray-600 mt-1">
            {branch.br_add}
          </p>
        )}

      </div>
    </div>
  );
}