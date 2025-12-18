
import React, { useState, useEffect } from 'react';
import { getWorkOrders, getWorkshopSettings } from '../services/dataService';
import { generateFinancialReportPDF } from '../services/pdfService';
import { WorkOrder, WorkOrderStatus, WorkshopSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { FileDown, Calendar, Search, TrendingUp, Hash, DollarSign, Filter } from 'lucide-react';

const Reports: React.FC = () => {
  const [allOrders, setAllOrders] = useState<WorkOrder[]>([]);
  const [filteredData, setFilteredData] = useState<WorkOrder[]>([]);
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);
  
  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateRangeLabel, setDateRangeLabel] = useState('Personalizado');

  useEffect(() => {
    const fetch = async () => {
        const data = await getWorkOrders();
        // Filter only completed/revenue generating orders
        const completed = data.filter(o => 
            o.status === WorkOrderStatus.FINISHED || 
            o.status === WorkOrderStatus.DELIVERED
        );
        setAllOrders(completed);
        setSettings(await getWorkshopSettings());
        
        // Default to Current Month
        handleQuickFilter('THIS_MONTH');
    }
    fetch();
  }, []);

  useEffect(() => {
      if (startDate && endDate) {
          applyFilter();
      }
  }, [startDate, endDate]);

  const applyFilter = () => {
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const result = allOrders.filter(o => {
        // Use exitDate if available (actual revenue date), otherwise entryDate
        const dateRef = new Date(o.exitDate || o.entryDate);
        return dateRef >= start && dateRef <= end;
    });

    setFilteredData(result);
  };

  const handleQuickFilter = (type: 'TODAY' | 'THIS_MONTH' | 'LAST_MONTH') => {
      const now = new Date();
      let start = new Date();
      let end = new Date();
      let label = '';

      if (type === 'TODAY') {
          start = now;
          end = now;
          label = 'Hoje';
      } else if (type === 'THIS_MONTH') {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          label = 'Este Mês';
      } else if (type === 'LAST_MONTH') {
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0);
          label = 'Mês Passado';
      }

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setDateRangeLabel(label);
  };

  const handlePrintPDF = () => {
    if (settings) {
      generateFinancialReportPDF(filteredData, startDate, endDate, settings);
    }
  };

  // KPIs Calculation
  const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.total, 0);
  const count = filteredData.length;
  const averageTicket = count > 0 ? totalRevenue / count : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Relatórios Financeiros</h1>
          <p className="text-sm text-slate-500">Análise de faturamento e serviços realizados</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrintPDF} disabled={count === 0} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded shadow-sm text-sm font-bold transition-all">
                <FileDown size={18} /> 
                <span className="hidden sm:inline">Exportar PDF Oficial</span>
                <span className="sm:hidden">PDF</span>
            </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-end">
              
              {/* Quick Filters */}
              <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Filter size={12}/> Filtros Rápidos</label>
                  <div className="flex gap-2">
                      <button onClick={() => handleQuickFilter('TODAY')} className={`px-3 py-2 rounded text-sm font-medium border transition-colors ${dateRangeLabel === 'Hoje' ? 'bg-accent/10 border-accent text-accent' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>Hoje</button>
                      <button onClick={() => handleQuickFilter('THIS_MONTH')} className={`px-3 py-2 rounded text-sm font-medium border transition-colors ${dateRangeLabel === 'Este Mês' ? 'bg-accent/10 border-accent text-accent' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>Este Mês</button>
                      <button onClick={() => handleQuickFilter('LAST_MONTH')} className={`px-3 py-2 rounded text-sm font-medium border transition-colors ${dateRangeLabel === 'Mês Passado' ? 'bg-accent/10 border-accent text-accent' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>Mês Passado</button>
                  </div>
              </div>

              {/* Date Inputs */}
              <div className="flex gap-2 w-full md:w-auto">
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início</label>
                      <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setDateRangeLabel('Personalizado'); }} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-accent/20 outline-none" />
                  </div>
                  <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim</label>
                      <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setDateRangeLabel('Personalizado'); }} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-accent/20 outline-none" />
                  </div>
              </div>
          </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Faturamento Total</p>
                  <h3 className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalRevenue)}</h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                  <DollarSign className="text-emerald-600" size={24} />
              </div>
          </div>
          <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ticket Médio</p>
                  <h3 className="text-2xl font-bold text-blue-600 tabular-nums">{formatCurrency(averageTicket)}</h3>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                  <TrendingUp className="text-blue-600" size={24} />
              </div>
          </div>
          <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Serviços Finalizados</p>
                  <h3 className="text-2xl font-bold text-slate-700 tabular-nums">{count}</h3>
              </div>
              <div className="bg-slate-100 p-3 rounded-lg">
                  <Hash className="text-slate-600" size={24} />
              </div>
          </div>
      </div>

      {/* Table Preview */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-700 text-sm uppercase">Detalhamento dos Lançamentos</h3>
             <span className="text-xs text-slate-500 font-mono bg-white px-2 py-1 rounded border border-slate-200">{filteredData.length} registros</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-500 border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-3 font-bold uppercase text-xs w-32">Data</th>
                        <th className="px-4 py-3 font-bold uppercase text-xs w-24">OS #</th>
                        <th className="px-4 py-3 font-bold uppercase text-xs">Cliente / Veículo</th>
                        <th className="px-4 py-3 font-bold uppercase text-xs text-right">Valor</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredData.length > 0 ? filteredData.map((item, idx) => (
                        <tr key={item.id} className={`hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                            <td className="px-4 py-3 text-slate-600 tabular-nums">{formatDate(item.exitDate || item.entryDate)}</td>
                            <td className="px-4 py-3 font-mono text-slate-500 text-xs">#{item.id.toUpperCase().substring(0,6)}</td>
                            <td className="px-4 py-3">
                                <div className="text-slate-800 font-medium text-xs">Cliente ID: {item.customerId.substring(0,8)}...</div>
                                <div className="text-slate-400 text-[10px]">Veículo ID: {item.vehicleId.substring(0,8)}...</div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600 tabular-nums">{formatCurrency(item.total)}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic">Nenhum registro encontrado neste período.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
