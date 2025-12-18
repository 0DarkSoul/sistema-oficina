import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import { CheckCircle, QrCode, ShieldCheck, LogOut, Copy, MessageCircle, Key, Lock, HelpCircle, Database, Calendar, AlertOctagon } from 'lucide-react';

const Subscription: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [licenseCode, setLicenseCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  // DADOS REAIS DE PAGAMENTO
  const PIX_KEY = "55996712576"; 
  const WHATSAPP_NUMBER = "55996712576"; 

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    alert("Chave PIX copiada!");
  };

  const handleSendReceipt = () => {
    const text = encodeURIComponent(`Olá, paguei o OficinaPro! Meu email é: ${user?.email}. Aguardo meu código de ativação.`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 1000));

    const result = await paymentService.validateLicense(user!.id, user!.email, licenseCode);

    if (result.success) {
      refreshUser();
      setIsSuccess(true);
      setTimeout(() => {
          navigate('/');
      }, 2500);
    } else {
      setError(result.message || 'Código inválido.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-800 flex flex-col md:flex-row my-8">
        
        {/* Esquerda: Info */}
        <div className="p-8 md:w-5/12 bg-slate-50 border-r border-slate-200 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="text-emerald-600" size={24}/>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ambiente Seguro</h2>
            </div>
            
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm mb-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-bl">MENSAL</div>
               <div className="flex justify-between items-center pt-2">
                 <span className="text-base font-bold text-slate-900">Assinatura Mensal</span>
                 <span className="text-2xl font-bold text-emerald-600 tracking-tight">R$ 65,00</span>
               </div>
               <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                 <Calendar size={12} className="text-slate-400"/>
                 <span>Libera acesso por exatos 30 dias.</span>
               </div>
            </div>

            {/* Aviso de Dados Seguros */}
            <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
               <Database className="text-blue-500 shrink-0 mt-0.5" size={18} />
               <div>
                  <h4 className="text-sm font-bold text-blue-900">Seus dados estão salvos!</h4>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Não se preocupe, o sistema bloqueou o acesso apenas por segurança. Seus clientes e O.S. continuam gravados e voltarão assim que ativar.
                  </p>
               </div>
            </div>

            <ol className="relative border-l border-slate-300 ml-3 space-y-6">                  
              <li className="mb-2 ml-4">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-200 rounded-full -left-3 ring-4 ring-white text-xs font-bold text-slate-600">
                      1
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">Faça o PIX</h3>
                  <p className="text-xs text-slate-500">Use a chave ao lado para transferir.</p>
              </li>
              <li className="mb-2 ml-4">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-200 rounded-full -left-3 ring-4 ring-white text-xs font-bold text-slate-600">
                      2
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">Envie o Comprovante</h3>
                  <p className="text-xs text-slate-500">Mande no WhatsApp para receber seu código.</p>
              </li>
              <li className="mb-2 ml-4">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full -left-3 ring-4 ring-white text-emerald-600">
                      <Key size={12} />
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">Digite o Código</h3>
                  <p className="text-xs text-slate-500">Insira o código recebido para liberar.</p>
              </li>
            </ol>
          </div>
          
          <div className="pt-6 mt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col gap-2">
             <p>Conta: <strong>{user?.email}</strong></p>
             <button onClick={logout} className="text-red-500 hover:underline flex items-center gap-1 w-fit">
               <LogOut size={12}/> Sair desta conta
             </button>
          </div>
        </div>

        {/* Direita: Ação */}
        <div className="p-8 md:w-7/12 bg-white flex flex-col items-center relative">
          
          {!isSuccess ? (
            <div className="w-full max-w-md animate-fade-in flex flex-col h-full">
              
              <div className="text-center mb-6">
                 <h3 className="text-lg font-bold text-slate-900">Renovação de Acesso</h3>
                 <p className="text-slate-500 text-sm">Transfira e valide seu código abaixo.</p>
              </div>

              {/* PIX AREA */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex items-center justify-between gap-3">
                 <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-white p-2 rounded border border-slate-200 shrink-0">
                       <QrCode size={24} className="text-slate-700"/>
                    </div>
                    <div className="min-w-0">
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Chave PIX (Celular)</p>
                       <p className="text-lg font-mono font-bold text-slate-800 truncate">{PIX_KEY}</p>
                    </div>
                 </div>
                 <button 
                    onClick={handleCopyPix}
                    className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 p-2 rounded transition-colors"
                    title="Copiar"
                  >
                    <Copy size={20} />
                  </button>
              </div>

              <button 
                  onClick={handleSendReceipt}
                  className="w-full mb-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle size={18} />
                  Pedir Código no WhatsApp
              </button>

              <div className="border-t border-slate-100 my-2"></div>

              {/* ACTIVATION FORM */}
              <form onSubmit={handleActivate} className="mt-4">
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1">
                    <Lock size={12} /> Digite seu Código de Ativação
                 </label>
                 <div className="flex gap-2">
                    <input 
                      type="text"
                      required
                      placeholder="Ex: PRO-A1B2-C3D4"
                      className="flex-1 border-2 border-slate-300 rounded-lg px-4 py-3 text-center font-mono font-bold text-lg uppercase focus:border-accent focus:ring-0 outline-none tracking-widest"
                      value={licenseCode}
                      onChange={(e) => setLicenseCode(e.target.value)}
                    />
                 </div>
                 
                 {error && (
                    <div className="mt-3 text-red-600 text-xs font-bold bg-red-50 p-2 rounded border border-red-100 text-center animate-pulse flex items-center gap-2 justify-center">
                        <AlertOctagon size={14} />
                        {error}
                    </div>
                 )}

                 <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verificando...' : 'Validar Código'}
                </button>
              </form>

              {/* FAQ Toggle */}
              <div className="mt-auto pt-6 text-center">
                 <button 
                    onClick={() => setShowFaq(!showFaq)}
                    className="flex items-center justify-center gap-1 w-full text-xs text-slate-400 hover:text-accent transition-colors"
                 >
                    <HelpCircle size={12} />
                    {showFaq ? 'Ocultar ajuda' : 'Como funciona?'}
                 </button>

                 {showFaq && (
                    <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                        Após enviar o comprovante no WhatsApp, nossa equipe verificará o pagamento e enviará o código. Ao inserir, seu sistema libera na hora com todos os dados salvos.
                    </p>
                 )}
              </div>

            </div>
          ) : (
             <div className="text-center animate-bounce-in py-12">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle size={48} />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Acesso Liberado!</h3>
                <p className="text-slate-500 mt-2 text-lg">Obrigado por assinar o OficinaPro.</p>
                <div className="mt-8">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-accent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-400 mt-3 font-mono">Carregando seus dados...</p>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Subscription;