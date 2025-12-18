
import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getWorkOrders, getCustomers, getVehicles } from '../services/dataService';
import { WorkOrder, WorkOrderStatus, Customer, Vehicle } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const WorkOrders: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setOrders(await getWorkOrders());
      setCustomers(await getCustomers());
      setVehicles(await getVehicles());
    }
    fetch();
  }, []);

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Desconhecido';
  const getVehicleInfo = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.model} (${v.plate})` : 'Desconhecido';
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    let classes = '';
    switch (status) {
      case WorkOrderStatus.PENDING_QUOTE: classes = 'bg-amber-100 text-amber-800 border-amber-200'; break;
      case WorkOrderStatus.QUOTE_APPROVED: classes = 'bg-indigo-100 text-indigo-800 border-indigo-200'; break;
      case WorkOrderStatus.IN_PROGRESS: classes = 'bg-sky-100 text-sky-800 border-sky-200'; break;
      case WorkOrderStatus.FINISHED: classes = 'bg-emerald-100 text-emerald-800 border-emerald-200'; break;
      case WorkOrderStatus.DELIVERED: classes = 'bg-slate-100 text-slate-800 border-slate-200'; break;
      case WorkOrderStatus.CANCELED: classes = 'bg-red-50 text-red-800 border-red-200'; break;
      default: classes = 'bg-slate-100 text-slate-800';
    }
    return <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${classes}`}>{status}</span>;
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'ALL' || order.status === filter;
    const customerName = getCustomerName(order.customerId).toLowerCase();
    const vehicleInfo = getVehicleInfo(order.vehicleId).toLowerCase();
    const matchesSearch = customerName.includes(search.toLowerCase()) || vehicleInfo.includes(search.toLowerCase()) || order.id.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded border border-slate-200 shadow-sm">
        <div><h1 className="text-lg font-bold text-slate-800">Ordens de Serviço</h1><p className="text-xs text-slate-500">Gestão de fila e orçamentos</p></div>
        <Link to="/work-orders/new" className="flex items-center gap-2 bg-accent hover:bg-accentDark text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm"><Plus size={16} /> Nova O.S.</Link>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input type="text" placeholder="Pesquisar OS, cliente ou placa..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter size={14} className="text-slate-500" /></div>
          <select className="pl-9 pr-8 py-2 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent appearance-none cursor-pointer" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">Status: Todos</option>
            {Object.values(WorkOrderStatus).map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600 w-24">OS ID</th>
                <th className="px-4 py-3 font-semibold text-slate-600 w-32">Entrada</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Cliente / Veículo</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">Nenhuma ordem de serviço encontrada com os filtros atuais.</td></tr>
              ) : (
                filteredOrders.map((order, idx) => (
                  <tr key={order.id} onClick={() => navigate(`/work-orders/${order.id}`)} className={`cursor-pointer transition-colors hover:bg-sky-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">#{order.id.toUpperCase().substring(0, 6)}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{formatDate(order.entryDate)}</td>
                    <td className="px-4 py-3"><div className="font-medium text-slate-800">{getCustomerName(order.customerId)}</div><div className="text-xs text-slate-500">{getVehicleInfo(order.vehicleId)}</div></td>
                    <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 text-right tabular-nums">{order.total > 0 ? formatCurrency(order.total) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-xs text-slate-500 flex justify-between">
           <span>Mostrando {filteredOrders.length} registros</span>
           <span>OficinaPro v1.0</span>
        </div>
      </div>
    </div>
  );
};
export default WorkOrders;
