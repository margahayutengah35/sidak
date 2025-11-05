// src/rt/pages/SirkulasiPenduduk/Edit_Kematian.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../supabaseClient";

function Edit_Kematian() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nik: "",
    no_kk: "",
    nama: "",
    tanggal_kematian: "",
    hari_kematian: "",
    pukul_kematian: "",
    sebab: "",
    tempat_kematian: "",
  });

  // Helper: nama hari bahasa Indonesia
  const getNamaHari = (dateString) => {
    if (!dateString) return "";
    const [y, m, d] = dateString.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    const hariArray = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return hariArray[dt.getDay()] || "";
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("data_kematian")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error("Error fetching data:", error);
      else setFormData(data);
    };

    fetchData();
  }, [id]);

  const handleUpdate = async () => {
    if (!formData.nik || !formData.no_kk || !formData.nama || !formData.tanggal_kematian ||
       !formData.hari_kematian || !formData.sebab) {
      alert("Harap lengkapi semua data!");
      return;
    }

    try {
      const { error } = await supabase
        .from("data_kematian")
        .update(formData)
        .eq("id", id);

      if (error) throw error;

      alert("Data kematian berhasil diupdate!");
      navigate("/admin/sirkulasi_penduduk/data_kematian");
    } catch (err) {
      console.error("Gagal update data:", err);
      alert("Terjadi kesalahan saat update data!\n" + err.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
      </button>
      <h1 className="text-xl font-semibold mb-4">Edit Data Kematian</h1>

      <form className="grid grid-cols-2 gap-4">
        {/* NIK, NO KK & Nama (read-only) */}
        <input
          readOnly
          className="w-full border p-2 rounded bg-gray-50"
          type="text"
          placeholder="NIK"
          value={formData.nik}
        />
        <input
          readOnly
          className="w-full border p-2 rounded bg-gray-50"
          type="text"
          placeholder="NO KK"
          value={formData.no_kk}
        />
        <input
          readOnly
          type="text"
          placeholder="Nama"
          value={formData.nama}
          className="w-full border p-2 rounded bg-gray-50"
        />

        {/* Tanggal Kematian */}
        <input
          type="date"
          placeholder="Tanggal Kematian"
          value={formData.tanggal_kematian}
          onChange={(e) => {
            const tanggal = e.target.value;
            const hari = getNamaHari(tanggal);
            setFormData({ ...formData, tanggal_kematian: tanggal, hari_kematian: hari });
          }}
          className="border rounded px-3 py-2"
        />

        {/* Hari Kematian (read-only) */}
        <input
          type="text"
          placeholder="Hari"
          value={formData.hari_kematian}
          readOnly
          className="w-full border p-2 rounded bg-gray-100"
        />

        {/* Pukul Kematian */}
        <input
          type="time"
          placeholder="Pukul Kematian"
          value={formData.pukul_kematian || ""}
          onChange={(e) => setFormData({ ...formData, pukul_kematian: e.target.value })}
          className="border rounded px-3 py-2"
        />

        {/* Sebab & Tempat Kematian */}
        <input
          type="text"
          placeholder="Sebab Kematian"
          value={formData.sebab || ""}
          onChange={(e) => setFormData({ ...formData, sebab: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Tempat Kematian"
          value={formData.tempat_kematian || ""}
          onChange={(e) => setFormData({ ...formData, tempat_kematian: e.target.value })}
          className="border rounded px-3 py-2"
        />
      </form>

      <div className="flex justify-end mt-4 space-x-2">
        <Link
          to="/admin/sirkulasi_penduduk/data_kematian"
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Batal
        </Link>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Update
        </button>
      </div>
    </div>
  );
}

export default Edit_Kematian;
