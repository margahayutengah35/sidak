import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../../supabaseClient";

function EditPindah() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id_penduduk: null,
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

  const [pendingUpdate, setPendingUpdate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("data_pindah")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching data:", error);
          return;
        }

        setFormData((prev) => ({ ...prev, ...data }));

        const idPenduduk = data.id_penduduk ?? data.id_penduduk;

        if (idPenduduk) {
          const { data: pend, error: pendErr } = await supabase
            .from("data_pindah_update")
            .select("*")
            .eq("id_penduduk", idPenduduk)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (pendErr) {
            console.error("Error fetching pending update:", pendErr);
          } else {
            if (pend && pend.status_verifikasi && pend.status_verifikasi.toLowerCase().includes("menunggu persetujuan")) {
              setPendingUpdate(pend);
            } else {
              setPendingUpdate(null);
            }
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
  }, [id]);

  const [isUpdating, setIsUpdating] = useState(false);

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

  if (pendingUpdate) {
    alert("⚠️ Ada usulan perubahan yang masih menunggu persetujuan admin!");
    return;
  }

  try {
    setIsUpdating(true);

    // 1️⃣ Update tabel data_pindah agar statusnya menunggu
    const { error: errUpdate } = await supabase
      .from("data_pindah")
      .update({
        jenis_update: "edit",
        status_verifikasi: "menunggu persetujuan",
        updated_at: new Date().toISOString(),
      })
      .eq("nik", formData.nik);

    if (errUpdate) throw errUpdate;

    // 2️⃣ Insert ke tabel data_pindah_update untuk disetujui oleh admin
    const { error: errInsert } = await supabase
      .from("data_pindah_update")
      .insert([
        {
          id_penduduk: formData.id_penduduk,
          nik: formData.nik,
          no_kk: formData.no_kk,
          nama: formData.nama,
          tanggal_pindah: formData.tanggal_pindah,
          alasan: formData.alasan,
          alasan_lain: formData.alasan === "Lainnya" ? formData.alasan_lain : null,
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
          jenis_update: "edit", // 👈 jenis usulan
          status_verifikasi: "menunggu persetujuan",
          created_at: new Date().toISOString(),
        },
      ]);

    if (errInsert) throw errInsert;

    alert("✅ Usulan edit berhasil dikirim dan menunggu persetujuan admin!");
    navigate("/rt/sirkulasipenduduk/datapindah");
  } catch (err) {
    console.error("❌ Gagal kirim usulan edit:", err);
    alert("❌ Terjadi kesalahan!\n" + (err.message || JSON.stringify(err)));
  } finally {
    setIsUpdating(false);
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

      {pendingUpdate && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-200">
          Sudah ada usulan perubahan untuk data ini yang sedang menunggu persetujuan admin.
          {pendingUpdate.created_at && (
            <div className="text-sm mt-1">
              Diajukan: {new Date(pendingUpdate.created_at).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}
        </div>
      )}

      <form className="grid grid-cols-4 gap-4">
        {/* NIK */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">NIK</label>
          <input
            type="text"
            value={formData.nik}
            onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
            className="border rounded px-3 py-2 w-full bg-gray-100"
            readOnly
          />
        </div>

        {/* NO KK */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">NO KK</label>
          <input
            type="text"
            value={formData.no_kk}
            readOnly
            className="border rounded px-3 py-2 w-full bg-gray-100"
          />
        </div>

        {/* Nama */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Nama</label>
          <input
            type="text"
            value={formData.nama}
            readOnly
            className="border rounded px-3 py-2 w-full bg-gray-100"
          />
        </div>

        {/* Tanggal Pindah */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Tanggal Pindah</label>
          <input
            type="date"
            value={formData.tanggal_pindah || ""}
            onChange={(e) => setFormData({ ...formData, tanggal_pindah: e.target.value })}
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

          {formData.alasan === "Lainnya" && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">Alasan Lain</label>
              <input
                type="text"
                placeholder="Sebutkan alasan lain"
                value={formData.alasan_lain || ""}
                onChange={(e) =>
                  setFormData({ ...formData, alasan_lain: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>
          )}
        </div>

        {/* Alamat pindah */}
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
              {field.replaceAll("_", " ").replace("pindah", "Pindah").toUpperCase()}
            </label>
            <input
              type="text"
              value={formData[field] || ""}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              className="border rounded px-3 py-2 w-full bg-gray-50"
            />
          </div>
        ))}

        {/* Jenis kepindahan */}
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
            onChange={(e) => setFormData({ ...formData, statuskk_tidakpindah: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, statuskk_pindah: e.target.value })}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">-- Pilih Status KK --</option>
            <option value="Numpang KK">Numpang KK</option>
            <option value="Membuat KK Baru">Membuat KK Baru</option>
          </select>
        </div>
      </form>

      {/* Tombol */}
      <div className="flex justify-end mt-4 space-x-2">
        <Link
          to="/rt/sirkulasipenduduk/datapindah"
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Batal
        </Link>
        <button
          type="button"
          onClick={handleUpdate}
          disabled={isUpdating || !!pendingUpdate}
          className={`px-4 py-2 ${
            isUpdating ? "bg-green-400" : "bg-green-600"
          } text-white rounded hover:bg-green-700 ${pendingUpdate ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUpdating
            ? "Menyimpan..."
            : pendingUpdate
            ? "Menunggu Persetujuan"
            : "Update"}
        </button>
      </div>
    </div>
  );
}

export default EditPindah;
