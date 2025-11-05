// src/rt/pages/KelolaData/Edit_Kelahiran.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../supabaseClient";

function Edit_Kelahiran() {
  const { id } = useParams();
  const navigate = useNavigate();

  // === STATE UTAMA ===
  const [formData, setFormData] = useState({
    no_kk: "",
    nik: "",
    nama: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jk: "",
    golongan_darah: "",
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

  // === FORMAT TANGGAL KE YYYY-MM-DD ===
  const toYMD = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d)) return String(val).split("T")[0] || "";
    return d.toISOString().slice(0, 10);
  };

  // === AMBIL DATA BERDASARKAN ID ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("data_kelahiran")
          .select(
            "no_kk, nik, nama, tempat_lahir, tanggal_lahir, jk, golongan_darah, agama, status_perkawinan, pendidikan, pekerjaan, alamat, rt, rw, status_keluarga, nik_ayah, nama_ayah, nik_ibu, nama_ibu, desa, kecamatan, kabupaten, provinsi, kode_pos"
          )
          .eq("id_kelahiran", id)
          .single();

        if (error) throw error;

        setFormData({
          ...data,
          tanggal_lahir: toYMD(data.tanggal_lahir),
        });
        setSearchJK(data.jk || "");
        setSearchAgama(data.agama || "");
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        alert("Terjadi kesalahan saat memuat data kelahiran.");
      }
    };

    fetchData();
  }, [id]);

  // === HANDLER INPUT ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // === INPUT YANG READONLY ===
  const readOnlyFields = [
    "alamat",
    "rt",
    "rw",
    "desa",
    "kecamatan",
    "kabupaten",
    "provinsi",
    "kode_pos",
  ];

  // === UPDATE DATA ===
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.no_kk || !formData.nik || !formData.nama) {
      alert("No KK, NIK, dan Nama wajib diisi!");
      return;
    }

    try {
      // === UPDATE TABEL DATA_KELAHIRAN ===
      const kelahiranPayload = {
        ...formData,
        jk: searchJK || formData.jk,
        agama: searchAgama || formData.agama,
      };

      const { error: kelahiranError } = await supabase
        .from("data_kelahiran")
        .update(kelahiranPayload)
        .eq("id_kelahiran", id);

      if (kelahiranError) throw kelahiranError;

      // === UPSERT KE TABEL DATA_PENDUDUK (hanya kolom yang ada di sana) ===
      const pendudukData = {
        no_kk: formData.no_kk,
        nik: formData.nik,
        nama: formData.nama,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir,
        jk: searchJK || formData.jk,
        golongan_darah: formData.golongan_darah,
        agama: searchAgama || formData.agama,
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
        status_keluarga: formData.status_keluarga,
        nik_ayah: formData.nik_ayah,
        nama_ayah: formData.nama_ayah,
        nik_ibu: formData.nik_ibu,
        nama_ibu: formData.nama_ibu,
      };

      const { error: pendudukError } = await supabase
        .from("data_penduduk")
        .upsert([pendudukData], { onConflict: ["nik"] });

      if (pendudukError) throw pendudukError;

      // === JIKA KEPALA KELUARGA, PERBARUI ALAMAT SEMUA ANGGOTA ===
      if (formData.status_keluarga === "Kepala Keluarga") {
        const { error: anggotaError } = await supabase
          .from("data_kelahiran")
          .update({
            alamat: formData.alamat,
            rt: formData.rt,
            rw: formData.rw,
            desa: formData.desa,
            kecamatan: formData.kecamatan,
            kabupaten: formData.kabupaten,
            provinsi: formData.provinsi,
            kode_pos: formData.kode_pos,
          })
          .eq("no_kk", formData.no_kk)
          .neq("nik", formData.nik);

        if (anggotaError) throw anggotaError;
      }

      alert("✅ Data kelahiran berhasil diperbarui!");
      navigate("/admin/sirkulasi_penduduk/data_kelahiran");
    } catch (err) {
      console.error("Error update:", err);
      alert("Terjadi kesalahan saat menyimpan perubahan!");
    }
  };

  // === RENDER FORM ===
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mb-5"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
      </button>

      <h1 className="text-xl font-semibold mb-4">Edit Data Kelahiran</h1>

      <form
        onSubmit={handleUpdate}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {Object.keys(formData).map((field) => {
          // === DROPDOWN JK ===
          if (field === "jk") {
            return (
              <div key={field} className="relative">
                <label className="text-sm font-medium">Jenis Kelamin</label>
                <input
                  type="text"
                  name="jk"
                  placeholder="-- Pilih Jenis Kelamin --"
                  value={searchJK}
                  onChange={(e) => {
                    setSearchJK(e.target.value);
                    setShowJKDropdown(true);
                  }}
                  onClick={() => setShowJKDropdown(true)}
                  onFocus={() => setShowJKDropdown(true)}
                  onBlur={() => setTimeout(() => setShowJKDropdown(false), 150)}
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-green-400"
                />
                {showJKDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {["Laki-laki", "Perempuan"]
                      .filter((item) =>
                        item.toLowerCase().includes(searchJK.toLowerCase())
                      )
                      .map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            setSearchJK(item);
                            setFormData((prev) => ({ ...prev, jk: item }));
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

          // === DROPDOWN AGAMA ===
          if (field === "agama") {
            return (
              <div key={field} className="relative">
                <label className="text-sm font-medium">Agama</label>
                <input
                  type="text"
                  name="agama"
                  placeholder="-- Pilih Agama --"
                  value={searchAgama}
                  onChange={(e) => {
                    setSearchAgama(e.target.value);
                    setShowAgamaDropdown(true);
                  }}
                  onClick={() => setShowAgamaDropdown(true)}
                  onFocus={() => setShowAgamaDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowAgamaDropdown(false), 150)
                  }
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-green-400"
                />
                {showAgamaDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {["Islam", "Kristen", "Katholik", "Hindu", "Budha", "Konghucu"]
                      .filter((item) =>
                        item.toLowerCase().includes(searchAgama.toLowerCase())
                      )
                      .map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            setSearchAgama(item);
                            setFormData((prev) => ({ ...prev, agama: item }));
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

          // === INPUT BIASA ===
          return (
            <div key={field}>
              <label className="text-sm font-medium capitalize">
                {field.replace(/_/g, " ")}
              </label>
              <input
                type={field.includes("tanggal") ? "date" : "text"}
                name={field}
                value={formData[field] || ""}
                onChange={handleChange}
                readOnly={readOnlyFields.includes(field)}
                className={`border rounded px-3 py-2 w-full focus:ring-2 focus:ring-green-400 ${
                  readOnlyFields.includes(field) ? "bg-gray-100" : ""
                }`}
              />
            </div>
          );
        })}
      </form>

      <div className="flex justify-end mt-5 gap-2">
        <Link
          to="/admin/sirkulasi_penduduk/data_kelahiran"
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Batal
        </Link>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}

export default Edit_Kelahiran;
