import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import RtDashboard from "./rt/pages/Dashboard/Dashboard";
import DashboardLayout from "./rt/pages/Layouts/DashboardLayout";
import DetailDataPenduduk from "./rt/pages/KelolaData/DetailDataPenduduk";
import EditPenduduk from "./rt/pages/KelolaData/EditPenduduk";
import DataPenduduk from "./rt/pages/KelolaData/DataPenduduk";
import TemplateCSV from "./rt/pages/KelolaData/TemplateCSV";
import DataKartuKeluarga from "./rt/pages/KelolaData/DataKartuKeluarga";
import DetailAnggotaKK from "./rt/pages/KelolaData/DetailAnggotaKK"; 
import DataKelahiran from "./rt/pages/SirkulasiPenduduk/DataKelahiran/DataKelahiran";
import EditKelahiran from "./rt/pages/SirkulasiPenduduk/DataKelahiran/EditKelahiran";
import DetailDataKelahiran from "./rt/pages/SirkulasiPenduduk/DataKelahiran/DetailKelahiran";
import DataKematian from "./rt/pages/SirkulasiPenduduk/DataKematian/DataKematian";
import EditKematian from "./rt/pages/SirkulasiPenduduk/DataKematian/EditKematian";
import DataPendatang from "./rt/pages/SirkulasiPenduduk/DataPendatang/DataPendatang";
import EditPendatang from "./rt/pages/SirkulasiPenduduk/DataPendatang/EditPendatang";
import DetailDataPendatang from "./rt/pages/SirkulasiPenduduk/DataPendatang/DetailDataPendatang";
import DataPindah from "./rt/pages/SirkulasiPenduduk/DataPindah/DataPindah";
import EditPindah from "./rt/pages/SirkulasiPenduduk/DataPindah/EditPindah";
import KelolaLaporan from "./rt/pages/KelolaLaporan/KelolaLaporan";
import DataAkun from "./rt/pages/Akun/DataAkun";
import EditAkun from "./rt/pages/Akun/EditAkun";

import RwDashboard from "./rw/pages/RwDashboard/RwDashboard";
import DashboardLayoutRw from "./rw/pages/Layouts/DashboardLayoutRw";
import RwKelolaData from "./rw/pages/RwKelolaData/DataPenduduk";
import DetailPerRT from "./rw/pages/RwKelolaData/DetailPerRT";
import DetailDataPendudukRT from "./rw/pages/RwKelolaData/DetailDataPendudukRT";
import DataKKPerRT from "./rw/pages/RwKelolaData/DataKKPerRt";
import DetailKKPerRT from "./rw/pages/RwKelolaData/DetailKKPerRT";
import AnggotaKKPerRT from "./rw/pages/RwKelolaData/AnggotaKKPerRT";
import AnggotaKK from "./rw/pages/RwKelolaData/AnggotaKK";
import DataKelahiranRT from "./rw/pages/RwSirkulasiPenduduk/DataKelahiran/DataKelahiranRT";
import DetailKelahiranPerRT from "./rw/pages/RwSirkulasiPenduduk/DataKelahiran/DetailKelahiranPerRT";
import DetailData from "./rw/pages/RwSirkulasiPenduduk/DataKelahiran/DetailData";
import DataKematianRT from "./rw/pages/RwSirkulasiPenduduk/DataKematian/DataKematianRT";
import DetailKematianPerRT from "./rw/pages/RwSirkulasiPenduduk/DataKematian/DetailKematianPerRT";
import DataPendatangRT from "./rw/pages/RwSirkulasiPenduduk/DataPendatang/DataPendatangRT";
import DetailPendatangPerRT from "./rw/pages/RwSirkulasiPenduduk/DataPendatang/DetailPendatangPerRT";
import DetailDataPendatangRT from "./rw/pages/RwSirkulasiPenduduk/DataPendatang/DetailDataPendatangRT";
import DataPindahRT from "./rw/pages/RwSirkulasiPenduduk/DataPindah/DataPindahRT";
import DetailPindahPerRT from "./rw/pages/RwSirkulasiPenduduk/DataPindah/DetailPindahPerRT";
import RWAkun from "./rw/pages/RwAkun/DataAkun"
import RWEditAkun from "./rw/pages/RwAkun/RWEditAkun";
import Laporan from "./rw/pages/RwKelolaLaporan/Laporan";

