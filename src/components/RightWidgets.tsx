import React, { useState } from 'react';
import { DeviceInfo, KdriveConfig, StorageStat } from '../types';

interface RightWidgetsProps {
  storageStats: StorageStat[];
  devices: DeviceInfo[];
  kdrive: KdriveConfig;
  onOpenStorageModal: () => void;
  onOpenKdrive: () => void;
  onSyncDevice: (deviceName: string) => void;
}

export const RightWidgets: React.FC<RightWidgetsProps> = ({
  storageStats,
  devices,
  kdrive,
  onOpenStorageModal,
  onOpenKdrive,
  onSyncDevice
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);

  return (
    <aside className="space-y-6">
      {/* Storage Card from Stitch featuring kDrive */}
      <div className="bg-surface-container rounded-3xl p-6 md:p-8 relative overflow-hidden group border border-outline-variant/10 shadow-xl shadow-blue-950/20">
        <div className="absolute -right-8 -top-8 h-32 w-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-outline">
            Nube de Datos
          </h4>
          <span className="text-[10px] text-primary font-mono bg-primary-container/20 px-2 py-0.5 rounded">
            {kdrive.connected ? 'kDrive OK' : 'Cloud SYNC'}
          </span>
        </div>

        <div className="space-y-6">
          {/* Featured kDrive entry */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">
                  folder_managed
                </span>
                kDrive (Infomaniak Suiza)
              </span>
              <span className="font-mono font-bold text-primary">
                {kdrive.connected ? '7%' : 'Listo'}
              </span>
            </div>

            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-primary"
                style={{
                  width: kdrive.connected ? '7%' : '0%'
                }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-outline font-mono">
              <span>{kdrive.used || '142 GB'} usados</span>
              <span>de {kdrive.total || '2.0 TB'}</span>
            </div>
          </div>

          {/* Other services status */}
          <div className="pt-2 border-t border-outline-variant/10 space-y-2 text-xs">
            <div className="flex justify-between items-center text-[11px] text-outline">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">shield</span>
                Cifrado RGPD Suizo
              </span>
              <span className="text-emerald-400 font-mono">Activo</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-outline">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">sync_alt</span>
                Protocolo
              </span>
              <span className="text-primary font-mono">WebDAV SSL</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenKdrive}
          className="mt-6 w-full py-3 rounded-xl bg-surface-container-highest text-[10px] uppercase tracking-widest font-black text-on-surface hover:bg-primary-container hover:text-[#90bbff] transition-all active:scale-95 duration-200 cursor-pointer shadow-md"
        >
          {kdrive.connected ? 'Gestionar kDrive' : 'Vincular kDrive'}
        </button>
      </div>

      {/* Ecosystem Status Card from Stitch */}
      <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl shadow-blue-950/20">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-outline">
            Red de Dispositivos
          </h4>
          <span className="text-[10px] text-emerald-400 font-mono">
            {devices.filter((d) => d.status === 'connected').length} en línea
          </span>
        </div>

        <div className="space-y-3">
          {devices.map((device) => {
            const isConnected = device.status === 'connected';
            const isSelected = selectedDevice?.id === device.id;

            return (
              <div
                key={device.id}
                onClick={() => setSelectedDevice(isSelected ? null : device)}
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-surface-container-high border-primary/40'
                    : 'bg-surface-container/50 hover:bg-surface-container border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        isConnected
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                          : 'bg-amber-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold text-on-surface block">
                        {device.name}
                      </span>
                      <span className="text-[10px] text-outline/80">
                        {device.statusText}
                        {device.latency && isConnected && ` • ${device.latency}`}
                      </span>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-xs text-outline transition-transform">
                    {isSelected ? 'expand_less' : 'chevron_right'}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/15 text-[10px] text-outline font-mono space-y-2 animate-in fade-in">
                    <div className="flex justify-between">
                      <span>IP Asignada:</span>
                      <span className="text-on-surface">{device.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Última Sincronización:</span>
                      <span className="text-on-surface">{device.lastSync}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSyncDevice(device.name);
                      }}
                      className="w-full mt-2 py-1.5 rounded-lg bg-surface-container-highest text-primary hover:bg-primary-container hover:text-white transition-colors text-center font-bold uppercase tracking-wider"
                    >
                      Probar enlace ahora
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Telemetry Feed */}
      <div className="bg-surface-container-low/70 border border-outline-variant/10 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">hub</span>
            <h5 className="text-[10px] uppercase tracking-[0.2em] font-black text-outline">
              Telemetría de Flujos
            </h5>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div className="space-y-2 text-[11px] font-mono text-outline">
          <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container/60">
            <span>Servidor kDrive WebDAV</span>
            <span className="text-emerald-400">Suiza (OK)</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container/60">
            <span>Cifrado de Adjuntos</span>
            <span className="text-primary">AES-256</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
