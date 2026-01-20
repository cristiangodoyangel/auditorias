import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { useNavigate } from 'react-router-dom';

const COLORS = ['#6F574E', '#8a7871ff', '#ccb7afff', '#9CA3AF']; // Primary, Black, Secondary, Gray

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await apiFetch('/dashboard/kpis/');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Error fetching dashboard", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-10 text-center"><span className="loading loading-lg loading-spinner text-primary"></span></div>;
  if (!data) return <div className="p-10 text-center">No se pudieron cargar los datos.</div>;

  const { kpis, alertas, charts, periodo } = data;

  // Helpers requested by user snippet
  const periodoActual = periodo;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isITO = user.is_ito || user.rol === 'ito' || user.role === 'ito'; // Adjust based on actual user object structure

  const formatMonto = (amount) => '$' + Number(amount).toLocaleString('es-CL', { maximumFractionDigits: 0 });
  const formatMoney = formatMonto; // Alias since other components use formatMoney
  const formatFechaCL = (dateString) => {
    if (!dateString) return '...';
    const date = new Date(dateString + 'T00:00:00'); // Ensure local time interpretation if it's YYYY-MM-DD
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };


  return (
    <div className="space-y-8 animate-fade-in">

      {/* 1. Header & Welcome */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-primary">Panel de Control</h1>
          <p className="text-base-content/70">Visión general del estado de la comunidad.</p>
        </div>
        <div className="text-right">
          <div className="badge badge-primary badge-outline text-lg p-3">{new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* 2. Periodo Actual (User Snippet) */}
      {periodoActual ? (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-box bg-base-200 shadow-sm border-l-4 border-primary">
          {/* Left Side: Period Name */}
          <div className="stat text-center md:text-left p-0 place-items-center md:place-items-start">
            <div className="stat-title text-lg font-bold">
              {periodoActual.nombre} (Actual)
            </div>
          </div>

          {/* Right Side: Amount and Dates */}
          <div className="stat text-center md:text-right p-0 place-items-center md:place-items-end">
            <div className="stat-value text-primary text-3xl my-1">
              {formatMonto(periodoActual.monto_asignado)}
            </div>
            <div className="stat-desc text-sm">{`Del ${formatFechaCL(
              periodoActual.fecha_inicio
            )} al ${formatFechaCL(periodoActual.fecha_fin)}`}</div>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning text-white">No hay un periodo activo configurado.</div>
      )}

      {/* 2. KPI Cards Main */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="stats shadow bg-base-100 border-l-4 border-primary">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div className="stat-title text-lg text-primary">Proyectos</div>
            <div className="stat-value text-primary text-2xl">{kpis.total_proyectos}</div>

          </div>
        </div>

        <div className="stats shadow bg-base-100 border-l-4 border-secondary">
          <div className="stat">
            <div className="stat-title text-lg text-secondary">Presupuesto Total</div>
            <div className="stat-value text-secondary text-2xl">{formatMoney(kpis.presupuesto_total)}</div>
            <div className="stat-desc">Asignado a proyectos</div>
          </div>
        </div>

        <div className="stats shadow bg-base-100 border-l-4 border-accent">
          <div className="stat">
            <div className="stat-title text-lg text-primary">Montos Pagados</div>
            <div className="stat-value text-accent text-2xl">{formatMoney(kpis.total_pagado)}</div>
            <div className="stat-desc">{kpis.porcentaje_ejecucion_fin.toFixed(1)}% ejecutado</div>
          </div>
        </div>

        <div className="stats shadow bg-base-100 border-l-4 border-success">
          <div className="stat">
            <div className="stat-title text-lg text-success">Rendido Aprobado</div>
            <div className="stat-value text-success text-2xl">{formatMoney(kpis.total_rendido_aprobado)}</div>
            <div className="stat-desc">Justificado correctamente</div>
          </div>
        </div>

      </div>

      {/* 3. Charts & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Chart: Estado Proyectos */}
        <div className="card bg-base-100 shadow-xl lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Estado de Rendiciones</h2>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.rendiciones.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {charts.rendiciones.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Si quisieramos el grafico de barras comparativo, podria ir aqui al lado o abajo */}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Alertas
            </h2>
            <div className="divider my-0"></div>
            <ul className="space-y-4">
              {alertas.rendiciones_observadas > 0 && (
                <li className="alert alert-primary shadow-sm">
                  <span>Hay <strong className="text-error font-bold text-lg">{alertas.rendiciones_observadas}</strong> rendiciones con observaciones pendientes de corregir.</span>
                </li>
              )}
              {alertas.rendiciones_pendientes > 0 && (
                <li className="alert alert-secondary shadow-sm">
                  <span>Hay <strong className="text-error font-bold text-lg">{alertas.rendiciones_pendientes}</strong> rendiciones esperando revisión del CPA.</span>
                </li>
              )}
              {alertas.proyectos_atrasados > 0 && (
                <li className="alert alert-error shadow-sm">
                  <span><strong>{alertas.proyectos_atrasados}</strong> proyectos han excedido su fecha de término.</span>
                </li>
              )}
              {alertas.rendiciones_observadas === 0 && alertas.rendiciones_pendientes === 0 && alertas.proyectos_atrasados === 0 && (
                <li className="text-center text-gray-500 py-4">
                  ¡Todo al día! No hay alertas pendientes.
                </li>
              )}
            </ul>
            <div className="card-actions justify-end mt-4">
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/proyectos')}>Ver todo</button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}