
import React, { useEffect, useState } from 'react';
import { 
  DollarSign, Wrench, CheckCircle, Clock, Calendar, 
  ArrowRight, Activity, TrendingUp, AlertCircle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, PieChart, Pie 
} from 'recharts';
import { getDashboardStats, getWorkOrders, getCustomers, getVehicles } from '../services/dataService';
import { DashboardStats, WorkOrder, WorkOrderStatus, Customer, Vehicle } from '../types';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/formatters';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<(WorkOrder & { customerName: string; vehicleName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- TIME GREETING ---
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const todayFull = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
        
        // Fetch recent list data
        const allOrders = await getWorkOrders();
        const allCustomers = await getCustomers();
        const allVehicles = await getVehicles();

        const active = allOrders
          .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
          .slice(0, 5) // Last 5
          .map(o => ({
              ...o,
              customerName: allCustomers.find(c => c.id === o.customerId)?.name || 'Desconhecido',
              vehicleName: allVehicles.find(v => v.id === o.vehicleId)?.model || 'Veículo'
          }));
        
        setRecentOrders(active);
        setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !stats) {
      return (
          <div className="flex h-full items-center justify-center p-12">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-accent rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium animate-pulse">Carregando indicadores...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-1">
              <Calendar size={14} />
              <span className="capitalize">{todayFull}</span>
           </div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">Equipe {stats.workshopName}</span>
           </h1>
           <p className="text-slate-500 mt-1">Aqui está o resumo da sua operação hoje.</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Em Serviço */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
              <Wrench size={60} className="text-sky-600" />
           </div>
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
                 <Wrench size={24} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded">Ativos</span>
           </div>
           <div>
              <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{stats.inProgress}</h3>
              <p className="text-sm text-slate-500 font-medium">Veículos em serviço</p>
           </div>
        </div>

        {/* Card 2: Finalizados Hoje */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
              <CheckCircle size={60} className="text-emerald-600" />
           </div>
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                 <CheckCircle size={24} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded">Hoje</span>
           </div>
           <div>
              <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{stats.finishedToday}</h3>
              <p className="text-sm text-slate-500 font-medium">Serviços entregues</p>
           </div>
        </div>

        {/* Card 3: Faturamento Mensal */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
              <DollarSign size={60} className="text-indigo-600" />
           </div>
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                 <DollarSign size={24} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded">Mensal</span>
           </div>
           <div>
              <h3 className="text-2xl font-bold text-slate-800 tabular-nums tracking-tight">{formatCurrency(stats.monthlyRevenue)}</h3>
              <p className="text-sm text-slate-500 font-medium">Faturamento acumulado</p>
           </div>
        </div>

        {/* Card 4: Atrasados/Críticos */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
              <AlertCircle size={60} className="text-red-600" />
           </div>
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 rounded-lg text-red-600">
                 <Clock size={24} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-100 bg-red-600 px-2 py-1 rounded">Atenção</span>
           </div>
           <div>
              <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{stats.delayedOrders}</h3>
              <p className="text-sm text-slate-500 font-medium">Serviços atrasados (+10d)</p>
           </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Chart 1: Revenue History */}
         <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-lg font-bold text-slate-800">Histórico de Faturamento</h3>
                   <p className="text-sm text-slate-500">Últimos 6 meses de operação</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                   <TrendingUp size={20} className="text-slate-400" />
                </div>
            </div>
            
            {/* CONTAINER FIXO OBRIGATÓRIO PARA EVITAR ERROS DO RECHARTS */}
            <div style={{ width: '100%', height: '320px', minHeight: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflowX: 'auto' }}>
                {stats.revenueHistory && stats.revenueHistory.length > 0 ? (
                  <BarChart width={500} height={300} data={stats.revenueHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 12, fill: '#64748b'}} 
                          dy={10} 
                      />
                      <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 11, fill: '#94a3b8'}} 
                          tickFormatter={(value) => `R$${value/1000}k`}
                      />
                      <Tooltip 
                          cursor={{fill: '#f1f5f9'}}
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                          formatter={(value: number) => [formatCurrency(value), 'Receita']}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                          {stats.revenueHistory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill="#0284c7" />
                          ))}
                      </Bar>
                  </BarChart>
                ) : (
                  <div className="text-slate-400 text-sm">Sem dados de faturamento para exibir.</div>
                )}
            </div>
         </div>

         {/* Chart 2: Status Distribution */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
             <div className="mb-4">
                 <h3 className="text-lg font-bold text-slate-800">Status da Oficina</h3>
                 <p className="text-sm text-slate-500">Distribuição atual dos serviços</p>
             </div>
             
             {/* CONTAINER FIXO OBRIGATÓRIO PARA EVITAR ERROS DO RECHARTS */}
             <div style={{ width: '100%', height: '320px', minHeight: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                 {stats.statusDistribution && stats.statusDistribution.length > 0 ? (
                   <>
                     <PieChart width={300} height={300}>
                         <Pie
                            data={stats.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                         >
                            {stats.statusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                         </Pie>
                         <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px'}} />
                     </PieChart>
                     {/* Center Label */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-3xl font-bold text-slate-800 tabular-nums">{stats.inProgress + stats.pendingQuotes + stats.delayedOrders}</span>
                         <span className="text-[10px] uppercase font-bold text-slate-400">Total Aberto</span>
                     </div>
                   </>
                 ) : (
                    <div className="text-slate-400 text-sm">Sem dados de status.</div>
                 )}
             </div>

             <div className="grid grid-cols-2 gap-2 mt-4">
                {stats.statusDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor: item.color}}></div>
                        <span className="truncate">{item.name} ({item.value})</span>
                    </div>
                ))}
             </div>
         </div>
      </div>

      {/* RECENT LIST SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Activity size={18} className="text-sky-600" />
                      Últimas Entradas
                  </h3>
              </div>
              <button 
                onClick={() => navigate('/work-orders')} 
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
              >
                Ver todas <ArrowRight size={12} />
              </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-400 font-semibold border-b border-slate-100">
                      <tr>
                          <th className="px-6 py-3 text-xs uppercase w-32">OS #</th>
                          <th className="px-6 py-3 text-xs uppercase">Cliente / Veículo</th>
                          <th className="px-6 py-3 text-xs uppercase">Status</th>
                          <th className="px-6 py-3 text-xs uppercase text-right">Valor</th>
                          <th className="px-6 py-3 text-xs uppercase text-right w-32">Data</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {recentOrders.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">Nenhum serviço registrado recentemente.</td></tr>
                      ) : (
                          recentOrders.map((order) => (
                              <tr 
                                key={order.id} 
                                onClick={() => navigate(`/work-orders/${order.id}`)}
                                className="group hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                  <td className="px-6 py-4">
                                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                                        #{order.id.toUpperCase().substring(0,6)}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="font-bold text-slate-800">{order.customerName}</div>
                                      <div className="text-xs text-slate-500">{order.vehicleName}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                        ${order.status === WorkOrderStatus.FINISHED ? 'bg-emerald-100 text-emerald-700' : ''}
                                        ${order.status === WorkOrderStatus.IN_PROGRESS ? 'bg-sky-100 text-sky-700' : ''}
                                        ${order.status === WorkOrderStatus.PENDING_QUOTE ? 'bg-amber-100 text-amber-700' : ''}
                                        ${order.status === WorkOrderStatus.DELIVERED ? 'bg-slate-100 text-slate-600' : ''}
                                      `}>
                                          {order.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right font-medium text-slate-700 tabular-nums">
                                      {formatCurrency(order.total)}
                                  </td>
                                  <td className="px-6 py-4 text-right text-slate-500 text-xs tabular-nums">
                                      {formatDate(order.entryDate)}
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

    </div>
  );
};

export default Dashboard;
