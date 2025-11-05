// src/rw/pages/sirkulasipenduduk/DetailKelahiranPerRT.jsx
import { useState, useEffect } from "react";
import { FileText, Eye, ArrowLeft } from "lucide-react";
import supabase from "../../../../supabaseClient";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";

function DetailKelahiranPerRT() {
  const [dataKelahiran, setDataKelahiran] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const rtParam = params.rt;

  // Ambil RW login
  const userRw = localStorage.getItem("userRw")?.trim();

  const escapeParam = (s) =>
    String(s || "").replace(/%/g, "\\%").replace(/_/g, "\\_").trim();

  useEffect(() => {
    let mounted = true;

    // Simpan RT terakhir yang dilihat (untuk kembali setelah search)
    if (rtParam && rtParam.toLowerCase() !== "search") {
      localStorage.setItem("lastViewedRt", rtParam);
    }
    
    const fetchData = async () => {
      if (!userRw) {
        setDataKelahiran([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const searchParams = new URLSearchParams(location.search);
        const keyword = searchParams.get("keyword");

        let query = supabase.from("data_kelahiran").select("*");

        // Filter RW sesuai login
        query = query.eq("rw", userRw);

        // Mode per RT
        if (rtParam && rtParam.toLowerCase() !== "search") {
          query = query.eq("rt", rtParam);
        }

        // Mode pencarian
        if (keyword) {
          const safe = escapeParam(keyword);
          query = query.or(
            `nik.ilike.%${safe}%,nama.ilike.%${safe}%,no_kk.ilike.%${safe}%`
          );
        }

        // Filter tanggal lahir
        query = query.not("tanggal_lahir", "is", null);

        const { data, error } = await query.order("id_kelahiran", {
          ascending: true,
        });

        if (!mounted) return;
        if (error) {
          console.error("Error fetching data kelahiran:", error);
          setDataKelahiran([]);
        } else {
          // ambil no_kk unik
          const kkList = [...new Set((data || []).map((d) => d.no_kk))];

          let kepalaKeluargaMap = {};
          if (kkList.length > 0) {
            const { data: kkData, error: kkError } = await supabase
              .from("data_penduduk")
              .select("no_kk, nama")
              .in("no_kk", kkList)
              .eq("status_keluarga", "Kepala Keluarga");

            if (!kkError && kkData) {
              kkData.forEach((row) => {
                kepalaKeluargaMap[row.no_kk] = row.nama;
              });
            }
          }

          const merged = (data || []).map((d) => ({
            ...d,
            kepala_keluarga: kepalaKeluargaMap[d.no_kk] || "-",
          }));

          setDataKelahiran(merged);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        if (mounted) setDataKelahiran([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    setCurrentPage(1);
    fetchData();

    return () => {
      mounted = false;
    };
  }, [location.search, rtParam, userRw]);

  // Pagination
  const totalPages = Math.ceil(dataKelahiran.length / entriesPerPage) || 1;
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentData = dataKelahiran.slice(indexOfFirst, indexOfLast);

  const handlePrevious = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));

  if (!userRw) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-red-500 text-center">
          RW tidak ditemukan. Harap login kembali.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">
          Data Kelahiran RW {userRw}
        </h1>
      </div>

      {/* Tombol kembali */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mt-4 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
      </button>

      {/* Dropdown Show entries */}
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

      {/* Tabel */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border border-gray-200 text-center">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-2 border">No</th>
              <th className="px-4 py-2 border">NIK</th>
              <th className="px-4 py-2 border">No KK</th>
              <th className="px-4 py-2 border">Nama</th>
              <th className="px-4 py-2 border">Tanggal Lahir</th>
              <th className="px-4 py-2 border">JK</th>
              <th className="px-4 py-2 border">Keluarga</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  className="border px-4 py-6 text-center text-gray-500"
                >
                  Memuat data...
                </td>
              </tr>
            ) : currentData.length > 0 ? (
              currentData.map((item, index) => (
                <tr key={item.id_kelahiran} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">
                    {indexOfFirst + index + 1}
                  </td>
                  <td className="px-4 py-2 border">{item.nik}</td>
                  <td className="px-4 py-2 border">{item.no_kk}</td>
                  <td className="px-4 py-2 border">{item.nama}</td>
                  <td className="px-4 py-2 border">{item.tanggal_lahir}</td>
                  <td className="px-4 py-2 border">{item.jk}</td>
                  <td className="px-4 py-2 border">{item.kepala_keluarga}</td>
                  <td className="px-4 py-2 border">
                    <Link
                      to={`/rw/rwsirkulasipenduduk/detaildata/${item.id_kelahiran}`}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
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
      {!loading && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm">
            Showing {dataKelahiran.length === 0 ? 0 : indexOfFirst + 1} to{" "}
            {Math.min(indexOfLast, dataKelahiran.length)} of{" "}
            {dataKelahiran.length} entries
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
                  currentPage === num
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
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
      )}
    </div>
  );
}

export default DetailKelahiranPerRT;
