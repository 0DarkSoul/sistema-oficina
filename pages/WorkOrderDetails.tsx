
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Save, Trash2, Car as CarIcon, Check, ChevronRight, Calculator, FileDown } from 'lucide-react';
import { getWorkOrderById, getCustomers, getVehicles, saveWorkOrder, getWorkshopSettings } from '../services/dataService';
import { generateWorkOrderPDF } from '../services/pdfService';
import { commonServices } from '../services/mockData';
import { WorkOrder, WorkOrderStatus, Customer, Vehicle, ServiceItem, WorkshopSettings } from '../types';
import { formatCurrency, generateId, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import DocumentHeader from '../components/DocumentHeader';

const StatusStepper: React.FC<{ currentStatus: WorkOrderStatus; onStatusChange: (s: WorkOrderStatus) => void }> = ({ currentStatus, onStatusChange }) => {
  const steps = [ WorkOrderStatus.PENDING_QUOTE, WorkOrderStatus.QUOTE_APPROVED, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.FINISHED, WorkOrderStatus.DELIVERED ];
  const currentIndex = steps.indexOf(currentStatus);
  if (currentIndex === -1) return null; 

  return (
    <div className="w-full py-2 overflow-x-auto no-print">
      <div className="flex items-center min-w-max bg-white p-2 rounded border border-slate-200 shadow-sm">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <React.Fragment key={step}>
              <div onClick={() => onStatusChange(step)} className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-all border text-xs font-bold uppercase tracking-wide select-none ${isCurrent ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : ''} ${isCompleted ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' : ''} ${!isCurrent && !isCompleted ? 'bg-transparent text-slate-300 border-transparent hover:bg-slate-50' : ''}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isCurrent ? 'bg-white text-slate-800' : ''} ${isCompleted ? 'bg-slate-400 text-white' : ''} ${!isCurrent && !isCompleted ? 'bg-slate-200 text-slate-400' : ''}`}>
                  {isCompleted ? <Check size={10} /> : index + 1}
                </div>
                <span className="whitespace-nowrap">{step}</span>
              </div>
              {index < steps.length - 1 && <div className="mx-1 text-slate-300"><ChevronRight size={14} /></div>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const WorkOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);
  const [workshopTerms, setWorkshopTerms] = useState('');
  
  const [isNew, setIsNew] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedCommonService, setSelectedCommonService] = useState('');

  useEffect(() => {
    const init = async () => {
        const allCustomers = await getCustomers();
        const allVehicles = await getVehicles();
        const loadedSettings = await getWorkshopSettings();
        setSettings(loadedSettings);
        setCustomers(allCustomers);
        setVehicles(allVehicles);
        setWorkshopTerms(loadedSettings.policyTerms || 'Garantia de 90 dias.');

        if (id === 'new') {
            setIsNew(true);
            setOrder({
                id: '',
                userId: user?.id || '',
                customerId: '',
                vehicleId: '',
                entryDate: new Date().toISOString(),
                status: WorkOrderStatus.PENDING_QUOTE,
                description: '',
                services: [],
                discount: 0,
                total: 0
            });
        } else {
            const existingOrder = await getWorkOrderById(id!);
            if (existingOrder) {
                setOrder(existingOrder);
                setCustomer(allCustomers.find(c => c.id === existingOrder.customerId) || null);
                setVehicle(allVehicles.find(v => v.id === existingOrder.vehicleId) || null);
            }
        }
    };
    init();
  }, [id, user]);

  useEffect(() => {
    if (order && customer && !isNew) {
        const safeName = customer.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        document.title = `OS_${order.id.toUpperCase().substring(0,6)}_${safeName}`;
    } else {
        document.title = 'OficinaPro ERP';
    }
    return () => { document.title = 'OficinaPro ERP'; };
  }, [order, customer, isNew]);

  const handleCustomerChange = (customerId: string) => {
    setOrder(prev => prev ? { ...prev, customerId, vehicleId: '' } : null);
    const selectedC = customers.find(c => c.id === customerId);
    setCustomer(selectedC || null);
    setAvailableVehicles(vehicles.filter(v => v.customerId === customerId));
  };

  const handleVehicleChange = (vehicleId: string) => {
    setOrder(prev => prev ? { ...prev, vehicleId } : null);
    setVehicle(vehicles.find(v => v.id === vehicleId) || null);
  };

  const handleAddService = (description = '', price = 0) => {
    if (!order) return;
    const newService: ServiceItem = { id: generateId(), description, price };
    setOrder({ ...order, services: [...order.services, newService] });
  };

  const handleAddCommonService = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = e.target.value;
    if (idx === "") return;
    const service = commonServices[Number(idx)];
    handleAddService(service.description, service.price);
    setSelectedCommonService(""); 
  };

  const updateService = (index: number, field: keyof ServiceItem, value: any) => {
    if (!order) return;
    const newServices = [...order.services];
    newServices[index] = { ...newServices[index], [field]: value };
    setOrder({ ...order, services: newServices });
  };

  const removeService = (index: number) => {
    if (!order) return;
    const newServices = order.services.filter((_, i) => i !== index);
    setOrder({ ...order, services: newServices });
  };

  const handleSave = async () => {
    if (!order || !order.customerId || !order.vehicleId) {
      alert('Validação: Selecione cliente e veículo.');
      return;
    }
    const saved = await saveWorkOrder(order);
    navigate(`/work-orders/${saved.id}`);
    setIsNew(false);
  };

  const handlePrintPDF = () => {
    if (order && settings) {
      generateWorkOrderPDF(order, customer, vehicle, settings);
    } else {
      alert("Aguarde o carregamento dos dados para gerar o PDF.");
    }
  };

  const calculateSubtotal = () => order?.services.reduce((acc, s) => acc + Number(s.price), 0) || 0;
  const calculateTotal = () => Math.max(0, calculateSubtotal() - (order?.discount || 0));

  if (!order) return <div className="p-8 text-center text-slate-500">Carregando O.S....</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 print:p-0 print:max-w-none print:pb-0">
      <div className="mb-6 flex justify-between items-center no-print sticky top-0 bg-slate-50/90 z-20 py-4 border-b border-slate-200 backdrop-blur-md">
        <button onClick={() => navigate('/work-orders')} className="flex items-center text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">
          <ArrowLeft size={16} className="mr-1" /> Voltar para Lista
        </button>
        <div className="flex gap-2">
          {!isNew && (
            <button onClick={handlePrintPDF} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded border border-slate-300 hover:bg-slate-50 shadow-sm text-sm font-medium transition-all">
              <FileDown size={16} /> Baixar PDF / Imprimir
            </button>
          )}
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-accent text-white rounded hover:bg-accentDark shadow-sm shadow-sky-500/20 text-sm font-bold transition-all uppercase tracking-wide">
            <Save size={16} /> {isNew ? 'Criar OS' : 'Salvar'}
          </button>
        </div>
      </div>

      {!isNew && (
        <div className="mb-6 no-print">
          <StatusStepper currentStatus={order.status} onStatusChange={(s) => setOrder({ ...order, status: s })} />
        </div>
      )}

      <div className="bg-white shadow-md border border-slate-200 print:shadow-none print:border-none print:w-full print:bg-white">
        <div className="px-8 pt-8 print:px-0 print:pt-0">
           <DocumentHeader title={isNew ? 'NOVA ORDEM' : `OS #${order.id.toUpperCase().substring(0,6)}`} subtitle={`Emissão: ${formatDate(order.entryDate)}`} rightContent={<div className="inline-block px-3 py-1 bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold uppercase rounded print:bg-white print:border-black print:px-2 print:py-0.5">{order.status}</div>} />
        </div>

        <div className="p-8 print:px-0 print:py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 mb-6">
                <div className="border border-slate-200 rounded p-4 bg-slate-50/50 relative hover:border-slate-300 transition-colors print:border-black print:bg-transparent print:rounded-none">
                    <h3 className="absolute -top-2.5 left-3 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 rounded print:border-none print:text-black print:bg-white">Dados do Cliente</h3>
                    {isNew ? (
                        <select className="w-full p-2.5 border border-slate-300 rounded bg-white text-sm text-slate-900 font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none mt-1" value={order.customerId} onChange={(e) => handleCustomerChange(e.target.value)}>
                        <option value="">-- Selecione o Cliente --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    ) : (
                        <div className="pt-1">
                            <div className="font-bold text-slate-900 text-lg leading-tight mb-1">{customer?.name}</div>
                            <div className="text-sm text-slate-700 flex flex-col gap-0.5">
                                <span className="font-medium">Doc: {customer?.document}</span>
                                <span>Tel: {customer?.phone}</span>
                                <span className="text-slate-500 print:text-slate-700">{customer?.address}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border border-slate-200 rounded p-4 bg-slate-50/50 relative hover:border-slate-300 transition-colors print:border-black print:bg-transparent print:rounded-none">
                    <h3 className="absolute -top-2.5 left-3 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 rounded print:border-none print:text-black print:bg-white">Dados do Veículo</h3>
                    {isNew ? (
                        <select className="w-full p-2.5 border border-slate-300 rounded bg-white text-sm text-slate-900 font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none disabled:opacity-50 disabled:bg-slate-50 mt-1" value={order.vehicleId} onChange={(e) => handleVehicleChange(e.target.value)} disabled={!order.customerId}>
                        <option value="">-- Selecione o Veículo --</option>
                        {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.model} - {v.plate}</option>)}
                        </select>
                    ) : (
                        <div className="pt-1">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-900 text-lg leading-tight">{vehicle?.model}</span>
                                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-slate-800 text-sm print:border-black print:text-black">{vehicle?.plate}</span>
                            </div>
                            <div className="text-sm text-slate-700 mt-1">{vehicle?.brand} • {vehicle?.year} • {vehicle?.color}</div>
                        </div>
                    )}
                </div>
            </div>
        
          <div className="mb-8 print:mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 print:text-black">Relato do Problema / Observações</label>
            <textarea className="w-full border border-slate-300 rounded p-3 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none min-h-[80px] resize-none print:border-black print:text-black print:bg-transparent" value={order.description} onChange={(e) => setOrder({...order, description: e.target.value})} placeholder="Descreva os danos ou serviços solicitados..." />
          </div>

          <div className="mb-2 flex flex-col sm:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-2 print:border-black">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 print:text-black"><Calculator size={20} className="text-slate-400 print:hidden"/> Serviços & Peças</h3>
             <div className="flex gap-2 no-print w-full sm:w-auto">
               <select className="flex-1 sm:w-64 border border-slate-300 rounded px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-accent/20 outline-none shadow-sm cursor-pointer" value={selectedCommonService} onChange={handleAddCommonService}>
                 <option value="">+ Item Rápido...</option>
                 {commonServices.map((s, idx) => (
                   <option key={idx} value={idx}>{s.description} ({formatCurrency(s.price)})</option>
                 ))}
               </select>
               <button onClick={() => handleAddService()} className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 text-sm font-medium transition-colors">Adicionar Vazio</button>
             </div>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden mb-6 shadow-sm print:border-x-0 print:border-t-0 print:border-b-2 print:border-black print:shadow-none print:rounded-none">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 print:bg-slate-100 print:text-black print:border-black">
                <tr>
                  <th className="text-left py-2 px-4 font-bold uppercase text-xs w-16">Item</th>
                  <th className="text-left py-2 px-4 font-bold uppercase text-xs">Descrição do Serviço / Peça</th>
                  <th className="text-right py-2 px-4 font-bold uppercase text-xs w-32">Valor (R$)</th>
                  <th className="w-10 no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-300">
                {order.services.map((service, index) => (
                  <tr key={service.id || index} className="group hover:bg-sky-50/10 transition-colors print:hover:bg-transparent">
                    <td className="py-2 px-4 text-slate-400 font-mono text-xs select-none print:text-black align-middle">{(index + 1).toString().padStart(2, '0')}</td>
                    <td className="py-2 px-4 align-middle">
                      <input type="text" className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 placeholder-slate-300 font-medium print:text-black print:font-normal" placeholder="Descreva o serviço..." value={service.description} onChange={(e) => updateService(index, 'description', e.target.value)} />
                    </td>
                    <td className="py-2 px-4 align-middle">
                      <input type="number" className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right text-slate-900 font-mono focus:border-accent focus:ring-1 focus:ring-accent outline-none print:border-none print:bg-transparent print:p-0 print:text-black" placeholder="0.00" step="0.01" value={service.price} onChange={(e) => updateService(index, 'price', Number(e.target.value))} />
                    </td>
                    <td className="text-center no-print px-2 align-middle">
                      <button onClick={() => removeService(index)} className="text-slate-300 hover:text-red-500 transition-colors p-1" tabIndex={-1}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {order.services.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400 italic bg-slate-50/20 print:hidden">Nenhum item lançado nesta ordem de serviço.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 print:break-inside-avoid">
             <div className="flex-1 no-print">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Anotações Internas (Não sai na impressão)</label>
               <textarea className="w-full h-24 border border-slate-200 rounded bg-white p-2 text-xs text-slate-600 resize-none focus:border-accent outline-none" placeholder="Observações privadas da oficina..."></textarea>
             </div>
             
             <div className="hidden print:block flex-1"></div>

             <div className="w-full sm:w-80 bg-slate-50 rounded p-4 border border-slate-200 print:bg-transparent print:border-none print:w-72 print:p-0">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-slate-500 font-medium print:text-black">Subtotal</span>
                  <span className="text-slate-800 font-mono font-bold print:text-black">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center mb-3 text-sm">
                  <span className="text-slate-500 font-medium print:text-black">Desconto</span>
                  <div className="flex items-center text-red-600 font-mono font-bold print:text-black">
                    <span className="mr-1">-</span>
                    <span className="print:hidden">R$</span>
                    <input type="number" className="w-20 text-right bg-white border border-slate-200 rounded focus:border-red-500 outline-none p-1 ml-1 text-red-600 font-mono font-bold text-sm h-7 print:border-none print:bg-transparent print:text-black print:p-0 print:w-auto" value={order.discount} onChange={(e) => setOrder({...order, discount: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-3 flex justify-between items-center print:border-black print:border-t-2 print:pt-2">
                  <span className="text-base font-bold text-slate-900 uppercase print:text-black">Total Líquido</span>
                  <span className="text-xl font-bold text-slate-900 font-mono bg-white px-3 py-1 rounded border border-slate-200 shadow-sm print:border-none print:bg-transparent print:px-0 print:text-black print:shadow-none">{formatCurrency(calculateTotal())}</span>
                </div>
             </div>
          </div>
          
          <div className="hidden print:block mt-8 text-center text-[10px] text-slate-400">
             Visualize o PDF gerado para imprimir o documento oficial.
          </div>
        </div>
      </div>
    </div>
  );
};
export default WorkOrderDetails;
