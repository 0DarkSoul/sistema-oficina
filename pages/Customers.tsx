
import React, { useState, useEffect } from 'react';
import { getCustomers, saveCustomer } from '../services/dataService';
import { Customer } from '../types';
import { Search, Plus, Phone, Mail, MapPin } from 'lucide-react';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer>>({});

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    const data = await getCustomers();
    setCustomers(data);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingCustomer({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCustomer(editingCustomer);
    await refresh();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Clientes</h1>
          <p className="text-xs text-slate-500">Cadastro de pessoa física e jurídica</p>
        </div>
        <button 
          onClick={handleNew}
          className="flex items-center gap-2 bg-accent hover:bg-accentDark text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white p-5 rounded border border-slate-200 hover:border-accent/40 shadow-sm transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200">
                {customer.name.charAt(0)}
              </div>
              <button 
                onClick={() => handleEdit(customer)}
                className="text-xs font-medium text-accent hover:text-accentDark opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Editar
              </button>
            </div>
            
            <h3 className="font-bold text-base text-slate-800 mb-1 truncate">{customer.name}</h3>
            <p className="text-xs text-slate-500 mb-4 font-mono bg-slate-50 inline-block px-1.5 py-0.5 rounded border border-slate-100">{customer.document}</p>
            
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                {customer.phone}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span className="truncate">{customer.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{editingCustomer.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                <input required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={editingCustomer.name || ''} onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})} placeholder="Ex: João da Silva" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF/CNPJ</label>
                  <input required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none font-mono text-sm" value={editingCustomer.document || ''} onChange={e => setEditingCustomer({...editingCustomer, document: e.target.value})} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                  <input required className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={editingCustomer.phone || ''} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                <input type="email" className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={editingCustomer.email || ''} onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})} placeholder="nome@exemplo.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço</label>
                <input className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none" value={editingCustomer.address || ''} onChange={e => setEditingCustomer({...editingCustomer, address: e.target.value})} placeholder="Rua, Número, Bairro" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-accent text-white rounded hover:bg-accentDark shadow-sm text-sm font-bold">Salvar Dados</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Customers;
