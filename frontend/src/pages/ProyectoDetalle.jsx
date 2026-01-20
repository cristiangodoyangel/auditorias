import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function formatMonto(monto) {
    if (monto === undefined || monto === null || isNaN(monto)) return '$0';
    return '$' + Number(monto).toLocaleString('es-CL', { maximumFractionDigits: 0 });
}

function formatFechaCL(fecha) {
    if (!fecha) return 'No definida';
    const parts = fecha.split('T')[0].split('-');
    if (parts.length !== 3) return fecha;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export default function ProyectoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [proyecto, setProyecto] = useState(null);
    const [rendiciones, setRendiciones] = useState([]);
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado Form Rendición
    const [showRendForm, setShowRendForm] = useState(false);
    const [rendFormLoading, setRendFormLoading] = useState(false);
    const [rendForm, setRendForm] = useState({
        monto_rendido: '',
        numero_documento: '',
        descripcion: '',
        fecha_rendicion: '',
        documento: null
    });

    // Estado Reporte Avance
    const [nuevoReporte, setNuevoReporte] = useState({ porcentaje: '', observaciones: '', foto: null });
    const [reporteLoading, setReporteLoading] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.rol === 'Admin Comunidad' || user.rol === 'admin';
    const isCPA = user.rol === 'cpa' || user.rol === 'CPA Revisor';
    const isITO = user.rol === 'ito' || user.rol === 'admin'; // Admin also acts as ITO for testing

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('access');
        try {
            const [resProy, resRend, resRep] = await Promise.all([
                fetch(`http://localhost:8000/api/proyectos/${id}/`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`http://localhost:8000/api/rendiciones/?proyecto=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`http://localhost:8000/api/reportes-avance/`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (resProy.ok) {
                const dataProy = await resProy.json();
                setProyecto(dataProy);

                if (resRend.ok) {
                    const dataRend = await resRend.json();
                    const listaRend = Array.isArray(dataRend) ? dataRend : dataRend.results || [];
                    setRendiciones(listaRend);
                }

                if (resRep.ok) {
                    const dataRep = await resRep.json();
                    const listaRep = Array.isArray(dataRep) ? dataRep : dataRep.results || [];
                    setReportes(listaRep.filter(r => String(r.proyecto) === String(id)));
                }
            } else {
                alert("No se pudo cargar el proyecto");
                navigate('/proyectos');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);



    const handleCrearRendicion = async (e) => {
        e.preventDefault();
        setRendFormLoading(true);
        const token = localStorage.getItem('access');
        
        try {
            // 1. Subir Documento
            const docForm = new FormData();
            docForm.append('archivo', rendForm.documento);
            docForm.append('nombre', rendForm.documento.name);
            docForm.append('tipo', 'rendicion');
            
            const docRes = await fetch(`http://localhost:8000/api/documentos/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: docForm
            });
            
            if (!docRes.ok) throw new Error("Error al subir documento");
            const docData = await docRes.json();
            
            // 2. Crear Rendición
            const rendPayload = {
                proyecto: id,
                monto_rendido: rendForm.monto_rendido,
                numero_documento: rendForm.numero_documento,
                descripcion: rendForm.descripcion,
                fecha_rendicion: rendForm.fecha_rendicion,
                documentos_ids: [docData.id]
            };
            
            const res = await fetch(`http://localhost:8000/api/rendiciones/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(rendPayload)
            });
            
            if (res.ok) {
                alert("Rendición creada con éxito");
                setShowRendForm(false);
                setRendForm({ monto_rendido: '', numero_documento: '', descripcion: '', fecha_rendicion: '', documento: null });
                fetchData();
            } else {
                const err = await res.json();
                alert("Error al crear rendición: " + JSON.stringify(err));
            }

        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setRendFormLoading(false);
        }
    };

    const handleCrearReporte = async (e) => {
        e.preventDefault();
        setReporteLoading(true);
        const token = localStorage.getItem('access');
        const formData = new FormData();
        formData.append('proyecto', id);
        formData.append('porcentaje_avance', nuevoReporte.porcentaje);
        formData.append('observaciones', nuevoReporte.observaciones);
        if (nuevoReporte.foto) {
            formData.append('foto_avance', nuevoReporte.foto);
        }

        try {
            const res = await fetch(`http://localhost:8000/api/reportes-avance/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });
            if (res.ok) {
                alert("Reporte de avance ingresado correctamente");
                setNuevoReporte({ porcentaje: '', observaciones: '', foto: null });
                fetchData();
            } else {
                const err = await res.json();
                alert("Error: " + JSON.stringify(err));
            }
        } catch (e) { alert("Error de conexión"); }
        setReporteLoading(false);
    };

    const handleEliminar = async () => {
        if (!window.confirm("¿Eliminar proyecto?")) return;
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`http://localhost:8000/api/proyectos/${id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { navigate('/proyectos'); }
            else alert("Error al eliminar");
        } catch (err) { alert("Error"); }
    };

    if (loading) return <div className="text-center p-10"><span className="loading loading-spinner text-primary"></span></div>;
    if (!proyecto) return <div className="text-center p-10">No encontrado</div>;

    // Cálculos
    const misRendiciones = rendiciones;
    const totalRendido = misRendiciones.reduce((acc, r) => acc + (parseFloat(r.monto_rendido) || 0), 0);
    const porcentaje = proyecto.presupuesto_total > 0 ? Math.round((totalRendido / proyecto.presupuesto_total) * 100) : 0;

    // Cálculos Financieros
    const saldoDisponible = proyecto.presupuesto_total - totalRendido;

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-20">

            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-base-100 rounded-box shadow border-l-4 border-primary">
                <div>
                    <h1 className="font-bold text-3xl text-primary">{proyecto.nombre}</h1>
                    <p className="text-sm text-gray-500 mt-1">ID: {proyecto.id} | Formulado el {formatFechaCL(proyecto.fecha_inicio)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className={`badge badge-lg text-primary ${proyecto.estado === 'aprobado' ? 'badge-success' : 'badge-ghost'}`}>
                        {proyecto.estado.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* FICHA TÉCNICA GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                {/* COLUMNA IZQUIERDA */}
                <div className="space-y-6">
                    <div className="card bg-base-100 shadow p-4">
                        <h3 className="font-bold text-gray-500 text-xs uppercase mb-2">Presupuesto Global</h3>
                        <div className="text-3xl font-bold text-primary">{formatMonto(proyecto.presupuesto_total)}</div>
                        <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1"><span>Ejecución Real</span><span>{porcentaje}%</span></div>
                            <progress className="progress progress-primary w-full" value={totalRendido} max={proyecto.presupuesto_total}></progress>
                            <div className="text-xs text-right mt-1 font-bold">{formatMonto(totalRendido)}</div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow p-4">
                        <h3 className="font-bold text-gray-500 text-xs uppercase mb-2">Gobernanza</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between"><span>Quórum Asamblea:</span><span className="font-bold">{proyecto.quorum_asamblea}</span></li>
                            <li className="flex justify-between items-center">
                                <span>Firma Presidente:</span>
                                {proyecto.firma_presidente ? <span className="badge badge-primary badge-xs">Firmado</span> : <span className="badge badge-warning badge-xs">Pendiente</span>}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <h3 className="card-title text-primary border-b pb-2">Detalles Formulación</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="label text-xs font-bold uppercase text-black">Objetivos</label><p className="text-sm">{proyecto.objetivos}</p></div>
                                <div><label className="label text-xs font-bold uppercase text-black">Justificación</label><p className="text-sm">{proyecto.justificacion}</p></div>
                            </div>
                            <div className="mt-4"><label className="label text-xs font-bold uppercase text-black">Descripción</label><p className="text-sm">{proyecto.descripcion}</p></div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <h3 className="card-title text-primary border-b pb-2">Carpeta Digital</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="border p-3 rounded">
                                    <div className="text-xs font-bold uppercase mb-2">Acta</div>
                                    {proyecto.acta_url ? <a href={proyecto.acta_url} target="_blank" className="btn btn-xs btn-primary btn-outline w-full">Ver PDF</a> : <span className="text-xs text-error">Falta</span>}
                                </div>
                                <div className="border p-3 rounded">
                                    <div className="text-xs font-bold uppercase mb-2">Cotizaciones</div>
                                    {proyecto.cotizaciones_urls && proyecto.cotizaciones_urls.length > 0 ? (
                                        proyecto.cotizaciones_urls.length === 1 ? (
                                            <a href={proyecto.cotizaciones_urls[0]} target="_blank" className="btn btn-xs btn-primary btn-outline w-full">Ver PDF</a>
                                        ) : (
                                            <div className="dropdown dropdown-hover w-full">
                                                <label tabIndex={0} className="btn btn-xs btn-info btn-outline w-full">{proyecto.cotizaciones_urls.length} Archivos</label>
                                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-30">
                                                    {proyecto.cotizaciones_urls.map((url, i) => (
                                                        <li key={i}><a href={url} target="_blank">Cotización {i + 1}</a></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )
                                    ) : <span className="text-xs text-error">Falta</span>}
                                </div>
                                <div className="border p-3 rounded">
                                    <div className="text-xs font-bold uppercase mb-2">Elegido</div>
                                    {proyecto.elegido_url ? <a href={proyecto.elegido_url} target="_blank" className="btn btn-xs btn-primary btn-outline w-full">Ver PDF</a> : <span className="text-xs">No</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN FINANCIERA Y RENDICIONES */}
            <div className="divider text-primary font-bold">GESTIÓN FINANCIERA</div>
            
            <div className="space-y-6 animate-fade-in">
                {/* RESUMEN FINANCIERO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stat bg-base-100 shadow rounded-box">
                        <div className="stat-title">Presupuesto Total</div>
                        <div className="stat-value text-primary text-2xl">{formatMonto(proyecto.presupuesto_total)}</div>
                    </div>
                    <div className="stat bg-base-100 shadow rounded-box">
                        <div className="stat-title">Ejecutado (Rendido)</div>
                        <div className="stat-value text-secondary text-2xl">{formatMonto(totalRendido)}</div>
                        <div className="stat-desc">{porcentaje}% del Presupuesto</div>
                    </div>
                    <div className="stat bg-base-100 shadow rounded-box">
                        <div className="stat-title">Saldo Disponible</div>
                        <div className="stat-value text-accent text-2xl">{formatMonto(saldoDisponible)}</div>
                    </div>
                </div>

                {/* TABLA RENDICIONES (Detalle de Gastos) */}
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="card-title">Detalle de Gastos (Rendiciones)</h3>
                            {!isITO && (
                                <button className="btn btn-primary btn-sm" onClick={() => setShowRendForm(true)}>
                                    Ingresar Rendición
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Descripción</th>
                                        <th>Monto</th>
                                        <th>Documento</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {misRendiciones.map(r => (
                                        <tr key={r.id}>
                                            <td>{formatFechaCL(r.fecha_rendicion)}</td>
                                            <td>{r.descripcion}</td>
                                            <td className="font-bold">{formatMonto(r.monto_rendido)}</td>
                                            <td>{r.numero_documento || '-'}</td>
                                            <td>
                                                <div className={`badge ${r.estado === 'pendiente' ? 'badge-primary' :
                                                    r.estado === 'aprobado' ? 'badge-success text-white' :
                                                        r.estado === 'observado' ? 'badge-warning' : 'badge-ghost'
                                                    } badge-sm capitalize`}>
                                                    {r.estado}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {misRendiciones.length === 0 && <tr><td colSpan="5" className="text-center italic opacity-50">No hay rendiciones registradas</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN TÉCNICA (ITO) opcional */}
            {isITO && (
                <>
                <div className="divider text-secondary font-bold">CONTROL TÉCNICO (ITO)</div>
                <div className="space-y-6 animate-fade-in">
                    {/* DASHBOARD COMPARATIVO */}
                    <div className="card bg-base-100 shadow p-6">
                        <h3 className="font-bold text-gray-500 text-xs uppercase mb-4">Estado del Proyecto (Físico vs Financiero)</h3>
                        <div className="flex flex-col gap-4">
                            {/* Barra Financiera (Lo que se ha pagado) */}
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-primary">Avance Financiero (Rendido)</span>
                                    <span>{porcentaje}% ({formatMonto(totalRendido)})</span>
                                </div>
                                <progress className="progress progress-primary w-full" value={totalRendido} max={proyecto.presupuesto_total}></progress>
                            </div>
                            {/* Barra Física (Lo construido) */}
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-primary">Avance Físico (Reportado ITO)</span>
                                    <span>{proyecto.ultimo_avance_fisico}%</span>
                                </div>
                                <progress className="progress progress-primary w-full" value={proyecto.ultimo_avance_fisico} max="100"></progress>
                            </div>
                        </div>
                    </div>

                    {/* FORMULARIO NUEVO REPORTE */}
                    <div className="card bg-base-100 shadow border-l-4 border-primary">
                        <div className="card-body">
                            <h3 className="card-title text-primary">Nuevo Reporte de Avance</h3>
                            <form onSubmit={handleCrearReporte} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">Porcentaje de Avance (%)</label>
                                    <input type="number" className="input input-bordered" required min="0" max="100" placeholder="Ej: 15"
                                        value={nuevoReporte.porcentaje}
                                        onChange={e => setNuevoReporte({ ...nuevoReporte, porcentaje: e.target.value })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">Foto de Evidencia</label>
                                    <input type="file" className="file-input file-input-bordered file-input-primary w-full" accept="image/*" required
                                        onChange={e => setNuevoReporte({ ...nuevoReporte, foto: e.target.files[0] })}
                                    />
                                </div>
                                <div className="form-control md:col-span-2">
                                    <label className="label">Observaciones Técnicas</label>
                                    <textarea className="textarea textarea-bordered" required placeholder="Describe los hitos alcanzados..."
                                        value={nuevoReporte.observaciones}
                                        onChange={e => setNuevoReporte({ ...nuevoReporte, observaciones: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 text-right">
                                    <button type="submit" className="btn btn-primary text-white" disabled={reporteLoading}>
                                        {reporteLoading ? <span className="loading loading-spinner"></span> : 'Publicar Avance'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* HISTORIAL DE REPORTES */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg px-2">Bitácora de Obra</h3>
                        {reportes.length === 0 ? <p className="opacity-50 px-2">No hay reportes registrados.</p> : reportes.map(rep => (
                            <div key={rep.id} className="card bg-base-100 shadow-sm border border-base-200">
                                <div className="card-body p-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="w-full md:w-48 h-32 flex-shrink-0 bg-base-200 rounded-box overflow-hidden flex items-center justify-center">
                                            {rep.foto_url ? (
                                                <a href={rep.foto_url} target="_blank" rel="noreferrer">
                                                    <img src={rep.foto_url} alt="Avance" className="w-full h-full object-cover hover:scale-105 transition-transform cursor-zoom-in" />
                                                </a>
                                            ) : <span className="text-xs opacity-50">Sin foto</span>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-lg">{rep.porcentaje_avance}% de Avance</h4>
                                                    <p className="text-xs text-gray-500">{formatFechaCL(rep.fecha_reporte)}</p>
                                                </div>
                                                <div className="badge badge-success text-white badge-outline">Reporte #{rep.id}</div>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-700">{rep.observaciones}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </>
            )}
            {/* FOOTER */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-8">
                <button className="btn btn-ghost" onClick={() => navigate(-1)}>Volver</button>
                {isAdmin && <button className="btn btn-error btn-outline" onClick={handleEliminar}>Admin: Eliminar Proyecto</button>}
                {/* MODAL NUEVA RENDICIÓN */}
            <dialog className={`modal ${showRendForm ? "modal-open" : ""}`}>
                <div className="modal-box w-11/12 max-w-2xl">
                    <h3 className="font-bold text-lg text-primary">Nueva Rendición</h3>
                    <form onSubmit={handleCrearRendicion} className="space-y-4 pt-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Documento PDF (Factura/Boleta)</span></label>
                            <input className="file-input file-input-bordered w-full" type="file" accept="application/pdf" required
                                onChange={e => setRendForm({ ...rendForm, documento: e.target.files[0] })}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Número de Documento</span></label>
                            <input className="input input-bordered w-full" type="text" placeholder="Ej: Factura 12345" required
                                value={rendForm.numero_documento}
                                onChange={e => setRendForm({ ...rendForm, numero_documento: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="form-control">
                                <label className="label"><span className="label-text">Monto Rendido</span></label>
                                <div className="input-group">
                                    <span>$</span>
                                    <input className="input input-bordered w-full" type="number" required
                                        value={rendForm.monto_rendido}
                                        onChange={e => setRendForm({ ...rendForm, monto_rendido: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Fecha</span></label>
                                <input className="input input-bordered w-full" type="date" required
                                    value={rendForm.fecha_rendicion}
                                    onChange={e => setRendForm({ ...rendForm, fecha_rendicion: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Descripción</span></label>
                            <textarea className="textarea textarea-bordered w-full" required
                                value={rendForm.descripcion}
                                onChange={e => setRendForm({ ...rendForm, descripcion: e.target.value })}
                            />
                        </div>
                        <div className="modal-action">
                            <button type="button" className="btn btn-ghost" onClick={() => setShowRendForm(false)}>Cancelar</button>
                            <button className="btn btn-primary" type="submit" disabled={rendFormLoading}>
                                {rendFormLoading ? <span className="loading loading-spinner"></span> : 'Guardar Rendición'}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>

        </div>
        </div>
    );
}