import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../../supabaseClient";
import logo from "../../../../assets/logo_desa.png";

function DetailPindah() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataPindah, setDataPindah] = useState(null);
  const [kepalaKeluarga, setKepalaKeluarga] = useState("-");

  useEffect(() => {
    const fetchDataPindah = async () => {
      const { data, error } = await supabase
        .from("data_pindah")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching data_pindah:", error);
      } else {
        setDataPindah(data);

        // Setelah data pindah didapat, ambil kepala keluarga berdasarkan no_kk
        if (data?.no_kk) {
          const { data: kkData, error: kkError } = await supabase
            .from("data_pindah")
            .select("nama")
            .eq("no_kk", data.no_kk)
            .eq("status_keluarga", "Kepala Keluarga")
            .single();

          if (!kkError && kkData) {
            setKepalaKeluarga(kkData.nama);
          } else {
            // Kalau tidak ditemukan di data_pindah, coba di data_penduduk
            const { data: pendudukData, error: pendudukError } = await supabase
              .from("data_penduduk")
              .select("nama")
              .eq("no_kk", data.no_kk)
              .eq("status_keluarga", "Kepala Keluarga")
              .single();

            if (!pendudukError && pendudukData) {
              setKepalaKeluarga(pendudukData.nama);
            }
          }
        }
      }
    };

    fetchDataPindah();
  }, [id]);

  if (!dataPindah) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  const alasanFinal =
    dataPindah.alasan === "Lainnya"
      ? dataPindah.alasan_lain || "-"
      : dataPindah.alasan || "-";

  const alamatAsalLengkap = `
    ${dataPindah.alamat || "-"}, RT ${dataPindah.rt || "-"}, RW ${dataPindah.rw || "-"},
    Ds. ${dataPindah.desa || "-"}, Kec. ${dataPindah.kecamatan || "-"},
    Kab. ${dataPindah.kabupaten || "-"}, ${dataPindah.provinsi || "-"},
    ${dataPindah.kode_pos || "-"}
  `;

  const alamatTujuanLengkap = `
    ${dataPindah.alamat_pindah || "-"}, RT ${dataPindah.rt_pindah || "-"}, RW ${dataPindah.rw_pindah || "-"},
    Ds. ${dataPindah.desa_pindah || "-"}, Kec. ${dataPindah.kecamatan_pindah || "-"},
    Kab. ${dataPindah.kabupaten_pindah || "-"}, ${dataPindah.provinsi_pindah || "-"},
    ${dataPindah.kodepos_pindah || "-"}
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

        {/* Logo Desa */}
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo Desa" className="w-24 h-24 object-contain" />
        </div>

        {/* Judul */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold uppercase">Data Pindah WNI</h1>
        </div>

        {/* DATA DAERAH ASAL */}
        <h2 className="font-semibold text-lg mb-3">DATA DAERAH ASAL</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 mb-6">
          <div className="flex justify-between"><span>Nomor KK</span><span>:</span></div>
          <div>{dataPindah.no_kk || "-"}</div>

          <div className="flex justify-between"><span>Nama Kepala Keluarga</span><span>:</span></div>
          <div>{kepalaKeluarga}</div>

          <div className="flex justify-between"><span>Alamat Asal</span><span>:</span></div>
          <div>{alamatAsalLengkap}</div>
        </div>

        {/* DATA KEPINDAHAN */}
        <h2 className="font-semibold text-lg mb-3">DATA KEPINDAHAN</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 mb-6">
          <div className="flex justify-between"><span>NIK</span><span>:</span></div>
          <div>{dataPindah.nik || "-"}</div>

          <div className="flex justify-between"><span>Nama Lengkap</span><span>:</span></div>
          <div>{dataPindah.nama || "-"}</div>
          <div className="flex justify-between"><span>Alasan Pindah</span><span>:</span></div>
          <div>{alasanFinal}</div>

          <div className="flex justify-between"><span>Alamat Tujuan</span><span>:</span></div>
          <div>{alamatTujuanLengkap}</div>

          <div className="flex justify-between"><span>Jenis Kepindahan</span><span>:</span></div>
          <div>{dataPindah.jenis_pindah || "-"}</div>

          <div className="flex justify-between"><span>Status KK Bagi Yang Tidak Pindah</span><span>:</span></div>
          <div>{dataPindah.statuskk_tidakpindah || "-"}</div>

          <div className="flex justify-between"><span>Status KK Bagi Yang Pindah</span><span>:</span></div>
          <div>{dataPindah.statuskk_pindah || "-"}</div>
        </div>
      </div>
    </div>
  );
}

export default DetailPindah;
