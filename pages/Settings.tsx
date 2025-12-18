
import React, { useEffect, useState } from 'react';
import { Database, Download, ShieldCheck, User, Building, Upload, Home, Briefcase, FileText, Save, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { exportSystemData, getSystemStatus, getWorkshopSettings, saveWorkshopSettings } from '../services/dataService';
import { WorkshopSettings } from '../types';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'workshop' | 'data'>('workshop');
  const [dbStatus, setDbStatus] = useState({ users: 0, customers: 0, orders: 0 });
  const [workshop, setWorkshop] = useState<WorkshopSettings>({
    name: '', document: '', email: '', phone: '',
    address: { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' },
    policyTerms: ''
  });
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const load = async () => {
        setDbStatus(await getSystemStatus());
        const settings = await getWorkshopSettings();
        setWorkshop(settings);
    }
    load();
  }, []);

  const handleDownloadBackup = async () => {
    const data = await exportSystemData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_oficinapro_cloud_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200000) { 
        alert("A imagem deve ter no máximo 200KB. Use um logo menor ou comprimido.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkshop({ ...workshop, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveWorkshopSettings(workshop);
    setSaveMessage("Configurações da oficina salvas com sucesso!");
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
        <h1 className="text-lg font-bold text-slate-800">Ajustes do Sistema</h1>
        <p className="text-xs text-slate-500">Personalize sua experiência e gerencie seus dados</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex flex-col gap-2">
           <button onClick={() => setActiveTab('workshop')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'workshop' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
              <Building size={18} /> Dados da Oficina
           </button>
           <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
              <User size={18} /> Minha Conta
           </button>
           <button onClick={() => setActiveTab('data')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'data' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
              <Database size={18} /> Banco de Dados
           </button>
        </div>

        <div className="flex-1">
            {activeTab === 'workshop' && (
                <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2"><Briefcase size={18} className="text-slate-500"/><h3 className="font-bold text-slate-700 text-sm uppercase">Identidade da Oficina</h3></div>
                        {saveMessage && <span className="text-xs font-bold text-emerald-600 animate-pulse">{saveMessage}</span>}
                    </div>
                    
                    <form onSubmit={handleSaveWorkshop} className="p-6 space-y-6">
                        <div className="flex items-start gap-6 border-b border-slate-100 pb-6">
                            <div className="w-24 h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                                {workshop.logo ? <img src={workshop.logo} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-400" size={32} />}
                                <label className="absolute inset-0 bg-black/50 text-white text-[10px] font-bold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><Upload size={16} className="mb-1"/> Alterar<input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} /></label>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800">Logotipo da Empresa</h4>
                                <p className="text-sm text-slate-500 mb-2">Este logo aparecerá no cabeçalho de todos os orçamentos e relatórios.</p>
                                <p className="text-xs text-slate-400">Recomendado: PNG Transparente (Max 200KB)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Fantasia</label><input required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={workshop.name} onChange={e => setWorkshop({...workshop, name: e.target.value})} placeholder="Ex: Oficina Mecânica Silva" /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razão Social (Opcional)</label><input className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={workshop.legalName || ''} onChange={e => setWorkshop({...workshop, legalName: e.target.value})} placeholder="Ex: Silva Serviços Automotivos LTDA" /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">CNPJ / CPF</label><input required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={workshop.document} onChange={e => setWorkshop({...workshop, document: e.target.value})} placeholder="00.000.000/0000-00" /></div>
                             <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone / WhatsApp</label><input required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={workshop.phone} onChange={e => setWorkshop({...workshop, phone: e.target.value})} placeholder="(00) 00000-0000" /></div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço Completo</label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                                <input className="md:col-span-3 border border-slate-300 rounded px-3 py-2 bg-white text-sm focus:outline-none" placeholder="Rua / Avenida" value={workshop.address.street} onChange={e => setWorkshop({...workshop, address: {...workshop.address, street: e.target.value}})} />
                                <input className="border border-slate-300 rounded px-3 py-2 bg-white text-sm focus:outline-none" placeholder="Número" value={workshop.address.number} onChange={e => setWorkshop({...workshop, address: {...workshop.address, number: e.target.value}})} />
                            </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <input className="md:col-span-2 border border-slate-300 rounded px-3 py-2 bg-white text-sm focus:outline-none" placeholder="Bairro" value={workshop.address.neighborhood} onChange={e => setWorkshop({...workshop, address: {...workshop.address, neighborhood: e.target.value}})} />
                                <input className="border border-slate-300 rounded px-3 py-2 bg-white text-sm focus:outline-none" placeholder="Cidade" value={workshop.address.city} onChange={e => setWorkshop({...workshop, address: {...workshop.address, city: e.target.value}})} />
                                <input className="border border-slate-300 rounded px-3 py-2 bg-white text-sm focus:outline-none" placeholder="UF" value={workshop.address.state} onChange={e => setWorkshop({...workshop, address: {...workshop.address, state: e.target.value}})} />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Termos e Garantias (Rodapé dos Documentos)</label>
                            <textarea className="w-full h-20 border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none resize-none" value={workshop.policyTerms || ''} onChange={e => setWorkshop({...workshop, policyTerms: e.target.value})} placeholder="Ex: Garantia de 90 dias para serviços. Peças com garantia do fabricante." />
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded shadow-lg transition-all flex items-center gap-2"><Save size={18} /> Salvar Configurações</button>
                        </div>
                    </form>
                </div>
            )}
            {activeTab === 'profile' && (
                <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <User size={18} className="text-slate-500"/>
                        <h3 className="font-bold text-slate-700 text-sm uppercase">Dados da Conta</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-600 border border-slate-200">
                                {user?.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{user?.name}</h4>
                                <p className="text-sm text-slate-500">{user?.email}</p>
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase">
                                    <ShieldCheck size={12} />
                                    {user?.subscriptionStatus === 'ACTIVE' ? 'Assinatura Ativa' : 'Período de Teste'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'data' && (
                <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <Database size={18} className="text-accent"/>
                        <h3 className="font-bold text-slate-700 text-sm uppercase">Gerenciamento de Dados</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-slate-600 mb-6">
                            Você está usando o banco de dados em nuvem. Seus dados estão seguros e persistem a reinicializações.
                        </p>
                        <div className="bg-slate-50 p-4 rounded border border-slate-200 mb-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div><span className="block text-xl font-bold text-slate-800 tabular-nums">{dbStatus.customers}</span><span className="text-[10px] uppercase font-bold text-slate-400">Clientes</span></div>
                                <div><span className="block text-xl font-bold text-slate-800 tabular-nums">{dbStatus.orders}</span><span className="text-[10px] uppercase font-bold text-slate-400">Ordens</span></div>
                                <div><span className="block text-xl font-bold text-slate-800 tabular-nums">{dbStatus.users}</span><span className="text-[10px] uppercase font-bold text-slate-400">Usuários</span></div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button onClick={handleDownloadBackup} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"><Download size={18} /> Baixar Backup JSON (Nuvem)</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
export default Settings;
