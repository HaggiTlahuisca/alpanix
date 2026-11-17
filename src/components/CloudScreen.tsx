import React from 'react';
import { STORAGE_STATS } from '../data/devices';

export const CloudScreen: React.FC = () => {
  // Protección anticrasheos: si no encuentra la variable, usa valores seguros
  const stats = STORAGE_STATS || {
    provider: 'Nube Privada',
    used: '0 GB',
    total: '1 TB',
    percentage: 0,
    encryption: 'Activo',
    protocol: 'HTTPS'
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto pb-24">
      <div>
        <h2 className="text-3xl font-extrabold text-on-surface mb-2">Nube de Datos</h2>
        <p className="text-on-surface-variant text-sm">
          Gestión de almacenamiento encriptado y archivos adjuntos de todas tus cuentas.
        </p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/15 rounded-3xl p-6 space-y-6 shadow-md">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">cloud</span>
            {stats.provider}
          </h3>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
            Estado OK
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-outline font-mono">
            <span>{stats.used} usados</span>
            <span>de {stats.total}</span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: `${stats.percentage}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/15 rounded-3xl p-8 shadow-md flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-6xl text-outline/50 mb-3">folder_open</span>
        <h3 className="text-lg font-bold text-on-surface">Bandeja de archivos limpia</h3>
        <p className="text-on-surface-variant text-sm mt-1">Aún no hay correos con archivos adjuntos pesados en la memoria caché.</p>
      </div>
    </div>
  );
};