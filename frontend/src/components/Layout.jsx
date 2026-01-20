import React from 'react';
import logo from '../assets/logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
);

// Helper for breadcrumbs
const getBreadcrumbs = (pathname) => {
  const pathDetail = pathname.split('/').filter(p => p !== '');
  if (pathDetail.length === 0) return 'Dashboard';
  return pathDetail.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ');
};

const NavLink = ({ to, children, className }) => (
  <li>
    <Link to={to} className={`flex items-center p-3 rounded-lg transition-all duration-300 hover:bg-white/10 hover:backdrop-blur-md hover:text-primary hover:translate-x-1 ${className}`}>
      {children}
    </Link>
  </li>
);

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = localStorage.getItem('user');
  const user = (storedUser && storedUser !== 'undefined') ? JSON.parse(storedUser) : {};

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    window.location.reload();
  };

  const userUnidad = user?.es_auditor ? 'Rol: Auditor' : (user?.comunidad?.nombre || user?.comunidad_nombre || 'Unidad Operativa');

  return (
    <div className="drawer lg:drawer-open font-sans text-gray-200 bg-base-100 min-h-screen">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      
      {/* Drawer Content (Main Page + Header) */}
      <div className="drawer-content flex flex-col items-center justify-start bg-base-100 min-h-screen">
        
        {/* Context Header */}
        <div className="w-full navbar bg-base-100/90 backdrop-blur-sm sticky top-0 z-30 border-b border-white/5 px-6">
          <div className="flex-none lg:hidden">
            <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost text-primary">
              <MenuIcon />
            </label>
          </div>
          <div className="flex-1 px-2 mx-2 text-xl font-semibold tracking-wide text-gray-300">
            <span className="text-primary mr-2">/</span> {getBreadcrumbs(location.pathname)}
          </div>
          <div className="flex-none hidden sm:block">
             <div className="flex flex-col items-end mr-4">
                <span className="font-bold text-sm text-gray-100 tracking-wider">
                  {user?.nombre || user?.username || "Usuario"}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-primary">
                  {userUnidad}
                </span>
             </div>
          </div>
          <div className="flex-none">
             <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-circle avatar ring ring-primary ring-offset-base-100 ring-offset-2">
                  <div className="w-10 rounded-full">
                    <img src="https://img.daisyui.com/images/profile/demo/superperson@192.webp" alt="Avatar" />
                  </div>
                </label>
                 <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-sm w-52 border border-white/10">
                  <li><a onClick={handleLogout} className="hover:text-primary"><LogoutIcon /> Cerrar sesión</a></li>
                </ul>
             </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="w-full p-6 text-gray-300">
          <div className="glass-panel p-6 rounded-sm shadow-2xl min-h-[80vh]">
             {children}
          </div>
        </main>
      
      </div> 
      
      {/* Drawer Side (Sidebar) */}
      <div className="drawer-side z-40">
        <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label> 
        <ul className="menu p-4 w-72 min-h-full bg-base-100 border-r border-white/5 text-base-content flex flex-col">
          {/* Sidebar Logo */}
          <div className="flex items-center gap-3 px-2 mb-10 mt-2">
            <img src={logo} alt="Logo" className="w-10 h-10 opacity-90" />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tighter text-white">COREFLOW</span>
              <span className="text-[10px] tracking-[0.2em] text-primary font-bold">AUDITORIAS</span>
            </div>
          </div>

          {/* Sidebar Links */}
          <div className="flex-1 flex flex-col gap-2 font-medium text-gray-400">
            <NavLink to="/dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Dashboard
            </NavLink>
            <NavLink to="/proyectos">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Proyectos
            </NavLink>
            <NavLink to="/periodos">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Periodos
            </NavLink>
            <NavLink to="/socios">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Activos / Stakeholders
            </NavLink>
          </div>

           <div className="text-xs text-center p-4 text-gray-600">
            © 2026 CoreFlow
          </div>
        </ul>
      </div>
    </div>
  );
}