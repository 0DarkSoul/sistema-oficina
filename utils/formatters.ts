export const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatDate = (dateString: string) => 
  new Date(dateString).toLocaleDateString('pt-BR');

export const generateId = () => Math.random().toString(36).substr(2, 9);
