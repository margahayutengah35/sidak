import React, { useEffect, useState } from "react";
import { Trash2, Users, FileText, UserPlus, Upload } from "lucide-react";
import supabase from "../../supabaseClient";
import { useLocation, Link, useNavigate } from "react-router-dom";

function DataKK() {
  const location = useLocation();
  const navigate = useNavigate();

  // allData untuk keperluan filter unik (RW/RT) dan operasi lainnya
  const [allData, setAllData] = useState([]);

  // tabel / kontrol umum
  const [dataKK, setDataKK] = useState({ withKepala: [], withoutKepala: [] });
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // untuk Tambah Data (placeholder)

  // FILTER / PAGINATION state
  const [filterMode, setFilterMode] = useState("all"); // "all" | "rw"
  const [rwFilter, setRwFilter] = useState("all");
  const [rtFilter, setRtFilter] = useState("all");

  // ambil keyword awal dari URL (jika ada)
  const queryParams = new URLSearchParams(location.search);
  const keywordFromUrl = queryParams.get("keyword")?.trim() || "";
  const [keyword, setKeyword] = useState(keywordFromUrl);

  const noKKFromUrl = queryParams.get("no_kk")?.trim() || "";
  const [noKKParam, setNoKKParam] = useState(noKKFromUrl);

  // === HELPERS: buildQueryString (kembalikan empty string jika semua default) ===
  const buildQueryString = (overrides = {}) => {
    const fm = overrides.filterMode ?? filterMode ?? "all";
    const rw = overrides.rw ?? rwFilter ?? "all";
    const rt = overrides.rt ?? rtFilter ?? "all";
    const page = overrides.page ?? currentPage ?? 1;
    const entries = overrides.entries ?? entriesPerPage ?? 500;
    const kw = overrides.keyword ?? keyword ?? "";

    // Jika semua default → kembalikan string kosong agar URL bersih
    const isDefault = fm === "all" && rw === "all" && rt === "all" && page === 1 && entries === 500 && !kw;
    if (isDefault) return "";

    const params = new URLSearchParams();
    params.set("filterMode", fm);
    params.set("rw", rw);
    params.set("rt", rt);
    params.set("page", String(page));
    params.set("entries", String(entries));
    if (kw) params.set("keyword", kw);

    return `?${params.toString()}`;
  };

  // === Inisialisasi state dari URL saat mount ===
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fm = params.get("filterMode");
    const rw = params.get("rw");
    const rt = params.get("rt");
    const page = Number(params.get("page"));
    const entries = Number(params.get("entries"));
    const kw = params.get("keyword");
    const nokk = params.get("no_kk");

    if (fm) setFilterMode(fm);
    if (rw) setRwFilter(rw);
    if (rt) setRtFilter(rt);
    if (!Number.isNaN(page) && page > 0) setCurrentPage(page);
    if (!Number.isNaN(entries) && entries > 0) setEntriesPerPage(entries);
    if (kw) setKeyword(kw.trim());
    if (nokk) setNoKKParam(nokk.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // jalankan sekali saat mount

  // jika location.search berubah (misal datang dari Header), sinkronkan keyword/no_kk internal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kw = params.get("keyword")?.trim() || "";
    const nokk = params.get("no_kk")?.trim() || "";
    setKeyword(kw);
    setNoKKParam(nokk);
  }, [location.search]);

  // === Sync URL ketika filter/pagination/keyword berubah ===
  useEffect(() => {
    const qs = buildQueryString();
    // jika buildQueryString() return "" maka URL menjadi path tanpa query
    navigate(`${location.pathname}${qs}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode, rwFilter, rtFilter, currentPage, entriesPerPage, keyword]);

  // === Fetch semua data (memperhatikan keyword di location.search dan no_kk) ===
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const queryParamsLocal = new URLSearchParams(location.search);
        const keywordLocal = queryParamsLocal.get("keyword")?.trim() || "";
        const noKKLocal = queryParamsLocal.get("no_kk")?.trim() || "";
  
        // === BASE QUERY ===
        let baseQuery = supabase
          .from("data_penduduk")
          .select("*", { count: "exact" })
          .order("id_penduduk", { ascending: true });
  
        // === FILTER: Prioritaskan no_kk jika ada ===
        if (noKKLocal) {
          baseQuery = baseQuery.eq("no_kk", noKKLocal);
        } else if (keywordLocal) {
          const isDigits = /^\d+$/.test(keywordLocal);
          if (isDigits && (keywordLocal.length === 16 || keywordLocal.length === 15 || keywordLocal.length === 12)) {
            baseQuery = baseQuery.or(`nik.eq.${keywordLocal},no_kk.eq.${keywordLocal}`);
          } else {
            baseQuery = baseQuery.or(
              `nama.ilike.%${keywordLocal}%,nik.ilike.%${keywordLocal}%,no_kk.ilike.%${keywordLocal}%`
            );
          }
        }
  
        // === DAPATKAN TOTAL DATA ===
        const { count: totalCount } = await baseQuery;
        const totalRows = totalCount || 0;
        console.log("Total data ditemukan:", totalRows);
  
        // === LOOP FETCH SEMUA DATA TANPA LIMIT 1000 ===
        const batchSize = 1000;
        let allRows = [];
  
        for (let start = 0; start < totalRows; start += batchSize) {
          const end = start + batchSize - 1;
          const { data, error } = await baseQuery.range(start, end);
          if (error) throw error;
  
          allRows = [...allRows, ...data];
          console.log(`Fetched ${allRows.length} / ${totalRows} data_penduduk...`);
        }
  
        // === Simpan Semua Data ===
        setAllData(allRows || []);
  
        // === Grup per KK ===
        const grouped = {};
        (allRows || []).forEach((d) => {
          if (!grouped[d.no_kk]) grouped[d.no_kk] = [];
          grouped[d.no_kk].push(d);
        });
  
        const withKepala = [];
        const withoutKepala = [];
  
        Object.values(grouped).forEach((anggota) => {
          const kepala = anggota.find(
            (a) => (a.status_keluarga || "").toLowerCase().trim() === "kepala keluarga"
          );
          if (kepala) withKepala.push(kepala);
          else withoutKepala.push(anggota[0]);
        });
  
        setDataKK({ withKepala, withoutKepala });
      } catch (err) {
        console.error("Gagal fetch data_penduduk:", err);
        setDataKK({ withKepala: [], withoutKepala: [] });
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAllData();
  }, [location.search]);
  

  // === Hitung daftar RW & RT unik dari allData ===
  const uniqueRWs = [...new Set(allData.map((item) => item.rw).filter(Boolean))].sort();
  const uniqueRTs =
    rwFilter === "all"
      ? [...new Set(allData.map((item) => item.rt).filter(Boolean))].sort()
      : [...new Set(allData.filter((item) => item.rw === rwFilter).map((item) => item.rt).filter(Boolean))].sort();

  // jika filter aktif, lakukan filter pada dataKK saat render TableComponent (kami anggota per KK sudah dibuat)
  const applyFiltersToList = (list) => {
    if (filterMode === "all") return list;
    // filterMode === 'rw'
    return list.filter((item) => {
      if (rwFilter !== "all" && item.rw !== rwFilter) return false;
      if (rtFilter !== "all" && item.rt !== rtFilter) return false;
      return true;
    });
  };

  // Hapus banyak data sekaligus
  const handleDeleteMany = async () => {
    if (!selectedIds.length) return alert("Pilih data yang ingin dihapus!");
    const confirmDelete = window.confirm(`Yakin ingin menghapus ${selectedIds.length} data terpilih?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from("data_penduduk").delete().in("id_penduduk", selectedIds);
    if (error) return alert("Gagal menghapus data!");

    setDataKK((prev) => ({
      withKepala: prev.withKepala.filter((item) => !selectedIds.includes(item.id_penduduk)),
      withoutKepala: prev.withoutKepala.filter((item) => !selectedIds.includes(item.id_penduduk)),
    }));
    setSelectedIds([]);
    setSelectAll(false);
    alert("Data terpilih berhasil dihapus!");
  };

  // Hapus satu data atau seluruh KK
  const handleDelete = async (id_penduduk, no_kk) => {
    const confirmChoice = window.confirm(
      "Apakah ingin menghapus Kepala Keluarga saja?\nOK = Hapus Kepala Keluarga saja\nCancel = Hapus seluruh anggota KK"
    );

    try {
      if (confirmChoice) {
        const { error } = await supabase.from("data_penduduk").delete().eq("id_penduduk", id_penduduk);
        if (error) throw error;

        setDataKK((prev) => ({
          withKepala: prev.withKepala.filter((item) => item.id_penduduk !== id_penduduk),
          withoutKepala: prev.withoutKepala.filter((item) => item.id_penduduk !== id_penduduk),
        }));
        alert("Kepala Keluarga berhasil dihapus!");
      } else {
        const { error } = await supabase.from("data_penduduk").delete().eq("no_kk", no_kk);
        if (error) throw error;

        setDataKK((prev) => ({
          withKepala: prev.withKepala.filter((item) => item.no_kk !== no_kk),
          withoutKepala: prev.withoutKepala.filter((item) => item.no_kk !== no_kk),
        }));
        alert("Kartu Keluarga beserta seluruh anggotanya berhasil dihapus!");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus data. Cek console untuk detail.");
    }
  };

  // Render
  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Kartu Keluarga</h1>
      </div>

      {/* top controls (Show + Filter RW/RT + Actions) */}
      <div className="flex justify-between items-center mt-4 mb-4 flex-wrap gap-3">
        {/* kiri: show entries + filter RW & RT */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* show entries */}
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
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={150}>150</option>
              <option value={200}>200</option>
            </select>
            <span className="text-sm">entries</span>
          </div>

          {/* filter RW & RT */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter:</span>
            {/* Segmented Control */}
            <div className="flex rounded-lg overflow-hidden border">
              <button
                onClick={() => {
                  setFilterMode("all");
                  setRwFilter("all");
                  setRtFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-4 py-1 text-sm font-medium ${
                  filterMode === "all" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => {
                  setFilterMode("rw");
                  setRwFilter("all");
                  setRtFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-4 py-1 text-sm font-medium ${
                  filterMode === "rw" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                RW
              </button>
            </div>

            {/* Dropdown RW & RT muncul kalau pilih RW */}
            {filterMode === "rw" && (
              <div className="flex items-center gap-2">
                {/* Dropdown RW */}
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={rwFilter}
                  onChange={(e) => {
                    setRwFilter(e.target.value);
                    setRtFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Semua RW</option>
                  {uniqueRWs.map((r) => (
                    <option key={r} value={r}>{`RW ${r}`}</option>
                  ))}
                </select>

                {/* Dropdown RT */}
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={rtFilter}
                  onChange={(e) => {
                    setRtFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Semua RT</option>
                  {uniqueRTs.map((r) => (
                    <option key={r} value={r}>{`RT ${r}`}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* kanan: action buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleDeleteMany}
            disabled={selectedIds.length === 0}
            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5 mr-2" /> Hapus Terpilih
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-gray-500">Memuat data...</div>
      ) : (
        <>
          {/* Tabel KK dengan Kepala Keluarga */}
          <h2 className="text-md font-bold mt-6 mb-2">KK dengan Kepala Keluarga</h2>
          <TableComponent
            data={applyFiltersToList(dataKK.withKepala)}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            selectAll={selectAll}
            setSelectAll={setSelectAll}
            handleDelete={handleDelete}
            handleDeleteMany={handleDeleteMany}
            buildQueryString={buildQueryString}
          />

          {/* Tabel KK tanpa Kepala Keluarga */}
          <h2 className="text-md font-bold mt-6 mb-2 text-red-600">KK tanpa Kepala Keluarga</h2>
          <TableComponent
            data={applyFiltersToList(dataKK.withoutKepala)}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            selectAll={selectAll}
            setSelectAll={setSelectAll}
            handleDelete={handleDelete}
            handleDeleteMany={handleDeleteMany}
            buildQueryString={buildQueryString}
          />
        </>
      )}
    </div>
  );
}

/* Komponen tabel */
function TableComponent({
  data,
  entriesPerPage,
  setEntriesPerPage,
  currentPage,
  setCurrentPage,
  selectedIds,
  setSelectedIds,
  selectAll,
  setSelectAll,
  handleDelete,
  handleDeleteMany,
  buildQueryString,
}) {
  // pastikan currentPage valid ketika data berubah
  useEffect(() => {
    const totalPagesLocal = Math.max(1, Math.ceil(data.length / entriesPerPage));
    if (currentPage > totalPagesLocal) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, entriesPerPage]);

  const totalPages = Math.max(1, Math.ceil(data.length / entriesPerPage));
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentData = data.slice(indexOfFirst, indexOfLast);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(currentData.map((item) => item.id_penduduk));
      setSelectAll(true);
    }
  };

  return (
    <div className="mb-10">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-center">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-2 border">
                <input type="checkbox" checked={selectedIds.length === currentData.length && currentData.length > 0} onChange={toggleSelectAll} />
              </th>
              <th className="px-4 py-2 border">No</th>
              <th className="px-4 py-2 border">NIK</th>
              <th className="px-4 py-2 border">No KK</th>
              <th className="px-4 py-2 border">Nama</th>
              <th className="px-4 py-2 border">Alamat</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length ? (
              currentData.map((item, idx) => (
                <tr key={item.id_penduduk} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">
                    <input type="checkbox" checked={selectedIds.includes(item.id_penduduk)} onChange={() => toggleSelect(item.id_penduduk)} />
                  </td>
                  <td className="px-4 py-2 border">{indexOfFirst + idx + 1}</td>
                  <td className="px-4 py-2 border">{item.nik}</td>
                  <td className="px-4 py-2 border">{item.no_kk}</td>
                  <td className="px-4 py-2 border">{item.nama}</td>
                  <td className="px-4 py-2 border">{item.alamat}</td>
                  <td className="px-4 py-2 border">
                    <div className="flex justify-center items-center space-x-4">
                      <Link
                        to={`/admin/kelola_data/detailkk/${item.no_kk}${buildQueryString()}`}
                        className="text-green-500 hover:text-green-700"
                        title="Anggota"
                      >
                        <Users size={20} />
                      </Link>
                      <button onClick={() => handleDelete(item.id_penduduk, item.no_kk)} className="text-red-500 hover:text-red-700" title="Hapus">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="border px-4 py-3 text-center text-gray-500">
                  Tidak ada data ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">
          Showing {data.length === 0 ? 0 : indexOfFirst + 1} to {Math.min(indexOfLast, data.length)} of {data.length} entries
        </span>
        <div className="space-x-2 flex items-center">
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`px-3 py-1 rounded ${currentPage === num ? "bg-green-500 text-white" : "bg-gray-200"}`}
            >
              {num}
            </button>
          ))}
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataKK;
