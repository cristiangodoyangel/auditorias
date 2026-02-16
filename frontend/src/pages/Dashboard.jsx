import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const COLORS = ["#FF007F", "#1F2937", "#6B7280", "#D1D5DB"];

// Mock Data for Design Persistence
const MOCK_DATA = {
  periodo: {
    nombre: "Periodo 2026-I",
    monto_asignado: 150000000,
    fecha_inicio: "2026-01-01",
    fecha_fin: "2026-06-30",
  },
  kpis: {
    total_proyectos: 12,
    presupuesto_total: 120000000,
    total_pagado: 45000000,
    total_rendido_aprobado: 38000000,
    porcentaje_ejecucion_fin: 37.5,
  },
  alertas: {
    rendiciones_observadas: 2,
    rendiciones_pendientes: 4,
    proyectos_atrasados: 1,
  },
  charts: {
    rendiciones: [
      { name: "Aprobado", value: 38000000 },
      { name: "Observado", value: 5000000 },
      { name: "Pendiente", value: 12000000 },
      { name: "Por Rendir", value: 65000000 },
    ],
    tendencia: [
      // New mock data chart
      { name: "Ene", gasto: 4000000 },
      { name: "Feb", gasto: 8500000 },
      { name: "Mar", gasto: 12000000 },
      { name: "Abr", gasto: 9800000 },
      { name: "May", gasto: 15000000 },
    ],
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(MOCK_DATA); // Init with mock data
  const [loading, setLoading] = useState(true);

  // Simulate Load with Fade-in
  useEffect(() => {
    // You can keep apiFetch here, but fallback to mock on error
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading)
    return (
      <div className="flex h-[80vh] items-center justify-center bg-base-100">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="text-gray-500 text-sm tracking-widest uppercase animate-pulse">
            Cargando CoreFlow...
          </span>
        </div>
      </div>
    );

  const { kpis, alertas, charts, periodo } = data;
  const formatMoney = (amount) =>
    "$" + Number(amount).toLocaleString("es-CL", { maximumFractionDigits: 0 });

  return (
    <div className="space-y-8 animate-fade-in bg-base-100 min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <img
            src={logo}
            alt="Logo"
            className="w-16 h-16 opacity-90 lg:hidden"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Panel de Control
            </h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              Sistema de Rendiciones Online
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="px-4 py-2 bg-base-200 border border-gray-700 rounded-sm text-gray-300 font-mono text-sm">
            {new Date().toLocaleDateString("es-CL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Hero Stats (Industrial Style - Thin Pink Border) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Presupuesto Total",
            value: formatMoney(kpis.presupuesto_total),
            icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "text-white",
          },
          {
            label: "Rendiciones Activas",
            value: kpis.total_proyectos,
            icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
            color: "text-primary",
          },

          {
            label: "Ejecutado (37%)",
            value: formatMoney(kpis.total_pagado),
            icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
            color: "text-accent",
          },
          {
            label: "Rendido Aprobado",
            value: formatMoney(kpis.total_rendido_aprobado),
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "text-success",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-base-200/50 p-6 rounded-sm border-[0.5px] border-primary/20 hover:border-primary/60 transition-all duration-300 group shadow-[0_0_10px_rgba(255,0,127,0.05)] hover:shadow-[0_0_15px_rgba(255,0,127,0.15)]"
          >
            <div className="flex justify-between items-start">
              <div className="overflow-hidden">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 truncate">
                  {stat.label}
                </p>
                <h3
                  className={`text-lg sm:text-xl xl:text-2xl font-bold ${stat.color} font-mono truncate`}
                  title={String(stat.value)}
                >
                  {stat.value}
                </h3>
              </div>
              <div
                className={`p-2 rounded-sm bg-base-300/50 group-hover:bg-primary/20 transition-colors`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 ${stat.color}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d={stat.icon}
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-200/40 border-[0.5px] border-primary/20 shadow-2xl rounded-sm">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold text-gray-200 mb-6 flex items-center">
                <span className="w-1 h-6 bg-primary mr-3"></span>
                Flujo de Rendiciones
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.tendencia}>
                    <defs>
                      <linearGradient
                        id="colorGasto"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#FF007F"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#FF007F"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#374151"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => `$${val / 1000000}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #FF007F",
                        borderRadius: "4px",
                      }}
                      itemStyle={{ color: "#FF007F" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gasto"
                      stroke="#FF007F"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorGasto)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Distribution Chart */}
            <div className="card bg-base-200/40 border-[0.5px] border-primary/20 shadow-xl rounded-sm p-4">
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                Estado de Presupuesto
              </h3>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.rendiciones}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {charts.rendiciones.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white">100%</span>
                    <p className="text-xs text-gray-500">Asignado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-base-200/40 border-[0.5px] border-primary/20 shadow-xl rounded-sm p-4 flex flex-col justify-center gap-3">
              <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Acciones Rápidas
              </h3>
              <button
                onClick={() => navigate("/proyectos")}
                className="btn btn-outline btn-primary btn-sm justify-start rounded-sm font-sans uppercase tracking-wide border-primary/50 hover:bg-primary/20 hover:border-primary"
              >
                + Nuevo Proyecto
              </button>
              <button className="btn btn-outline btn-secondary btn-sm justify-start rounded-sm font-sans text-gray-300 hover:text-white border-gray-700 hover:border-gray-500">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Cargar Rendición
              </button>
              <button className="btn btn-ghost btn-sm justify-start text-xs text-gray-500 hover:text-gray-300">
                Ver reportes avanzados →
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Alerts */}
        <div className="space-y-6">
          <div className="card bg-gray-900/50 border border-red-900/30 rounded-sm overflow-hidden">
            <div className="bg-red-900/20 p-4 border-b border-red-900/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
              <h2 className="text-red-400 font-bold uppercase text-sm tracking-wider">
                Centro de Alertas
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {alertas.rendiciones_observadas > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-900/10 border-l-2 border-red-500 rounded-r-sm">
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-gray-200 text-sm font-semibold">
                      {alertas.rendiciones_observadas} Rendiciones Observadas
                    </p>
                    <p className="text-xs text-gray-500">
                      Requiere corrección inmediata.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 bg-yellow-900/10 border-l-2 border-yellow-500 rounded-r-sm">
                <svg
                  className="w-5 h-5 text-yellow-500 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-gray-200 text-sm font-semibold">
                    {alertas.rendiciones_pendientes} En Revisión
                  </p>
                  <p className="text-xs text-gray-500">
                    Esperando aprobación del CPA.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Period Card */}
          <div className="card bg-base-300/30 border border-white/5 rounded-sm p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
              Periodo Vigente
            </h3>
            <p className="text-xl font-bold text-white mb-4">
              {periodo.nombre}
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progreso</span>
                  <span>{kpis.porcentaje_ejecucion_fin}%</span>
                </div>
                <progress
                  className="progress progress-primary w-full h-1"
                  value={kpis.porcentaje_ejecucion_fin}
                  max="100"
                ></progress>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-base-100 rounded border border-white/5">
                  <span className="block text-gray-500">Inicio</span>
                  <span className="text-gray-300">{periodo.fecha_inicio}</span>
                </div>
                <div className="p-2 bg-base-100 rounded border border-white/5">
                  <span className="block text-gray-500">Fin</span>
                  <span className="text-gray-300">{periodo.fecha_fin}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
