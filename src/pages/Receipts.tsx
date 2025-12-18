import React, { useEffect, useMemo, useState } from "react";
import TabBar from "@/components/TabBar";
import { baseurl } from "@/Api/Baseurl";
import { useApp } from "@/contexts/AppContext";


interface Transaction {
  id: number;
  voucherID?: string;
  date?: string;
  trantype?: string;
  AccountName?: string;
  PartyID?: number;
  DC?: string;
  Amount?: string | number;
  balance_amount?: string | number;
  created_at?: string;
}

function Receipts() {
  const { user } = useApp() as { user: { id?: string } | null };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 🔍 Search & Pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    if (user?.id) fetchTransactions();
  }, [user]);

  const fetchTransactions = async (): Promise<void> => {
    try {
      const res = await fetch(`${baseurl}/ledger`);
      const data: Transaction[] = await res.json();

      const filtered = data.filter(
        (item) => Number(item.PartyID) === Number(user?.id)
      );

      setTransactions(filtered);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Search Filter
  ========================= */
  const filteredData = useMemo(() => {
    return transactions.filter((item) => {
      const q = search.toLowerCase();
      return (
        item.voucherID?.toLowerCase().includes(q) ||
        item.trantype?.toLowerCase().includes(q) ||
        item.AccountName?.toLowerCase().includes(q) ||
        item.DC?.toLowerCase().includes(q)
      );
    });
  }, [transactions, search]);

  /* =========================
     Pagination
  ========================= */
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  return (

       <>
  {/* 🔝 Sticky Header */}
  <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200">
    <div className="max-w-md mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Transactions</h1>
          <p className="text-sm text-gray-500">
            {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
          </p>
        </div>

      </div>
    </div>
  </header>

  {/* 📄 Page Content */}
  <div className="container mx-auto px-4 py-6">
    <TabBar />

    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-64 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-md px-2 py-1"
            >
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* 📊 Table */}
        {loading ? (
          <p className="text-gray-500">Loading transactions...</p>
        ) : filteredData.length === 0 ? (
          <p className="text-gray-500">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="border px-3 py-2">Date</th>
                  <th className="border px-3 py-2">Type</th>
                  <th className="border px-3 py-2">Voucher</th>
                  <th className="border px-3 py-2">Account</th>
                  <th className="border px-3 py-2">Dr / Cr</th>
                  <th className="border px-3 py-2">Amount</th>
                  <th className="border px-3 py-2">Balance</th>
                  <th className="border px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => {
                  const dc = item.DC?.toUpperCase();
                  return (
                    <tr
                      key={item.id}
                      className="text-center hover:bg-gray-50"
                    >
                      <td className="border px-3 py-2">
                        {item.date
                          ? new Date(item.date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="border px-3 py-2">
                        {item.trantype || "-"}
                      </td>
                      <td className="border px-3 py-2">
                        {item.voucherID || "-"}
                      </td>
                      <td className="border px-3 py-2">
                        {item.AccountName || "-"}
                      </td>
                      <td className="border px-3 py-2 font-medium">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            dc === "C"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {dc || "-"}
                        </span>
                      </td>
                      <td className="border px-3 py-2">
                        ₹{Number(item.Amount || 0).toFixed(2)}
                      </td>
                      <td className="border px-3 py-2">
                        ₹{Number(item.balance_amount || 0).toFixed(2)}
                      </td>
                      <td className="border px-3 py-2">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("en-IN")
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 🔢 Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <span>
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + entriesPerPage, filteredData.length)} of{" "}
              {filteredData.length}
            </span>

            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === i + 1
                      ? "bg-blue-500 text-white"
                      : ""
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
     
  </div>
</>

       
  );
}

export default Receipts;
