import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TablaGenerica from '../components/TablaGenerica';
import { apiFetch } from '../utils/api';

function formatFechaCL(fecha) {
  if (!fecha || typeof fecha !== 'string' || !fecha.includes('-')) return '';
  const parts = fecha.split('T')[0].split('-');
  if (parts.length !== 3) return fecha;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function formatMonto(monto) {
  if (monto === undefined || monto === null || isNaN(monto)) return '$0';
  return '$' + Number(monto).toLocaleString('es-CL', { maximumFractionDigits: 0 });
}

export default function Rendiciones() {
  const [rendiciones, setRendiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    proyecto: '',
    documento: null,
    monto_rendido: '',
    numero_documento: '',
    descripcion: '',
    fecha_rendicion: '',
  });
  const [proyectos, setProyectos] = useState([]);
  const [comunidadId, setComunidadId] = useState(null);
  const [periodoVigente, setPeriodoVigente] = useState(null);
  const [showNoPeriodoModal, setShowNoPeriodoModal] = useState(false);
  const navigate = useNavigate();

  const fetchRendiciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/rendiciones/');
      const data = res.ok ? await res.json() : [];
      setRendiciones(Array.isArray(data) ? data : data.results || []);
    } catch {
      setRendiciones([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function fetchComunidad() {
      let comunidadFromToken = null;
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.comunidad && user.comunidad.id) {
          comunidadFromToken = user.comunidad.id;
        }
      } catch (err) { /* Silencio */ }

      try {
        const res = await apiFetch("/auth/profile/");

        if (res.ok) {
          const data = await res.json();
          let id = null;
          if (data.comunidad_id) id = data.comunidad_id;
          else if (data.comunidad) id = data.comunidad;
          else if (comunidadFromToken) id = comunidadFromToken;
          if (id) {
            setComunidadId(id);
            return id;
          }
        }
        if (comunidadFromToken) {
          setComunidadId(comunidadFromToken);
          return comunidadFromToken;
        }
        return null;
      } catch (err) {
        if (comunidadFromToken) {
          setComunidadId(comunidadFromToken);
          return comunidadFromToken;
        }
        return null;
      }
    }

    async function fetchPeriodoVigente(idComunidad) {
      if (!idComunidad) {
        setPeriodoVigente(null);
        return;
      }

      try {
        const res = await apiFetch("/periodos/periodos/");

        if (res.ok) {
          const data = await res.json();
          const listaPeriodos = Array.isArray(data) ? data : data.results || [];
          const hoy = new Date().toISOString().slice(0, 10);

          const vigente = listaPeriodos.find((p) => {
            const esDeMiComunidad = String(p.comunidad) === String(idComunidad);
            const fechaValida = p.fecha_inicio <= hoy && p.fecha_fin >= hoy;
            return esDeMiComunidad && fechaValida;
          });

          if (vigente) {
            setPeriodoVigente(vigente);
          } else {
            setPeriodoVigente(null);
            setShowNoPeriodoModal(true);
          }
        }
      } catch (err) {
        setPeriodoVigente(null);
      }
    }

    async function fetchProyectosData() {
      try {
        const res = await apiFetch('/proyectos/');
        const data = res.ok ? await res.json() : [];
        setProyectos(Array.isArray(data) ? data : data.results || []);
      } catch {
        setProyectos([]);
      }
    }

    async function cargarDatosIniciales() {
      const idComunidad = await fetchComunidad();
      await fetchPeriodoVigente(idComunidad);
      await fetchRendiciones();
      await fetchProyectosData();
    }

    cargarDatosIniciales();
  }, [fetchRendiciones]);

  const handleShowForm = () => {
    if (!periodoVigente) {
      setShowNoPeriodoModal(true);
    } else {
      setShowForm(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    if (!periodoVigente) {
      setShowNoPeriodoModal(true);
      setFormLoading(false);
      return;
    }

    const docForm = new FormData();
    docForm.append('archivo', form.documento);
    docForm.append('nombre', form.documento.name);
    docForm.append('tipo', 'rendicion');
    docForm.append('descripcion', form.descripcion);

    let docData;
    try {
      const docRes = await apiFetch('/documentos/', {
        method: 'POST',
        body: docForm
      });
      docData = await docRes.json();
      if (!docRes.ok) {
        throw new Error('Error al subir el documento: ' + JSON.stringify(docData));
      }
    } catch (err) {
      alert(err.message);
      setFormLoading(false);
      return;
    }

    const documentoId = docData.id;

    const rendicionPayload = {
      proyecto: form.proyecto,
      monto_rendido: form.monto_rendido,
      numero_documento: form.numero_documento,
      descripcion: form.descripcion,
      fecha_rendicion: form.fecha_rendicion,
      documentos_ids: [documentoId]
    };

    try {
      const res = await apiFetch('/rendiciones/', {
        method: 'POST',
        body: JSON.stringify(rendicionPayload)
      });

      const resText = await res.text();
      if (!res.ok) {
        try {
          const errJson = JSON.parse(resText);
          alert('Error al guardar la rendición: ' + JSON.stringify(errJson));
        } catch {
          alert('Error al guardar la rendición: ' + resText);
        }
        setFormLoading(false);
        return;
      }

      fetchRendiciones();
      setShowForm(false);
      setForm({ proyecto: '', documento: null, monto_rendido: '', descripcion: '', fecha_rendicion: '' });

    } catch (err) {
      alert(err.message);
    }
    setFormLoading(false);
  };

  // --- Estado para Modal Revisión ---
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [rendicionSeleccionada, setRendicionSeleccionada] = useState(null);
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [accionRevision, setAccionRevision] = useState(null); // 'observar' o 'aprobar'
  const [isCPA, setIsCPA] = useState(false); // Helper para visibilidad

  // Estado Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setIsCPA(u.rol === 'cpa' || u.rol === 'CPA Revisor' || u.rol === 'admin');
  }, []);

  const handleRevisar = async (rend, nuevoEstado, obs = '') => {
    // Si es "observar" y no viene obs, abrir modal
    if (nuevoEstado === 'observado' && !obs && !showRevisionModal) {
      setRendicionSeleccionada(rend);
      setAccionRevision('observado');
      setNuevaObservacion(rend.observacion || ''); // Cargar existente si hay
      setShowRevisionModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`http://localhost:8000/api/rendiciones/${rend.id}/revisar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          observacion: obs
        })
      });
      if (res.ok) {
        fetchRendiciones();
        setShowRevisionModal(false);
        setSuccessMessage(nuevoEstado === 'aprobado' ? 'Rendición aprobada correctamente.' : 'Observación enviada correctamente.');
        setShowSuccessModal(true);
      } else {
        alert('Error al actualizar estado');
      }
    } catch (e) { alert('Error de conexión'); }
  };

  const handleCorregir = (rend) => {
    // Cargar datos en el formulario para editar
    setForm({
      proyecto: rend.proyecto,
      documento: null, // No podemos "cargar" el archivo, usuario debe subir uno nuevo si quiere cambiarlo
      monto_rendido: rend.monto_rendido,
      descripcion: rend.descripcion,
      fecha_rendicion: rend.fecha_rendicion
    });
    // Nota: El backend de 'Corregir' idealmente sería un PUT al rendicion
    // Por simplicidad en este paso, asumimos que "Corregir" es CREAR UNA NUEVA o usar un PUT si existiera.
    // Dado que el requerimiento pide "Corregir", lo más limpio es editar.
    // PERO RendicionViewSet tiene update. Usaremos un flag 'editMode' en el form.
    alert("Funcionalidad de Edición completa pendiente. Por ahora debes crear una nueva rendición corregida.");
  };

  const columns = [
    { key: 'proyecto', label: 'Proyecto' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'n_doc', label: 'N° Doc' },
    { key: 'monto', label: 'Monto' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'estado', label: 'Estado' },
    { key: 'documento', label: 'Documento' },
    { key: 'acciones', label: 'Acciones' },
  ];

  const dataParaTabla = rendiciones.map(r => ({
    proyecto: r.proyecto_nombre || '...',
    descripcion: r.descripcion,
    n_doc: r.numero_documento || '-',
    monto: formatMonto(r.monto_rendido),
    fecha: formatFechaCL(r.fecha_rendicion),
    estado: (
      <div className="flex items-center gap-2">
        <div className={`badge ${r.estado === 'pendiente' ? 'badge-primary' :
          r.estado === 'aprobado' ? 'badge-success text-white' :
            r.estado === 'observado' ? 'badge-error text-white' : 'badge-ghost'
          } badge-sm capitalize`}>
          {r.estado || 'Pendiente'}
        </div>
        {r.observacion && (
          <div className="tooltip" data-tip={r.observacion}>
            <span className="cursor-help text-xs text-info">ℹ️ Obs</span>
          </div>
        )}
      </div>
    ),
    documento: (
      r.documentos_adjuntos && r.documentos_adjuntos.length > 0 ? (
        r.documentos_adjuntos.map(doc => (
          <a
            key={doc.id}
            href={doc.archivo}
            download
            target="_blank"
            rel="noopener noreferrer"
            title={doc.nombre}
            className="btn btn-primary btn-xs hover:bg-primary-900 hover:text-white"
          >
            Ver PDF
          </a>
        ))
      ) : (
        <span>-</span>
      )
    ),
    acciones: (
      <div className="flex gap-1 justify-end">
        {isCPA && r.estado === 'pendiente' && (
          <>
            <button className="btn btn-xs btn-primary text-white tooltip" data-tip="Aprobar"
              onClick={() => handleRevisar(r, 'aprobado')}>✓</button>
            <button className="btn btn-xs btn-primary text-white tooltip" data-tip="Observar"
              onClick={() => handleRevisar(r, 'observado')}>✎</button>
          </>
        )}
        {!isCPA && r.estado === 'observado' && (
          <button className="btn btn-xs btn-outline btn-info" onClick={() => handleCorregir(r)}>Corregir</button>
        )}
      </div>
    )
  }));

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isITO = ((user.rol === 'ito') || (user.rol === 'admin'));
  const isITOOnly = user.rol === 'ito';

  return (
    <div className="space-y-6">

      <dialog className={`modal ${showNoPeriodoModal ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error">Atención</h3>
          <p className="py-4 text-base-content/80">
            No se encontró un Periodo activo para su comunidad.
            <br />
            Debe crear un periodo antes de poder gestionar proyectos.
          </p>
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/crear-periodo")}
            >
              Crear Periodo
            </button>
          </div>
        </div>
      </dialog>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-box bg-base-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-primary">Gestión de Rendiciones</h2>
          <p className="text-base-content/70">
            Carga y justificación de gastos del proyecto.
          </p>
        </div>
        {!isITOOnly && (
          <button className="btn btn-primary" onClick={handleShowForm}>
            Crear Rendición
          </button>
        )}
      </div>

      <dialog className={`modal ${showForm ? "modal-open" : ""}`}>
        <div className="modal-box w-11/12 max-w-2xl">
          <h3 className="font-bold text-lg text-primary">Nueva Rendición</h3>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">

            <div className="form-control">
              <label className="label"><span className="label-text">Proyecto</span></label>
              <select className="select select-bordered" required value={form.proyecto} onChange={e => setForm(f => ({ ...f, proyecto: e.target.value }))}>
                <option value="">Selecciona un proyecto</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Documento PDF (Factura/Boleta)</span></label>
              <input
                className="file-input file-input-bordered w-full"
                type="file"
                accept="application/pdf"
                required
                onChange={e => setForm(f => ({ ...f, documento: e.target.files[0] }))}
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Monto Rendido</span></label>
              <div className="input-group">
                <span>$</span>
                <input className="input input-bordered w-full" type="number" required value={form.monto_rendido} onChange={e => setForm(f => ({ ...f, monto_rendido: e.target.value }))} />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Descripción</span></label>
              <textarea className="textarea textarea-bordered w-full" required value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Número de Documento</span></label>
              <input className="input input-bordered w-full" type="text" placeholder="Ej: Factura 12345" required value={form.numero_documento} onChange={e => setForm(f => ({ ...f, numero_documento: e.target.value }))} />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Fecha de Rendición</span></label>
              <input className="input input-bordered w-full" type="date" required value={form.fecha_rendicion} onChange={e => setForm(f => ({ ...f, fecha_rendicion: e.target.value }))} />
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" type="submit" disabled={formLoading}>
                {formLoading && <span className="loading loading-spinner"></span>}
                {formLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* MODAL REVISIÓN (OBSERVACIONES) */}
      <dialog className={`modal ${showRevisionModal ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg text-warning">Agregar Observación</h3>
          <p className="py-2 text-sm">Indica el motivo de la observación para que la comunidad pueda corregir.</p>
          <textarea className="textarea textarea-bordered w-full mt-2" placeholder="Ej: Falta firma en boleta..."
            value={nuevaObservacion}
            onChange={e => setNuevaObservacion(e.target.value)}
          ></textarea>
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={() => setShowRevisionModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => handleRevisar(rendicionSeleccionada, 'observado', nuevaObservacion)}>
              Guardar Observación
            </button>
          </div>
        </div>
      </dialog>

      {/* MODAL ÉXITO ACCIÓN */}
      <dialog className={`modal ${showSuccessModal ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg text-success">¡Acción Exitosa!</h3>
          <p className="py-4">{successMessage}</p>
          <div className="modal-action">
            <button className="btn btn-primary" onClick={() => setShowSuccessModal(false)}>Aceptar</button>
          </div>
        </div>
      </dialog>

      {
        loading ? (
          <div className="text-center p-12" >
            <span className="loading loading-lg loading-spinner text-primary"></span>
          </div>
        ) : (
          <TablaGenerica
            columns={columns}
            data={dataParaTabla}
            emptyText="No hay rendiciones registradas."
            rowsPerPage={8}
          />
        )}
    </div >
  );
}