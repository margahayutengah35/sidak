// src/rt/pages/sirkulasi/Edit_Pindah.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../supabaseClient";

function Edit_Pindah() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ State form
  const [formData, setFormData] = useState({
    nik: "",
    no_kk: "",
    nama: "",
    tanggal_pindah: "",
    alasan: "",
    alasan_lain: "",
    alamat_pindah: "",
    rt_pindah: "",
    rw_pindah: "",
    desa_pindah: "",
    kecamatan_pindah: "",
    kabupaten_pindah: "",
    provinsi_pindah: "",
    kodepos_pindah: "",
    jenis_pindah: "",
    statuskk_tidakpindah: "",
    statuskk_pindah: "",
  });

  // ✅ Ambil data dari Supabase berdasarkan ID
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("data_pindah")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching data:", error);
      } else if (data) {
        setFormData({
          nik: data.nik || "",
          no_kk: data.no_kk || "",
          nama: data.nama || "",
          tanggal_pindah: data.tanggal_pindah || "",
          alasan: data.alasan || "",
          alasan_lain: data.alasan_lain || "",
          alamat_pindah: data.alamat_pindah || "",
          rt_pindah: data.rt_pindah || "",
          rw_pindah: data.rw_pindah || "",
          desa_pindah: data.desa_pindah || "",
          kecamatan_pindah: data.kecamatan_pindah || "",
          kabupaten_pindah: data.kabupaten_pindah || "",
          provinsi_pindah: data.provinsi_pindah || "",
          kodepos_pindah: data.kodepos_pindah || "",
          jenis_pindah: data.jenis_pindah || "",
          statuskk_tidakpindah: data.statuskk_tidakpindah || "",
          statuskk_pindah: data.statuskk_pindah || "",
        });
      }
    };

    fetchData();
  }, [id]);

  // ✅ Fungsi update data
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (
      !formData.nik ||
      !formData.nama ||
      !formData.tanggal_pindah ||
      !formData.alamat_pindah
    ) {
      alert("⚠️ Harap lengkapi semua data wajib!");
      return;
    }

    try {
      const { error } = await supabase
        .from("data_pindah")
        .update({
          nik: formData.nik,
          no_kk: formData.no_kk,
          nama: formData.nama,
          tanggal_pindah: formData.tanggal_pindah,
          alasan: formData.alasan,
          alasan_lain:
            formData.alasan === "Lainnya" ? formData.alasan_lain : null,
          alamat_pindah: formData.alamat_pindah,
          rt_pindah: formData.rt_pindah,
          rw_pindah: formData.rw_pindah,
          desa_pindah: formData.desa_pindah,
          kecamatan_pindah: formData.kecamatan_pindah,
          kabupaten_pindah: formData.kabupaten_pindah,
          provinsi_pindah: formData.provinsi_pindah,
          kodepos_pindah: formData.kodepos_pindah,
          jenis_pindah: formData.jenis_pindah,
          statuskk_tidakpindah: formData.statuskk_tidakpindah,
          statuskk_pindah: formData.statuskk_pindah,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      alert("✅ Data pindah berhasil diperbarui!");
      navigate("/admin/sirkulasi_penduduk/data_pindah");
    } catch (err) {
      console.error("Gagal update data:", err);
      alert("❌ Terjadi kesalahan saat update data!\n" + err.message);
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

      <h1 className="text-xl font-semibold mb-4">Edit Data Pindah</h1>

      <form onSubmit={handleUpdate} className="grid grid-cols-4 gap-4">
        {/* NIK */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">NIK</label>
          <input
            type="text"
            value={formData.nik}
            readOnly
            className="border rounded px-3 py-2 w-full bg-gray-100"
          />
        </div>

        {/* NO KK */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">No KK</label>
          <input
            type="text"
            value={formData.no_kk}
            readOnly
            className="border rounded px-3 py-2 w-full bg-gray-100"
          />
        </div>

        {/* NAMA */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Nama</label>
          <input
            type="text"
            value={formData.nama}
            readOnly
            className="border rounded px-3 py-2 w-full bg-gray-100"
          />
        </div>

        {/* TANGGAL PINDAH */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Tanggal Pindah
          </label>
          <input
            type="date"
            value={formData.tanggal_pindah || ""}
            onChange={(e) =>
              setFormData({ ...formData, tanggal_pindah: e.target.value })
            }
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* Alasan */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Alasan Pindah</label>
          <select
            value={formData.alasan}
            onChange={(e) =>
              setFormData({ ...formData, alasan: e.target.value, alasan_lain: "" })
            }
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">-- Pilih Alasan --</option>
            <option value="Pekerjaan">Pekerjaan</option>
            <option value="Pendidikan">Pendidikan</option>
            <option value="Keamanan">Keamanan</option>
            <option value="Kesehatan">Kesehatan</option>
            <option value="Perumahan">Perumahan</option>
            <option value="Keluarga">Keluarga</option>
            <option value="Lainnya">Lainnya (Sebutkan)</option>
          </select>

          {/* Input alasan lain hanya muncul jika "Lainnya" */}
          {formData.alasan === "Lainnya" && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">Alasan Lain</label>
              <input
                type="text"
                placeholder="Sebutkan alasan lain"
                value={formData.alasan_lain || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    alasan_lain: e.target.value,
                  })
                }
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>
          )}
        </div>

        {/* INPUT ALAMAT & WILAYAH PINDAH */}
        {[
          "alamat_pindah",
          "rt_pindah",
          "rw_pindah",
          "desa_pindah",
          "kecamatan_pindah",
          "kabupaten_pindah",
          "provinsi_pindah",
          "kodepos_pindah",
        ].map((field) => (
          <div className="col-span-1" key={field}>
            <label className="block text-sm font-medium text-gray-700">
              {field
                .replaceAll("_", " ")
                .replace("pindah", "Pindah")
                .toUpperCase()}
            </label>
            <input
              type="text"
              value={formData[field] || ""}
              onChange={(e) =>
                setFormData({ ...formData, [field]: e.target.value })
              }
              className="border rounded px-3 py-2 w-full bg-gray-50"
            />
          </div>
        ))}

        {/* Jenis Kepindahan */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Jenis Kepindahan</label>
          <select
            value={formData.jenis_pindah || ""}
            onChange={(e) => setFormData({ ...formData, jenis_pindah: e.target.value })}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">-- Pilih Jenis Kepindahan --</option>
            <option value="kepala keluarga">Kepala Keluarga</option>
            <option value="kepala & sebagian anggota">Kepala & Sebagian Anggota</option>
            <option value="kepala & seluruh anggota">Kepala & Seluruh Anggota</option>
            <option value="anggota keluarga">Anggota Keluarga</option>
          </select>
        </div>

        {/* Status KK */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Status KK (Tidak Pindah)
          </label>
          <select
            value={formData.statuskk_tidakpindah || ""}
            onChange={(e) =>
              setFormData({ ...formData, statuskk_tidakpindah: e.target.value })
            }
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">-- Pilih Status --</option>
            <option value="Tetap">Tetap</option>
            <option value="KK Baru">KK Baru</option>
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Status KK (Yang Pindah)
          </label>
          <select
            value={formData.statuskk_pindah || ""}
            onChange={(e) =>
              setFormData({ ...formData, statuskk_pindah: e.target.value })
            }
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">-- Pilih Status KK --</option>
            <option value="Numpang KK">Numpang KK</option>
            <option value="Membuat KK Baru">Membuat KK Baru</option>
          </select>
        </div>
      </form>

      {/* TOMBOL AKSI */}
      <div className="flex justify-end mt-6 space-x-3">
        <Link
          to="/admin/sirkulasi_penduduk/data_pindah"
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Batal
        </Link>
        <button
          type="submit"
          onClick={handleUpdate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Simpan 
        </button>
      </div>
    </div>
  );
}

export default Edit_Pindah;
