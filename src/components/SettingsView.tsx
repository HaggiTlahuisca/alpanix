import React, { useState } from 'react';

interface SettingsViewProps {
  onSaveToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSaveToast }) => {
  // Estado para la URL de la API (lee lo guardado o usa la default)
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('midnight_api_url') || 'https://api.tlahuisca.com.mx');
 
  const [syncFreq, setSyncFreq] = useState('1m');
  const [enableJitter, setEnableJitter] = useState(true);
  const [enableMultiControl, setEnableMultiControl] = useState(true);
  const [enableTpm, setEnableTpm] = useState(true);
  const [notifyLowStorage, setNotifyLowStorage] = useState(true);
  const [notifyDeviceOffline, setNotifyDeviceOffline] = useState(true);

  const handleSave = () => {
    // Guardar la URL en el almacenamiento local del teléfono
    localStorage.setItem('midnight_api_url', apiUrl);
    
    onSaveToast('Preferencias guardadas. Aplicando nueva configuración de red...');
    
    // Recargar la app suavemente después de 1.5s para que tome la nueva URL
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl">
      <div>
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary bg-primary-container/20 px-2 py-0.5 rounded">
          CONFIGURACIÓN DEL SISTEMA
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-on-surface mt-1 mb-2 font-headline">
          Ajustes de Sistema
        </h2>
        <p className="text-on-surface-variant font-medium text-sm">
          Ajusta la conexión a tu servidor VPS, parámetros de enlace y seguridad.
        </p>
      </div>

      <div className="space-y-4">
        {/* Account Info */}
        <div className="bg-surface-container-low border border-outline-variant/15 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
          <h3 className="text-sm uppercase tracking-wider font-bold text-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">person</span>
            Perfil de Estación de Trabajo
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-surface-container-highest overflow-hidden ring-2 ring-primary/40 flex-shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">account_circle</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-on-surface">Administrador del Sistema</h4>
                <p className="text-xs text-primary font-mono">Panel de Control</p>
                <span className="inline-block mt-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Nodo Seguro Activo
                </span>
              </div>
            </div>

            <button
              onClick={() => alert('Sesión de telemetría activa en todos los dispositivos.')}
              className="px-4 py-2 rounded-xl bg-surface-container text-xs font-bold text-on-surface-variant hover:text-white hover:bg-surface-container-high transition-colors self-start sm:self-auto"
            >
              Auditar Sesiones
            </button>
          </div>
        </div>

        {/* Server Connection (NUEVO) */}
        <div className="bg-surface-container-low border border-outline-variant/15 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
          <h3 className="text-sm uppercase tracking-wider font-bold text-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">dns</span>
            Conexión con el Servidor (API VPS)
          </h3>
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-surface-container">
            <div>
              <span className="font-bold text-on-surface block text-sm">
                Dirección URL del Backend
              </span>
              <span className="text-outline text-[11px]">
                Ingresa la dirección HTTPS de tu servidor. Si cambias de dominio o IP, modifícalo aquí sin tener que recompilar la app.
              </span>
            </div>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.midominio.com.mx"
              className="bg-[#0b1326] border border-outline-variant/20 rounded-xl px-3 py-3 mt-1 text-sm text-primary font-mono outline-none w-full focus:border-primary"
            />
          </div>
        </div>

        {/* Sync Settings */}
        <div className="bg-surface-container-low border border-outline-variant/15 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
          <h3 className="text-sm uppercase tracking-wider font-bold text-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">sync</span>
            Protocolo de Sincronización
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-surface-container">
              <div>
                <span className="font-bold text-on-surface block text-sm">
                  Intervalo de Telemetría
                </span>
                <span className="text-outline text-[11px]">
                  Frecuencia con la que la aplicación consulta nuevos datos en segundo plano.
                </span>
              </div>

              <select
                value={syncFreq}
                onChange={(e) => setSyncFreq(e.target.value)}
                className="bg-[#0b1326] border border-outline-variant/20 rounded-xl px-3 py-1.5 text-xs text-primary font-mono outline-none"
              >
                <option value="realtime">En tiempo real (&lt; 2ms)</option>
                <option value="1m">Cada 1 minuto</option>
                <option value="5m">Cada 5 minutos</option>
                <option value="15m">Bajo demanda</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container">
              <div>
                <span className="font-bold text-on-surface block text-sm">
                  Notificar pérdida de conexión
                </span>
                <span className="text-outline text-[11px]">
                  Alerta si el teléfono no puede alcanzar al servidor VPS.
                </span>
              </div>

              <input
                type="checkbox"
                checked={notifyDeviceOffline}
                onChange={(e) => setNotifyDeviceOffline(e.target.checked)}
                className="h-5 w-5 rounded border-outline-variant bg-surface-container-low accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-3">
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-2xl bg-primary text-on-primary font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">check</span>
            Guardar y Aplicar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};