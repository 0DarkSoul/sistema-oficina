
import React, { useEffect, useState } from 'react';
import { getWorkshopSettings } from '../services/dataService';
import { WorkshopSettings } from '../types';
import { Car } from 'lucide-react';

interface DocumentHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ title, subtitle, rightContent }) => {
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getWorkshopSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings header:", error);
      }
    };
    loadSettings();
  }, []);

  if (!settings) return null;

  return (
    <div className="w-full bg-white mb-8 print:mb-6">
      <div className="flex flex-col md:flex-row print:flex-row justify-between items-start gap-8 print:gap-6 pb-6 border-b-2 border-slate-900">
        
        {/* Left Side: Logo & Company Info */}
        <div className="flex gap-6 print:gap-4 items-start flex-1">
          {/* LOGO CONTAINER: STRICT 48PX HEIGHT RULE */}
          <div className="shrink-0">
             {settings.logo ? (
                <img 
                  src={settings.logo} 
                  alt="Logo" 
                  className="h-[48px] max-w-[180px] object-contain object-left" 
                />
             ) : (
                <div className="h-[48px] w-[48px] bg-slate-900 text-white flex items-center justify-center rounded-lg shadow-sm print:border print:border-black print:bg-white print:text-black">
                    <Car size={24} />
                </div>
             )}
          </div>
          
          <div className="flex flex-col justify-start pt-0.5">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-none mb-1">{settings.name}</h1>
            {settings.legalName && (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{settings.legalName}</p>
            )}
            
            <div className="text-xs text-slate-600 leading-relaxed space-y-0.5">
               <p className="font-medium text-slate-800">
                  {settings.address?.street}, {settings.address?.number}
               </p>
               <p>
                  {settings.address?.neighborhood} • {settings.address?.city}/{settings.address?.state}
               </p>
               <p>
                  {settings.address?.zip && `CEP: ${settings.address?.zip}`}
               </p>
               <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-slate-100 print:border-slate-300">
                  <span className="font-bold text-slate-700">CNPJ: {settings.document}</span>
                  <span className="font-bold text-slate-700">Tel: {settings.phone}</span>
               </div>
            </div>
          </div>
        </div>
        
        {/* Right Side: Document Meta */}
        <div className="text-right flex flex-col items-end justify-center min-w-[220px]">
           <h2 className="text-2xl print:text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h2>
           {subtitle && (
             <p className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded print:bg-transparent print:p-0">{subtitle}</p>
           )}
           <div className="mt-4 print:mt-2">
             {rightContent}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentHeader;
