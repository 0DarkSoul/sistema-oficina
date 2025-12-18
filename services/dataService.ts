
import { Customer, Vehicle, WorkOrder, WorkOrderStatus, DashboardStats, User, Transaction, WorkshopSettings } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to get current auth ID
const getAuthUserId = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
};

// ============================================================================
// SYSTEM INITIALIZATION & DIAGNOSTICS
// ============================================================================
export const initSystem = async () => {
  if (!isSupabaseConfigured) {
      console.log("⚠️ Sistema aguardando configuração do Supabase...");
      return;
  }
};

export const checkDatabaseConnection = async (): Promise<{ status: 'ok' | 'missing_tables' | 'error', message?: string }> => {
    if (!isSupabaseConfigured) return { status: 'error', message: 'Supabase keys missing' };

    try {
        // Simple check for users table existence.
        // We do not check for specific columns or workshop_settings to avoid false negatives with RLS or schema variations.
        const { error: usersError } = await supabase.from('users').select('id', { count: 'exact', head: true });

        if (usersError) {
            // If table doesn't exist, it's a critical missing_table error
            if (usersError.code === '42P01' || usersError.message.includes('Could not find the table') || usersError.message.includes('relation "public.users" does not exist')) {
                return { status: 'missing_tables' };
            }
            // For other errors (like permissions), we assume connection is OK but maybe restricted
            console.warn("Database check warning:", usersError.message);
        }

        return { status: 'ok' };
    } catch (e: any) {
        return { status: 'error', message: e.message || 'Unknown error' };
    }
}

// ============================================================================
// DATA ACCESS OBJECTS (DAO)
// ============================================================================

// --- Users ---
// Users table uses 'id' as PK which matches auth.uid(), so no user_id column needed usually.
export const getUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured) return []; 
  const { data, error } = await supabase.from('users').select('*');
  if (error) { 
    console.error("Erro getUsers:", error.message); 
    return []; 
  }
  return data || [];
};

export const saveUser = async (user: User): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  const uid = await getAuthUserId();
  if (!uid) return false;

  const { password, ...safeUser } = user;
  safeUser.id = uid;

  const { error } = await supabase.from('users').upsert(safeUser);
  if (error) {
    console.error("Erro ao salvar usuário:", error.message);
    return false;
  }
  return true;
};

