// src/rw/pages/RwKelolaData/DetailKKPerRt.jsx
import { useState, useEffect } from "react";
import { FileText, Users, Trash2 } from "lucide-react";
import supabase from "../../../supabaseClient";
import { useLocation, useParams, Link } from "react-router-dom";

function DetailKKPerRT() {
  const [dataKK, setDataKK] = useState({ withKepala: [], withoutKepala: [] });
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false); // <-- state loading
  const location = useLocation();
  const { rt } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // mulai loading
        const params = new URLSearchParams(location.search);
        const noKK = params.get("no_kk");

        let query = supabase.from("data_penduduk").select("*");

        if (noKK) {
          query = query.eq("no_kk", noKK);
        } else if (rt) {
          query = query.eq("rt", rt);
        }

        const userRw = localStorage.getItem("userRw")?.trim();
        if (userRw) {
          query = query.eq("rw", userRw);
        }

        const { data, error } = await query.order("id_penduduk", { ascending: true });

        if (error) {
          console.error("Error fetching data:", error);
        } else {
          const grouped = {};
          (data || []).forEach((d) => {
            if (!grouped[d.no_kk]) grouped[d.no_kk] = [];
            grouped[d.no_kk].push(d);
          });

          const withKepala = [];
          const withoutKepala = [];

          Object.values(grouped).forEach((anggota) => {
            const kepala = anggota.find(
              (a) => (a.status_keluarga || "").toLowerCase().trim() === "kepala keluarga"
            );
            if (kepala) {
              withKepala.push(kepala);
            } else {
              withoutKepala.push(anggota[0]);
            }
          });

          setDataKK({ withKepala, withoutKepala });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false); // selesai loading
      }
    };

    fetchData();
  }, [location.search, rt]);

  // Hapus banyak data sekaligus
  const handleDeleteMany = async () => {
    if (!selectedIds.length) return alert("Pilih data yang ingin dihapus!");
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus ${selectedIds.length} data terpilih?`
    );
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("data_penduduk")
      .delete()
      .in("id_penduduk", selectedIds);
    if (error) return alert("Gagal menghapus data!");

    setDataKK((prev) => ({
      withKepala: prev.withKepala.filter(
        (item) => !selectedIds.includes(item.id_penduduk)
      ),
      withoutKepala: prev.withoutKepala.filter(
        (item) => !selectedIds.includes(item.id_penduduk)
      ),
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
        const { error } = await supabase
          .from("data_penduduk")
          .delete()
          .eq("id_penduduk", id_penduduk);
        if (error) throw error;

        setDataKK((prev) => ({
          withKepala: prev.withKepala.filter(
            (item) => item.id_penduduk !== id_penduduk
          ),
          withoutKepala: prev.withoutKepala.filter(
            (item) => item.id_penduduk !== id_penduduk
          ),
        }));
        alert("Kepala Keluarga berhasil dihapus!");
      } else {
        const { error } = await supabase
          .from("data_penduduk")
          .delete()
          .eq("no_kk", no_kk);
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

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Kartu Keluarga</h1>
      </div>

      {/* Tabel KK dengan Kepala Keluarga */}
      <h2 className="text-md font-bold mt-6 mb-2">KK dengan Kepala Keluarga</h2>
      <TableComponent
        data={dataKK.withKepala}
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
        loading={loading} // kirim ke tabel
      />

      {/* Tabel KK tanpa Kepala Keluarga */}
      <h2 className="text-md font-bold mt-6 mb-2 text-red-600">KK tanpa Kepala Keluarga</h2>
      <TableComponent
        data={dataKK.withoutKepala}
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
        loading={loading}
      />
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
  loading, // <-- terima loading
}) {
  const totalPages = Math.ceil(data.length / entriesPerPage) || 1;
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentData = data.slice(indexOfFirst, indexOfLast);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
      {/* Controls */}
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
            {[500, 550, 600, 650].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
          <span className="text-sm">entries</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDeleteMany}
            disabled={!selectedIds.length}
            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5 mr-2" /> Hapus Terpilih
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-center">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-2 border">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === currentData.length &&
                    currentData.length > 0
                  }
                  onChange={toggleSelectAll}
                />
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
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="border px-4 py-3 text-center text-gray-500"
                >
                  Memuat data...
                </td>
              </tr>
            ) : currentData.length ? (
              currentData.map((item, idx) => (
                <tr key={item.id_penduduk} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id_penduduk)}
                      onChange={() => toggleSelect(item.id_penduduk)}
                    />
                  </td>
                  <td className="px-4 py-2 border">{indexOfFirst + idx + 1}</td>
                  <td className="px-4 py-2 border">{item.nik}</td>
                  <td className="px-4 py-2 border">{item.no_kk}</td>
                  <td className="px-4 py-2 border">{item.nama}</td>
                  <td className="px-4 py-2 border">{item.alamat}</td>
                  <td className="px-4 py-2 border">
                    <div className="flex justify-center items-center space-x-4">
                      <Link
                        to={`/rw/rwkeloladata/anggotakkperrt/${encodeURIComponent(
                          item.no_kk
                        )}`}
                        className="text-green-500 hover:text-green-700"
                        title="Anggota"
                      >
                        <Users size={20} />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id_penduduk, item.no_kk)}
                        className="text-red-500 hover:text-red-700"
                        title="Hapus"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="border px-4 py-3 text-center text-gray-500"
                >
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
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
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

export default DetailKKPerRT;
