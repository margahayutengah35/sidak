// src/rw/pages/RwKelolaData/DetailDataPendudukRT.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../supabaseClient";
import logo from "../../../assets/logo_desa.png";

function DetailDataPendudukRT() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [penduduk, setPenduduk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPenduduk = async () => {
      setLoading(true);
      try {
        const parsedId = isNaN(Number(id)) ? id : parseInt(id, 10);
        const { data, error } = await supabase
          .from("data_penduduk")
          .select("*")
          .eq("id_penduduk", parsedId)
          .single();

        if (error) {
          console.error("Error fetching penduduk:", error);
          setPenduduk(null);
        } else {
          setPenduduk(data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setPenduduk(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPenduduk();
  }, [id]);

  if (loading) return <div className="p-6 text-gray-600">Loading...</div>;
  if (!penduduk) return <div className="p-6 text-gray-600">Data tidak ditemukan.</div>;

  const pekerjaanLainnya =
    penduduk.pekerjaan === "Jasa Lainnya" || penduduk.pekerjaan === "Lainnya";

  const alamatFinal = penduduk.alamat === "Lainnya" && penduduk.alamat_detail
    ? penduduk.alamat_detail
    : penduduk.alamat || "-";

  const alamatLengkap = `${alamatFinal}, RT ${penduduk.rt || "-"}, RW ${penduduk.rw || "-"}, Desa ${penduduk.desa || "-"}, Kecamatan ${penduduk.kecamatan || "-"}, Kabupaten ${penduduk.kabupaten || "-"}, Provinsi ${penduduk.provinsi || "-"}, ${penduduk.kode_pos || "-"}`;

  return (
    <div className="flex justify-center w-full overflow-x-hidden">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 sm:p-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
        </button>

        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo Desa" className="w-24 h-24 object-contain" />
        </div>

        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold uppercase">Biodata Penduduk WNI</h1>
        </div>

        <div className="text-center text-lg font-bold mb-6">NIK: {penduduk.nik || "-"}</div>

        <h2 className="font-semibold text-lg mb-3">DATA PERSONAL</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 mb-6">
          <div className="flex justify-between"><span>Nama Lengkap</span><span>:</span></div>
          <div>{penduduk.nama || "-"}</div>

          <div className="flex justify-between"><span>Tempat Lahir</span><span>:</span></div>
          <div>{penduduk.tempat_lahir || "-"}</div>

          <div className="flex justify-between"><span>Tanggal Lahir</span><span>:</span></div>
          <div>{penduduk.tanggal_lahir || "-"}</div>

          <div className="flex justify-between"><span>Jenis Kelamin</span><span>:</span></div>
          <div>{penduduk.jk || "-"}</div>

          <div className="flex justify-between"><span>Golongan Darah</span><span>:</span></div>
          <div>{penduduk.golongan_darah || "-"}</div>

          <div className="flex justify-between"><span>Agama</span><span>:</span></div>
          <div>{penduduk.agama || "-"}</div>

          <div className="flex justify-between"><span>Pendidikan Terakhir</span><span>:</span></div>
          <div>{penduduk.pendidikan || "-"}</div>

          <div className="flex justify-between"><span>Jenis Pekerjaan</span><span>:</span></div>
          <div>{pekerjaanLainnya ? penduduk.pekerjaan_detail || "-" : penduduk.pekerjaan || "-"}</div>

          <div className="flex justify-between"><span>Status Perkawinan</span><span>:</span></div>
          <div>{penduduk.status_perkawinan || "-"}</div>

          <div className="flex justify-between"><span>Hubungan Keluarga</span><span>:</span></div>
          <div>{penduduk.status_keluarga || "-"}</div>

          <div className="flex justify-between"><span>NIK Ibu</span><span>:</span></div>
          <div>{penduduk.nik_ibu || "-"}</div>

          <div className="flex justify-between"><span>Nama Lengkap Ibu</span><span>:</span></div>
          <div>{penduduk.nama_ibu || "-"}</div>

          <div className="flex justify-between"><span>NIK Ayah</span><span>:</span></div>
          <div>{penduduk.nik_ayah || "-"}</div>

          <div className="flex justify-between"><span>Nama Lengkap Ayah</span><span>:</span></div>
          <div>{penduduk.nama_ayah || "-"}</div>

          <div className="flex justify-between"><span>Alamat Lengkap</span><span>:</span></div>
          <div>{alamatLengkap}</div>
        </div>

        <h2 className="font-semibold text-lg mb-3">DATA KEPEMILIKAN DOKUMEN</h2>
        <div className="grid grid-cols-2 gap-y-2 gap-x-6">
          <div className="flex justify-between"><span>Nomor Kartu Keluarga</span><span>:</span></div>
          <div>{penduduk.no_kk || "-"}</div>
        </div>
      </div>
    </div>
  );
}

export default DetailDataPendudukRT;
