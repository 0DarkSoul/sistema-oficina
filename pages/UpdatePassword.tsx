
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, CheckCircle, AlertTriangle, Key } from 'lucide-react';

const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { updatePassword, isRecoveryMode } = useAuth();
  const navigate = useNavigate();

  // STRICT URL SECURITY CHECK
  useEffect(() => {
    const href = window.location.href;
    const hash = window.location.hash;
    
    // Supabase coloca tokens no hash (#access_token=...&type=recovery)
    // 1. Verificação via URL (estado inicial)
    const urlHasToken = href.includes('access_token') || href.includes('type=recovery') || hash.includes('type=recovery');

    // 2. Verificação via Contexto (estado reativo do Supabase)
    // Se o Supabase consumiu o token da URL, ele dispara o evento PASSWORD_RECOVERY que seta isRecoveryMode=true
    
    const isAuthorized = urlHasToken || isRecoveryMode;

    if (!isAuthorized) {
        // Se não houver token na URL e não estivermos em modo de recuperação validado pelo evento,
        // redirecionar para login.
        // Isso previne que "Recarregar a página" (F5) deixe o usuário preso aqui, pois o token some e o contexto reseta.
        console.warn("UpdatePassword: No token or recovery mode detected. Redirecting to Login.");
        navigate('/login', { replace: true });
    }
  }, [navigate, isRecoveryMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);

    // Usa a sessão estabelecida pelo link mágico para atualizar a senha
    const isUpdated = await updatePassword(password);
    setIsLoading(false);

    if (isUpdated) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      setError('Não foi possível atualizar a senha. O link pode ter expirado.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Senha Atualizada!</h2>
            <p className="text-slate-500 mt-2">Você será redirecionado em instantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-200">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-200 text-slate-600 mb-3">
            <Key size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Definir Nova Senha</h2>
          <p className="text-slate-500 mt-1 text-sm">Crie uma nova senha segura para sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nova Senha</label>
            <div className="relative group">
              <div className="absolute left-3 top-2.5 text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirmar Senha</label>
            <div className="relative group">
              <div className="absolute left-3 top-2.5 text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium"
                placeholder="Repita a senha"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accentDark disabled:bg-slate-300 text-white font-bold py-3 rounded-lg transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] uppercase tracking-wide text-sm mt-4"
          >
            {isLoading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
