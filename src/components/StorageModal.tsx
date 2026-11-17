import React, { useState } from 'react';
import { StorageStat } from '../types';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceFocus?: 'all' | 'drive' | 'onedrive';
  storageStats: StorageStat[];
  onExpandPlan: (planName: string) => void;
  onTriggerCloudSync: (service: string) => void;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  isOpen,
  onClose,
  serviceFocus = 'all',
  storageStats,
  onExpandPlan,
  onTriggerCloudSync
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'tier2' | 'tier3'>('tier2');
  const [syncingService, setSyncingService] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = (name: string) => {
    setSyncingService(name);
    setTimeout(() => {
      onTriggerCloudSync(name);
      setSyncingService(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#131b2e] border border-outline-variant/30 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl shadow-blue-950/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/15 bg-[#0b1326]/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-container/30 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">cloud_sync</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-on-surface">
                {serviceFocus === 'drive'
                  ? 'Integración Google Drive'
                  : serviceFocus === 'onedrive'
                  ? 'Integración OneDrive'
                  : 'Nube de Datos y Almacenamiento'}
              </h3>
              <span className="text-[10px] text-outline font-mono">
                Cuotas y Sincronización Automática
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-white hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Current Status Breakdown */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-wider font-bold text-outline">
              Estado de los Proveedores Conectados
            </h4>

            {storageStats.map((stat) => (
              <div
                key={stat.name}
                className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-primary">
                      {stat.icon}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-on-surface block">
                        {stat.name}
                      </span>
                      <span className="text-[10px] text-outline font-mono">
                        {stat.used} de {stat.total}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: stat.color }}
                    >
                      {stat.percentage}%
                    </span>
                    <button
                      onClick={() => handleSync(stat.name)}
                      disabled={syncingService === stat.name}
                      className="px-3 py-1 rounded-lg bg-surface-container-highest text-[10px] uppercase tracking-wider font-bold text-primary hover:bg-primary-container hover:text-white transition-all flex items-center gap-1"
                    >
                      <span
                        className={`material-symbols-outlined text-xs ${
                          syncingService === stat.name ? 'animate-spin' : ''
                        }`}
                      >
                        sync
                      </span>
                      {syncingService === stat.name ? 'Sincronizando' : 'Sincronizar'}
                    </button>
                  </div>
                </div>

                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stat.percentage}%`,
                      backgroundColor: stat.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Allocation Breakdown */}
          <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-outline">
              Distribución de Espacio Arquitectónico:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container">
                <span className="text-outline text-[10px] block">Planos CAD y DWG</span>
                <span className="font-bold text-on-surface font-mono">890 GB</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container">
                <span className="text-outline text-[10px] block">Renders 8K & EXR</span>
                <span className="font-bold text-on-surface font-mono">420 GB</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container">
                <span className="text-outline text-[10px] block">Backups de Kernel</span>
                <span className="font-bold text-on-surface font-mono">98 GB</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container">
                <span className="text-outline text-[10px] block">Bandeja de Correo</span>
                <span className="font-bold text-on-surface font-mono">32 GB</span>
              </div>
            </div>
          </div>

          {/* Expand Plans */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-outline">
              Expandir Capacidad en la Nube
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setSelectedPlan('tier2')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedPlan === 'tier2'
                    ? 'border-primary bg-primary-container/20 shadow-md'
                    : 'border-outline-variant/20 bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-on-surface">Plan Studio 5.0 TB</span>
                  <span className="text-xs font-mono text-primary font-bold">12€ / mes</span>
                </div>
                <p className="text-[11px] text-outline leading-relaxed">
                  Ideal para estudios de arquitectura con múltiples nodos BIM y exportación 8K.
                </p>
              </div>

              <div
                onClick={() => setSelectedPlan('tier3')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedPlan === 'tier3'
                    ? 'border-primary bg-primary-container/20 shadow-md'
                    : 'border-outline-variant/20 bg-surface-container hover:bg-surface-container-high'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-on-surface">Plan Clúster 10.0 TB</span>
                  <span className="text-xs font-mono text-primary font-bold">24€ / mes</span>
                </div>
                <p className="text-[11px] text-outline leading-relaxed">
                  Almacenamiento ultra-rápido en SSD NVMe con replicación multirregión continua.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/15 flex items-center justify-between bg-[#0b1326]/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-outline hover:text-white transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onExpandPlan(selectedPlan === 'tier2' ? 'Studio 5.0 TB' : 'Clúster 10.0 TB');
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            Actualizar Cuota
          </button>
        </div>
      </div>
    </div>
  );
};