import AdminDashboard from "./admin/AdminDashboard/AdminDashboard";
import DashboardLayoutAdmin from "./admin/Layouts/DashboardLayoutAdmin";
import Data_Penduduk from "./admin/Kelola_Data/Data_Penduduk";
import DataKK from "./admin/Kelola_Data/DataKK";
import Data_Kelahiran from "./admin/Sirkulasi_Penduduk/Data_Kelahiran/Data_Kelahiran";
import Data_Kematian from "./admin/Sirkulasi_Penduduk/Data_Kematian/Data_Kematian";
import Data_Pendatang from "./admin/Sirkulasi_Penduduk/Data_Pendatang/Data_Pendatang";
import Data_Pindah from "./admin/Sirkulasi_Penduduk/Data_Pindah/Data_Pindah";
import Kelola_Laporan from "./admin/Kelola_Laporan/Kelola_Laporan";
import Data_Akun from "./admin/DataAkun/Data_Akun";
import Edit_Akun from "./admin/DataAkun/Edit_Akun";
import DetailKK from "./admin/Kelola_Data/DetailKK";
import Detail_DataPenduduk from "./admin/Kelola_Data/Detail_DataPenduduk";
import Edit_Penduduk from "./admin/Kelola_Data/Edit_Penduduk";
import Template_CSV from "./admin/Kelola_Data/Template_CSV";
import Edit_Pindah from "./admin/Sirkulasi_Penduduk/Data_Pindah/Edit_Pindah";
import Edit_Kematian from "./admin/Sirkulasi_Penduduk/Data_Kematian/Edit_Kematian";
import Edit_Pendatang from "./admin/Sirkulasi_Penduduk/Data_Pendatang/Edit_Pendatang";
import Detail_DataPendatang from "./admin/Sirkulasi_Penduduk/Data_Pendatang/Detail_DataPendatang";
import Edit_Kelahiran from "./admin/Sirkulasi_Penduduk/Data_Kelahiran/Edit_Kelahiran";
import Detail_Kelahiran from "./admin/Sirkulasi_Penduduk/Data_Kelahiran/Detail_Kelahiran";
import DetailPindah from "./rt/pages/SirkulasiPenduduk/DataPindah/DetailPindah";
import DetailDataPindah from "./rw/pages/RwSirkulasiPenduduk/DataPindah/DetailDataPindah";
import Penduduk_Update from "./admin/Permintaan_ACC/Penduduk_Update";
import Pindah_Update from "./admin/Permintaan_ACC/pindah_update";
import Kematian_Update from "./admin/Permintaan_ACC/kematian_update";
import Kelahiran_Update from "./admin/Permintaan_ACC/kelahiran_update";
import Pendatang_Update from "./admin/Permintaan_ACC/pendatang_update";

