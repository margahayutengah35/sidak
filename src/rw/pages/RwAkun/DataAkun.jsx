import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Edit, FileText } from "lucide-react";
import supabase from "../../../supabaseClient";
import defaultAvatar from "../../../assets/logo.png";

function DataAkun() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Ambil ID user login dari localStorage
  const userId = localStorage.getItem("userId");

  // Fungsi cek apakah foto sudah berupa URL lengkap
  const isFullUrl = (s) =>
    typeof s === "string" && (s.startsWith("http://") || s.startsWith("https://"));

  // Ambil URL publik foto dari Supabase Storage
  const getFotoUrl = async (fotoPath) => {
    if (!fotoPath) return defaultAvatar;

    if (isFullUrl(fotoPath)) return fotoPath;

    try {
      const { data } = supabase.storage
        .from("user-photos") // ganti dengan nama bucket
        .getPublicUrl(fotoPath);

      return data?.publicUrl || defaultAvatar;
    } catch (err) {
      console.error("Gagal ambil URL foto:", err);
      return defaultAvatar;
    }
  };

  // Ambil data akun user login saja
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setAllData([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId) // hanya ambil data akun user yang login
          .single();

        if (error) {
          console.error("Gagal ambil data akun:", error);
          setAllData([]);
          return;
        }

        const fotoUrl = await getFotoUrl(data.foto);
        setAllData([{ ...data, fotoUrl }]);
      } catch (err) {
        console.error("Unexpected error:", err);
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Akun</h1>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-2 border">No</th>
              <th className="px-4 py-2 border">Profile</th>
              <th className="px-4 py-2 border">Nama</th>
              <th className="px-4 py-2 border">Username</th>
              <th className="px-4 py-2 border">No HP</th>
              <th className="px-4 py-2 border">JK</th>
              <th className="px-4 py-2 border">RW</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {allData.length > 0 ? (
              allData.map((item, index) => (
                <tr key={item.id ?? index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">{index + 1}</td>
                  <td className="px-4 py-2 border text-center">
                    <img
                      src={item.fotoUrl || defaultAvatar}
                      alt="User"
                      className="w-10 h-10 rounded-full object-cover mx-auto"
                      onError={(e) => {
                        e.currentTarget.src = defaultAvatar;
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 border">{item.nama}</td>
                  <td className="px-4 py-2 border">{item.username}</td>
                  <td className="px-4 py-2 border">{item.no_hp}</td>
                  <td className="px-4 py-2 border">{item.jk}</td>
                  <td className="px-4 py-2 border">{item.rw}</td>
                  <td className="px-4 py-2 border">{item.role}</td>
                  <td className="px-4 py-2 border text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        to={`/rw/rwakun/rweditakun/${item.id}`}
                        className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={10}
                  className="text-center py-4 text-gray-500 italic"
                >
                  {loading ? "Memuat data..." : "Tidak ada data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataAkun;
