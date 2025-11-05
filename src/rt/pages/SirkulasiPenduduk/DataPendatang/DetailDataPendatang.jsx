import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../../supabaseClient";
import logo from "../../../../assets/logo_desa.png"; // pastikan path logo benar

function DetailDataPendatang() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pendatang, setPendatang] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataPenduduk, setDataPenduduk] = useState([]);

  useEffect(() => {
    const fetchPendatang = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("data_pendatang")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        setPendatang(data);
      }
      setLoading(false);
    };
    fetchPendatang();
  }, [id]);

  useEffect(() => {
    const fetchDataPenduduk = async () => {
      const { data, error } = await supabase.from("data_penduduk").select("*");
      if (error) {
        console.error("Gagal ambil data penduduk:", error);
      } else {
        setDataPenduduk(data);
      }
    };
    fetchDataPenduduk();
  }, []);

  if (loading) return <div className="p-6 text-gray-600">Loading...</div>;
  if (!pendatang) return <div className="p-6 text-gray-600">Data tidak ditemukan</div>;

  // Alamat lengkap
  const alamatLengkap = `
    ${pendatang.alamat || "-"}, RT ${pendatang.rt || "-"}, RW ${pendatang.rw || "-"},
    Desa ${pendatang.desa || "-"}, Kecamatan ${pendatang.kecamatan || "-"},
    Kabupaten ${pendatang.kabupaten || "-"}, Provinsi ${pendatang.provinsi || "-"}, ${pendatang.kode_pos || "-"} 
  `;

  return (
    <div className="flex justify-center w-full overflow-x-hidden">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 sm:p-10">
        {/* Tombol Kembali */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo Desa" className="w-24 h-24 object-contain" />
        </div>

        {/* Judul */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold uppercase">
            Biodata Pendatang Warga Negara Indonesia
          </h1>
        </div>

        {/* NIK */}
        <div className="text-center text-lg font-bold mb-6">
          NIK: {pendatang.nik || "-"}
        </div>

        {/* DATA PERSONAL */}
        <h2 className="font-semibold text-lg mb-3">DATA PERSONAL</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 mb-6">
          <div className="flex justify-between"><span>Nama Lengkap</span><span>:</span></div>
          <div>{pendatang.nama || "-"}</div>

          <div className="flex justify-between"><span>Tempat Lahir</span><span>:</span></div>
          <div>{pendatang.tempat_lahir || "-"}</div>

          <div className="flex justify-between"><span>Tanggal Lahir</span><span>:</span></div>
          <div>{pendatang.tanggal_lahir || "-"}</div>

          <div className="flex justify-between"><span>Jenis Kelamin</span><span>:</span></div>
          <div>{pendatang.jk || "-"}</div>

          <div className="flex justify-between"><span>Golongan Darah</span><span>:</span></div>
          <div>{pendatang.golongan_darah || "-"}</div>

          <div className="flex justify-between"><span>Agama</span><span>:</span></div>
          <div>{pendatang.agama || "-"}</div>

          <div className="flex justify-between"><span>Pendidikan</span><span>:</span></div>
          <div>{pendatang.pendidikan || "-"}</div>

          <div className="flex justify-between"><span>Pekerjaan</span><span>:</span></div>
          <div>{pendatang.pekerjaan || "-"}</div>

          <div className="flex justify-between"><span>Status Perkawinan</span><span>:</span></div>
          <div>{pendatang.status_perkawinan || "-"}</div>

          <div className="flex justify-between"><span>Status Keluarga</span><span>:</span></div>
          <div>{pendatang.status_keluarga || "-"}</div>

          <div className="flex justify-between"><span>NIK Ibu</span><span>:</span></div>
          <div>{pendatang.nik_ibu || "-"}</div>

          <div className="flex justify-between"><span>Nama Ibu</span><span>:</span></div>
          <div>{pendatang.nama_ibu || "-"}</div>

          <div className="flex justify-between"><span>NIK Ayah</span><span>:</span></div>
          <div>{pendatang.nik_ayah || "-"}</div>

          <div className="flex justify-between"><span>Nama Ayah</span><span>:</span></div>
          <div>{pendatang.nama_ayah || "-"}</div>

          <div className="flex justify-between"><span>Alamat Lengkap</span><span>:</span></div>
          <div>{alamatLengkap}</div>
        </div>

        {/* DATA LAINNYA */}
        <h2 className="font-semibold text-lg mb-3">DATA KEPEMILIKAN DOKUMEN</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6">
          <div className="flex justify-between"><span>Nomor KK</span><span>:</span></div>
          <div>{pendatang.no_kk || "-"}</div>
        </div>
      </div>
    </div>
  );
}

export default DetailDataPendatang;
