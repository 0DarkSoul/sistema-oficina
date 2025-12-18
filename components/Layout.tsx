
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Wrench, 
  LogOut, 
  Menu, 
  FileText,
  Settings,
  ChevronRight,
  Clock,
  CreditCard,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getWorkshopSettings } from '../services/dataService';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, daysRemaining } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [workshopName, setWorkshopName] = useState<string>('OficinaPro');
  const location = useLocation();
  const navigate = useNavigate();

  // Load Workshop Branding (White Label)
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const settings = await getWorkshopSettings();
        if (settings) {
          if (settings.logo) setLogo(settings.logo);
          if (settings.name) setWorkshopName(settings.name);
        }
      } catch (e) {
        console.error("Error loading branding", e);
      }
    };
    loadBranding();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Visão Geral', path: '/', icon: LayoutDashboard },
    { label: 'Ordens de Serviço', path: '/work-orders', icon: Wrench },
    { label: 'Clientes', path: '/customers', icon: Users },
    { label: 'Veículos', path: '/vehicles', icon: Car },
    { label: 'Relatórios', path: '/reports', icon: FileText },
    { label: 'Configurações', path: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
     if (path === '/' && location.pathname !== '/') return false;
     return location.pathname.startsWith(path);
  }

  const isTrial = user?.subscriptionStatus === 'TRIAL';
  const isActiveSub = user?.subscriptionStatus === 'ACTIVE';

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-20 lg:hidden no-print backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Commercial Style */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-72 bg-primary text-slate-300 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out no-print
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* BRAND AREA (Height 80px approx, Logo max 48px) */}
        <div className="h-24 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
          {logo ? (
            <img 
              src={logo} 
              alt="Logo" 
              className="h-[48px] max-w-[180px] object-contain object-left" 
            />
          ) : (
            <div className="flex items-center gap-3 text-white">
              <div className="bg-accent p-2 rounded-lg shadow-lg shadow-accent/20">
                <Car size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl leading-none tracking-tight text-white">{workshopName}</h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Gestão Inteligente</p>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Alert */}
        {(isTrial || (isActiveSub && daysRemaining < 7)) && (
          <div className="mx-4 mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
             <div className={`flex items-center gap-2 mb-1.5 ${isTrial ? 'text-amber-400' : 'text-amber-500'}`}>
               <Clock size={16} />
               <span className="text-xs font-bold uppercase tracking-wide">
                 {isTrial ? 'Período de Teste' : 'Renovação'}
               </span>
             </div>
             <p className="text-xs text-slate-400 mb-2">
               Seu acesso expira em <span className="text-white font-bold">{daysRemaining} dias</span>.
             </p>
             {isTrial && (
                <Link to="/subscription" className="block text-center py-2 bg-accent hover:bg-accentDark text-white text-xs font-bold rounded transition-colors shadow-sm">
                  Assinar Agora
                </Link>
             )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Menu Principal</p>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium
                  ${active 
                    ? 'bg-accent text-white shadow-lg shadow-accent/25' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={`transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight size={14} className="text-white/80" />}
              </Link>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-300 font-bold text-lg shadow-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/30 text-slate-400 border border-slate-700 rounded-lg text-xs font-bold transition-all uppercase tracking-wide"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 lg:hidden flex items-center justify-between p-4 no-print shrink-0 z-10">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-accent p-2 rounded-md hover:bg-slate-50 transition-colors"
          >
            <Menu size={24} />
          </button>
          
          {logo ? (
             <img src={logo} alt="Logo" className="h-8 object-contain" />
          ) : (
             <span className="font-bold text-slate-800 text-lg">{workshopName}</span>
          )}
          
          <div className="w-8"></div> {/* Spacer for center alignment */}
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
