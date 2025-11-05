// src/pages/admin/Edit_Akun.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import supabase from "../../supabaseClient";
import defaultAvatar from "../../assets/logo.png";

function Edit_Akun() {
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
    foto: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(defaultAvatar);
  const fileInputRef = useRef(null);

  // Fetch user data (including password)
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (data) {
          setFormData({
            nama: data.nama || "",
            username: data.username || "",
            no_hp: data.no_hp || "",
            jk: data.jk || "",
            rt: data.rt || "",
            rw: data.rw || "",
            role: data.role || "",
            // <-- sekarang ambil password dari DB juga
            password: data.password || "",
            foto: data.foto || "",
          });

          // compute foto preview (support public url or storage path)
          if (data.foto) {
            if (
              typeof data.foto === "string" &&
              (data.foto.startsWith("http://") || data.foto.startsWith("https://"))
            ) {
              setFotoPreview(`${data.foto}?t=${Date.now()}`);
            } else {
              try {
                const { data: urlData } = supabase.storage
                  .from("user-photos")
                  .getPublicUrl(data.foto);
                setFotoPreview(
                  urlData?.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : defaultAvatar
                );
              } catch (err) {
                console.warn("Gagal ambil preview dari storage:", err);
                setFotoPreview(defaultAvatar);
              }
            }
          } else {
            setFotoPreview(defaultAvatar);
          }
        }
      } catch (err) {
        console.error("Gagal ambil data user:", err?.message || err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  // handle photo selection (preview local)
  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  // upload foto -> return storage path (not public url)
  const uploadFotoToStorage = async (file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("user-photos")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      return filePath;
    } finally {
      setUploading(false);
    }
  };

  // update handler
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.username) {
      return alert("Nama dan Username wajib diisi!");
    }

    setLoading(true);
    try {
      let newFotoPath = null;
      const oldFotoPath =
        formData.foto &&
        typeof formData.foto === "string" &&
        !formData.foto.startsWith("http")
          ? formData.foto
          : null;

      // jika ada foto baru, upload dulu
      if (fotoFile) {
        const uploadedPath = await uploadFotoToStorage(fotoFile);
        if (!uploadedPath) throw new Error("Gagal mengunggah foto");
        newFotoPath = uploadedPath;

        // hapus foto lama jika ada path storage
        if (oldFotoPath) {
          try {
            await supabase.storage.from("user-photos").remove([oldFotoPath]);
          } catch (err) {
            console.warn("Gagal menghapus foto lama:", err?.message || err);
          }
        }
      }

      // build update payload (include role + password (we fetched it) )
      const updateData = {
        nama: formData.nama,
        username: formData.username,
        no_hp: formData.no_hp,
        jk: formData.jk,
        rt: formData.rt,
        rw: formData.rw,
        role: formData.role,
        // include password (since you requested to keep/edit it)
        password: formData.password,
      };

      if (newFotoPath) updateData.foto = newFotoPath;

      const { error } = await supabase.from("users").update(updateData).eq("id", id);
      if (error) throw error;

      // notify other parts of app if needed
      window.dispatchEvent(new Event("profile-updated"));
      alert("Data berhasil diperbarui!");
      navigate("/admin/dataakun/data_akun");
    } catch (err) {
      console.error("Update error:", err);
      alert("Terjadi kesalahan saat menyimpan: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </button>
        <h1 className="text-xl font-semibold">Edit Akun</h1>
      </div>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FOTO */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border shadow-sm">
            <img
              src={fotoPreview || defaultAvatar}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = defaultAvatar)}
            />
          </div>

          <label className="mt-3 text-sm font-medium">Upload Foto</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            className="mt-2 text-sm cursor-pointer"
          />
          {uploading && <div className="mt-2 text-xs text-gray-500">Mengunggah foto...</div>}
        </div>

        {/* FORM */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama</label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">No HP</label>
            <input
              type="text"
              value={formData.no_hp}
              onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
            <select
              value={formData.jk}
              onChange={(e) => setFormData({ ...formData, jk: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Pilih Jenis Kelamin --</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">-- Pilih Role --</option>
              <option value="admin">Admin</option>
              <option value="rt">RT</option>
              <option value="rw">RW</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">RT</label>
            <input
              type="text"
              value={formData.rt}
              onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">RW</label>
            <input
              type="text"
              value={formData.rw}
              onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Masukkan password"
                className="w-full border rounded px-3 py-2 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kosongkan jika tidak ingin merubah password.
            </p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="md:col-span-3 flex justify-end space-x-2 mt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            disabled={loading || uploading}
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
            disabled={loading || uploading}
          >
            {loading ? "Menyimpan..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Edit_Akun;
