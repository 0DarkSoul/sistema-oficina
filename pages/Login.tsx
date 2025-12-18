
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkDatabaseConnection } from '../services/dataService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { 
  Car, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, 
  Database, Eye, EyeOff, Terminal
} from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed local loading state to distinguish from auth loading
  
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
        navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Check DB connection on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
        checkDatabaseConnection().then(status => {
            if (status.status !== 'ok') {
                console.warn("Database connection status:", status);
            }
        });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
        setError('Configure o banco de dados primeiro.');
        return;
    }

    setError('');
    setIsSubmitting(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // IF AUTH IS LOADING, SHOW SPINNER (Instead of Login Form)
  if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <div className="w-10 h-10 border-4 border-slate-700 border-t-sky-500 rounded-full animate-spin"></div>
               <p className="text-slate-400 text-sm">Verificando sessão...</p>
            </div>
        </div>
      );
  }

  // 1. TELA: SUPABASE NÃO CONFIGURADO (CHAVES FALTANDO)
  if (!isSupabaseConfigured) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
            <div className="w-full max-w-2xl bg-slate-800 rounded-xl border border-slate-700 shadow-2xl p-8">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-6">
                    <div className="bg-red-500/10 p-3 rounded-lg">
                        <Database className="text-red-400" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Banco de Dados Desconectado</h1>
                        <p className="text-slate-400">O sistema precisa de uma conexão Supabase para funcionar.</p>
                    </div>
                </div>
                {/* Instruções de Chave ... */}
                <div className="space-y-6">
                    <div className="bg-black/30 rounded-lg p-4 font-mono text-sm text-slate-300 border border-slate-700">
                        <p className="mb-2 text-slate-500">// Edite o arquivo:</p>
                        <p className="text-yellow-400 font-bold">services/supabaseClient.ts</p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-bold flex items-center gap-2"><Terminal size={18} /> Passo a Passo:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm marker:text-slate-500">
                            <li>Crie um projeto grátis em <a href="https://supabase.com" target="_blank" className="text-accent hover:underline">supabase.com</a></li>
                            <li>No menu <strong>Settings > API</strong>, copie a <strong>URL</strong> e a <strong>anon public key</strong>.</li>
                            <li>Abra o arquivo <code>services/supabaseClient.ts</code>.</li>
                            <li>Cole suas chaves nas variáveis <code>HARDCODED_URL</code> e <code>HARDCODED_KEY</code>.</li>
                            <li>Recarregue esta página.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // 3. TELA DE LOGIN NORMAL
  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      
      {/* LEFT COLUMN: BRANDING */}
      <div className="hidden lg:flex lg:w-7/12 bg-slate-900 relative overflow-hidden flex-col justify-between p-16 text-white transition-all">
        <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
           <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[100px] animate-pulse-slow"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/40 rounded-full blur-[80px] animate-float"></div>
        </div>

        <div className="relative z-10 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-8">
             <div className="bg-gradient-to-br from-white/10 to-white/5 p-2.5 rounded-xl border border-white/10 backdrop-blur-md shadow-xl">
                <Car className="text-sky-400" size={28} />
             </div>
             <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">OficinaPro ERP</h1>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">System Online</p>
                </div>
             </div>
          </div>
        </div>

        <div className="relative z-10 max-w-xl animate-fade-in-up" style={{animationDelay: '0.1s'}}>
           <h2 className="text-5xl font-bold leading-[1.1] mb-6 tracking-tight">
             O controle total da sua oficina em <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">um só lugar.</span>
           </h2>
           <p className="text-lg text-slate-400 leading-relaxed font-light">
             Gerencie ordens de serviço, clientes, estoque e financeiro com a plataforma feita para quem entende de carros.
           </p>
        </div>

        <div className="relative z-10 mt-12 flex items-center gap-6 text-xs text-slate-500 font-medium animate-fade-in">
           <span>© 2024 OficinaPro Systems</span>
           <span className="w-1 h-1 rounded-full bg-slate-700"></span>
           <span className="flex items-center gap-1"><ShieldCheck size={12}/> Security Standard AES-256</span>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div className="w-full lg:w-5/12 flex flex-col justify-center items-center p-6 bg-white relative">
         <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
            <div className="bg-slate-900 p-2 rounded-lg shadow-lg">
               <Car className="text-sky-400" size={20} />
            </div>
            <span className="font-bold text-slate-900 text-lg">OficinaPro</span>
         </div>

         <div className="w-full max-w-[380px] animate-fade-in-up space-y-8">
            <div className="text-center lg:text-left space-y-2">
               <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bem-vindo</h2>
               <p className="text-slate-500">Digite suas credenciais para continuar.</p>
            </div>

            <div className="space-y-4 min-h-[60px]">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 animate-shake">
                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                    <div>
                        <h4 className="text-sm font-bold text-red-900">Acesso Negado</h4>
                        <p className="text-xs text-red-700 mt-0.5">{error}</p>
                    </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-0.5">E-mail Corporativo</label>
                  <div className="relative group">
                     <div className="absolute left-0 top-0 bottom-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-accent text-slate-400">
                        <Mail size={18} />
                     </div>
                     <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium text-sm shadow-sm"
                        placeholder="nome@empresa.com"
                     />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-0.5">
                     <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Senha</label>
                     {/* Pass state to indicate explicit navigation */}
                     <Link 
                        to="/forgot-password" 
                        state={{ fromLogin: true }}
                        className="text-xs font-semibold text-accent hover:text-accentDark hover:underline transition-colors"
                     >
                        Esqueceu?
                     </Link>
                  </div>
                  <div className="relative group">
                     <div className="absolute left-0 top-0 bottom-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-accent text-slate-400">
                        <Lock size={18} />
                     </div>
                     <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium text-sm shadow-sm"
                        placeholder="••••••••"
                     />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 bottom-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer outline-none"
                     >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                  </div>
               </div>

               <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 text-sm tracking-wide"
               >
                  {isSubmitting ? (
                     <>
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       <span>Autenticando...</span>
                     </>
                  ) : (
                     <>Acessar Sistema <ArrowRight size={16} /></>
                  )}
               </button>
            </form>

            <div className="pt-8 border-t border-slate-100 text-center">
               <p className="text-slate-500 text-sm">
                  Não tem uma conta? <Link to="/register" className="text-accent font-bold hover:text-accentDark transition-colors">Começar teste grátis</Link>
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Login;
