
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, KeyRound, ArrowLeft, CheckCircle, Lock, Bell, HelpCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: Code, 3: Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [suggestedEmails, setSuggestedEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [simulatedEmailContent, setSimulatedEmailContent] = useState<string | null>(null);
  
  const { requestPasswordReset, resetPassword, getRegisteredEmailsHint, isAuthenticated } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();

  // STRICT ACCESS CONTROL
  useEffect(() => {
    // 1. Se usuário já está logado, não tem porque recuperar senha. Vai para o Dashboard.
    if (isAuthenticated) {
        navigate('/', { replace: true });
        return;
    }

    // 2. Proteção contra acesso direto via URL (F5 ou digitar na barra)
    // O usuário DEVE vir da tela de Login clicando no link "Esqueceu?"
    const isExplicitAccess = location.state?.fromLogin;
    
    // Se não veio do login e está no passo 1, chuta para login
    if (!isExplicitAccess && step === 1) {
       navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate, location, step]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuggestedEmails([]);
    setIsLoading(true);
    setSimulatedEmailContent(null);

    await new Promise(r => setTimeout(r, 1000));

    const receivedCode = await requestPasswordReset(email);
    setIsLoading(false);

    if (receivedCode) {
      setStep(2);
      setTimeout(() => {
        setSimulatedEmailContent(receivedCode);
      }, 500);
    } else {
      setError('E-mail não encontrado.');
      // Fetch hints to show the user what actually exists in the database
      const hints = await getRegisteredEmailsHint();
      setSuggestedEmails(hints);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const success = await resetPassword(email, code, newPassword);
    setIsLoading(false);

    if (success) {
      setStep(3);
      setSimulatedEmailContent(null);
    } else {
      setError('Código inválido ou expirado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
      
      {simulatedEmailContent && (
        <div className="absolute top-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-2xl border-l-4 border-accent animate-bounce-in z-50 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Bell className="h-6 w-6 text-accent" />
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-slate-900">Novo E-mail Recebido</p>
                <p className="mt-1 text-sm text-slate-500">OficinaPro: Recuperação de Senha</p>
                <div className="mt-2 bg-slate-100 p-2 rounded text-center">
                  <p className="text-xs text-slate-500 mb-1">Seu código de verificação é:</p>
                  <p className="text-xl font-bold text-slate-800 tracking-widest">{simulatedEmailContent}</p>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none"
                  onClick={() => setSimulatedEmailContent(null)}
                >
                  <span className="sr-only">Fechar</span>
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800 relative z-10">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-200">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-200 text-slate-600 mb-3">
            <KeyRound size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Recuperar Acesso</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            {step === 1 && "Informe seu e-mail para receber o código"}
            {step === 2 && "Digite o código enviado e a nova senha"}
            {step === 3 && "Senha alterada com sucesso"}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4">
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 font-medium flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                  {error}
                </div>
                {/* Dica de contas existentes para resolver o problema do usuário */}
                {step === 1 && suggestedEmails.length > 0 && (
                  <div className="mt-2 pl-3.5 border-l-2 border-red-200">
                    <p className="text-xs text-red-800 font-bold mb-1 flex items-center gap-1">
                      <HelpCircle size={10} /> Contas identificadas neste dispositivo:
                    </p>
                    <ul className="text-xs text-red-700 font-mono">
                      {suggestedEmails.map((e, idx) => (
                        <li key={idx}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail Cadastrado</label>
                <div className="relative group">
                  <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-accent transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-medium"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accentDark disabled:bg-slate-300 text-white font-bold py-3 rounded-lg transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] uppercase tracking-wide text-sm mt-2"
              >
                {isLoading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Código de Verificação</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-center font-mono font-bold tracking-widest text-lg"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nova Senha</label>
                <div className="relative group">
                   <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-accent transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none font-medium"
                    placeholder="Nova senha"
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirmar Senha</label>
                <div className="relative group">
                   <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-accent transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none font-medium"
                    placeholder="Repita a nova senha"
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accentDark disabled:bg-slate-300 text-white font-bold py-3 rounded-lg transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] uppercase tracking-wide text-sm mt-4"
              >
                {isLoading ? 'Salvando...' : 'Alterar Senha'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Tudo Pronto!</h3>
              <p className="text-slate-500 text-sm mt-2 mb-6">Sua senha foi alterada com sucesso. Você já pode acessar o sistema.</p>
              
              <Link 
                to="/login"
                replace
                className="block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-all uppercase tracking-wide text-sm"
              >
                Voltar para Login
              </Link>
            </div>
          )}

          {step !== 3 && (
            <div className="text-center mt-6 pt-4 border-t border-slate-100">
               <Link to="/login" replace className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">
                 <ArrowLeft size={16} /> Voltar
               </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
