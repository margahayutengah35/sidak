// src/rw/pages/sirkulasipenduduk/DetailPindahPerRT.jsx
import { useState, useEffect } from "react";
import { FileText, Eye, ArrowLeft } from "lucide-react";
import supabase from "../../../../supabaseClient";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";

function DetailPindahPerRT() {
  const [dataPindah, setDataPindah] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const rtParam = params.rt;

  const userRw = localStorage.getItem("userRw")?.trim(); // RW login

  const escapeParam = (s) =>
    String(s || "").replace(/%/g, "\\%").replace(/_/g, "\\_").trim();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!userRw) {
        setDataPindah([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const searchParams = new URLSearchParams(location.search);
        const keyword = searchParams.get("keyword");

        let query = supabase.from("data_pindah").select("*");

        // Filter RW sesuai login
        query = query.eq("rw", userRw);

        // Filter RT jika ada
        if (rtParam && String(rtParam).toLowerCase() !== "search") {
          const rtKey = String(rtParam).padStart(2, "0");
          query = query.eq("rt", rtKey);
        }

        // Pencarian keyword
        if (keyword) {
          const safe = escapeParam(keyword);
          query = query.or(`nik.ilike.%${safe}%,nama.ilike.%${safe}%`);
        }

        const { data, error } = await query.order("id", { ascending: false });

        if (!mounted) return;
        if (error) {
          console.error("Error fetching data pindah:", error);
          setDataPindah([]);
        } else {
          setDataPindah(data || []);
          console.log(
            `Fetched ${data?.length || 0} pindah (rtParam=${rtParam}, keyword=${keyword})`
          );
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        if (mounted) setDataPindah([]);
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
  const totalPages = Math.max(1, Math.ceil(dataPindah.length / entriesPerPage));
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentData = dataPindah.slice(indexOfFirst, indexOfLast);

  const handlePrevious = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

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
        <h1 className="text-lg font-semibold">Data Pindah RW {userRw}</h1>
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
              <th className="px-4 py-2 border">JK</th>
              <th className="px-4 py-2 border">Tanggal Pindah</th>
              <th className="px-4 py-2 border">Alasan</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="border px-4 py-3 text-center text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : currentData.length > 0 ? (
              currentData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{indexOfFirst + index + 1}</td>
                  <td className="px-4 py-2 border">{item.nik}</td>
                  <td className="px-4 py-2 border">{item.no_kk}</td>
                  <td className="px-4 py-2 border">{item.nama}</td>
                  <td className="px-4 py-2 border">{item.jk}</td>
                  <td className="px-4 py-2 border">{item.tanggal_pindah}</td>
                  <td className="px-4 py-2 border">{item.alasan}</td>
                  <td className="px-4 py-2 border text-center">
                    <div className="flex justify-center space-x-2">
                      <Link to={`/rw/rwsirkulasipenduduk/detaildatapindah/${item.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full">
                        <Eye className="w-4 h-4" />
                      </Link>
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
          Showing {dataPindah.length === 0 ? 0 : indexOfFirst + 1} to{" "}
          {Math.min(indexOfLast, dataPindah.length)} of {dataPindah.length} entries
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

export default DetailPindahPerRT;
