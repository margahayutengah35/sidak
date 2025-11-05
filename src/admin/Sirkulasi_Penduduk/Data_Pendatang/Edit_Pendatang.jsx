// src/rt/pages/KelolaData/Edit_Pendatang.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../supabaseClient";

function Edit_Pendatang() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    no_kk: "", nik: "", nama: "", tempat_lahir: "", tanggal_lahir: "", jk: "",
    golongan_darah: "", agama: "", status_perkawinan: "", pendidikan: "", pekerjaan: "",
    alamat: "", rt: "", rw: "", status_keluarga: "", nik_ayah: "", nama_ayah: "",
    nik_ibu: "", nama_ibu: "", desa: "Margahayu Tengah", kecamatan: "Margahayu", kabupaten: "Bandung",
    provinsi: "Jawa Barat", kode_pos: "40225", tanggal_datang: ""
  });

  // Dropdown helper states
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
  const [searchRw, setSearchRw] = useState("");
  const [showRwDropdown, setShowRwDropdown] = useState(false);
  const [searchStatusKeluarga, setSearchStatusKeluarga] = useState("");
  const [showStatusKeluargaDropdown, setShowStatusKeluargaDropdown] = useState(false);

  // Options from DB (users table)
  const [rtOptions, setRtOptions] = useState([]);
  const [rwOptions, setRwOptions] = useState([]);

  const alamatOptions = [
    "Jl. Sadang","Kp. Sadang","Pasantren","Kp. Pasantren","Kopo Bihbul","Jl. Kopo Bihbul",
    "Nata Endah","Komp. Nata Endah","Taman Kopo Indah","Komp. Taman Kopo Indah",
    "Bbk. Tasikmalaya","Kp. Bbk. Tasikmalaya","Sekeloa Girang","Jl. Sekeloa Girang",
    "Perum Linggahara","Kp. Margamulya","Komp. Nata Endah Gg. Margamulya"
  ];

  const pekerjaanOptions = [
    "Belum/Tidak Bekerja","Mengurus Rumah Tangga","Pelajar/Mahasiswa","Pensiunan",
    "Pegawai Negeri Sipil","Tentara Nasional Indonesia","Kepolisian RI","Perdagangan",
    "Petani/Pekebun","Peternak","Nelayan/Perikanan","Industri","Kontruksi","Transportasi",
    "Karyawan Swasta","Karyawan BUMN","Karyawan BUMD","Karyawan Honorer","Buruh Harian Lepas",
    "Buruh Tani/Perkebunan","Buruh Nelayan/Perikanan","Buruh Peternakan","Pembantu Rumah Tangga",
    "Tukang Cukur","Tukang Listrik","Tukang Batu","Tukang Kayu","Tukang Sol Sepatu",
    "Tukang Las/Pandai Besi","Tukang Jahit","Tukang Gigi","Penata Rias","Penata Busana",
    "Penata Rambut","Mekanik","Seniman","Tabib","Paraji","Perancang Busana","Penterjemah",
    "Imam Masjid","Pendeta","Pastor","Wartawan","Ustadz/Mubaligh","Juru Masak",
    "Promotor Acara","Anggota DPR-RI","Anggota DPD","Anggota BPK","Presiden","Wakil Presiden",
    "Anggota Mahkamah Konstitusi","Anggota Kabinet Kementrian","Duta Besar","Gubernur",
    "Wakil Gubernur","Bupati","Wakil Bupati","Walikota","Wakil Walikota","Anggota DPRD Prop.",
    "Anggota DPRD Kab. Kota","Dosen","Guru","Pilot","Pengacara","Notaris","Arsitek","Akuntan",
    "Konsultan","Dokter","Bidan","Perawat","Apoteker","Prikiater/Psikolog","Penyiar Televisi",
    "Penyiar Radio","Pelaut","Peneliti","Sopir","Pialang","Paranormal","Pedagang",
    "Perangkat Desa","Kepala Desa","Biarawati","Wiraswasta"
  ];

  // Helper: ambil distinct rt/rw dari tabel users, normalisasi dan sort
  useEffect(() => {
    const normalizeList = (arr) => {
      const cleaned = Array.from(new Set(arr.map(a => (a ?? "").toString().trim()).filter(Boolean)));
      if (cleaned.length === 0) return [];
      const allNumeric = cleaned.every(v => /^\d+$/.test(v));
      if (allNumeric) {
        return cleaned
          .map(v => String(Number(v)).padStart(2, "0"))
          .sort((a, b) => Number(a) - Number(b));
      } else {
        return cleaned.sort((a, b) => a.localeCompare(b));
      }
    };

    const fetchRtrwFromUsers = async () => {
      try {
        const { data: users, error } = await supabase.from("users").select("rt, rw");
        if (error) throw error;
        if (!users) {
          setRtOptions([]);
          setRwOptions([]);
          return;
        }
        const rts = users.map(u => u.rt ?? "");
        const rws = users.map(u => u.rw ?? "");
        setRtOptions(normalizeList(rts));
        setRwOptions(normalizeList(rws));
      } catch (err) {
        console.error("Gagal mengambil RT/RW dari users:", err);
        // fallback: kosongkan options (UI tetap bekerja)
        setRtOptions([]);
        setRwOptions([]);
      }
    };

    fetchRtrwFromUsers();
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // ambil pendatang by id
        const { data: pendatang, error: errPendatang } = await supabase
          .from("data_pendatang")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (errPendatang) {
          throw errPendatang;
        }
        if (!pendatang) {
          throw new Error("Data pendatang tidak ditemukan!");
        }

        // set form data langsung (jangan spread formData lama)
        const initial = {
          no_kk: pendatang.no_kk || "",
          nik: pendatang.nik || "",
          nama: pendatang.nama || "",
          tempat_lahir: pendatang.tempat_lahir || "",
          tanggal_lahir: pendatang.tanggal_lahir || "",
          jk: pendatang.jk || "",
          golongan_darah: pendatang.golongan_darah || "",
          agama: pendatang.agama || "",
          status_perkawinan: pendatang.status_perkawinan || "",
          pendidikan: pendatang.pendidikan || "",
          pekerjaan: pendatang.pekerjaan || "",
          alamat: pendatang.alamat || "",
          rt: pendatang.rt || "",
          rw: pendatang.rw || "",
          status_keluarga: pendatang.status_keluarga || "",
          nik_ayah: pendatang.nik_ayah || "",
          nama_ayah: pendatang.nama_ayah || "",
          nik_ibu: pendatang.nik_ibu || "",
          nama_ibu: pendatang.nama_ibu || "",
          desa: pendatang.desa || "Margahayu Tengah",
          kecamatan: pendatang.kecamatan || "Margahayu",
          kabupaten: pendatang.kabupaten || "Bandung",
          provinsi: pendatang.provinsi || "Jawa Barat",
          kode_pos: pendatang.kode_pos || "40225",
          tanggal_datang: pendatang.tanggal_datang || ""
        };
        setFormData(initial);

        // set dropdown helper strings
        setSearchJK(pendatang.jk || "");
        setSearchAgama(pendatang.agama || "");
        setSearchStatus(pendatang.status_perkawinan || "");
        setSearchPendidikan(pendatang.pendidikan || "");
        setSearchPekerjaan(pendatang.pekerjaan || "");
        setSearchAlamat(pendatang.alamat || "");
        setSearchRt(pendatang.rt || "");
        setSearchRw(pendatang.rw || "");
        setSearchStatusKeluarga(pendatang.status_keluarga || "");

      } catch (err) {
        console.error("Error fetch data:", err);
        alert("Gagal mengambil data pendatang.");
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle update
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const idNumber = Number(id);
      if (!id || isNaN(idNumber)) {
        alert("ID pendatang tidak valid!");
        setIsUpdating(false);
        return;
      }

      // Pastikan input manual ikut terkirim (rt/rw juga)
      const payload = {
        ...formData,
        pekerjaan: searchPekerjaan?.trim() || formData.pekerjaan,
        alamat: searchAlamat?.trim() || formData.alamat,
        rt: searchRt?.trim() || formData.rt,
        rw: searchRw?.trim() || formData.rw,
      };

      const { error } = await supabase
        .from("data_pendatang")
        .update(payload)
        .eq("id", id);

      if (error) {
        console.error("Update gagal:", error);
        alert("Gagal update data pendatang: " + error.message);
        return;
      }

      alert("✅ Data pendatang berhasil diperbarui!");
      navigate("/admin/sirkulasi_penduduk/data_pendatang");
    } catch (err) {
      console.error("Terjadi kesalahan:", err);
      alert("Terjadi kesalahan saat memperbarui data!");
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

      <h1 className="text-xl font-semibold mb-4">Edit Data Pendatang</h1>

      <form className="grid grid-cols-4 gap-4">
        {/* No KK */}
        <input type="text" placeholder="No KK" value={formData.no_kk} readOnly
          onChange={(e) => setFormData({ ...formData, no_kk: e.target.value })}
          className="border rounded px-3 py-2" />
        {/* NIK */}
        <input type="text" placeholder="NIK" value={formData.nik} readOnly
          onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
          className="border rounded px-3 py-2" />
        {/* Nama */}
        <input type="text" placeholder="Nama" value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          className="border rounded px-3 py-2" />
        {/* Tempat Lahir */}
        <input type="text" placeholder="Tempat Lahir" value={formData.tempat_lahir}
          onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
          className="border rounded px-3 py-2" />
        {/* Tanggal Lahir */}
        <input type="date" placeholder="Tanggal Lahir" value={formData.tanggal_lahir}
          onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
          className="border rounded px-3 py-2" />
        {/* Jenis Kelamin */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih Jenis Kelamin --"
            value={searchJK}
            onChange={(e) => {
              setSearchJK(e.target.value);
              setShowJKDropdown(true);
            }}
            onClick={() => setShowJKDropdown(true)}
            onFocus={() => setShowJKDropdown(true)}
            onBlur={() => setTimeout(() => setShowJKDropdown(false), 200)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showJKDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {["Laki-laki", "Perempuan"]
                .filter((item) =>
                  item.toLowerCase().includes((searchJK || "").toLowerCase())
                )
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

        {/* Golongan Darah */}
        <input type="text" placeholder="Golongan Darah" value={formData.golongan_darah}
          onChange={(e) => setFormData({ ...formData, golongan_darah: e.target.value })}
          className="border rounded px-3 py-2" />

        {/* Agama */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih Agama --"
            value={searchAgama || ""}
            onChange={(e) => {
              setSearchAgama(e.target.value);
              setShowAgamaDropdown(true);
            }}
            onClick={() => setShowAgamaDropdown(true)}
            onFocus={() => setShowAgamaDropdown(true)}
            onBlur={() => setTimeout(() => setShowAgamaDropdown(false), 200)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showAgamaDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {["Islam","Kristen","Katholik","Hindu","Budha","Konghucu"]
                .filter((item) => item.toLowerCase().includes((searchAgama || "").toLowerCase()))
                .map((item, index) => (
                  <li
                    key={index}
                    onClick={() => {
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

        {/* Status Perkawinan */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih Status Perkawinan --"
            value={searchStatus || ""}
            onChange={(e) => {
              setSearchStatus(e.target.value);
              setShowStatusDropdown(true);
            }}
            onClick={() => setShowStatusDropdown(true)}
            onFocus={() => setShowStatusDropdown(true)}
            onBlur={() => setTimeout(() => setShowStatusDropdown(false), 200)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showStatusDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {["Belum Kawin","Kawin tercatat","Kawin tidak tercatat","Cerai hidup","Cerai mati"]
                .filter((item) => item.toLowerCase().includes((searchStatus || "").toLowerCase()))
                .map((item, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setFormData({ ...formData, status_perkawinan: item });
                      setSearchStatus(item);
                      setShowStatusDropdown(false);
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
            value={searchPendidikan || ""}
            onChange={(e) => {
              setSearchPendidikan(e.target.value);
              setShowPendidikanDropdown(true);
            }}
            onClick={() => setShowPendidikanDropdown(true)}
            onFocus={() => setShowPendidikanDropdown(true)}
            onBlur={() => setTimeout(() => setShowPendidikanDropdown(false), 200)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showPendidikanDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {[
                "Tidak/belum sekolah","Belum tamat SD/sederajat","Tamat SD/sederajat",
                "SLTP/sederajat","Diploma I/II","Akademi I/Diploma III/S.Muda",
                "Diploma IV/Strata I","Strata II","Strata III"
              ].filter((item) => item.toLowerCase().includes((searchPendidikan || "").toLowerCase()))
                .map((item, index) => (
                  <li
                    key={index}
                    onClick={() => {
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
            value={searchPekerjaan || ""}
            onChange={(e) => {
              setSearchPekerjaan(e.target.value);
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
                  item.toLowerCase().includes((searchPekerjaan || "").toLowerCase())
                )
                .map((item, index) => (
                  <li
                    key={index}
                    onMouseDown={() => {
                      setFormData({ ...formData, pekerjaan: item }); // simpan pekerjaan
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
            placeholder="-- Pilih Alamat --"
            value={searchAlamat || ""}
            onChange={(e) => {
              setSearchAlamat(e.target.value);
              setShowAlamatDropdown(true);
            }}
            onClick={() => setShowAlamatDropdown(true)}
            onFocus={() => setShowAlamatDropdown(true)}
            onBlur={() => setTimeout(() => setShowAlamatDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {showAlamatDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {alamatOptions
                .filter((item) =>
                  item.toLowerCase().includes((searchAlamat || "").toLowerCase())
                )
                .map((item, index) => (
                  <li
                    key={index}
                    onMouseDown={() => {
                      setFormData({ ...formData, alamat: item }); // simpan alamat terpilih
                      setSearchAlamat(item); // tampilkan alamat ke input
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

        
        {/* RW */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih RW --"
            value={searchRw || ""}
            onChange={(e) => {
              setSearchRw(e.target.value);
              setShowRwDropdown(true);
            }}
            onClick={() => setShowRwDropdown(true)}
            onFocus={() => setShowRwDropdown(true)}
            onBlur={() => setTimeout(() => setShowRwDropdown(false), 200)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showRwDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {(rwOptions.length > 0 ? rwOptions : Array.from({length:20}, (_,i)=>String(i+1).padStart(2,'0')))
                .filter((item) => item.toLowerCase().includes((searchRw || "").toLowerCase()))
                .map((item, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setFormData({ ...formData, rw: item });
                      setSearchRw(item);
                      setShowRwDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* RT */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih RT --"
            value={searchRt || ""}
            onChange={(e) => {
              setSearchRt(e.target.value);
              setShowRtDropdown(true);
            }}
            onClick={() => setShowRtDropdown(true)}
            onFocus={() => setShowRtDropdown(true)}
            onBlur={() => setTimeout(() => setShowRtDropdown(false), 200)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showRtDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {(rtOptions.length > 0 ? rtOptions : Array.from({length:10}, (_,i)=>String(i+1).padStart(2,'0')))
                .filter((item) => item.toLowerCase().includes((searchRt || "").toLowerCase()))
                .map((item, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setFormData({ ...formData, rt: item });
                      setSearchRt(item);
                      setShowRtDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Status Keluarga */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih Status Dalam Keluarga --"
            value={searchStatusKeluarga || ""}
            onChange={(e) => {
              setSearchStatusKeluarga(e.target.value);
              setShowStatusKeluargaDropdown(true);
            }}
            onClick={() => setShowStatusKeluargaDropdown(true)}
            onFocus={() => setShowStatusKeluargaDropdown(true)}
            onBlur={() => setTimeout(() => setShowStatusKeluargaDropdown(false), 200)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {showStatusKeluargaDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {[
                "Kepala Keluarga","Suami","Istri","Anak","Orang Tua","Mertua","Cucu","Menantu","Pembantu","Family Lain"
              ].filter((item) => item.toLowerCase().includes((searchStatusKeluarga || "").toLowerCase()))
                .map((item, index) => (
                  <li
                    key={index}
                    onClick={() => {
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
        <input type="text" placeholder="NIK Ayah" value={formData.nik_ayah}
          onChange={(e) => setFormData({ ...formData, nik_ayah: e.target.value })}
          className="border rounded px-3 py-2" />
        <input type="text" placeholder="Nama Ayah" value={formData.nama_ayah}
          onChange={(e) => setFormData({ ...formData, nama_ayah: e.target.value })}
          className="border rounded px-3 py-2" />

        {/* NIK & Nama Ibu */}
        <input type="text" placeholder="NIK Ibu" value={formData.nik_ibu}
          onChange={(e) => setFormData({ ...formData, nik_ibu: e.target.value })}
          className="border rounded px-3 py-2" />
        <input type="text" placeholder="Nama Ibu" value={formData.nama_ibu}
          onChange={(e) => setFormData({ ...formData, nama_ibu: e.target.value })}
          className="border rounded px-3 py-2" />

        {/* Desa, Kecamatan, Kabupaten, Provinsi, Kode Pos */}
        <div className="col-span-2 grid grid-cols-4 gap-4">
          <input type="text" placeholder="Desa" value={formData.desa} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
          <input type="text" placeholder="Kecamatan" value={formData.kecamatan} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
          <input type="text" placeholder="Kabupaten" value={formData.kabupaten} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
          <input type="text" placeholder="Provinsi" value={formData.provinsi} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
          <input type="text" placeholder="Kode Pos" value={formData.kode_pos} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
        </div>

        {/* Tanggal Datang */}
        <div className="relative w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Datang</label>
          <input
            type="date"
            value={formData.tanggal_datang || ""}
            onChange={(e) => setFormData({ ...formData, tanggal_datang: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

      </form>

      <div className="flex justify-end mt-4 space-x-2">
        <Link to="/admin/sirkulasi_penduduk/data_pendatang" className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Batal</Link>
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className={`px-4 py-2 rounded text-white ${isUpdating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
          {isUpdating ? 'Updating...' : 'Update'}
        </button>
      </div>
    </div>
  );
}

export default Edit_Pendatang;
