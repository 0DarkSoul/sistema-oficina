
import React, { useState, useEffect } from 'react';
import { getVehicles, getCustomers, saveVehicle } from '../services/dataService';
import { Vehicle, Customer } from '../types';
import { Search, Plus, Car as CarIcon } from 'lucide-react';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle>>({});

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setVehicles(await getVehicles());
    setCustomers(await getCustomers());
  };

  const getOwnerName = (id: string) => customers.find(c => c.id === id)?.name || 'Desconhecido';

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingVehicle({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle.customerId) return alert("Selecione um cliente");
    await saveVehicle(editingVehicle);
    await refresh();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Veículos</h1>
          <p className="text-xs text-slate-500">Frota cadastrada no sistema</p>
        </div>
        <button 
          onClick={handleNew}
          className="flex items-center gap-2 bg-accent hover:bg-accentDark text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo Veículo
        </button>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-3 uppercase text-xs w-24">Placa</th>
              <th className="px-6 py-3 uppercase text-xs">Modelo/Marca</th>
              <th className="px-6 py-3 uppercase text-xs">Proprietário</th>
              <th className="px-6 py-3 uppercase text-xs">Cor</th>
              <th className="px-6 py-3 uppercase text-xs w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((vehicle, idx) => (
              <tr key={vehicle.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                <td className="px-6 py-3 font-mono font-bold text-slate-700 bg-slate-50/50">{vehicle.plate}</td>
                <td className="px-6 py-3">
                  <div className="text-slate-900 font-medium">{vehicle.model}</div>
                  <div className="text-xs text-slate-500">{vehicle.brand} • {vehicle.year}</div>
                </td>
                <td className="px-6 py-3 text-slate-600">{getOwnerName(vehicle.customerId)}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <div className="w-3 h-3 rounded-full border border-slate-300 shadow-sm" style={{backgroundColor: vehicle.color === 'Branco' ? '#fff' : 'gray'}}></div>
                    {vehicle.color}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <button onClick={() => handleEdit(vehicle)} className="text-accent hover:text-accentDark font-medium text-xs border border-accent/20 px-2 py-1 rounded hover:bg-accent/5 transition-colors">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{editingVehicle.id ? 'Editar Veículo' : 'Novo Veículo'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proprietário</label>
                <select required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={editingVehicle.customerId || ''} onChange={e => setEditingVehicle({...editingVehicle, customerId: e.target.value})}>
                  <option value="">Selecione o Cliente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Placa</label>
                  <input required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none uppercase font-mono" value={editingVehicle.plate || ''} onChange={e => setEditingVehicle({...editingVehicle, plate: e.target.value.toUpperCase()})} placeholder="ABC-1234" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ano</label>
                  <input type="number" required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={editingVehicle.year || ''} onChange={e => setEditingVehicle({...editingVehicle, year: Number(e.target.value)})} placeholder="2024" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marca</label>
                  <input required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={editingVehicle.brand || ''} onChange={e => setEditingVehicle({...editingVehicle, brand: e.target.value})} placeholder="Ex: Fiat" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo</label>
                  <input required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={editingVehicle.model || ''} onChange={e => setEditingVehicle({...editingVehicle, model: e.target.value})} placeholder="Ex: Uno" />
                </div>
              </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor</label>
                  <input required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={editingVehicle.color || ''} onChange={e => setEditingVehicle({...editingVehicle, color: e.target.value})} placeholder="Ex: Branco" />
                </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-accent text-white rounded hover:bg-accentDark shadow-sm text-sm font-bold">Salvar Veículo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Vehicles;
