// src/rw/pages/RwKelolaData/DetailPerRT.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { FileText, Eye, ArrowLeft } from "lucide-react";
import supabase from "../../../supabaseClient";

// helper untuk fetch semua data tanpa limit 1000
async function fetchAllRows(table, columns = "*", chunkSize = 1000, filter = null) {
  let from = 0;
  let allData = [];
  while (true) {
    let query = supabase.from(table).select(columns).range(from, from + chunkSize - 1);
    if (filter && typeof filter === "function") query = filter(query);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < chunkSize) break;
    from += chunkSize;
  }
  return allData;
}

function DetailPerRT() {
  const { rt } = useParams(); // ambil rt dari URL
  const location = useLocation(); // untuk ambil query keyword
  const navigate = useNavigate(); // tombol kembali

  const queryParams = new URLSearchParams(location.search);
  const keyword = queryParams.get("keyword") || "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(500);

  const totalPages = Math.max(1, Math.ceil(rows.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const displayedData = rows.slice(startIndex, startIndex + entriesPerPage);

  // ambil data penduduk per RT + keyword
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!rt) {
        setRows([]);
        setLoading(false);
        return;
      }

      const filterFn = (q) => {
        let query = q.eq("rt", rt).order("id_penduduk", { ascending: false });
        if (keyword) {
          query = query.or(
            `nik.ilike.%${keyword}%,nama.ilike.%${keyword}%,no_kk.ilike.%${keyword}%`
          );
        }
        return query;
      };

      const data = await fetchAllRows(
        "data_penduduk",
        "id_penduduk, nik, nama, jk, no_kk, alamat, rt, rw",
        1000,
        filterFn
      );

      setRows(data);
    } catch (err) {
      console.error("Gagal ambil data_penduduk:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [rt, keyword]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // pagination handler
  const handlePrevious = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg mb-4">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Penduduk RT {rt}</h1>
        <span className="ml-2 text-sm opacity-90">
          total: <strong>{rows.length}</strong>
        </span>
        {keyword && (
          <span className="ml-4 text-sm italic">
            (Hasil pencarian: <strong>{keyword}</strong>)
          </span>
        )}
      </div>

      {/* Tombol kembali */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
      </button>

      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
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

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-1 py-1 border">No</th>
              <th className="px-4 py-2 border">NIK</th>
              <th className="px-4 py-2 border">Nama</th>
              <th className="px-4 py-2 border">JK</th>
              <th className="px-4 py-2 border">No KK</th>
              <th className="px-4 py-2 border">Alamat</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : displayedData.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              displayedData
                .sort((a, b) => b.id_penduduk - a.id_penduduk)
                .map((item, index) => (
                  <tr key={item.id_penduduk} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-center">
                      {(currentPage - 1) * entriesPerPage + index + 1}
                    </td>
                    <td className="px-4 py-2 border text-center">{item.nik}</td>
                    <td className="px-4 py-2 border text-center">{item.nama}</td>
                    <td className="px-4 py-2 border text-center">{item.jk}</td>
                    <td className="px-4 py-2 border text-center">{item.no_kk}</td>
                    <td className="px-4 py-2 border text-center">{item.alamat || "-"}</td>
                    <td className="px-4 py-2 border text-center">
                      <div className="flex justify-center space-x-2">
                        <Link
                          to={`/rw/rwkeloladata/detaildatapendudukrt/${item.id_penduduk}`}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">
          Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
          {Math.min(currentPage * entriesPerPage, rows.length)} of {rows.length} entries
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
                currentPage === num ? "bg-green-500 text-white" : "bg-gray-200"
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

export default DetailPerRT;
