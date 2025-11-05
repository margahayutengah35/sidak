import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../supabaseClient";

function Edit_Penduduk() {
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
  // rwOptions akan diisi dari DB (distinct rw dari tabel users)
  const [rwOptions, setRwOptions] = useState([]);

  const [rtListForRw, setRtListForRw] = useState(rtOptions);

  const [searchStatusKeluarga, setSearchStatusKeluarga] = useState("");
  const [showStatusKeluargaDropdown, setShowStatusKeluargaDropdown] = useState(false);

  const [userRt, setUserRt] = useState("");
  const [userRw, setUserRw] = useState("");

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

  const [formData, setFormData] = useState({
    no_kk: "", nik: "", nama: "", tempat_lahir: "", tanggal_lahir: "", jk: "",
    agama: "", status_perkawinan: "", pendidikan: "", pekerjaan: "",
    alamat: "", rt: "", rw: "", status_keluarga: "", nik_ayah: "", nama_ayah: "",
    nik_ibu: "", nama_ibu: "", golongan_darah: "", desa: "Margahayu Tengah",
    kecamatan: "Margahayu", kabupaten: "Bandung", provinsi: "Jawa Barat", kode_pos: "40225"
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // util sort numeric-friendly
  const sortNumericLike = (arr) => {
    return arr.slice().sort((a, b) => {
      const na = Number(a), nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });
  };

  // fetch RT list for a given RW (call this explicitly whenever RW is set)
  const fetchRtsForRw = useCallback(async (rwValue) => {
    if (!rwValue) {
      setRtListForRw(rtOptions);
      // do not overwrite user-chosen RT if already present
      return;
    }

    try {
      const { data, error } = await supabase.from("users").select("rt").eq("rw", rwValue);
      if (error) {
        console.error("Gagal ambil RT untuk RW:", error);
        setRtListForRw(rtOptions);
        return;
      }
      const list = Array.from(new Set((data || []).map(r => r.rt))).filter(Boolean);
      const sorted = list.length ? sortNumericLike(list) : rtOptions;
      setRtListForRw(sorted);

      // If current formData.rt empty or doesn't belong to this RW, set a sensible default
      setFormData(prev => {
        const currentRt = prev.rt;
        if (!currentRt || !sorted.includes(currentRt)) {
          return { ...prev, rt: sorted[0] || rtOptions[0] };
        }
        return prev;
      });

      setSearchRt(prev => (prev || sorted[0] || rtOptions[0]));
    } catch (err) {
      console.error("Gagal ambil RT untuk RW:", err);
      setRtListForRw(rtOptions);
    }
  }, []); // rtOptions is stable constant

  // Ambil RW distinct dari tabel users (sort numerik)
  useEffect(() => {
    let mounted = true;
    const fetchDistinctRw = async () => {
      try {
        const { data, error } = await supabase.from("users").select("rw");
        if (error) throw error;
        const rawList = Array.from(new Set((data || []).map((r) => r.rw))).filter(Boolean);
        const sorted = sortNumericLike(rawList);
        if (mounted) setRwOptions(sorted);
      } catch (err) {
        console.error("Gagal ambil RW dari users:", err);
      }
    };
    fetchDistinctRw();
    return () => { mounted = false; };
  }, []);

  // Ambil RT/RW user yang sedang login (jika ada) — ini hanya untuk prefilling
  useEffect(() => {
    let mounted = true;
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

        if (!mounted) return;
        setUserRt(data?.rt || "");
        setUserRw(data?.rw || "");

        // set both formData and visible search fields
        if (data?.rw) {
          setFormData(prev => ({ ...prev, rw: data.rw, rt: data.rt || prev.rt }));
          setSearchRw(data.rw);
          // ensure RT list reflects this RW
          await fetchRtsForRw(data.rw);
        }
        if (data?.rt) {
          setFormData(prev => ({ ...prev, rt: data.rt }));
          setSearchRt(data.rt);
        }
      } catch (err) {
        console.error("Error saat fetch RT/RW:", err);
      }
    };

    fetchUserRtRw();
    return () => { mounted = false; };
  }, [fetchRtsForRw]);

  // Ambil data penduduk berdasarkan id (prefill form)
  useEffect(() => {
    let mounted = true;
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

        if (!mounted) return;

        const alamatFromSource = source.alamat || "";
        setFormData(prev => ({
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
          rt: source.rt || prev.rt || "",
          rw: source.rw || prev.rw || "",
          status_keluarga: source.status_keluarga || "",
          nik_ayah: source.nik_ayah || "",
          nama_ayah: source.nama_ayah || "",
          nik_ibu: source.nik_ibu || "",
          golongan_darah: source.golongan_darah || "",
          nama_ibu: source.nama_ibu || "",
          desa: source.desa || "Margahayu Tengah",
          kecamatan: source.kecamatan || "Margahayu",
          kabupaten: source.kabupaten || "Bandung",
          provinsi: source.provinsi || "Jawa Barat",
          kode_pos: source.kode_pos || "40225",
        }));

        // visible search fields
        setSearchAlamat(alamatFromSource);
        setSearchJK(source.jk || "");
        setSearchAgama(source.agama || "");
        setSearchStatus(source.status_perkawinan || "");
        setSearchPendidikan(source.pendidikan || "");
        setSearchPekerjaan(source.pekerjaan || "");
        setSearchStatusKeluarga(source.status_keluarga || "");

        // Jika ada RW di data penduduk -> pastikan RT list diupdate segera
        if (source.rw) {
          setSearchRw(source.rw);
          // fetch RTs explicitly untuk menghindari race condition
          await fetchRtsForRw(source.rw);
          if (source.rt) {
            setSearchRt(source.rt);
            setFormData(prev => ({ ...prev, rt: source.rt }));
          }
        } else {
          // fallback: kalau tidak ada rw di sumber, jangan ganggu rtList
          setRtListForRw(rtOptions);
        }
      } catch (err) {
        console.error("Gagal fetch data:", err);
        alert("Gagal mengambil data!");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [id, fetchRtsForRw]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const idNumber = Number(id);

      if (!id || isNaN(idNumber)) {
        alert("ID tidak valid!");
        setIsUpdating(false);
        return;
      }

      // Pastikan pekerjaan & alamat & rt/rw sinkron dengan search (prefer search if non-empty)
      const payload = {
        ...formData,
        pekerjaan: searchPekerjaan || formData.pekerjaan || null,
        alamat: searchAlamat || formData.alamat || null,
        rw: (searchRw !== "" ? searchRw : (formData.rw || null)),
        rt: (searchRt !== "" ? searchRt : (formData.rt || null)),
      };

      const { error } = await supabase
        .from("data_penduduk")
        .update(payload)
        .eq("id_penduduk", idNumber);

      if (error) {
        console.error("Update gagal:", error);
        alert("Gagal update data penduduk: " + error.message);
        return;
      }

      alert("Data penduduk berhasil diperbarui!");
      navigate("/admin/kelola_data/data_penduduk");
    } catch (err) {
      console.error("Terjadi kesalahan:", err);
      alert("Terjadi kesalahan saat memperbarui data!");
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

      <form className="grid grid-cols-4 gap-4" onSubmit={handleUpdate}>
        {/* No KK */}
        <input type="text" placeholder="No KK" value={formData.no_kk}
          onChange={(e) => setFormData({ ...formData, no_kk: e.target.value })}
          className="border rounded px-3 py-2" />

        {/* NIK */}
        <input type="text" placeholder="NIK" value={formData.nik}
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

        {/* Jenis Kelamin dropdown */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih Jenis Kelamin --"
            value={searchJK}
            onChange={(e) => { setSearchJK(e.target.value); setShowJKDropdown(true); }}
            onClick={() => setShowJKDropdown(true)}
            onFocus={() => setShowJKDropdown(true)}
            onBlur={() => setTimeout(() => setShowJKDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {showJKDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {["Laki-laki", "Perempuan"].filter(item => item.toLowerCase().includes((searchJK || "").toLowerCase()))
                .map((item, index) => (
                  <li key={index} onMouseDown={() => { setFormData({ ...formData, jk: item }); setSearchJK(item); setShowJKDropdown(false); }} className="px-3 py-2 hover:bg-green-100 cursor-pointer">{item}</li>
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
            onChange={(e) => { setSearchAgama(e.target.value); setShowAgamaDropdown(true); }}
            onClick={() => setShowAgamaDropdown(true)}
            onFocus={() => setShowAgamaDropdown(true)}
            onBlur={() => setTimeout(() => setShowAgamaDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {showAgamaDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {["Islam","Kristen","Katholik","Hindu","Budha","Konghucu"]
                .filter(item => item.toLowerCase().includes((searchAgama || "").toLowerCase()))
                .map((item, index) => (
                  <li key={index} onMouseDown={() => { setFormData({ ...formData, agama: item }); setSearchAgama(item); setShowAgamaDropdown(false); }} className="px-3 py-2 hover:bg-green-100 cursor-pointer">{item}</li>
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
            onChange={(e) => { setSearchStatus(e.target.value); setShowStatusDropdown(true); }}
            onClick={() => setShowStatusDropdown(true)}
            onFocus={() => setShowStatusDropdown(true)}
            onBlur={() => setTimeout(() => setShowStatusDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {showStatusDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {["Belum Kawin","Kawin tercatat","Kawin tidak tercatat","Cerai hidup","Cerai mati"]
                .filter(item => item.toLowerCase().includes((searchStatus || "").toLowerCase()))
                .map((item, index) => (
                  <li key={index} onMouseDown={() => { setFormData({ ...formData, status_perkawinan: item }); setSearchStatus(item); setShowStatusDropdown(false); }} className="px-3 py-2 hover:bg-green-100 cursor-pointer">{item}</li>
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
            onChange={(e) => { setSearchPendidikan(e.target.value); setShowPendidikanDropdown(true); }}
            onClick={() => setShowPendidikanDropdown(true)}
            onFocus={() => setShowPendidikanDropdown(true)}
            onBlur={() => setTimeout(() => setShowPendidikanDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {showPendidikanDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {["Tidak/belum sekolah","Belum tamat SD/sederajat","Tamat SD/sederajat","SLTP/sederajat","Diploma I/II","Akademi I/Diploma III/S.Muda","Diploma IV/Strata I","Strata II","Strata III"]
                .filter(item => item.toLowerCase().includes((searchPendidikan || "").toLowerCase()))
                .map((item, index) => (
                  <li key={index} onMouseDown={() => { setFormData({ ...formData, pendidikan: item }); setSearchPendidikan(item); setShowPendidikanDropdown(false); }} className="px-3 py-2 hover:bg-green-100 cursor-pointer">{item}</li>
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

        {/* RW (dropdown diambil dari users) */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih RW --"
            value={searchRw} // <-- gunakan searchRw sebagai source of truth
            onChange={async (e) => {
              const v = e.target.value;
              setSearchRw(v);
              setFormData(prev => ({ ...prev, rw: v }));
              setShowRwDropdown(true);

              // Jika user mengetik value yang valid (tidak kosong), update RT list secara langsung
              if (v) {
                await fetchRtsForRw(v);
              } else {
                setRtListForRw(rtOptions);
              }
            }}
            onClick={() => setShowRwDropdown(true)}
            onFocus={() => setShowRwDropdown(true)}
            onBlur={() => setTimeout(() => setShowRwDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {showRwDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {rwOptions
                .filter(item => item.toLowerCase().includes((searchRw || "").toLowerCase()))
                .map((item, index) => (
                  <li
                    key={index}
                    onMouseDown={async () => {
                      // ketika RW dipilih, set RW & fetch RTs segera
                      setFormData(prev => ({ ...prev, rw: item, rt: "" }));
                      setSearchRw(item);
                      setSearchRt("");
                      setShowRwDropdown(false);
                      await fetchRtsForRw(item);
                    }}
                    className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* RT (otomatis mengikuti RW yang dipilih) */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="-- Pilih RT --"
            value={searchRt} // <-- gunakan searchRt sebagai source of truth
            onChange={(e) => {
              const v = e.target.value;
              setSearchRt(v);
              setFormData(prev => ({ ...prev, rt: v }));
              setShowRtDropdown(true);
            }}
            onClick={() => setShowRtDropdown(true)}
            onFocus={() => setShowRtDropdown(true)}
            onBlur={() => setTimeout(() => setShowRtDropdown(false), 150)}
            className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {showRtDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {rtListForRw
                .filter(item => item.toLowerCase().includes((searchRt || "").toLowerCase()))
                .map((item, index) => (
                  <li
                    key={index}
                    onMouseDown={() => {
                      setFormData(prev => ({ ...prev, rt: item }));
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
          <input type="text" placeholder="-- Pilih Status Dalam Keluarga --" value={searchStatusKeluarga || ""} onChange={(e) => { setSearchStatusKeluarga(e.target.value); setShowStatusKeluargaDropdown(true); }} onClick={() => setShowStatusKeluargaDropdown(true)} onFocus={() => setShowStatusKeluargaDropdown(true)} onBlur={() => setTimeout(() => setShowStatusKeluargaDropdown(false), 150)} className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400" />

          {showStatusKeluargaDropdown && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {["Kepala Keluarga","Suami","Istri","Anak","Orang Tua","Mertua","Cucu","Menantu","Pembantu","Family Lain"].filter(item => item.toLowerCase().includes((searchStatusKeluarga || "").toLowerCase())).map((item, index) => (
                <li key={index} onMouseDown={() => { setFormData({ ...formData, status_keluarga: item }); setSearchStatusKeluarga(item); setShowStatusKeluargaDropdown(false); }} className="px-3 py-2 hover:bg-green-100 cursor-pointer">{item}</li>
              ))}
            </ul>
          )}
        </div>

        {/* NIK & Nama Ayah */}
        <input type="text" placeholder="NIK Ayah" value={formData.nik_ayah} onChange={(e) => setFormData({ ...formData, nik_ayah: e.target.value })} className="border rounded px-3 py-2" />
        <input type="text" placeholder="Nama Ayah" value={formData.nama_ayah} onChange={(e) => setFormData({ ...formData, nama_ayah: e.target.value })} className="border rounded px-3 py-2" />

        {/* NIK & Nama Ibu */}
        <input type="text" placeholder="NIK Ibu" value={formData.nik_ibu} onChange={(e) => setFormData({ ...formData, nik_ibu: e.target.value })} className="border rounded px-3 py-2" />
        <input type="text" placeholder="Nama Ibu" value={formData.nama_ibu} onChange={(e) => setFormData({ ...formData, nama_ibu: e.target.value })} className="border rounded px-3 py-2" />

        {/* Desa, Kecamatan, Kabupaten */}
        <div className="col-span-2 grid grid-cols-4 gap-4">
          <input type="text" placeholder="Desa" value={formData.desa} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
          <input type="text" placeholder="Kecamatan" value={formData.kecamatan} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
          <input type="text" placeholder="Kabupaten" value={formData.kabupaten} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
          <input type="text" placeholder="Provinsi" value={formData.provinsi} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
          <input type="text" placeholder="Kode Pos" value={formData.kode_pos} readOnly className="w-full border rounded px-3 py-2 bg-gray-100" />
        </div>

        {/* Spacing element to keep grid alignment */}
        <div className="col-span-4 h-2"></div>

        {/* Buttons (submit inside form) */}
        <div className="col-span-4 flex justify-end mt-2 space-x-2">
          <Link to="/admin/kelola_data/data_penduduk" className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Batal</Link>
          <button type="submit" disabled={isUpdating} className={`px-4 py-2 ${isUpdating ? 'bg-green-400' : 'bg-green-600'} text-white rounded hover:bg-green-700`}>
            {isUpdating ? 'Menyimpan...' : 'Update'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default Edit_Penduduk;
