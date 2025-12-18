
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURAÇÃO DO BANCO DE DADOS EXTERNO
// ------------------------------------------------------------------

// Função segura para ler variáveis de ambiente sem quebrar no navegador
const getEnv = (key: string) => {
  try {
    // Verifica Vite
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
       // @ts-ignore
       return import.meta.env[key];
    }
    // Verifica Node/Process
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

// ------------------------------------------------------------------
// ⚠️ ATENÇÃO: SE ESTIVER RODANDO SEM BUILD (DIRETO NO NAVEGADOR),
// COLE SUAS CHAVES DO SUPABASE ABAIXO DENTRO DAS ASPAS:
// ------------------------------------------------------------------
const HARDCODED_URL = 'https://szvvqgugaeffbhomctmv.supabase.co'
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dnZxZ3VnYWVmZmJob21jdG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTExMjksImV4cCI6MjA4MTM4NzEyOX0.BhV2XS2sXZuBmvKdxJmD9og8e4zphEbVvHWztSOTVhQ'


// Seleção de credenciais
const rawUrl = HARDCODED_URL || getEnv('REACT_APP_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
const rawKey = HARDCODED_KEY || getEnv('REACT_APP_SUPABASE_KEY') || getEnv('VITE_SUPABASE_KEY');

// Validação de URL
const isValidUrl = (url: string) => url && url.startsWith('http') && !url.includes('placeholder');

// Configuração Final
export const isSupabaseConfigured = isValidUrl(rawUrl) && !!rawKey;

const SUPABASE_URL = isSupabaseConfigured ? rawUrl : 'https://project-placeholder.supabase.co';
const SUPABASE_KEY = rawKey || 'placeholder-key';

if (!isSupabaseConfigured) {
  console.warn("%c🚨 SUPABASE NÃO CONFIGURADO 🚨", "color: red; font-size: 14px; font-weight: bold;");
  console.warn("O sistema está rodando em modo de interface apenas. Edite services/supabaseClient.ts para conectar.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

