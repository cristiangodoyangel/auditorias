import React, { useEffect, useState } from 'react';
import TablaGenerica from '../components/TablaGenerica';

const mockSocios = [
  { id: 1, nombre: "Juan", apellido: "Mamani", rut: "12.345.678-9", direccion: "Calle Caracoles 123, San Pedro", telefono: "+56 9 8765 4321", activo: true, comunidad: 1 },
  { id: 2, nombre: "María", apellido: "Colque", rut: "13.456.789-0", direccion: "Av. Licancabur 456, San Pedro", telefono: "+56 9 1234 5678", activo: true, comunidad: 1 },
  { id: 3, nombre: "Pedro", apellido: "Chaile", rut: "10.123.456-7", direccion: "Calle Tocopilla 789, San Pedro", telefono: "+56 9 9876 5432", activo: true, comunidad: 1 },
  { id: 4, nombre: "Luisa", apellido: "Panire", rut: "15.678.901-2", direccion: "Pasaje Lasana 321, Toconao", telefono: "+56 9 5555 6666", activo: true, comunidad: 1 },
  { id: 5, nombre: "Carlos", apellido: "Ayaviri", rut: "14.234.567-8", direccion: "Calle Gustavo Le Paige 654, San Pedro", telefono: "+56 9 4444 3333", activo: false, comunidad: 1 },
  { id: 6, nombre: "Ana", apellido: "Cruz", rut: "16.789.012-3", direccion: "Calle Domingo Atienza 987, Toconao", telefono: "+56 9 7777 8888", activo: true, comunidad: 1 },
  { id: 7, nombre: "Diego", apellido: "Sila", rut: "17.345.678-4", direccion: "Calle Pachama 159, San Pedro", telefono: "+56 9 2222 1111", activo: true, comunidad: 1 },
  { id: 8, nombre: "Francisca", apellido: "Tito", rut: "18.901.234-5", direccion: "Av. del Inca 753, Calama", telefono: "+56 9 6666 9999", activo: true, comunidad: 1 },
  { id: 9, nombre: "Jorge", apellido: "Ramos", rut: "11.234.567-K", direccion: "Calle Granaderos 246, Calama", telefono: "+56 9 3333 4444", activo: false, comunidad: 1 },
  { id: 10, nombre: "Claudia", apellido: "Véliz", rut: "19.567.890-1", direccion: "Calle Latorre 369, Calama", telefono: "+56 9 8888 7777", activo: true, comunidad: 1 },
];

