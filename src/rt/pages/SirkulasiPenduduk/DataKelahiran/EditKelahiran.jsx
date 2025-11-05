// src/rt/pages/KelolaData/EditKelahiran.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../../supabaseClient";

function EditKelahiran() {
  const { id } = useParams(); // id = id_kelahiran
  const navigate = useNavigate();

  // ===== STATE =====
  const [formData, setFormData] = useState({
    id_kelahiran: null,
    no_kk: "",
    nik: "",
    nama: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jk: "",
    golongan_darah: "",
    agama: "",
    status_perkawinan: "Belum Kawin",
    pendidikan: "Tidak/belum sekolah",
    pekerjaan: "Belum/Tidak Bekerja",
    alamat: "",
    rt: "",
    rw: "",
    status_keluarga: "Anak",
    nik_ayah: "",
    nama_ayah: "",
    nik_ibu: "",
    nama_ibu: "",
    desa: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
    kode_pos: "",
  });

  const [searchJK, setSearchJK] = useState("");
  const [showJKDropdown, setShowJKDropdown] = useState(false);

  const [searchAgama, setSearchAgama] = useState("");
  const [showAgamaDropdown, setShowAgamaDropdown] = useState(false);

  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ===== AMBIL DATA LAMA + CEK PENDING USULAN =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ambil data kelahiran utama
        const { data, error } = await supabase
          .from("data_kelahiran")
          .select("*")
          .eq("id_kelahiran", id)
          .single();

        if (error) {
          console.error("Fetch data error:", error);
          return;
        }

        // set form
        setFormData((prev) => ({ ...prev, ...data }));
        setSearchJK(data?.jk || "");
        setSearchAgama(data?.agama || "");

        // cek apakah ada usulan edit yang menunggu persetujuan untuk id_kelahiran ini
        const { data: pend, error: pendErr } = await supabase
          .from("data_kelahiran_update")
          .select("*")
          .eq("id_kelahiran", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendErr) {
          console.error("Error fetching pending update:", pendErr);
          setPendingUpdate(null);
        } else {
          if (pend && pend.status_verifikasi && pend.status_verifikasi.toLowerCase().includes("menunggu persetujuan")) {
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

  // ===== UPDATE (ALUR: TANDAI UTAMA => MASUKKAN USULAN) =====
  const handleUpdate = async () => {
    // validasi minimal
    if (!formData.no_kk || !formData.nik || !formData.nama) {
      alert("No KK, NIK, dan Nama harus diisi!");
      return;
    }

    if (pendingUpdate) {
      alert("Ada usulan perubahan yang sedang menunggu persetujuan admin. Mohon tunggu hingga usulan tersebut diproses.");
      return;
    }

    try {
      setIsUpdating(true);

      // 1) update data_kelahiran: hanya set status_verifikasi jadi menunggu, dan updated_at
      const { error: kelahiranError } = await supabase
        .from("data_kelahiran")
        .update({
          status_verifikasi: "menunggu persetujuan",
          updated_at: new Date().toISOString(),
        })
        .eq("id_kelahiran", id);

      if (kelahiranError) throw kelahiranError;

      // 2) insert ke data_kelahiran_update sebagai usulan (jenis = 'edit')
      const insertPayload = {
        id_kelahiran: id,
        no_kk: formData.no_kk,
        nik: formData.nik,
        nama: formData.nama,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir,
        jk: formData.jk,
        agama: formData.agama,
        status_perkawinan: formData.status_perkawinan,
        pendidikan: formData.pendidikan,
        pekerjaan: formData.pekerjaan,
        alamat: formData.alamat,
        rt: formData.rt,
        rw: formData.rw,
        desa: formData.desa,
        kecamatan: formData.kecamatan,
        kabupaten: formData.kabupaten,
        provinsi: formData.provinsi,
        kode_pos: formData.kode_pos,
        nik_ayah: formData.nik_ayah,
        nama_ayah: formData.nama_ayah,
        tanggal_lahir_ayah: formData.tanggal_lahir_ayah || null,
        pekerjaan_ayah: formData.pekerjaan_ayah || null,
        nik_ibu: formData.nik_ibu,
        nama_ibu: formData.nama_ibu,
        tanggal_lahir_ibu: formData.tanggal_lahir_ibu || null,
        pekerjaan_ibu: formData.pekerjaan_ibu || null,
        status_keluarga: formData.status_keluarga || "Anak",
        golongan_darah: formData.golongan_darah,
        jenis: "edit",
        status_verifikasi: "menunggu persetujuan",
        created_at: new Date().toISOString(),
      };

      const { error: insertErr } = await supabase
        .from("data_kelahiran_update")
        .insert([insertPayload]);

      if (insertErr) throw insertErr;

      // Selesai — perubahan akan diproses admin / trigger DB
      alert("✅ Usulan perubahan berhasil dikirim, menunggu persetujuan admin.");
      navigate("/rt/sirkulasipenduduk/datakelahiran");
    } catch (err) {
      console.error("Terjadi kesalahan saat mengusulkan update:", err);
      alert("Terjadi kesalahan saat mengirim usulan! Cek console untuk detail.");
    } finally {
      setIsUpdating(false);
    }
  };

  // ===== RENDER FORM =====
  const readOnlyFields = [
    "status_perkawinan",
    "pendidikan",
    "pekerjaan",
    "alamat",
    "rt",
    "rw",
    "desa",
    "kecamatan",
    "kabupaten",
    "provinsi",
    "kode_pos",
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mb-4"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
      </button>

      <h1 className="text-xl font-semibold mb-4">Edit Data Kelahiran</h1>

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
        {[
          "no_kk",
          "nik",
          "nama",
          "tempat_lahir",
          "tanggal_lahir",
          "jk",
          "golongan_darah",
          "agama",
          "status_perkawinan",
          "pendidikan",
          "pekerjaan",
          "alamat",
          "rt",
          "rw",
          "status_keluarga",
          "nik_ayah",
          "nama_ayah",
          "nik_ibu",
          "nama_ibu",
          "desa",
          "kecamatan",
          "kabupaten",
          "provinsi",
          "kode_pos",
        ].map((field) => {
          if (field === "jk") {
            return (
            <div key={field} className="relative w-full">
              <input
                type="text"
                placeholder="-- Pilih Jenis Kelamin --"
                value={searchJK || ""}
                onChange={(e) => {
                  setSearchJK(e.target.value);
                  setShowJKDropdown(true);
                }}
                onClick={() => setShowJKDropdown(true)}
                onFocus={() => setShowJKDropdown(true)}
                // hapus onBlur lama, ganti handle via mouse
                className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {showJKDropdown && (
                <ul
                  className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto"
                  // cegah dropdown tertutup saat klik item
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {["Laki-laki", "Perempuan"]
                    .filter(item => item.toLowerCase().includes(searchJK.toLowerCase()))
                    .map((item, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setFormData({ ...formData, jk: item });
                          setSearchJK(item);
                          setShowJKDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                      >
                        {item}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            );
          }

          if (field === "agama") {
            return (
            <div key="agama" className="relative w-full">
              <input
                type="text"
                placeholder="-- Pilih Agama --"
                value={searchAgama}
                onChange={(e) => {
                  setSearchAgama(e.target.value);
                  setShowAgamaDropdown(true);
                }}
                onFocus={() => setShowAgamaDropdown(true)}
                onBlur={() => setTimeout(() => setShowAgamaDropdown(false), 200)} // delay supaya klik list tidak hilang
                className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {showAgamaDropdown && (
                <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                  {["Islam","Kristen","Katholik","Hindu","Budha","Konghucu"]
                    .filter(item => item.toLowerCase().includes(searchAgama.toLowerCase()))
                    .map((item, index) => (
                      <li
                        key={index}
                        onMouseDown={(e) => { // prevent blur sebelum klik selesai
                          e.preventDefault();
                          setFormData({ ...formData, agama: item });
                          setSearchAgama(item);
                          setShowAgamaDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                      >
                        {item}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            );
          }

          return (
            <input
              key={field}
              type={field === "tanggal_lahir" ? "date" : "text"}
              placeholder={field.replace("_"," ")}
              value={formData[field] ?? ""}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              readOnly={readOnlyFields.includes(field)}
              className={`border rounded px-3 py-2 ${readOnlyFields.includes(field) ? "bg-gray-100" : ""}`}
            />
          );
        })}
      </form>

      <div className="flex justify-end mt-4 space-x-2">
        <Link to="/rt/sirkulasipenduduk/datakelahiran" className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
          Batal
        </Link>
        <button
          onClick={handleUpdate}
          disabled={isUpdating || !!pendingUpdate}
          className={`px-4 py-2 ${isUpdating ? "bg-green-400" : "bg-green-600"} text-white rounded hover:bg-green-700 ${pendingUpdate ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUpdating ? "Menyimpan..." : pendingUpdate ? "Menunggu Persetujuan" : "Update"}
        </button>
      </div>
    </div>
  );
}

export default EditKelahiran;
