// src/components/StatsGrid.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Users,
  FileText,
  User,
  UserCheck,
  PlusCircle,
  MinusCircle,
  Move,
  UserPlus,
} from "lucide-react";
import supabase from "../../../supabaseClient";

const colorClasses = {
  blue: "bg-blue-500 text-white",
  green: "bg-green-500 text-white",
  yellow: "bg-yellow-400 text-slate-800",
  red: "bg-red-500 text-white",
};

function computeDelta(current = 0, previous = null) {
  if (previous === null) return { percent: null, direction: "none" };
  if (previous === 0) return { percent: 100, direction: "up" };
  const diff = current - previous;
  const percent = Math.round((diff / previous) * 1000) / 10;
  const direction = percent > 0 ? "up" : percent < 0 ? "down" : "none";
  return { percent: Math.abs(percent), direction };
}

function StatsGrid() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { key: "penduduk", title: "Penduduk", value: 0, color: "blue", icon: Users, delta: { percent: null, direction: "none" } },
    { key: "kk", title: "Kartu Keluarga", value: 0, color: "green", icon: FileText, delta: { percent: null, direction: "none" } },
    { key: "perempuan", title: "Perempuan", value: 0, color: "yellow", icon: User, delta: { percent: null, direction: "none" } },
    { key: "laki", title: "Laki-Laki", value: 0, color: "red", icon: UserCheck, delta: { percent: null, direction: "none" } },
    { key: "lahir", title: "Lahir", value: 0, color: "blue", icon: PlusCircle, delta: { percent: null, direction: "none" } },
    { key: "meninggal", title: "Meninggal", value: 0, color: "green", icon: MinusCircle, delta: { percent: null, direction: "none" } },
    { key: "pindah", title: "Pindah", value: 0, color: "yellow", icon: Move, delta: { percent: null, direction: "none" } },
    { key: "pendatang", title: "Pendatang", value: 0, color: "red", icon: UserPlus, delta: { percent: null, direction: "none" } },
  ]);

  const routeMap = {
    penduduk: "/rt/keloladata/datapenduduk",
    kk: "/rt/keloladata/datakartukeluarga",
    perempuan: "/rt/keloladata/datapenduduk",
    laki: "/rt/keloladata/datapenduduk",
    lahir: "/rt/sirkulasipenduduk/datakelahiran",
    meninggal: "/rt/sirkulasipenduduk/datakematian",
    pindah: "/rt/sirkulasipenduduk/datapindah",
    pendatang: "/rt/sirkulasipenduduk/datapendatang",
  };

  const readLocalUser = () => {
    const userId = localStorage.getItem("userId");
    const rawRt = localStorage.getItem("userRt");
    const rawRw = localStorage.getItem("userRw");
    return { userId, rawRt, rawRw };
  };

  useEffect(() => {
    let mounted = true;
    const realtimeHandles = [];

    const fetchStats = async () => {
      try {
        const { userId, rawRt, rawRw } = readLocalUser();
        if (!userId) return;

        const rtCandidates = [rawRt?.trim(), rawRt?.trim().padStart(2, "0")].filter(Boolean);
        const rwCandidates = [rawRw?.trim(), rawRw?.trim().padStart(2, "0")].filter(Boolean);

        for (const rtVal of rtCandidates) {
          for (const rwVal of rwCandidates) {
            try {
              // Ambil data penduduk
              const pendudukRes = await supabase
                .from("data_penduduk")
                .select("nik, no_kk, jk", { count: "exact" })
                .eq("rt", rtVal)
                .eq("rw", rwVal);
              if (pendudukRes.error) continue;

              const kkRows = pendudukRes.data ?? [];

              // HITUNG KK UNIK
              const uniqueKKs = new Set(
                kkRows.map(r => r.no_kk?.trim()).filter(Boolean)
              );
              const totalKK = uniqueKKs.size;

              // HITUNG L / P
              let perempuan = 0, laki = 0;
              kkRows.forEach(r => {
                const jk = (r.jk || "").toLowerCase();
                if (jk.startsWith("p")) perempuan++;
                else if (jk.startsWith("l")) laki++;
              });

              // Ambil data sirkulasi
              const [kelahiranRes, kematianRes, pindahRes, pendatangRes] = await Promise.all([
                supabase.from("data_kelahiran").select("id_kelahiran", { count: "exact" }).eq("rt", rtVal).eq("rw", rwVal),
                supabase.from("data_kematian").select("id", { count: "exact" }).eq("rt", rtVal).eq("rw", rwVal),
                supabase.from("data_pindah").select("id", { count: "exact" }).eq("rt", rtVal).eq("rw", rwVal),
                supabase.from("data_pendatang").select("id", { count: "exact" }).eq("rt", rtVal).eq("rw", rwVal),
              ]);

              const newValuesMap = {
                penduduk: pendudukRes.count ?? 0,
                kk: totalKK,
                perempuan,
                laki,
                lahir: kelahiranRes.count ?? 0,
                meninggal: kematianRes.count ?? 0,
                pindah: pindahRes.count ?? 0,
                pendatang: pendatangRes.count ?? 0,
              };

              const prevStatsRaw = localStorage.getItem(`statsData_${userId}`);
              const prevStats = prevStatsRaw ? JSON.parse(prevStatsRaw) : stats;

              const newStats = Object.keys(newValuesMap).map(k => {
                const cur = newValuesMap[k];
                const prevEntry = prevStats.find(p => p.key === k) || {};
                const delta = computeDelta(cur, Number(prevEntry.value ?? 0));
                const template = stats.find(s => s.key === k) || {};
                return {
                  key: k,
                  title: template.title || k,
                  value: cur,
                  color: template.color || "blue",
                  icon: template.icon || Users,
                  delta,
                };
              });

              if (mounted) {
                setStats(newStats);
                localStorage.setItem(`statsData_${userId}`, JSON.stringify(newStats));
              }
              return true;
            } catch { }
          }
        }
      } catch (err) {
        console.error("Gagal fetch stats:", err);
      }
    };

    fetchStats();

    // Realtime subscriptions
    const tables = ["data_penduduk", "data_kelahiran", "data_kematian", "data_pindah", "data_pendatang"];
    if (supabase.channel) {
      tables.forEach(t => {
        const ch = supabase.channel(`realtime_stats_${t}`)
          .on("postgres_changes", { event: "*", schema: "public", table: t }, () => {
            fetchStats();
          }).subscribe();
        realtimeHandles.push(ch);
      });
    }

    const onStorage = e => {
      if (["userId", "userRt", "userRw"].includes(e.key)) fetchStats();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      realtimeHandles.forEach(h => supabase.removeChannel?.(h));
    };
  }, []);

  const handleSelengkapnya = key => {
    const path = routeMap[key];
    if (path) navigate(path);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map(item => {
        const Icon = item.icon;
        const delta = item.delta || { percent: null, direction: "none" };
        return (
          <div key={item.key} className={`${colorClasses[item.color]} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">{item.title}</p>
                <p className="text-3xl font-bold mb-2">{item.value}</p>
                <div className="text-xs font-medium">
                  {delta.percent === null ? (
                    <span className="opacity-80">—</span>
                  ) : delta.direction === "up" ? (
                    <span className="inline-flex items-center space-x-1">
                      <span className="text-green-900">▲</span>
                      <span>{delta.percent}%</span>
                      <span className="ml-2 opacity-80">dari terakhir</span>
                    </span>
                  ) : delta.direction === "down" ? (
                    <span className="inline-flex items-center space-x-1">
                      <span className="text-red-900">▼</span>
                      <span>{delta.percent}%</span>
                      <span className="ml-2 opacity-80">dari terakhir</span>
                    </span>
                  ) : (
                    <span className="opacity-80">0% dari terakhir</span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl group-hover:scale-110 transition-all duration-200 flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <hr className="border-t border-white/40 mb-3" />
            <button onClick={() => handleSelengkapnya(item.key)} className="flex items-center justify-center space-x-2 text-sm font-semibold mx-auto mt-auto cursor-pointer">
              <span>Selengkapnya</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default StatsGrid;
