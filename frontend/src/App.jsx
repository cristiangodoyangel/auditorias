import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Proyectos from './pages/Proyectos';
import ProyectoDetalle from './pages/ProyectoDetalle';
import Socios from './pages/Socios';
import Periodos from './pages/Periodos';
import Login from './pages/Login';
import CrearPeriodo from './pages/CrearPeriodo';


const Redirector = ({ to, onReset }) => {
  const navigate = useNavigate();
  React.useEffect(() => {
    if (to) {
      navigate(to, { replace: true });
      onReset();
    }
  }, [to, navigate, onReset]);
  return null;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access'));
  const [redirectTo, setRedirectTo] = useState(null);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol && (user.rol.toLowerCase().includes('admin'))) {
      setRedirectTo('/crear-periodo');
    } else {
      setRedirectTo('/dashboard');
    }
  };

  const handlePeriodoCreado = () => {
    setRedirectTo('/dashboard');
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Redirector to={redirectTo} onReset={() => setRedirectTo(null)} />
      <Layout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crear-periodo" element={<CrearPeriodo onPeriodoCreado={handlePeriodoCreado} />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
          <Route path="/socios" element={<Socios />} />
          <Route path="/periodos" element={<Periodos />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;