function App() {
  const [userRole, setUserRole] = useState(() => localStorage.getItem("userRole"));
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Simpan userRole ke localStorage
  useEffect(() => {
    if (userRole) {
      localStorage.setItem("userRole", userRole);
    } else {
      localStorage.removeItem("userRole");
    }
  }, [userRole]);

  // Logout function
  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem("userRole");
  };

  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route
          path="/"
          element={
            <div className="grid w-full h-screen place-items-center bg-green-800">
              <Login setUserRole={setUserRole} />
            </div>
          }
        />

        {/* Admin */}
        <Route element={<ProtectedRoute userRole={userRole} allowedRole="admin" />}>
          <Route
            path="/admin"
            element={
              <DashboardLayoutAdmin
                sideBarCollapsed={sideBarCollapsed}
                setSideBarCollapsed={setSideBarCollapsed}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onLogout={handleLogout}
              />
            }
          >
            <Route path="admindashboard" element={<AdminDashboard />} />
            <Route path="kelola_data/data_penduduk" element={<Data_Penduduk />} />
            <Route path="kelola_data/data_penduduk/:id" element={<Detail_DataPenduduk />} />
            <Route path="kelola_data/data_penduduk/template" element={<Template_CSV />} />
            <Route path="kelola_data/edit/:id" element={<Edit_Penduduk />} />
            <Route path="kelola_data/datakk" element={<DataKK />} />
            <Route path="kelola_data/detailkk/:noKK" element={<DetailKK />} />
            <Route path="sirkulasi_penduduk/data_kelahiran" element={<Data_Kelahiran />} />
            <Route path="sirkulasi_penduduk/data_kelahiran/edit/:id" element={<Edit_Kelahiran />} />
            <Route path="sirkulasi_penduduk/data_kelahiran/:id" element={<Detail_Kelahiran />} />
            <Route path="sirkulasi_penduduk/data_kematian" element={<Data_Kematian />} />
            <Route path="sirkulasi_penduduk/data_kematian/edit_kematian/:id" element={<Edit_Kematian />} />
            <Route path="sirkulasi_penduduk/data_pendatang" element={<Data_Pendatang />} />
            <Route path="sirkulasi_penduduk/data_pendatang/edit/:id" element={<Edit_Pendatang />} />
            <Route path="sirkulasi_penduduk/data_pendatang/:id" element={<Detail_DataPendatang />} />
            <Route path="sirkulasi_penduduk/data_pindah" element={<Data_Pindah />} />
            <Route path="sirkulasi_penduduk/data_pindah/edit_pindah/:id" element={<Edit_Pindah />} />
            <Route path="permintaan_acc/penduduk_update" element={<Penduduk_Update />} />
            <Route path="permintaan_acc/pindah_update" element={<Pindah_Update />} />
            <Route path="permintaan_acc/kematian_update" element={<Kematian_Update />} />
            <Route path="permintaan_acc/kelahiran_update" element={<Kelahiran_Update />} />
            <Route path="permintaan_acc/pendatang_update" element={<Pendatang_Update />} />
            <Route path="dataakun/data_akun" element={<Data_Akun />} />
            <Route path="kelola_laporan/kelola_laporan" element={<Kelola_Laporan />} />
            <Route path="dataakun/edit_akun/:id" element={<Edit_Akun />} />
          </Route>
        </Route>

        {/* RT */}
        <Route element={<ProtectedRoute userRole={userRole} allowedRole="rt" />}>
          <Route
            path="/rt"
            element={
              <DashboardLayout
                sideBarCollapsed={sideBarCollapsed}
                setSideBarCollapsed={setSideBarCollapsed}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onLogout={handleLogout}
              />
            }
          >
            <Route path="dashboard" element={<RtDashboard />} />
            <Route path="keloladata/datapenduduk" element={<DataPenduduk />} />
            <Route path="keloladata/datapenduduk/template" element={<TemplateCSV />} />
            <Route path="keloladata/datakartukeluarga" element={<DataKartuKeluarga />} />
            <Route path="keloladata/datapenduduk/:id" element={<DetailDataPenduduk />} />
            <Route path="keloladata/datapenduduk/edit/:id" element={<EditPenduduk />} />
            <Route path="keloladata/detailanggotakk/:noKK" element={<DetailAnggotaKK />} />
            <Route path="sirkulasipenduduk/datakelahiran" element={<DataKelahiran />} />
            <Route path="sirkulasipenduduk/datakelahiran/edit/:id" element={<EditKelahiran />} />
            <Route path="sirkulasipenduduk/datakelahiran/:id" element={<DetailDataKelahiran />} />
            <Route path="sirkulasipenduduk/datakematian" element={<DataKematian />} />
            <Route path="sirkulasipenduduk/datakematian/editkematian/:id" element={<EditKematian />} />
            <Route path="sirkulasipenduduk/datapendatang" element={<DataPendatang />} />
            <Route path="sirkulasipenduduk/datapendatang/edit/:id" element={<EditPendatang />} />
            <Route path="sirkulasipenduduk/datapendatang/:id" element={<DetailDataPendatang />} />
            <Route path="sirkulasipenduduk/datapindah" element={<DataPindah />} />
            <Route path="sirkulasipenduduk/datapindah/editpindah/:id" element={<EditPindah />} />
            <Route path="sirkulasipenduduk/datapindah/:id" element={<DetailPindah />} />
            <Route path="kelolalaporan/kelolalaporan" element={<KelolaLaporan />} />
            <Route path="akun/dataakun" element={<DataAkun />} />
            <Route path="akun/editakun/:id" element={<EditAkun />} />
          </Route>
        </Route>

        {/* RW */}
        <Route element={<ProtectedRoute userRole={userRole} allowedRole="rw" />}>
          <Route
            path="/rw"
            element={
              <DashboardLayoutRw
                sideBarCollapsed={sideBarCollapsed}
                setSideBarCollapsed={setSideBarCollapsed}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onLogout={handleLogout}
              />
            }
          >
            <Route path="rwdashboard" element={<RwDashboard />} />
            <Route path="rwkeloladata/datapenduduk" element={<RwKelolaData />} />
            <Route path="rwkeloladata/detailperrt/:rt" element={<DetailPerRT />} />
            <Route path="rwkeloladata/detaildatapendudukrt/:id" element={<DetailDataPendudukRT />} />
            <Route path="rwkeloladata/datakkperrt" element={<DataKKPerRT />} />
            <Route path="rwkeloladata/detailkkperrt/:rt" element={<DetailKKPerRT />} />
            <Route path="rwkeloladata/anggotakkperrt/:noKK" element={<AnggotaKKPerRT />} />
            <Route path="rwkeloladata/anggotakk" element={<AnggotaKK />} />
            <Route path="rwsirkulasipenduduk/datakelahiranrt" element={<DataKelahiranRT />} />
            <Route path="rwkeloladata/detailkkperrt/:rt" element={<DetailKKPerRT />} />
            <Route path="rwsirkulasipenduduk/detailkelahiranperrt/:rt" element={<DetailKelahiranPerRT />} />
            <Route path="rwsirkulasipenduduk/detaildata/:id" element={<DetailData />} />
            <Route path="rwsirkulasipenduduk/datakematianrt" element={<DataKematianRT />} />
            <Route path="rwsirkulasipenduduk/detailkematianperrt/:rt" element={<DetailKematianPerRT />} />
            <Route path="rwsirkulasipenduduk/datapendatangrt" element={<DataPendatangRT />} />
            <Route path="rwsirkulasipenduduk/detailpendatangperrt/:rt" element={<DetailPendatangPerRT />} />
            <Route path="rwsirkulasipenduduk/detaildatapendatangrt/:id" element={<DetailDataPendatangRT />} />
            <Route path="rwsirkulasipenduduk/datapindahrt" element={<DataPindahRT />} />
            <Route path="rwsirkulasipenduduk/detailpindahperrt/:rt" element={<DetailPindahPerRT />} />
            <Route path="rwsirkulasipenduduk/detaildatapindah/:id" element={<DetailDataPindah />} />
            <Route path="rwkelolalaporan/laporan" element={<Laporan />} />
            <Route path="rwakun/dataakun" element={<RWAkun />} />
            <Route path="rwakun/rweditakun/:id" element={<RWEditAkun />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
