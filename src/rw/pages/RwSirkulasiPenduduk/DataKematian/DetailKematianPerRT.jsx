// src/rt/pages/KelolaData/DetailKematianPerRT.jsx
import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import supabase from "../../../../supabaseClient";

function DetailKematianPerRT() {
  const { rt } = useParams(); // bisa: <rt> (mis. "01") atau "search"
  const location = useLocation();
  const navigate = useNavigate();

  const [allData, setAllData] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const userRw = localStorage.getItem("userRw") || "";
  const userRtFromStorage = localStorage.getItem("userRt") || "";

  // Tentukan mode RT: kalau param rt === 'search' => tidak memaksa filter rt,
  // kalau ada rt (bukan 'search') => gunakan itu sebagai filter RT,
  // kalau tidak ada param sama sekali, fallback ke userRtFromStorage (untuk RT role)
  const isSearchSegment = rt === "search";
  const routeRt = rt && rt !== "search" ? rt : null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const keyword = (params.get("keyword") || "").trim();

        let allResults = [];

        // helper: perform query for a field (ni: will include rt filter if routeRt present)
        const queryForField = async (field) => {
          // start query builder
          let builder = supabase.from("data_kematian").select("*").eq("rw", userRw);

          // apply RT filter only if routeRt is set (i.e. we are viewing a specific RT)
          if (routeRt) builder = builder.eq("rt", routeRt);

          // if there's keyword -> ilike on field
          if (keyword) {
            builder = builder.ilike(field, `%${keyword}%`);
          }

          const { data, error } = await builder;
          if (error) {
            console.error("Supabase error", field, error);
            return [];
          }
          return Array.isArray(data) ? data : [];
        };

        if (keyword) {
          // Jika keyword, cari pada beberapa field (nik, no_kk, nama)
          const fields = ["nik", "no_kk", "nama"];
          for (let field of fields) {
            const data = await queryForField(field);
            if (data && data.length > 0) allResults.push(...data);
          }

          // jika routeRt tidak ada (mode search across all RTs) — kita sudah tidak menambahkan rt filter,
          // sehingga hasil datang dari seluruh RW. Hapus duplikat berdasarkan id:
          allResults = Array.from(
            new Map(allResults.map((item) => [item.id, item])).values()
          );
        } else {
          // tanpa keyword: ambil semua record
          let builder = supabase
            .from("data_kematian")
            .select("*")
            .eq("rw", userRw)
            .order("id", { ascending: true });

          if (routeRt) builder = builder.eq("rt", routeRt);

          const { data, error } = await builder;
          if (error) {
            console.error("Supabase fetch error:", error);
            allResults = [];
          } else {
            allResults = data || [];
          }
        }

        setAllData(allResults);
        setCurrentPage(1);
        setSelectedIds([]);
        setSelectAll(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // rerun ketika search string berubah, atau route rt berubah, atau userRw berubah
  }, [location.search, routeRt, userRw]);

  const totalPages = Math.max(1, Math.ceil(allData.length / entriesPerPage));
  const displayedData = allData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handlePrevious = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(displayedData.map((d) => d.id));
      setSelectAll(true);
    }
  };

  // Helper
  function getNamaHari(dateString) {
    if (!dateString) return "";
    const [y, m, d] = dateString.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    const hariArray = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return hariArray[dt.getDay()] || "";
  }

  function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return "";
    const [y, m, d] = dateString.split("-");
    return `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${y}`;
  }

  function formatTimeHHMM(timeString) {
    if (!timeString) return "";
    const parts = timeString.split(":");
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }

  // label RT untuk header: kalau routeRt ada pakai itu, kalau tidak pakai userRtFromStorage, kalau juga ga ada tampil 'Semua RT'
  const labelRt = routeRt || (userRtFromStorage ? userRtFromStorage : "Semua RT");

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">
          Data Kematian RT {labelRt} RW {userRw}
        </h1>
      </div>

      {/* Tombol kembali */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mt-4 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
      </button>

      <div className="flex justify-between items-center mt-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="appearance-none bg-gray-200 border rounded px-2 py-1 text-sm pr-6 focus:outline-none"
          >
            <option value={500}>500</option>
            <option value={550}>550</option>
            <option value={600}>600</option>
            <option value={650}>650</option>
          </select>
          <span className="text-sm">entries</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-2 border text-center">
                <input
                  type="checkbox"
                  checked={
                    displayedData.length > 0 &&
                    selectedIds.length === displayedData.length
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-2 border">No</th>
              <th className="px-4 py-2 border">NIK</th>
              <th className="px-4 py-2 border">No KK</th>
              <th className="px-4 py-2 border">Nama</th>
              <th className="px-4 py-2 border">Hari / Tanggal / Pukul</th>
              <th className="px-4 py-2 border">Sebab</th>
              <th className="px-4 py-2 border">Tempat Kematian</th>
            </tr>
          </thead>
          <tbody>
            {displayedData.length > 0 ? (
              displayedData.map((item, index) => {
                const hari =
                  item.hari_kematian || getNamaHari(item.tanggal_kematian);
                const tanggal = item.tanggal_kematian
                  ? formatDateToDDMMYYYY(item.tanggal_kematian)
                  : "";
                const pukul = item.pukul_kematian
                  ? formatTimeHHMM(item.pukul_kematian)
                  : "";
                const combined =
                  hari || tanggal || pukul
                    ? `${hari}${tanggal ? `, ${tanggal}` : ""}${
                        pukul ? ` - ${pukul}` : ""
                      }`
                    : "-";

                return (
                  <tr key={item.id ?? index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {(currentPage - 1) * entriesPerPage + index + 1}
                    </td>
                    <td className="px-4 py-2 border">{item.nik}</td>
                    <td className="px-4 py-2 border">{item.no_kk}</td>
                    <td className="px-4 py-2 border">{item.nama}</td>
                    <td className="px-4 py-2 border">{combined}</td>
                    <td className="px-4 py-2 border">{item.sebab}</td>
                    <td className="px-4 py-2 border">{item.tempat_kematian}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-500">
                  {loading ? "Memuat..." : "Tidak ada data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">
          Showing{" "}
          {(currentPage - 1) * entriesPerPage +
            (displayedData.length > 0 ? 1 : 0)}{" "}
          to {Math.min(currentPage * entriesPerPage, allData.length)} of{" "}
          {allData.length} entries
        </span>
        <div className="space-x-2 flex items-center">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`px-3 py-1 rounded ${
                currentPage === num ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailKematianPerRT;
