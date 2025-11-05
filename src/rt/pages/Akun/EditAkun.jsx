// src/rt/pages/EditAkun.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import supabase from "../../../supabaseClient";

function EditAkun() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    no_hp: "",
    jk: "",
    rt: "",
    rw: "",
    role: "",
    password: "",
    foto: "", // store path in DB (not full URL) when uploading
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const fileInputRef = useRef(null);

  // fetch user data and compute preview (if foto is storage path -> get publicUrl)
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
        if (error) {
          console.error("Gagal ambil data user:", error);
          return;
        }
        setFormData((prev) => ({ ...prev, ...(data || {}) }));

        // compute preview URL
        if (data?.foto) {
          if (typeof data.foto === "string" && (data.foto.startsWith("http://") || data.foto.startsWith("https://"))) {
            setFotoPreview(`${data.foto}?t=${Date.now()}`);
          } else {
            try {
              const { data: urlData } = supabase.storage.from("user-photos").getPublicUrl(data.foto);
              setFotoPreview(urlData?.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : "");
            } catch (err) {
              console.warn("Gagal ambil preview dari storage:", err);
              setFotoPreview("");
            }
          }
        } else {
          setFotoPreview("");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  // upload file to storage -> return filePath (do NOT return full URL)
  const uploadFotoToStorage = async (file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("user-photos").upload(filePath, file, { upsert: true });
      if (uploadError) {
        throw uploadError;
      }
      // return storage path to save in DB
      return filePath;
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.username) {
      return alert("Nama dan Username wajib diisi!");
    }

    setLoading(true);
    try {
      let newFotoPath = null;
      const oldFotoPath = formData.foto && typeof formData.foto === "string" && !formData.foto.startsWith("http")
        ? formData.foto
        : null;

      // if user uploaded a new file: upload it first
      if (fotoFile) {
        const uploadedPath = await uploadFotoToStorage(fotoFile);
        if (!uploadedPath) throw new Error("Gagal mengunggah foto");

        newFotoPath = uploadedPath;

        // delete old file only after new is uploaded successfully
        if (oldFotoPath) {
          try {
            await supabase.storage.from("user-photos").remove([oldFotoPath]);
          } catch (err) {
            console.warn("Gagal menghapus foto lama (non-fatal):", err);
          }
        }
      }

      // build updateData — include foto only if we have a new fotoPath
      const updateData = {
        nama: formData.nama,
        username: formData.username,
        no_hp: formData.no_hp,
        jk: formData.jk,
        rt: formData.rt,
        rw: formData.rw,
        password: formData.password,
      };
      if (newFotoPath) {
        updateData.foto = newFotoPath; // store path in DB
      }
      // if no new foto uploaded => do NOT include foto key — that preserves existing DB value

      const { error } = await supabase.from("users").update(updateData).eq("id", id);
      if (error) throw error;

      // trigger sidebar refresh
      window.dispatchEvent(new Event("profile-updated"));

      alert("Data berhasil diperbarui!");
      navigate("/rt/akun/dataakun");
    } catch (err) {
      console.error("Update error:", err);
      alert("Terjadi kesalahan saat menyimpan: " + (err.message || err.error_description || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </button>
        <h1 className="text-xl font-semibold">Edit Akun</h1>
      </div>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FOTO & PREVIEW */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border shadow-sm">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-sm text-gray-500">No Foto</div>
              )}
            </div>

            <label className="mt-3 text-sm font-medium">Upload Foto</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} className="mt-2 text-sm cursor-pointer" />
            {uploading && <div className="mt-2 text-xs text-gray-500">Mengunggah foto...</div>}
          </div>
        </div>

        {/* FORM FIELD */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama</label>
            <input type="text" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">No HP</label>
            <input type="text" value={formData.no_hp} onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
            <select value={formData.jk} onChange={(e) => setFormData({ ...formData, jk: e.target.value })} className="w-full border rounded px-3 py-2">
              <option value="">-- Pilih Jenis Kelamin --</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <input type="text" value={formData.role || "Belum diatur"} className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed" disabled />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">RT</label>
            <input type="text" value={formData.rt} onChange={(e) => setFormData({ ...formData, rt: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">RW</label>
            <input type="text" value={formData.rw} onChange={(e) => setFormData({ ...formData, rw: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Masukkan password baru" className="w-full border rounded px-3 py-2 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin merubah password.</p>
          </div>
        </div>

        {/* Tombol Simpan & Batal */}
        <div className="md:col-span-3 flex justify-end space-x-2 mt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" disabled={loading || uploading}>Batal</button>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60" disabled={loading || uploading}>{loading ? "Menyimpan..." : "Update"}</button>
        </div>
      </form>
    </div>
  );
}

export default EditAkun;
