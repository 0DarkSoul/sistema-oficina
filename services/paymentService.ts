import { Transaction, User } from '../types';
import { saveTransaction, saveUser, getUsers } from './dataService';
import { v4 as uuidv4 } from 'uuid';

const SUBSCRIPTION_DAYS = 30;

/**
 * GERAÇÃO DE CÓDIGO TEMPORAL
 * O código agora muda todo mês. Isso impede que o usuário decore um código e use para sempre.
 * Formato: PRO-{HASH_EMAIL}-{HASH_DATA}-{CHECKSUM}
 */
export const generateLicenseForEmail = (email: string): string => {
  const cleanEmail = email.trim().toLowerCase();
  const date = new Date();
  const monthKey = `${date.getMonth() + 1}${date.getFullYear()}`; // Ex: 102023

  // Hash do Email
  let emailHash = 0;
  for (let i = 0; i < cleanEmail.length; i++) {
    emailHash = ((emailHash << 5) - emailHash) + cleanEmail.charCodeAt(i);
    emailHash |= 0;
  }
  const part1 = Math.abs(emailHash).toString(16).toUpperCase().padStart(4, '0').substring(0, 4);

  // Hash da Data (Mês/Ano) - Muda todo mês
  let dateHash = 0;
  for (let i = 0; i < monthKey.length; i++) {
    dateHash = ((dateHash << 5) - dateHash) + monthKey.charCodeAt(i);
    dateHash |= 0;
  }
  const part2 = Math.abs(dateHash).toString(16).toUpperCase().padStart(4, '0').substring(0, 4);

  // Salt de Segurança (Fixo)
  const salt = ((cleanEmail.length * 7) + (parseInt(monthKey) % 99)).toString(16).toUpperCase().padStart(2, '0');

  return `PRO-${part1}-${part2}-${salt}`;
};

const upgradeUserSubscription = async (userId: string, usedCode: string) => {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  
  if (user) {
    const now = new Date();
    // Lógica inteligente: Se a conta ainda não venceu, soma 30 dias ao vencimento futuro.
    // Se já venceu, soma 30 dias a partir de HOJE.
    const currentExpiry = user.subscriptionExpiryDate ? new Date(user.subscriptionExpiryDate) : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    
    // REGRA: Adicionar exatos 30 dias de acesso
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + SUBSCRIPTION_DAYS);
    
    // Atualiza tracking de códigos usados
    const currentCodes = user.redeemedCodes || [];
    const updatedCodes = [...currentCodes, usedCode];

    const updatedUser: User = {
      ...user,
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiryDate: newDate.toISOString(),
      redeemedCodes: updatedCodes
    };
    
    await saveUser(updatedUser);
    return true;
  }
  return false;
};

export const paymentService = {
  
  validateLicense: async (userId: string, email: string, inputCode: string): Promise<{success: boolean, message?: string}> => {
    const users = await getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Usuário não encontrado.' };

    const cleanInput = inputCode.trim().toUpperCase();

    // 1. VERIFICAÇÃO DE REPLAY (Se o código já foi usado por este usuário)
    if (user.redeemedCodes && user.redeemedCodes.includes(cleanInput)) {
      return { success: false, message: 'Este código já foi utilizado anteriormente.' };
    }

    // 2. VERIFICAÇÃO DE VALIDADE DO CÓDIGO
    // Como o código muda todo mês, precisamos verificar se é o código do mês ATUAL ou do mês PASSADO (tolerância de virada de mês)
    const currentMonthCode = generateLicenseForEmail(email);
    
    // Gerar código do mês anterior para tolerância (caso o cliente pague dia 31 e ative dia 01)
    // Nota: Para simplificar e garantir segurança máxima, vamos validar APENAS o código do mês vigente gerado pelo Admin agora.
    // Se o admin gerou o código hoje, ele é baseado na data de hoje.
    
    if (cleanInput === currentMonthCode) {
      const transaction: Transaction = {
        id: uuidv4(),
        userId,
        amount: 65.00,
        method: 'pix',
        status: 'approved',
        date: new Date().toISOString(),
        description: 'Renovação Mensal (30 Dias)',
        externalReference: inputCode
      };
      await saveTransaction(transaction);
      await upgradeUserSubscription(userId, cleanInput);
      return { success: true };
    }
    
    return { success: false, message: 'Código inválido ou expirado. Solicite um novo código atualizado.' };
  },

  activateFreeTier: async (userId: string): Promise<boolean> => {
    // Free tier logic bypasses code check
    const users = await getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
        const updatedUser: User = { ...user, subscriptionStatus: 'TRIAL', trialStartDate: new Date().toISOString() };
        await saveUser(updatedUser);
        return true;
    }
    return false;
  }
};