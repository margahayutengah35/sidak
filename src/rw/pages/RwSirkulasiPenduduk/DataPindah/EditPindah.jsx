import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import supabase from "../../../../supabaseClient";

function EditPindah() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nik: "",
    nama: "",
    tanggal_pindah: "",
    alasan: "",
  });

  // Ambil data berdasarkan ID
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("data_pindah")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        setFormData(data);
      }
    };

    fetchData();
  }, [id]);

  // Proses update data pindah
  const handleUpdate = async () => {
    if (!formData.nik || !formData.nama || !formData.tanggal_pindah || !formData.alasan) {
      alert("Harap lengkapi semua data!");
      return;
    }

    try {
      const { error } = await supabase
        .from("data_pindah")
        .update({
          nik: formData.nik,
          nama: formData.nama,
          tanggal_pindah: formData.tanggal_pindah,
          alasan: formData.alasan,
        })
        .eq("id", id);

      if (error) throw error;

      alert("Data pindah berhasil diperbarui!");
      navigate("/rt/sirkulasipenduduk/datapindah");
    } catch (err) {
      console.error("Gagal update data:", err);
      alert("Terjadi kesalahan saat update data!\n" + err.message);
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

      <form className="grid grid-cols-2 gap-4">
        {/* NIK */}
        <input
          type="text"
          placeholder="NIK"
          value={formData.nik}
          onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
          readOnly
          className="w-full border p-2 rounded bg-gray-50"
        />

        {/* Nama */}
        <input
          type="text"
          placeholder="Nama"
          value={formData.nama}
          onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          readOnly
          className="w-full border p-2 rounded bg-gray-50"
        />

        {/* Tanggal Pindah */}
        <input
          type="date"
          placeholder="Tanggal Pindah"
          value={formData.tanggal_pindah}
          onChange={(e) => setFormData({ ...formData, tanggal_pindah: e.target.value })}
          className="border rounded px-3 py-2"
        />

        {/* Alasan */}
        <input
          type="text"
          placeholder="Alasan Pindah"
          value={formData.alasan}
          onChange={(e) => setFormData({ ...formData, alasan: e.target.value })}
          className="border rounded px-3 py-2"
        />
      </form>

      <div className="flex justify-end mt-4 space-x-2">
        <Link
          to="/rt/sirkulasipenduduk/datapindah"
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Batal
        </Link>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Update
        </button>
      </div>
    </div>
  );
}

export default EditPindah;
