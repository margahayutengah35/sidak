import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Edit,
  FileText,
  Trash2,
  UserPlus,
  Upload,
  Eye, 
  EyeOff
} from "lucide-react";
import supabase from "../../supabaseClient";
import defaultAvatar from "../../assets/logo.png";

function Data_Akun() {
  const [allData, setAllData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [loading, setLoading] = useState(false);

  // filter state
  const [roleFilter, setRoleFilter] = useState("all");
  const [rtFilter, setRtFilter] = useState("all");
  const [rwFilter, setRwFilter] = useState("all");
  const [uniqueRTs, setUniqueRTs] = useState([]);
  const [uniqueRWs, setUniqueRWs] = useState([]);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);

  // selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // modal add state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    no_hp: "",
    jk: "L",
    rt: "",
    rw: "",
    username: "",
    password: "",
    role: "rt",
    foto: null, // optional
  });

  const isFullUrl = (s) =>
    typeof s === "string" &&
    (s.startsWith("http://") || s.startsWith("https://"));

  const getFotoUrl = async (fotoPath) => {
    if (!fotoPath) return defaultAvatar;
    if (isFullUrl(fotoPath)) return fotoPath;
    try {
      const { data } = supabase.storage
        .from("user-photos")
        .getPublicUrl(fotoPath);
      return data?.publicUrl || defaultAvatar;
    } catch {
      return defaultAvatar;
    }
  };

  // fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;

      const withFotoUrl = await Promise.all(
        data.map(async (item) => ({
          ...item,
          fotoUrl: await getFotoUrl(item.foto),
        }))
      );

      setUniqueRTs(
        Array.from(
          new Set(
            withFotoUrl.map((d) => d.rt).filter((v) => v && v !== "-")
          )
        ).sort()
      );
      setUniqueRWs(
        Array.from(new Set(withFotoUrl.map((d) => d.rw).filter(Boolean))).sort()
      );
      setAllData(withFotoUrl);
    } catch (err) {
      console.error("Error fetch:", err);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // apply filter + keep admin on top
  useEffect(() => {
    let filtered = [...allData];
    if (roleFilter === "admin") {
      filtered = filtered.filter((d) => d.role === "admin");
    } else if (roleFilter === "rt") {
      filtered = filtered.filter((d) => d.role === "rt");
      if (rtFilter !== "all")
        filtered = filtered.filter((d) => String(d.rt) === String(rtFilter));
    } else if (roleFilter === "rw") {
      filtered = filtered.filter((d) => d.role === "rw");
      if (rwFilter !== "all")
        filtered = filtered.filter((d) => String(d.rw) === String(rwFilter));
    }

    filtered.sort((a, b) => {
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (a.role !== "admin" && b.role === "admin") return 1;
      return (a.id ?? 0) - (b.id ?? 0);
    });

    setDisplayedData(filtered);
    setCurrentPage(1);
    setSelectedIds([]);
    setSelectAll(false);
  }, [allData, roleFilter, rtFilter, rwFilter]);

  // pagination logic
  const totalPages = Math.max(1, Math.ceil(displayedData.length / entriesPerPage));
  const paginatedData = displayedData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handlePrevious = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  const handleNext = () =>
    currentPage < totalPages && setCurrentPage((p) => p + 1);

  const [showPassword, setShowPassword] = useState(false);

  // toggle single select
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // toggle select all on current page
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const allIds = paginatedData.map((item) => item.id);
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

  // delete single
  const handleDeleteSingle = async (id) => {
    const ok = window.confirm("Yakin ingin menghapus data ini?");
    if (!ok) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      // refresh
      await fetchData();
      // clear selection if included
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      console.error("Gagal hapus:", err);
      alert("Gagal hapus data. Cek console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // delete multiple
  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(`Hapus ${selectedIds.length} data terpilih?`);
    if (!ok) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("users").delete().in("id", selectedIds);
      if (error) throw error;
      await fetchData();
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      console.error("Gagal hapus banyak:", err);
      alert("Gagal hapus data. Cek console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // modal form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAddData = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // basic insert (password stored as plain per your original - consider hashing in real app)
      const insertPayload = {
        nama: formData.nama,
        no_hp: formData.no_hp,
        jk: formData.jk,
        rt: formData.rt,
        rw: formData.rw,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        foto: formData.foto || null,
      };
      const { error } = await supabase.from("users").insert([insertPayload]);
      if (error) throw error;
      // reset + close + refresh
      setFormData({
        nama: "",
        no_hp: "",
        jk: "L",
        rt: "",
        rw: "",
        username: "",
        password: "",
        role: "rt",
        foto: null,
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Gagal tambah data:", err);
      alert("Gagal menyimpan. Cek console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Akun</h1>
      </div>

      {/* top controls */}
      <div className="flex justify-between items-center mt-4 mb-4 flex-wrap gap-3">
        {/* left controls (Show entries + Filter role) */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* show entries */}
          <div className="flex items-center space-x-2">
            <span className="text-sm">Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="appearance-none bg-gray-200 border rounded px-2 py-1 text-sm pr-6 focus:outline-none"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={150}>150</option>
              <option value={200}>200</option>
            </select>
            <span className="text-sm">entries</span>
          </div>

          {/* filter role */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter role:</span>
            <div className="flex rounded-lg overflow-hidden border">
              {[
                { key: "all", label: "Semua" },
                { key: "admin", label: "Admin" },
                { key: "rt", label: "RT" },
                { key: "rw", label: "RW" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setRoleFilter(opt.key);
                    setRtFilter("all");
                    setRwFilter("all");
                  }}
                  className={`px-3 py-1 text-sm font-medium rounded-none focus:outline-none transition-all whitespace-nowrap ${
                    roleFilter === opt.key
                      ? "bg-green-600 text-white shadow"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {roleFilter === "rt" && (
              <select
                className="border rounded px-2 py-1 text-sm ml-2"
                value={rtFilter}
                onChange={(e) => setRtFilter(e.target.value)}
              >
                <option value="all">Semua RT</option>
                {uniqueRTs.map((r) => (
                  <option key={r} value={r}>{`RT ${r}`}</option>
                ))}
              </select>
            )}
            {roleFilter === "rw" && (
              <select
                className="border rounded px-2 py-1 text-sm ml-2"
                value={rwFilter}
                onChange={(e) => setRwFilter(e.target.value)}
              >
                <option value="all">Semua RW</option>
                {uniqueRWs.map((r) => (
                  <option key={r} value={r}>{`RW ${r}`}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* right action buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleDeleteMultiple}
            disabled={selectedIds.length === 0 || isSubmitting}
            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5 mr-2" /> Hapus Terpilih
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Tambah Data
          </button>
          <Link
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            to="/rt/keloladata/datapenduduk/template"
          >
            <Upload className="mr-2" /> Import CSV
          </Link>
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-0 py-0 border text-center">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length > 0 &&
                    paginatedData.length > 0 &&
                    selectedIds.length === paginatedData.length
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-2 border text-center">No</th>
              <th className="px-4 py-2 border text-center">Profile</th>
              <th className="px-4 py-2 border text-center">Nama</th>
              <th className="px-4 py-2 border text-center">Username</th>
              <th className="px-4 py-2 border text-center">No HP</th>
              <th className="px-4 py-2 border text-center">JK</th>
              <th className="px-4 py-2 border text-center">RT</th>
              <th className="px-4 py-2 border text-center">RW</th>
              <th className="px-4 py-2 border text-center">Role</th>
              <th className="px-4 py-2 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr key={item.id ?? index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {(currentPage - 1) * entriesPerPage + index + 1}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <img
                      src={item.fotoUrl || defaultAvatar}
                      alt="User"
                      className="w-10 h-10 rounded-full object-cover mx-auto"
                      onError={(e) => (e.currentTarget.src = defaultAvatar)}
                    />
                  </td>
                  <td className="px-4 py-2 border text-center">{item.nama}</td>
                  <td className="px-4 py-2 border text-center">{item.username}</td>
                  <td className="px-4 py-2 border text-center">{item.no_hp}</td>
                  <td className="px-4 py-2 border text-center">{item.jk}</td>
                  <td className="px-4 py-2 border text-center">{item.rt}</td>
                  <td className="px-4 py-2 border text-center">{item.rw}</td>
                  <td className="px-4 py-2 border text-center font-semibold text-green-600">
                    {item.role}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        to={`/admin/dataakun/edit_akun/${item.id}`}
                        className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteSingle(item.id)}
                        disabled={isSubmitting}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={11}
                  className="text-center py-4 text-gray-500 italic"
                >
                  {loading ? "Memuat data..." : "Tidak ada data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* pagination */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm">
            Showing{" "}
            {displayedData.length > 0
              ? (currentPage - 1) * entriesPerPage + 1
              : 0}{" "}
            to{" "}
            {Math.min(currentPage * entriesPerPage, displayedData.length)} of{" "}
            {displayedData.length} entries
          </span>
          <div className="space-x-2 flex items-center">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`px-3 py-1 rounded ${
                  currentPage === num ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* blur background */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          <div className="relative bg-white p-6 rounded-lg w-full max-w-lg z-10">
            <h2 className="text-lg font-semibold mb-4">Tambah Data Akun</h2>

            <form onSubmit={handleAddData} className="space-y-3">
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleInputChange}
                placeholder="Nama"
                className="w-full border px-3 py-2 rounded"
                required
              />
              <input
                type="text"
                name="no_hp"
                value={formData.no_hp}
                onChange={handleInputChange}
                placeholder="No HP"
                className="w-full border px-3 py-2 rounded"
                required
              />
              <select
                name="jk"
                value={formData.jk}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded"
                required
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>

              <div className="flex gap-2">
                <input
                  type="text"
                  name="rt"
                  value={formData.rt}
                  onChange={handleInputChange}
                  placeholder="RT"
                  className="w-1/2 border px-3 py-2 rounded"
                />
                <input
                  type="text"
                  name="rw"
                  value={formData.rw}
                  onChange={handleInputChange}
                  placeholder="RW"
                  className="w-1/2 border px-3 py-2 rounded"
                />
              </div>

              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username"
                className="w-full border px-3 py-2 rounded"
                required
              />
              <div className="relative">
              <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="w-full border px-3 py-2 rounded pr-10" // pr-10 biar ada space untuk icon
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button></div>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded"
                required
              >
                <option value="admin">Admin</option>
                <option value="rt">RT</option>
                <option value="rw">RW</option>
              </select>

              {/* buttons bottom-right */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    // reset form and close
                    setFormData({
                      nama: "",
                      no_hp: "",
                      jk: "L",
                      rt: "",
                      rw: "",
                      username: "",
                      password: "",
                      role: "rt",
                      foto: null,
                    });
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Data_Akun;