export default function Socios() {
  let isAdmin = false;
  let comunidadId = null;
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    isAdmin = user && (user.rol === 'admin' || user.role === 'admin');
    if (user && user.comunidad && user.comunidad.id) {
      comunidadId = user.comunidad.id;
    } else if (user && user.comunidad_id) {
      comunidadId = user.comunidad_id;
    }
  } catch { }

  const [socios, setSocios] = useState(mockSocios);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const [editando, setEditando] = useState(null);
  const [nuevoSocio, setNuevoSocio] = useState({ nombre: '', apellido: '', rut: '', direccion: '', telefono: '', activo: true });

  function handleAgregar() {
    setEditando('nuevo');
    setNuevoSocio({ nombre: '', apellido: '', rut: '', direccion: '', telefono: '', activo: true, comunidad: comunidadId });
  }

  function handleGuardarNuevo() {
    setFormLoading(true);
    setTimeout(() => {
      const socioGuardado = { ...nuevoSocio, id: socios.length + 1 };
      setSocios([...socios, socioGuardado]);
      setEditando(null);
      setFormLoading(false);
    }, 500);
  }

  function handleEditar(socio) {
    if (!isAdmin) return;
    setEditando(socio.id);
    setNuevoSocio({ ...socio });
  }

  function handleGuardarEdicion() {
    setSocios(socios.map(s => s.id === editando ? { ...nuevoSocio, id: editando } : s));
    setEditando(null);
  }

  function handleEliminar(id) {
    setSocios(socios.filter(s => s.id !== id));
    setEditando(null);
  }

  const sociosActivos = socios.filter(s => s.activo).length;
  const sociosInactivos = socios.length - sociosActivos;

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-box bg-base-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-primary">Gestión de Socios</h2>
          <p className="text-base-content/70">
            Registro y control de socios de la comunidad
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleAgregar}>
            Agregar Socio
          </button>
        )}
      </div>

      <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
        <div className="stat place-items-center">
          <div className="stat-title text-primary">Socios Totales</div>
          <div className="stat-value text-primary">{socios.length}</div>
        </div>
        <div className="stat place-items-center">
          <div className="stat-title text-primary">Socios Activos</div>
          <div className="stat-value text-primary">{sociosActivos}</div>
        </div>
        <div className="stat place-items-center">
          <div className="stat-title text-primary">Socios Inactivos</div>
          <div className="stat-value text-primary">{sociosInactivos}</div>
        </div>
      </div>

      {(editando !== null) && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-primary">{editando === 'nuevo' ? 'Agregar Socio' : 'Editar Socio'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Nombre</span></label>
                <input type="text" className="input input-bordered" placeholder="Nombre" value={nuevoSocio.nombre} onChange={e => setNuevoSocio({ ...nuevoSocio, nombre: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Apellido</span></label>
                <input type="text" className="input input-bordered" placeholder="Apellido" value={nuevoSocio.apellido} onChange={e => setNuevoSocio({ ...nuevoSocio, apellido: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">RUT</span></label>
                <input type="text" className="input input-bordered" placeholder="RUT" value={nuevoSocio.rut} onChange={e => setNuevoSocio({ ...nuevoSocio, rut: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Dirección</span></label>
                <input type="text" className="input input-bordered" placeholder="Dirección" value={nuevoSocio.direccion} onChange={e => setNuevoSocio({ ...nuevoSocio, direccion: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Teléfono</span></label>
                <input type="text" className="input input-bordered" placeholder="Teléfono" value={nuevoSocio.telefono} onChange={e => setNuevoSocio({ ...nuevoSocio, telefono: e.target.value })} />
              </div>
              <div className="form-control md:col-span-2">
                <label className="label cursor-pointer justify-start gap-4">
                  <input type="checkbox" className="checkbox checkbox-primary" checked={nuevoSocio.activo} onChange={e => setNuevoSocio({ ...nuevoSocio, activo: e.target.checked })} />
                  <span className="label-text ">Socio Activo</span>
                </label>
              </div>
            </div>
            <div className="card-actions justify-end gap-2 mt-4">
              {editando !== 'nuevo' && (
                <button className="btn btn-error text-white" onClick={() => handleEliminar(editando)}>Eliminar</button>
              )}
              <button className="btn btn-ghost" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={editando === 'nuevo' ? handleGuardarNuevo : handleGuardarEdicion} disabled={formLoading}>
                {formLoading && <span className="loading loading-spinner"></span>}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center p-12">
          <span className="loading loading-lg loading-spinner text-primary"></span>
        </div>
      ) : (
        <TablaGenerica
          columns={[
            { key: 'nombre', label: 'Nombre' },
            { key: 'apellido', label: 'Apellido' },
            { key: 'rut', label: 'RUT' },
            { key: 'direccion', label: 'Dirección' },
            { key: 'telefono', label: 'Teléfono' },
            { key: 'activo', label: 'Socio Activo' },
          ]}
          data={socios}
          renderCell={(row, col) => {
            if (col.key === 'activo') {
              return row.activo
                ? <div className="badge badge-primary badge-outline">Sí</div>
                : <div className="badge badge-ghost">No</div>;
            }
            if (col.key === 'nombre' && isAdmin) {
              return <span className="link link-primary font-bold hover:text-primary-focus transition-colors" onClick={() => handleEditar(row)}>{row.nombre}</span>;
            }
            return row[col.key] || '';
          }}
          emptyText="No hay socios registrados"
          rowsPerPage={10}
        />
      )}
    </div>
  );
}