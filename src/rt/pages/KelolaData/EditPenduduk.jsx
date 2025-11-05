// src/rt/pages/EditPenduduk.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../supabaseClient";

function EditPenduduk() {
  const { id } = useParams();
  const navigate = useNavigate();

  // dropdown/search states
  const [searchJK, setSearchJK] = useState("");
  const [showJKDropdown, setShowJKDropdown] = useState(false);

  const [searchAgama, setSearchAgama] = useState("");
  const [showAgamaDropdown, setShowAgamaDropdown] = useState(false);

  const [searchStatus, setSearchStatus] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [searchPendidikan, setSearchPendidikan] = useState("");
  const [showPendidikanDropdown, setShowPendidikanDropdown] = useState(false);

  const [searchPekerjaan, setSearchPekerjaan] = useState("");
  const [showPekerjaanDropdown, setShowPekerjaanDropdown] = useState(false);

  const [searchAlamat, setSearchAlamat] = useState("");
  const [showAlamatDropdown, setShowAlamatDropdown] = useState(false);

  const [searchRt, setSearchRt] = useState("");
  const [showRtDropdown, setShowRtDropdown] = useState(false);
  const rtOptions = Array.from({ length: 10 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  const [searchRw, setSearchRw] = useState("");
  const [showRwDropdown, setShowRwDropdown] = useState(false);
  const rwOptions = Array.from({ length: 20 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  const [searchStatusKeluarga, setSearchStatusKeluarga] = useState("");
  const [showStatusKeluargaDropdown, setShowStatusKeluargaDropdown] =
    useState(false);

  const [userRt, setUserRt] = useState("");
  const [userRw, setUserRw] = useState("");

  // track if there's already a pending update for this id_penduduk
  const [pendingUpdate, setPendingUpdate] = useState(null);

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

  const pekerjaanOptions = [
    "Belum/Tidak Bekerja",
    "Mengurus Rumah Tangga",
    "Pelajar/Mahasiswa",
    "Pensiunan",
    "Pegawai Negeri Sipil",
    "Tentara Nasional Indonesia",
    "Kepolisian RI",
    "Perdagangan",
    "Petani/Pekebun",
    "Peternak",
    "Nelayan/Perikanan",
    "Industri",
    "Kontruksi",
    "Transportasi",
    "Karyawan Swasta",
    "Karyawan BUMN",
    "Karyawan BUMD",
    "Karyawan Honorer",
    "Buruh Harian Lepas",
    "Buruh Tani/Perkebunan",
    "Buruh Nelayan/Perikanan",
    "Buruh Peternakan",
    "Pembantu Rumah Tangga",
    "Tukang Cukur",
    "Tukang Listrik",
    "Tukang Batu",
    "Tukang Kayu",
    "Tukang Sol Sepatu",
    "Tukang Las/Pandai Besi",
    "Tukang Jahit",
    "Tukang Gigi",
    "Penata Rias",
    "Penata Busana",
    "Penata Rambut",
    "Mekanik",
    "Seniman",
    "Tabib",
    "Paraji",
    "Perancang Busana",
    "Penterjemah",
    "Imam Masjid",
    "Pendeta",
    "Pastor",
    "Wartawan",
    "Ustadz/Mubaligh",
    "Juru Masak",
    "Promotor Acara",
    "Anggota DPR-RI",
    "Anggota DPD",
    "Anggota BPK",
    "Presiden",
    "Wakil Presiden",
    "Anggota Mahkamah Konstitusi",
    "Anggota Kabinet Kementrian",
    "Duta Besar",
    "Gubernur",
    "Wakil Gubernur",
    "Bupati",
    "Wakil Bupati",
    "Walikota",
    "Wakil Walikota",
    "Anggota DPRD Prop.",
    "Anggota DPRD Kab. Kota",
    "Dosen",
    "Guru",
    "Pilot",
    "Pengacara",
    "Notaris",
    "Arsitek",
    "Akuntan",
    "Konsultan",
    "Dokter",
    "Bidan",
    "Perawat",
    "Apoteker",
    "Prikiater/Psikolog",
    "Penyiar Televisi",
    "Penyiar Radio",
    "Pelaut",
    "Peneliti",
    "Sopir",
    "Pialang",
    "Paranormal",
    "Pedagang",
    "Perangkat Desa",
    "Kepala Desa",
    "Biarawati",
    "Wiraswasta",
  ];

  const [formData, setFormData] = useState({
    no_kk: "",
    nik: "",
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
    golongan_darah: "",
    desa: "Margahayu Tengah",
    kecamatan: "Margahayu",
    kabupaten: "Bandung",
    provinsi: "Jawa Barat",
    kode_pos: "40225",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // fetch initial penduduk and pending update (if any)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: penduduk, error: errPenduduk } = await supabase
          .from("data_penduduk")
          .select("*")
          .eq("id_penduduk", Number(id))
          .maybeSingle();

        if (errPenduduk) throw errPenduduk;

        const source = penduduk || null;
        if (!source) {
          alert("Data tidak ditemukan.");
          setIsLoading(false);
          return;
        }

        const alamatFromSource = source.alamat || "";

        setFormData((prev) => ({
          ...prev,
          no_kk: source.no_kk || "",
          nik: source.nik || "",
          nama: source.nama || "",
          tempat_lahir: source.tempat_lahir || "",
          tanggal_lahir: source.tanggal_lahir || "",
          jk: source.jk || "",
          agama: source.agama || "",
          status_perkawinan: source.status_perkawinan || "",
          pendidikan: source.pendidikan || "",
          pekerjaan: source.pekerjaan || "",
          alamat: alamatFromSource,
          rt: source.rt || "",
          rw: source.rw || "",
          status_keluarga: source.status_keluarga || "",
          nik_ayah: source.nik_ayah || "",
          nama_ayah: source.nama_ayah || "",
          nik_ibu: source.nik_ibu || "",
          nama_ibu: source.nama_ibu || "",
          golongan_darah: source.golongan_darah || "",
          desa: source.desa || "Margahayu Tengah",
          kecamatan: source.kecamatan || "Margahayu",
          kabupaten: source.kabupaten || "Bandung",
          provinsi: source.provinsi || "Jawa Barat",
          kode_pos: source.kode_pos || "40225",
        }));

        // set search inputs to display current values until user changes them
        setSearchAlamat(alamatFromSource);
        setSearchJK(source.jk || "");
        setSearchAgama(source.agama || "");
        setSearchStatus(source.status_perkawinan || "");
        setSearchPendidikan(source.pendidikan || "");
        setSearchPekerjaan(source.pekerjaan || "");
        setSearchRt(source.rt || "");
        setSearchRw(source.rw || "");
        setSearchStatusKeluarga(source.status_keluarga || "");
      } catch (err) {
        console.error("Gagal fetch data:", err);
        alert("Gagal mengambil data!");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPendingUpdate = async () => {
      try {
        const { data: pending, error: errPending } = await supabase
          .from("data_penduduk_update")
          .select("*")
          .eq("id_penduduk", Number(id))
          .eq("status_verifikasi", "menunggu persetujuan")
          .maybeSingle();

        if (errPending) {
          // log but don't break—table might not exist if not created
          console.error("Gagal fetch pending update:", errPending);
        } else {
          setPendingUpdate(pending || null);
        }
      } catch (err) {
        console.error("Error fetch pending:", err);
      }
    };

    fetchData();
    fetchPendingUpdate();
  }, [id]);

  // fetch logged-in user's RT/RW and set into form + UI fields
  useEffect(() => {
    const fetchUserRtRw = async () => {
      try {
        const rawId = localStorage.getItem("userId");
        if (!rawId) return;

        const userId = Number(rawId);
        const { data, error } = await supabase
          .from("users")
          .select("rt, rw")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Gagal ambil RT/RW user:", error);
          return;
        }

        setUserRt(data?.rt || "");
        setUserRw(data?.rw || "");

        setFormData((prev) => ({
          ...prev,
          rt: prev.rt || data?.rt || "",
          rw: prev.rw || data?.rw || "",
        }));

        setSearchRt((prev) => prev || data?.rt || "");
        setSearchRw((prev) => prev || data?.rw || "");
      } catch (err) {
        console.error("Error saat fetch RT/RW:", err);
      }
    };

    fetchUserRtRw();
  }, []);

// === HANDLE UPDATE (FINAL FIX TANPA DOUBLE INSERT) ===
const handleUpdate = async (e) => {
  e.preventDefault();

  // ❌ Prevent double submit
  if (isUpdating) return;

  setIsUpdating(true);

  try {
    const idNumber = Number(id);
    if (!id || isNaN(idNumber)) {
      alert("ID tidak valid!");
      setIsUpdating(false);
      return;
    }

    // 🔹 Cek apakah sudah ada pending update
    const { data: existingUpdate, error: existingError } = await supabase
      .from("data_penduduk_update")
      .select("id")
      .eq("id_penduduk", idNumber)
      .ilike("status_verifikasi", "%menunggu persetujuan%") // pakai % untuk wildcard
      .maybeSingle();


    if (existingError && existingError.code !== "PGRST116") {
      console.error("Gagal cek existing:", existingError);
      alert("Terjadi kesalahan saat memeriksa data perubahan!");
      setIsUpdating(false);
      return;
    }

    // 🔹 Siapkan data perubahan
    const perubahan = {
      id_penduduk: idNumber,
      no_kk: formData.no_kk || null,
      nik: formData.nik || null,
      nama: formData.nama || null,
      tempat_lahir: formData.tempat_lahir || null,
      tanggal_lahir: formData.tanggal_lahir || null,
      jk: formData.jk || null,
      agama: formData.agama || null,
      status_perkawinan: formData.status_perkawinan || null,
      pendidikan: formData.pendidikan || null,
      pekerjaan: formData.pekerjaan || null,
      alamat: formData.alamat || null,
      rt: formData.rt || null,
      rw: formData.rw || null,
      status_keluarga: formData.status_keluarga || null,
      nik_ayah: formData.nik_ayah || null,
      nama_ayah: formData.nama_ayah || null,
      nik_ibu: formData.nik_ibu || null,
      nama_ibu: formData.nama_ibu || null,
      desa: formData.desa || "Margahayu Tengah",
      kecamatan: formData.kecamatan || "Margahayu",
      kabupaten: formData.kabupaten || "Bandung",
      provinsi: formData.provinsi || "Jawa Barat",
      kode_pos: formData.kode_pos || "40225",
      golongan_darah: formData.golongan_darah || null,
      status_verifikasi: "menunggu persetujuan",
    };

    if (existingUpdate) {
      // 🔹 Update jika sudah ada pending
      const { error: updateError } = await supabase
        .from("data_penduduk_update")
        .update(perubahan)
        .eq("id", existingUpdate.id);

      if (updateError) {
        console.error("Gagal update data pending:", updateError);
        alert("Gagal memperbarui usulan perubahan!");
        setIsUpdating(false);
        return;
      }
    } else {
      // 🔹 Insert jika belum ada pending
      const { error: insertError } = await supabase
        .from("data_penduduk_update")
        .insert([perubahan]);

      if (insertError) {
        console.error("Gagal insert perubahan:", insertError);
        alert("Gagal mengajukan perubahan: " + insertError.message);
        setIsUpdating(false);
        return;
      }
    }

    // 🔹 Update status data_penduduk
    const { error: statusError } = await supabase
      .from("data_penduduk")
      .update({ status_verifikasi: "menunggu persetujuan" })
      .eq("id_penduduk", idNumber);

    if (statusError) console.error("Gagal update status:", statusError);

    // 🔹 Tampilkan banner pending
    setPendingUpdate(true);
    alert("Perubahan telah diajukan dan menunggu persetujuan admin.");
    navigate("/rt/keloladata/datapenduduk");

  } catch (err) {
    console.error("Terjadi kesalahan:", err);
    alert("Terjadi kesalahan saat mengajukan perubahan data!");
  } finally {
    setIsUpdating(false);
  }
};



  if (isLoading) {
    return <div className="p-6 bg-white rounded-lg shadow">Memuat data...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
      </button>

      <h1 className="text-xl font-semibold mb-4">Edit Data Penduduk</h1>

      {/* Jika sudah ada usulan pending, tampilkan banner */}
      {pendingUpdate && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-200">
          Sudah ada usulan perubahan untuk data ini yang sedang menunggu persetujuan admin.
          {pendingUpdate.created_at && (
            <div className="text-sm mt-1">
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

      <form className="grid grid-cols-4 gap-4" onSubmit={handleUpdate}>
        {/* No KK */}
        <input
          type="text"
          placeholder="No KK"
          value={formData.no_kk}
          onChange={(e) => setFormData({ ...formData, no_kk: e.target.value })}
          className="border rounded px-3 py-2"
        />

        {/* NIK */}
        <input
          type="text"
          placeholder="NIK"
          value={formData.nik}
          onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
          className="border rounded px-3 py-2"
        />

        {/* Nama */}
        <input
          type="text"
          placeholder="Nama"
          value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          className="border rounded px-3 py-2"
        />

        {/* Tempat Lahir */}
        <input
          type="text"
          placeholder="Tempat Lahir"
          value={formData.tempat_lahir}
          onChange={(e) =>
            setFormData({ ...formData, tempat_lahir: e.target.value })
          }
          className="border rounded px-3 py-2"
        />

        {/* Tanggal Lahir */}
        <input
          type="date"
          placeholder="Tanggal Lahir"
          value={formData.tanggal_lahir || ""}
          onChange={(e) =>
            setFormData({ ...formData, tanggal_lahir: e.target.value })
          }
          className="border rounded px-3 py-2"
        />

        {/* Jenis Kelamin dropdown */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih Jenis Kelamin --"
            value={searchJK}
            onChange={(e) => {
              setSearchJK(e.target.value);
              setFormData({ ...formData, jk: e.target.value });
              setShowJKDropdown(true);
            }}
            onClick={() => setShowJKDropdown(true)}
            onFocus={() => setShowJKDropdown(true)}
            onBlur={() => setTimeout(() => setShowJKDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showJKDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {["Laki-laki", "Perempuan"]
                .filter((item) =>
                  item.toLowerCase().includes(searchJK.toLowerCase())
                )
                .map((item, index) => (
                  <li
                    key={index}
                    onMouseDown={() => {
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

        {/* Golongan Darah */}
        <input
          type="text"
          placeholder="Golongan Darah"
          value={formData.golongan_darah}
          onChange={(e) =>
            setFormData({ ...formData, golongan_darah: e.target.value })
          }
          className="border rounded px-3 py-2"
        />

        {/* Agama */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih Agama --"
            value={searchAgama}
            onChange={(e) => {
              setSearchAgama(e.target.value);
              setFormData({ ...formData, agama: e.target.value });
              setShowAgamaDropdown(true);
            }}
            onClick={() => setShowAgamaDropdown(true)}
            onFocus={() => setShowAgamaDropdown(true)}
            onBlur={() => setTimeout(() => setShowAgamaDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showAgamaDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {["Islam", "Kristen", "Katholik", "Hindu", "Budha", "Konghucu"]
                .filter((item) =>
                  item.toLowerCase().includes(searchAgama.toLowerCase())
                )
                .map((item, index) => (
                  <li
                    key={index}
                    onMouseDown={() => {
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

        {/* Pendidikan */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih Pendidikan --"
            value={searchPendidikan}
            onChange={(e) => {
              setSearchPendidikan(e.target.value);
              setFormData({ ...formData, pendidikan: e.target.value });
              setShowPendidikanDropdown(true);
            }}
            onClick={() => setShowPendidikanDropdown(true)}
            onFocus={() => setShowPendidikanDropdown(true)}
            onBlur={() => setTimeout(() => setShowPendidikanDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showPendidikanDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {[
                "Tidak/belum sekolah",
                "Belum tamat SD/sederajat",
                "Tamat SD/sederajat",
                "SLTP/sederajat",
                "Diploma I/II",
                "Akademi I/Diploma III/S.Muda",
                "Diploma IV/Strata I",
                "Strata II",
                "Strata III",
              ]
                .filter((item) =>
                  item.toLowerCase().includes(searchPendidikan.toLowerCase())
                )
                .map((item, index) => (
                  <li
                    key={index}
                    onMouseDown={() => {
                      setFormData({ ...formData, pendidikan: item });
                      setSearchPendidikan(item);
                      setShowPendidikanDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Pekerjaan */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih Pekerjaan --"
            value={searchPekerjaan}
            onChange={(e) => {
              setSearchPekerjaan(e.target.value);
              setFormData({ ...formData, pekerjaan: e.target.value });
              setShowPekerjaanDropdown(true);
            }}
            onClick={() => setShowPekerjaanDropdown(true)}
            onFocus={() => setShowPekerjaanDropdown(true)}
            onBlur={() => setTimeout(() => setShowPekerjaanDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showPekerjaanDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {pekerjaanOptions
                .filter((item) =>
                  item.toLowerCase().includes(searchPekerjaan.toLowerCase())
                )
                .map((item, index) => (
                  <li
                    key={index}
                    onMouseDown={() => {
                      setFormData({ ...formData, pekerjaan: item });
                      setSearchPekerjaan(item);
                      setShowPekerjaanDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Alamat */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih atau Ketik Alamat --"
            value={searchAlamat}
            onChange={(e) => {
              setSearchAlamat(e.target.value);
              setFormData({ ...formData, alamat: e.target.value });
              setShowAlamatDropdown(true);
            }}
            onClick={() => setShowAlamatDropdown(true)}
            onFocus={() => setShowAlamatDropdown(true)}
            onBlur={() => setTimeout(() => setShowAlamatDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-text focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showAlamatDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {alamatOptions
                .filter((item) =>
                  item.toLowerCase().includes(searchAlamat.toLowerCase())
                )
                .map((item, index) => (
                  <li
                    key={index}
                    onMouseDown={() => {
                      setFormData({ ...formData, alamat: item });
                      setSearchAlamat(item);
                      setShowAlamatDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* RT / RW readonly (gunakan userRt/userRw kalau ada) */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="RT"
            value={userRt || formData.rt || ""}
            readOnly
            className="border rounded px-3 py-2 w-full bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="relative w-full">
          <input
            type="text"
            placeholder="RW"
            value={userRw || formData.rw || ""}
            readOnly
            className="border rounded px-3 py-2 w-full bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Status Keluarga */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih Status Dalam Keluarga --"
            value={searchStatusKeluarga}
            onChange={(e) => {
              setSearchStatusKeluarga(e.target.value);
              setFormData({ ...formData, status_keluarga: e.target.value });
              setShowStatusKeluargaDropdown(true);
            }}
            onClick={() => setShowStatusKeluargaDropdown(true)}
            onFocus={() => setShowStatusKeluargaDropdown(true)}
            onBlur={() => setTimeout(() => setShowStatusKeluargaDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showStatusKeluargaDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {[
                "Kepala Keluarga",
                "Suami",
                "Istri",
                "Anak",
                "Orang Tua",
                "Mertua",
                "Cucu",
                "Menantu",
                "Pembantu",
                "Family Lain",
              ]
                .filter((item) =>
                  item.toLowerCase().includes(searchStatusKeluarga.toLowerCase())
                )
                .map((item, index) => (
                  <li
                    key={index}
                    onMouseDown={() => {
                      setFormData({ ...formData, status_keluarga: item });
                      setSearchStatusKeluarga(item);
                      setShowStatusKeluargaDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* NIK & Nama Ayah */}
        <input
          type="text"
          placeholder="NIK Ayah"
          value={formData.nik_ayah}
          onChange={(e) => setFormData({ ...formData, nik_ayah: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Nama Ayah"
          value={formData.nama_ayah}
          onChange={(e) => setFormData({ ...formData, nama_ayah: e.target.value })}
          className="border rounded px-3 py-2"
        />

        {/* NIK & Nama Ibu */}
        <input
          type="text"
          placeholder="NIK Ibu"
          value={formData.nik_ibu}
          onChange={(e) => setFormData({ ...formData, nik_ibu: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Nama Ibu"
          value={formData.nama_ibu}
          onChange={(e) => setFormData({ ...formData, nama_ibu: e.target.value })}
          className="border rounded px-3 py-2"
        />

        {/* Desa, Kecamatan, Kabupaten */}
        <div className="col-span-3 grid grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Desa"
            value={formData.desa}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
          <input
            type="text"
            placeholder="Kecamatan"
            value={formData.kecamatan}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
          <input
            type="text"
            placeholder="Kabupaten"
            value={formData.kabupaten}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
          <input
            type="text"
            placeholder="Provinsi"
            value={formData.provinsi}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
          <input
            type="text"
            placeholder="Kode Pos"
            value={formData.kode_pos}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Spacing element to keep grid alignment */}
        <div className="col-span-4 h-2"></div>

        {/* Buttons (submit inside form) */}
        <div className="col-span-4 flex justify-end mt-2 space-x-2">
          <Link
            to="/rt/keloladata/datapenduduk"
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isUpdating || !!pendingUpdate}
            className={`px-4 py-2 ${
              isUpdating ? "bg-green-400" : "bg-green-600"
            } text-white rounded hover:bg-green-700 ${pendingUpdate ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isUpdating ? "Menyimpan..." : pendingUpdate ? "Menunggu Persetujuan" : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditPenduduk;
