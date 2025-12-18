import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, User, Mail, Lock, Building, AlertTriangle } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));

    const success = await register(name, email, password, companyName);
    
    // Double check if success is true, if register returned false it means email taken or save failed
    if (success) {
      navigate('/');
    } else {
      setError('Falha no cadastro. E-mail já existe ou erro no navegador.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-200">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent text-white mb-3 shadow-lg shadow-accent/30">
            <Car size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Criar Conta Grátis</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">Teste o OficinaPro por 7 dias sem compromisso</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 font-medium flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Seu Nome</label>
            <div className="relative group">
              <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-accent transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium text-sm"
                placeholder="Ex: Carlos Silva"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome da Oficina</label>
            <div className="relative group">
              <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-accent transition-colors">
                <Building size={18} />
              </div>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium text-sm"
                placeholder="Ex: Funilaria Express"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail</label>
            <div className="relative group">
              <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-accent transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium text-sm"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
            <div className="relative group">
              <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-accent transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium text-sm"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accentDark disabled:bg-slate-300 text-white font-bold py-3 rounded-lg transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] uppercase tracking-wide text-sm mt-4"
          >
            {isLoading ? 'Criando conta...' : 'Começar Teste Grátis'}
          </button>

          <div className="text-center mt-4">
             <p className="text-xs text-slate-500">
               Já tem uma conta? <Link to="/login" className="text-accent font-bold hover:underline">Faça Login</Link>
             </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;