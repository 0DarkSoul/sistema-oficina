
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Subscription from './pages/Subscription';
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import WorkOrderDetails from './pages/WorkOrderDetails';
import Customers from './pages/Customers';
import Vehicles from './pages/Vehicles';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import { initSystem } from './services/dataService';

// Componente para lidar com lógica de inicialização dentro do contexto do Router
const AppContent: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // 1. Limpeza de tokens de recuperação antigos para evitar loops
        localStorage.removeItem('recovery_token');
        sessionStorage.removeItem('recovery_token');
        
        // 2. Inicialização de serviços
        initSystem();

        // 3. Detecção de URL de recuperação do Supabase (Magic Link)
        if (location.hash && location.hash.includes('type=recovery')) {
             console.log("Detectado link de recuperação. Redirecionando para atualização de senha.");
             navigate('/reset-password');
        }

    }, [navigate, location]);

    return (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<UpdatePassword />} />
          <Route path="/password-recovery" element={<Navigate to="/reset-password" replace />} />
          
          <Route path="/subscription" element={
            <SubscriptionWrapper />
          } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/customers" element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } />

          <Route path="/vehicles" element={
            <ProtectedRoute>
              <Vehicles />
            </ProtectedRoute>
          } />
          
          <Route path="/work-orders" element={
            <ProtectedRoute>
              <WorkOrders />
            </ProtectedRoute>
          } />
          
          <Route path="/work-orders/:id" element={
            <ProtectedRoute>
              <WorkOrderDetails />
            </ProtectedRoute>
          } />

           <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // SHOW LOADING SPINNER - Prevents redirecting while session is being restored
  if (isLoading) {
      return (
          <div className="min-h-screen bg-slate-100 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-slate-300 border-t-accent rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-sm font-medium">Carregando sistema...</p>
              </div>
          </div>
      );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check Subscription Status
  if (user?.subscriptionStatus === 'EXPIRED') {
    return <Navigate to="/subscription" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

// Helper to prevent accessing subscription page if not logged in
const SubscriptionWrapper = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
      return <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-white rounded-full animate-spin"></div>
      </div>;
  }

  return isAuthenticated ? <Subscription /> : <Navigate to="/login" />;
}

export default App;
