import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TablaGenerica from "../components/TablaGenerica";

function formatMonto(monto) {
  if (monto === undefined || monto === null || isNaN(monto)) return "$0";
  return "$" + Number(monto).toLocaleString("es-CL", { maximumFractionDigits: 0 });
}

function formatFechaCL(fecha) {
  if (!fecha || typeof fecha !== "string" || !fecha.includes("-")) return "";
  const parts = fecha.split("T")[0].split("-");
  if (parts.length !== 3) return fecha;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


const MOCK_PROYECTOS = [
  { id: 1, nombre: 'Mejoramiento Iluminación Central', objetivos: 'Cambio a luminarias LED en áreas comunes', fecha_inicio: '2026-03-01', fecha_fin: '2026-05-01', presupuesto_total: 15000000, estado: 'en_ejecucion' },
  { id: 2, nombre: 'Reparación Sala de Bombas', objetivos: 'Mantención correctiva urgente', fecha_inicio: '2026-02-15', fecha_fin: '2026-03-30', presupuesto_total: 8000000, estado: 'aprobado' },
  { id: 3, nombre: 'Habilitación Sala Multiuso', objetivos: 'Remodelación interior', fecha_inicio: '2026-04-01', fecha_fin: '2026-07-01', presupuesto_total: 25000000, estado: 'borrador' },
];

export default function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [rendiciones, setRendiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); // Reemplaza 'etapa'

  // Estado del Formulario Extendido (Paso 3)
  const [nuevoProyecto, setNuevoProyecto] = useState({
    nombre: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    presupuesto_total: "",
    // Nuevos campos Formulación
    objetivos: "",
    justificacion: "",
    beneficiarios_estimados: 0,
    // Nuevos campos Gobernanza
    quorum_asamblea: 0,
    firma_presidente: false,
    // Gestión de Documentos Upload First
    documentos_ids: []
  });

  // Estado para gestión de subidas
  const [uploading, setUploading] = useState(false);
  const [archivosSubidos, setArchivosSubidos] = useState({
    acta: null, // { id: 1, nombre: 'acta.pdf' }
    cotizaciones: [], // [{ id: 2, nombre: 'cot.pdf' }]
    elegido: null
  });

  const [comunidadId, setComunidadId] = useState(null);
  const [periodoVigente, setPeriodoVigente] = useState(null);
  const [showNoPeriodoModal, setShowNoPeriodoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const navigate = useNavigate();

  // --- Helpers de Upload ---
  const uploadFile = async (file, tipo) => {
    const token = localStorage.getItem("access");
    if (!token) return null;

    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("nombre", file.name); // Nombre original
    formData.append("tipo", tipo);        // 'Acta', 'Cotizaciones', etc.
    formData.append("proyecto", "");      // Se vinculará después

    try {
      setUploading(true);
      const res = await fetch("http://localhost:8000/api/documentos/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // No content-type (boundary)
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data; // { id: ..., nombre: ... }
      } else {
        const err = await res.text();
        alert("Error al subir archivo: " + err);
        return null;
      }
    } catch (e) {
      alert("Error de red al subir: " + e.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;

    const doc = await uploadFile(file, tipo);
    if (doc) {
      if (tipo === 'Acta') {
        setArchivosSubidos(prev => ({ ...prev, acta: doc }));
        setNuevoProyecto(prev => ({ ...prev, documentos_ids: [...prev.documentos_ids, doc.id] }));
      } else if (tipo === 'Cotizaciones') {
        setArchivosSubidos(prev => ({ ...prev, cotizaciones: [...prev.cotizaciones, doc] }));
        setNuevoProyecto(prev => ({ ...prev, documentos_ids: [...prev.documentos_ids, doc.id] }));
      } else if (tipo === 'Cotizacion Elegida') {
        setArchivosSubidos(prev => ({ ...prev, elegido: doc }));
        setNuevoProyecto(prev => ({ ...prev, documentos_ids: [...prev.documentos_ids, doc.id] }));
      }
    }
  };

  // --- Fetch Data ---
  const fetchProyectos = useCallback(async () => {
    const token = localStorage.getItem("access");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/proyectos/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = [];
      if (res.ok) {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch { data = []; }
        setProyectos(Array.isArray(data) ? data : data.results || []);
      } else {
         console.warn("Using Mock Data for Proyectos due to API Error");
         setProyectos(MOCK_PROYECTOS);
      }
    } catch (err) {
      console.warn("Using Mock Data for Proyectos due to Network Error");
      setProyectos(MOCK_PROYECTOS);
    }
    setLoading(false);
  }, []);

  const fetchRendiciones = useCallback(async () => {
    const token = localStorage.getItem("access");
    try {
      const res = await fetch("http://localhost:8000/api/rendiciones/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        let data = await res.json();
        setRendiciones(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      setRendiciones([]);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access");
    async function fetchComunidadAndPeriodo() {
      // 1. Obtener Comunidad
      let comId = null;
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user?.comunidad?.id) comId = user.comunidad.id;
      } catch { }

      if (!comId) {
        try {
          const res = await fetch("http://localhost:8000/api/auth/profile/", { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            comId = data.comunidad_id || data.comunidad;
          }
        } catch { }
      }
      setComunidadId(comId);

      // 2. Obtener Periodo
      if (comId) {
        try {
          const res = await fetch("http://localhost:8000/api/periodos/periodos/", { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            const periodos = Array.isArray(data) ? data : data.results || [];
            const hoy = new Date().toISOString().slice(0, 10);
            const p = periodos.find(x => String(x.comunidad) === String(comId) && x.fecha_inicio <= hoy && x.fecha_fin >= hoy);
            if (p) setPeriodoVigente(p);
            else setShowNoPeriodoModal(true);
          }
        } catch { }
      }
    }

    fetchComunidadAndPeriodo();
    fetchProyectos();
    fetchRendiciones();
  }, [fetchProyectos, fetchRendiciones]);


  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const token = localStorage.getItem("access");

    if (!comunidadId || !periodoVigente) {
      alert("Falta información de unidad operativa o periodo.");
      setFormLoading(false);
      return;
    }

    // Validacion de Acta
    if (!archivosSubidos.acta) {
      alert("El Acta de Asamblea es obligatoria para la formulación.");
      setFormLoading(false);
      return;
    }
    // Validacion Quorum
    if (nuevoProyecto.quorum_asamblea <= 0) {
      alert("El quórum de la asamblea debe ser mayor a 0.");
      setFormLoading(false);
      return;
    }

    const payload = {
      ...nuevoProyecto,
      comunidad: comunidadId,
      periodo: periodoVigente.id,
      estado: 'borrador' // Siempre nace como borrador
    };

    try {
      const res = await fetch("http://localhost:8000/api/proyectos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        fetchProyectos();
        // Reset form
        setNuevoProyecto({
          nombre: "", descripcion: "", fecha_inicio: "", fecha_fin: "", presupuesto_total: "",
          objetivos: "", justificacion: "", beneficiarios_estimados: 0,
          quorum_asamblea: 0, firma_presidente: false, documentos_ids: []
        });
        setArchivosSubidos({ acta: null, cotizaciones: [], elegido: null });
        setArchivosSubidos({ acta: null, cotizaciones: [], elegido: null });
        setShowSuccessModal(true);
      } else {
        const text = await res.text();
        alert("Error al crear: " + text);
      }
    } catch (err) {
      alert("Error de red: " + err.message);
    }
    setFormLoading(false);
  };

  const columns = [
    { key: "nombre", label: "Proyecto" },
    { key: "fechas", label: "Fechas" },
    { key: "presupuesto", label: "Presupuesto" },
    { key: "rendido", label: "Rendido" },
    { key: "estado_rendicion", label: "Estado" },
  ];

  const dataParaTabla = proyectos.map((p) => {
    const presupuesto = parseFloat(p.presupuesto_total) || 0;
    const rends = rendiciones.filter(r => r.proyecto === p.id);
    const montoRendido = rends.reduce((acc, r) => acc + (parseFloat(r.monto_rendido) || 0), 0);
    const porcentaje = presupuesto > 0 ? Math.round((montoRendido / presupuesto) * 100) : 0;

    return {
      nombre: (
        <div>
          <div className="font-bold text-primary cursor-pointer hover:underline" onClick={() => navigate(`/proyectos/${p.id}`)}>
            {p.nombre}
          </div>
          <div className="text-xs text-gray-500 truncate max-w-xs">{p.objetivos}</div>
        </div>
      ),
      fechas: (
        <div className="text-xs">
          {formatFechaCL(p.fecha_inicio)} <br /> {formatFechaCL(p.fecha_fin)}
        </div>
      ),
      presupuesto: <div className="font-medium">{formatMonto(presupuesto)}</div>,
      rendido: (
        <div>
          <div className="font-medium">{formatMonto(montoRendido)}</div>
          <progress className="progress progress-primary w-20 h-1.5" value={montoRendido} max={presupuesto}></progress>
          <span className="text-[10px] ml-1">{porcentaje}%</span>
        </div>
      ),
      estado_rendicion: (
        <div className={`badge ${p.estado === 'aprobado' ? 'badge-success' : 'badge-ghost'} badge-sm`}>
          {p.estado}
        </div>
      ),
      documentos: (
        <div className="flex gap-1">
          {p.acta_url && <a href={p.acta_url} target="_blank" className="btn btn-xs btn-outline btn-primary" title="Acta">A</a>}
          {p.cotizaciones_urls && p.cotizaciones_urls.length > 0 && <span className="badge badge-xs badge-info">{p.cotizaciones_urls.length} C</span>}
        </div>
      )
    };
  });

  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const isITO = user.rol === 'ito';

  return (
    <div className="space-y-6">

      {/* Modal No Periodo */}
      <dialog className={`modal ${showNoPeriodoModal ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error">Atención</h3>
          <p className="py-4">No hay periodo activo. Debe crear uno.</p>
          <div className="modal-action">
            <button className="btn btn-primary" onClick={() => navigate("/crear-periodo")}>Ir a Crear Periodo</button>
          </div>
        </div>
      </dialog>

      {/* Modal Exito */}
      <dialog className={`modal ${showSuccessModal ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg text-success">¡Éxito!</h3>
          <p className="py-4">El proyecto ha sido formulado exitosamente.</p>
          <div className="modal-action">
            <button className="btn btn-primary" onClick={() => setShowSuccessModal(false)}>Aceptar</button>
          </div>
        </div>
      </dialog>

      <div className="flex justify-between items-center p-4 glass-header rounded-box border border-base-content/20">
        <div>
          <h2 className="text-2xl font-bold text-primary">Formulación de Proyectos</h2>
          <p className="text-sm opacity-70">Pre-inversión y aprobación</p>
        </div>
        {!isITO && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Nuevo Proyecto"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <form onSubmit={handleCrearProyecto} className="card-body gap-6">
            <h3 className="text-xl font-bold">Ficha de Formulación</h3>

            {/* SECCIÓN 1: DATOS BÁSICOS */}
            <div className="collapse collapse-open border border-base-300 bg-base-100 rounded-box">
              <div className="collapse-title text-lg font-medium bg-base-200">1. Identificación del Proyecto</div>
              <div className="collapse-content pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">Nombre Corto</label>
                  <input type="text" className="input input-bordered" required
                    value={nuevoProyecto.nombre}
                    onChange={e => setNuevoProyecto({ ...nuevoProyecto, nombre: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label">Presupuesto ($)</label>
                  <input type="number" className="input input-bordered" required
                    value={nuevoProyecto.presupuesto_total}
                    onChange={e => setNuevoProyecto({ ...nuevoProyecto, presupuesto_total: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label">Fecha Inicio</label>
                  <input type="date" className="input input-bordered" required
                    value={nuevoProyecto.fecha_inicio}
                    onChange={e => setNuevoProyecto({ ...nuevoProyecto, fecha_inicio: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label">Fecha Fin (Estimada)</label>
                  <input type="date" className="input input-bordered" required
                    value={nuevoProyecto.fecha_fin}
                    onChange={e => setNuevoProyecto({ ...nuevoProyecto, fecha_fin: e.target.value })} />
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label">Descripción General</label>
                  <textarea className="textarea textarea-bordered h-20" required
                    placeholder="Resumen corto del proyecto..."
                    value={nuevoProyecto.descripcion}
                    onChange={e => setNuevoProyecto({ ...nuevoProyecto, descripcion: e.target.value })}></textarea>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: FORMULACIÓN CUALITATIVA */}
            <div className="collapse collapse-open border border-base-300 bg-base-100 rounded-box">
              <div className="collapse-title text-lg font-medium bg-base-200">2. Detalles Cualitativos</div>
              <div className="collapse-content pt-4 space-y-4">
                <div className="form-control">
                  <label className="label">Objetivos del Proyecto</label>
                  <textarea className="textarea textarea-bordered h-24" placeholder="¿Qué se quiere lograr?"
                    value={nuevoProyecto.objetivos}
                    onChange={e => setNuevoProyecto({ ...nuevoProyecto, objetivos: e.target.value })}></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">Justificación</label>
                    <textarea className="textarea textarea-bordered" placeholder="¿Por qué es necesario?"
                      value={nuevoProyecto.justificacion}
                      onChange={e => setNuevoProyecto({ ...nuevoProyecto, justificacion: e.target.value })}></textarea>
                  </div>
                  <div className="form-control">
                    <label className="label">Beneficiarios Estimados (#)</label>
                    <input type="number" className="input input-bordered" min="0"
                      value={nuevoProyecto.beneficiarios_estimados}
                      onChange={e => setNuevoProyecto({ ...nuevoProyecto, beneficiarios_estimados: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: GOBERNANZA Y ARCHIVOS */}
            <div className="collapse collapse-open border border-base-300 bg-base-100 rounded-box">
              <div className="collapse-title text-lg font-medium bg-base-200">3. Gobernanza y Respaldo</div>
              <div className="collapse-content pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ASAMBLEA */}
                <div className="space-y-4">
                  <h4 className="font-bold border-b pb-1">Validación Asamblea</h4>
                  <div className="form-control">
                    <label className="label">Quórum (# Asistentes)</label>
                    <input type="number" className="input input-bordered" required min="1"
                      value={nuevoProyecto.quorum_asamblea}
                      onChange={e => setNuevoProyecto({ ...nuevoProyecto, quorum_asamblea: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Acta Escaneada (Obligatorio)</span>
                      {archivosSubidos.acta && <span className="badge badge-success badge-sm ml-2">Subido</span>}
                    </label>
                    <input type="file" className="file-input file-input-bordered w-full" accept=".pdf,.jpg,.png"
                      onChange={(e) => handleFileChange(e, 'Acta')} />
                  </div>
                </div>

                {/* COTIZACIONES */}
                <div className="space-y-4">
                  <h4 className="font-bold border-b pb-1">Selección Proveedor</h4>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Cotizaciones (Opcional)</span>
                      <span className="badge badge-ghost ml-2">{archivosSubidos.cotizaciones.length} docs</span>
                    </label>
                    <input type="file" className="file-input file-input-bordered file-input-sm w-full" multiple
                      onChange={(e) => handleFileChange(e, 'Cotizaciones')} />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Cotización Elegida</span>
                      {archivosSubidos.elegido && <span className="badge badge-success badge-sm ml-2">Subido</span>}
                    </label>
                    <input type="file" className="file-input file-input-bordered file-input-sm w-full"
                      onChange={(e) => handleFileChange(e, 'Cotizacion Elegida')} />
                  </div>
                </div>

              </div>
            </div>

            {/* SECCIÓN 4: FIRMA */}
            <div className="alert alert-primary-100 shadow-lg">
              <div>
                <h3 className="font-bold">Formalización</h3>
                <div className="text-xs">Al marcar esta casilla, el Presidente de la Unidad Operativa firma digitalmente este proyecto.</div>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer gap-2">
                  <span className="label-text font-bold">Firma Presidente</span>
                  <input type="checkbox" className="checkbox checkbox-lg checkbox-primary"
                    checked={nuevoProyecto.firma_presidente}
                    onChange={e => setNuevoProyecto({ ...nuevoProyecto, firma_presidente: e.target.checked })} />
                </label>
              </div>
            </div>

            <div className="card-actions justify-end mt-4">
              <button type="submit" className="btn btn-primary btn-lg" disabled={formLoading || uploading}>
                {formLoading ? "Guardando..." : "Crear Proyecto"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLA */}
      <div className="bg-base-100 rounded-box shadow p-4">
        <TablaGenerica columns={columns} data={dataParaTabla} />
      </div>

    </div>
  );
}