// --- Workshop Settings ---
export const getWorkshopSettings = async (): Promise<WorkshopSettings> => {
  if (!isSupabaseConfigured) return createEmptySettings();

  const uid = await getAuthUserId();
  if (!uid) return createEmptySettings();

  // 1. Try to fetch existing settings
  // Explicitly selecting fields can prevent fetching unwanted columns, but * is fine if we sanitize on save.
  const { data, error } = await supabase
      .from('workshop_settings')
      .select('*')
      .eq('user_id', uid)
      .limit(1)
      .maybeSingle();
  
  // 2. If exists, return it
  if (data) {
    return {
      ...data,
      address: data.address || { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' }
    };
  }

  // 3. If NOT exists, AUTO-CREATE
  // CORRECTED: Use 'user_id' (snake_case) for the insert
  const defaultSettings = {
      user_id: uid, 
      name: 'Minha Oficina',
      document: '',
      email: '',
      phone: '',
      address: { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' },
      policyTerms: 'Garantia de 90 dias para serviços.'
  };

  const { data: newSettings, error: insertError } = await supabase
      .from('workshop_settings')
      .insert(defaultSettings)
      .select()
      .single();

  if (insertError) {
      console.error("Erro ao criar settings padrão:", JSON.stringify(insertError));
      // Fallback
      return { 
        name: defaultSettings.name, 
        document: '', email: '', phone: '', 
        address: defaultSettings.address, 
        policyTerms: defaultSettings.policyTerms 
      }; 
  }

  return newSettings;
};

const createEmptySettings = (): WorkshopSettings => ({
  name: 'Oficina Não Configurada',
  document: '', email: '', phone: '',
  address: { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' }
});

export const saveWorkshopSettings = async (settings: WorkshopSettings): Promise<void> => {
  if (!isSupabaseConfigured) return;
  const uid = await getAuthUserId();
  if (!uid) return;

  // 1. Check if record exists specifically for this user
  const { data: existing } = await supabase
      .from('workshop_settings')
      .select('id')
      .eq('user_id', uid)
      .limit(1)
      .maybeSingle();
  
  // 2. Prepare Payload
  // CRITICAL: Ensure we strip 'userId' (camelCase) if it accidentally exists in the object
  // and strip 'id' so we don't try to update the PK column directly (Supabase handles via selector or query)
  const { userId, id, ...rest } = settings as any;
  
  const payload = { 
      ...rest, 
      user_id: uid 
  };

  if (existing?.id) {
      // 3a. UPDATE
      const { error } = await supabase
          .from('workshop_settings')
          .update(payload)
          .eq('id', existing.id);
      
      if (error) console.error("Erro ao salvar configurações (UPDATE):", error.message);
  } else {
      // 3b. INSERT
      const { error } = await supabase
          .from('workshop_settings')
          .insert(payload);
      
      if (error) console.error("Erro ao salvar configurações (INSERT):", error.message);
  }
};

// --- Customers ---
export const getCustomers = async (): Promise<Customer[]> => {
  if (!isSupabaseConfigured) return [];
  // CORRECTED: Map 'user_id' from DB to 'userId' in TS
  const { data, error } = await supabase.from('customers').select('*, userId:user_id');
  if(error) console.error(error);
  return data || [];
};

export const saveCustomer = async (customer: Partial<Customer>): Promise<Customer> => {
  if (!isSupabaseConfigured) throw new Error("Banco de dados desconectado");
  const uid = await getAuthUserId();
  if (!uid) throw new Error("Sessão expirada");
  
  // Prepare payload for DB (convert userId -> user_id)
  const { userId, ...rest } = customer;
  
  const dbPayload: any = { ...rest };
  dbPayload.user_id = uid; // Enforce ownership
  
  if (!dbPayload.id) {
      dbPayload.id = generateId();
      dbPayload.createdAt = new Date().toISOString();
  }

  // NOTE: We don't need 'userId' in the upsert payload, we use 'user_id'
  const { data, error } = await supabase
    .from('customers')
    .upsert(dbPayload)
    .select('*, userId:user_id') // Select back with alias
    .single();

  if (error) throw error;
  return data;
};

// --- Vehicles ---
export const getVehicles = async (): Promise<Vehicle[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('vehicles').select('*, userId:user_id');
  if(error) console.error(error);
  return data || [];
};

export const saveVehicle = async (vehicle: Partial<Vehicle>): Promise<Vehicle> => {
  if (!isSupabaseConfigured) throw new Error("Banco de dados desconectado");
  const uid = await getAuthUserId();
  if (!uid) throw new Error("Sessão expirada");

  const { userId, ...rest } = vehicle;
  const dbPayload: any = { ...rest };
  dbPayload.user_id = uid;

  if (!dbPayload.id) {
    dbPayload.id = generateId();
  }

  const { data, error } = await supabase
    .from('vehicles')
    .upsert(dbPayload)
    .select('*, userId:user_id')
    .single();

  if (error) throw error;
  return data;
};

// --- Work Orders ---
export const getWorkOrders = async (): Promise<WorkOrder[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('work_orders').select('*, userId:user_id');
  if(error) console.error(error);
  return data || [];
};

export const getWorkOrderById = async (id: string): Promise<WorkOrder | undefined> => {
  if (!isSupabaseConfigured) return undefined;
  const { data, error } = await supabase.from('work_orders').select('*, userId:user_id').eq('id', id).single();
  if(error) console.error(error);
  return data || undefined;
};

export const saveWorkOrder = async (order: Partial<WorkOrder>): Promise<WorkOrder> => {
  if (!isSupabaseConfigured) throw new Error("Banco de dados desconectado");
  const uid = await getAuthUserId();
  if (!uid) throw new Error("Sessão expirada");

  const { userId, ...rest } = order;
  const dbPayload: any = { ...rest };
  dbPayload.user_id = uid;

  if (!dbPayload.id) {
    dbPayload.id = generateId();
    dbPayload.entryDate = new Date().toISOString();
    dbPayload.services = dbPayload.services || [];
    dbPayload.total = 0;
    dbPayload.discount = 0;
    dbPayload.status = WorkOrderStatus.PENDING_QUOTE;
  } else {
    // Recalculate totals on save
    if (dbPayload.services) {
      const subtotal = dbPayload.services.reduce((acc: number, s: any) => acc + (Number(s.price) || 0), 0);
      dbPayload.total = Math.max(0, subtotal - (Number(dbPayload.discount) || 0));
    }
  }

  const { data, error } = await supabase
    .from('work_orders')
    .upsert(dbPayload)
    .select('*, userId:user_id')
    .single();

  if (error) throw error;
  return data;
};

// --- Transactions ---
export const getTransactions = async (): Promise<Transaction[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('transactions').select('*, userId:user_id');
  if(error) console.error(error);
  return data || [];
};

export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  if (!isSupabaseConfigured) return;
  const uid = await getAuthUserId();
  
  const { userId, ...rest } = transaction;
  const dbPayload = { ...rest, user_id: uid };
  
  await supabase.from('transactions').upsert(dbPayload);
};

// --- Analytics ---
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const emptyStats = { 
    pendingQuotes: 0, inProgress: 0, finished: 0, monthlyRevenue: 0, 
    finishedToday: 0, delayedOrders: 0, revenueHistory: [], statusDistribution: [] 
  };

  if (!isSupabaseConfigured) return emptyStats;
  
  const orders = await getWorkOrders();
  const settings = await getWorkshopSettings();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const todayStr = now.toISOString().split('T')[0];
  
  // 1. Basic Counts
  const pendingQuotes = orders.filter(o => o.status === WorkOrderStatus.PENDING_QUOTE).length;
  const inProgress = orders.filter(o => o.status === WorkOrderStatus.IN_PROGRESS).length;
  const finishedTotal = orders.filter(o => o.status === WorkOrderStatus.FINISHED || o.status === WorkOrderStatus.DELIVERED).length;

  // 2. Monthly Revenue
  const monthlyRevenue = orders
    .filter(o => {
      const d = new Date(o.exitDate || o.entryDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && 
             (o.status === WorkOrderStatus.FINISHED || o.status === WorkOrderStatus.DELIVERED);
    })
    .reduce((acc, curr) => acc + curr.total, 0);

  // 3. Finished Today
  const finishedToday = orders.filter(o => {
     const isDone = o.status === WorkOrderStatus.FINISHED || o.status === WorkOrderStatus.DELIVERED;
     if (!isDone) return false;
     const d = new Date(o.exitDate || o.entryDate).toISOString().split('T')[0];
     return d === todayStr;
  }).length;

  // 4. Delayed Orders (Active > 10 days)
  // We assume "Delayed" implies "In Progress" for a long time since we don't have a deadline field.
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  
  const delayedOrders = orders.filter(o => {
      if (o.status !== WorkOrderStatus.IN_PROGRESS) return false;
      const entry = new Date(o.entryDate);
      return entry < tenDaysAgo;
  }).length;

  // 5. Revenue History (Last 6 Months)
  const revenueHistory = [];
  for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      
      const total = orders
        .filter(o => {
            const od = new Date(o.exitDate || o.entryDate);
            return od.getMonth() === month && od.getFullYear() === year && 
                   (o.status === WorkOrderStatus.FINISHED || o.status === WorkOrderStatus.DELIVERED);
        })
        .reduce((acc, curr) => acc + curr.total, 0);
      
      const monthName = d.toLocaleString('pt-BR', { month: 'short' });
      revenueHistory.push({ name: monthName.charAt(0).toUpperCase() + monthName.slice(1), value: total });
  }

  // 6. Status Distribution
  const statusDistribution = [
      { name: 'Em Serviço', value: inProgress, color: '#0284c7' }, // Sky 600
      { name: 'Finalizados', value: finishedTotal, color: '#16a34a' }, // Emerald 600
      { name: 'Em Orçamento', value: pendingQuotes, color: '#eab308' }, // Yellow 500
      { name: 'Atrasados', value: delayedOrders, color: '#dc2626' } // Red 600
  ];

  return {
    pendingQuotes,
    inProgress,
    finished: finishedTotal,
    monthlyRevenue,
    finishedToday,
    delayedOrders,
    revenueHistory,
    statusDistribution,
    workshopName: settings.name
  };
};

export const getSystemStatus = async () => {
    if (!isSupabaseConfigured) return { users: 0, customers: 0, orders: 0 };
    try {
        const { count: users, error: uErr } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: customers } = await supabase.from('customers').select('*', { count: 'exact', head: true });
        const { count: orders } = await supabase.from('work_orders').select('*', { count: 'exact', head: true });

        if(uErr) throw uErr;

        return {
            users: users || 0,
            customers: customers || 0,
            orders: orders || 0
        };
    } catch (e) {
        return { users: 0, customers: 0, orders: 0 };
    }
};

export const exportSystemData = async (): Promise<string> => {
    if (!isSupabaseConfigured) return "{}";
    const users = await getUsers();
    const customers = await getCustomers();
    const orders = await getWorkOrders();
    
    const backup = {
        version: '3.0-cloud',
        date: new Date().toISOString(),
        data: { users, customers, orders }
    };
    return JSON.stringify(backup, null, 2);
};

export const importDataForCurrentUser = async (jsonString: string, currentUserId: string): Promise<any> => {
    return { success: false, message: "Importação via arquivo desativada em modo Nuvem." };
};
