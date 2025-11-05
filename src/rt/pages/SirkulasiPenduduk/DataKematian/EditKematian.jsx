// src/rt/pages/KelolaData/EditKematian.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronDown, ArrowLeft } from "lucide-react";
import supabase from "../../../../supabaseClient";

function EditKematian() {
  const { id } = useParams();
  const navigate = useNavigate();

  const alamatOptions = [
    "Jl. Sadang",
    "Kp. Sadang",
    "Pasantren",
    "Kp. Pasantren",
    "Kopo Bihbul",
    "Jl. Kopo Bihbul",
    "Nata Endah",
    "Komp. Nata Endah",
    "Taman Kopo Indah",
    "Komp. Taman Kopo Indah",
    "Bbk. Tasikmalaya",
    "Kp. Bbk. Tasikmalaya",
    "Sekeloa Girang",
    "Jl. Sekeloa Girang",
    "Perum Linggahara",
    "Kp. Margamulya",
    "Komp. Nata Endah Gg. Margamulya",
  ];

  const agamaOptions = ["Islam", "Kristen", "Katholik", "Hindu", "Budha", "Konghucu"];
  const jkOptions = ["Laki-laki", "Perempuan"];

  const [formData, setFormData] = useState({
    nik: "",
    no_kk: "",
    nama: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jk: "",
    agama: "",
    status_perkawinan: "",
    pendidikan: "",
    pekerjaan: "",
    alamat: "",
    rt: "",
    rw: "",
    status_keluarga: "",
    nik_ayah: "",
    nama_ayah: "",
    nik_ibu: "",
    nama_ibu: "",
    desa: "Margahayu Tengah",
    kecamatan: "Margahayu",
    kabupaten: "Bandung",
    provinsi: "Jawa Barat",
    kode_pos: "40225",
    tanggal_kematian: "",
    hari_kematian: "",
    pukul_kematian: "",
    tempat_kematian: "",
    sebab: "",
  });

  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAlamatDropdown, setShowAlamatDropdown] = useState(false);

  // 🔹 Ambil data utama dan cek pending update
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("data_kematian")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setFormData((prev) => ({ ...prev, ...data }));

        if (data?.nik) {
          const { data: pend, error: pendErr } = await supabase
            .from("data_kematian_update")
            .select("*")
            .eq("nik", data.nik)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (pendErr) console.error("Error fetch pending update:", pendErr);

          if (
            pend &&
            pend.status_verifikasi &&
            pend.status_verifikasi.toLowerCase().includes("menunggu persetujuan")
          ) {
            setPendingUpdate(pend);
          } else {
            setPendingUpdate(null);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
  }, [id]);

  // 🔹 Handle Update
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.nik || !formData.nama || !formData.tanggal_kematian) {
      alert("Harap lengkapi data wajib (NIK, Nama, Tanggal Kematian).");
      return;
    }

    if (pendingUpdate) {
      alert("Sudah ada usulan perubahan yang menunggu persetujuan admin.");
      return;
    }

    try {
      setIsUpdating(true);

      const { error: insertError } = await supabase.from("data_kematian_update").insert([
        {
          ...formData,
          jenis_update: "edit",
          status_verifikasi: "menunggu persetujuan",
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("data_kematian")
        .update({
          status_verifikasi: "menunggu persetujuan",
          alasan_penolakan: null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      alert("✅ Usulan perubahan berhasil dikirim untuk persetujuan admin!");
      navigate("/rt/sirkulasipenduduk/datakematian");
    } catch (err) {
      console.error("Gagal kirim data:", err);
      alert("❌ Terjadi kesalahan saat mengirim data!\n" + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // 🔹 Render Input
  const renderInput = (field) => {
    const readOnlyFields = ["rt", "rw", "desa", "kecamatan", "kabupaten", "provinsi"];
    const isReadOnly = readOnlyFields.includes(field);

    // Field alamat
if (field === "alamat") {
  const filteredOptions =
    showAlamatDropdown && formData.alamat
      ? alamatOptions.filter((opt) =>
          opt.toLowerCase().includes(formData.alamat.toLowerCase())
        )
      : alamatOptions;

  return (
    <div className="relative">
      <input
        type="text"
        value={formData.alamat || ""}
        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
        onFocus={() => setShowAlamatDropdown(true)}
        onBlur={() => setTimeout(() => setShowAlamatDropdown(false), 150)}
        placeholder="Pilih atau ketik alamat..."
        className="border rounded px-3 py-2 w-full bg-white pr-8 focus:outline-none"
      />

      {/* Tombol ikon dropdown */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // biar input nggak kehilangan fokus
          setShowAlamatDropdown((prev) => !prev);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
      >
        <ChevronDown size={18} />
      </button>

      {showAlamatDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {alamatOptions.map((opt) => (
            <div
              key={opt}
              onMouseDown={() => {
                setFormData({ ...formData, alamat: opt });
                setShowAlamatDropdown(false);
              }}
              className="px-3 py-2 hover:bg-green-100 cursor-pointer"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

    // Field Agama
    if (field === "agama") {
      return (
        <select
          value={formData.agama}
          onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
          className="border rounded px-3 py-2 w-full bg-white"
        >
          <option value="">-- Pilih Agama --</option>
          {agamaOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    // Field Jenis Kelamin
    if (field === "jk") {
      return (
        <select
          value={formData.jk}
          onChange={(e) => setFormData({ ...formData, jk: e.target.value })}
          className="border rounded px-3 py-2 w-full bg-white"
        >
          <option value="">-- Pilih Jenis Kelamin --</option>
          {jkOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    // Field lainnya
    return (
      <input
        type={
          field.includes("tanggal")
            ? "date"
            : field.includes("pukul")
            ? "time"
            : "text"
        }
        value={formData[field] || ""}
        readOnly={isReadOnly}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        className={`border rounded px-3 py-2 w-full ${
          isReadOnly ? "bg-gray-100 cursor-not-allowed" : "bg-gray-50"
        }`}
      />
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow overflow-visible">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
      </button>

      <h1 className="text-xl font-semibold mb-4">Edit Data Kematian</h1>

      {pendingUpdate && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-300">
          <p>Sudah ada usulan perubahan yang menunggu persetujuan admin.</p>
          {pendingUpdate.created_at && (
            <div className="text-sm mt-1 text-yellow-700">
              Diajukan:{" "}
              {new Date(pendingUpdate.created_at).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}
        </div>
      )}

      <form className="grid grid-cols-5 gap-4">
        {[
          "nik",
          "no_kk",
          "nama",
          "jk",
          "agama",
          "tanggal_lahir",
          "alamat",
          "rt",
          "rw",
          "tanggal_kematian",
          "hari_kematian",
          "pukul_kematian",
          "tempat_kematian",
          "sebab",
          "desa",
          "kecamatan",
          "kabupaten",
          "provinsi",
        ].map((field) => (
          <div className="col-span-1" key={field}>
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {field.replaceAll("_", " ")}
            </label>
            {renderInput(field)}
          </div>
        ))}
      </form>

      <div className="flex justify-end mt-4 space-x-2">
        <Link
          to="/rt/sirkulasipenduduk/datakematian"
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
          } text-white rounded hover:bg-green-700 ${
            pendingUpdate ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isUpdating
            ? "Mengirim..."
            : pendingUpdate
            ? "Menunggu Persetujuan"
            : "Update"}
        </button>
      </div>
    </div>
  );
}

export default EditKematian;
