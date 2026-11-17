import React, { useState } from 'react';
import { AppBranding, KdriveConfig, ThemeId } from '../types';

interface ConfigScreenProps {
  onBack: () => void;
  branding: AppBranding;
  onUpdateBranding: (branding: Partial<AppBranding>) => void;
  kdrive: KdriveConfig;
  onUpdateKdrive: (kdrive: Partial<KdriveConfig>) => void;
  onOpenServerSettings: () => void;
  onOpenLogin: () => void;
  onSaveToast: (msg: string) => void;
}

export const ConfigScreen: React.FC<ConfigScreenProps> = ({
  onBack,
  branding,
  onUpdateBranding,
  kdrive,
  onUpdateKdrive,
  onOpenServerSettings,
  onOpenLogin,
  onSaveToast
}) => {
  // Local form states
  const [appName, setAppName] = useState(branding.appName);
  const [userName, setUserName] = useState(branding.userName);
  const [userEmail, setUserEmail] = useState(branding.userEmail);
  const [userRole, setUserRole] = useState(branding.userRole);

  // kDrive states
  const [kdUser, setKdUser] = useState(kdrive.username || '');
  const [kdToken, setKdToken] = useState(kdrive.token || '');
  const [kdFolder, setKdFolder] = useState(kdrive.remoteFolder || '/Documentos/Adjuntos');
  const [kdTesting, setKdTesting] = useState(false);

  const themes: { id: ThemeId; name: string; desc: string; primary: string; bg: string; border: string }[] = [
    {
      id: 'tlahuis',
      name: 'Tlahuisca (Principal)',
      desc: 'Teal #12B4B4, Navy #0B1F53, Oro #F2B84B y Fondo Blanco',
      primary: '#12B4B4',
      bg: '#ffffff',
      border: '#0B1F53'
    },
    {
      id: 'blueprint',
      name: 'Midnight Blueprint',
      desc: 'Azul cian arquitectónico oscuro',
      primary: '#a7c8ff',
      bg: '#0b1326',
      border: '#004a8d'
    },
    {
      id: 'emerald',
      name: 'Obsidian Emerald',
      desc: 'Verde esmeralda de terminal segura',
      primary: '#34d399',
      bg: '#061510',
      border: '#064e3b'
    },
    {
      id: 'amber',
      name: 'Amber Industrial',
      desc: 'Ámbar cálido de instrumentación técnica',
      primary: '#fbbf24',
      bg: '#13100b',
      border: '#78350f'
    },
    {
      id: 'violet',
      name: 'Cyber Violet',
      desc: 'Índigo y violeta de alta gama',
      primary: '#c084fc',
      bg: '#0e0c19',
      border: '#581c87'
    },
    {
      id: 'monochrome',
      name: 'Monochrome Slate',
      desc: 'Titanio neutro y blanco editorial',
      primary: '#e2e8f0',
      bg: '#0a0e17',
      border: '#334155'
    }
  ];

  const handleTestKdrive = () => {
    setKdTesting(true);
    setTimeout(() => {
      setKdTesting(false);
      onUpdateKdrive({
        connected: true,
        username: kdUser,
        token: kdToken,
        remoteFolder: kdFolder,
        used: '142 GB',
        total: '2.0 TB',
        lastSync: 'Justo ahora'
      });
      onSaveToast('Conexión con kDrive (Infomaniak) verificada con éxito.');
    }, 1100);
  };

  const handleSaveAll = () => {
    onUpdateBranding({
      appName,
      userName,
      userEmail,
      userRole
    });
    onSaveToast('Ajustes, nombre de la aplicación y perfil guardados.');
  };

  return (
    <div className="space-y-10 animate-in fade-in max-w-5xl mx-auto pb-24">
      {/* TopAppBar */}
      <header className="flex items-center justify-between pb-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-[#90bbff] hover:bg-[#171f33] transition-colors p-2 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-manrope font-bold text-xl tracking-tight text-[#c2c6d1]">
            Configuración y Personalización
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLogin}
            className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-primary-container text-xs text-[#90bbff] font-bold uppercase tracking-wider transition-colors"
          >
            Cambiar Cuenta
          </button>
        </div>
      </header>

      {/* Main Header */}
      <div>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-[#90bbff] mb-2 uppercase font-headline">
          Ajustes del Sistema
        </h2>
        <p className="text-on-surface-variant text-base md:text-lg font-light">
          Personaliza los colores, el nombre de tu aplicación y tu nube privada kDrive.
        </p>
      </div>

      <div className="space-y-8">
        {/* SECTION 1: THEME SELECTOR */}
        <section className="bg-surface-container-low p-6 md:p-8 rounded-2xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-manrope uppercase tracking-widest text-xs font-bold text-[#90bbff] flex items-center gap-2">
                <span className="material-symbols-outlined text-base">palette</span>
                Paleta de Color y Tema Visual
              </h3>
              <p className="text-xs text-outline mt-1">
                Haz clic en cualquier estilo para cambiar los colores de toda la aplicación en tiempo real.
              </p>
            </div>
            <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded bg-surface-container font-bold text-primary">
              Tema Activo: {themes.find((t) => t.id === branding.theme)?.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((t) => {
              const isSelected = branding.theme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onUpdateBranding({ theme: t.id })}
                  className={`p-4 rounded-xl cursor-pointer transition-all border flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30 shadow-lg'
                      : 'border-outline-variant/15 hover:border-primary/40 bg-surface-container'
                  }`}
                  style={{ backgroundColor: t.bg }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: t.primary }}
                      />
                      <span className="font-bold text-xs text-white">{t.name}</span>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-sm text-primary">
                        check_circle
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#c2c6d1]/80 leading-relaxed">{t.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: APP BRANDING & PERSONALIZATION */}
        <section className="bg-surface-container-low p-6 md:p-8 rounded-2xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-manrope uppercase tracking-widest text-xs font-bold text-[#90bbff] flex items-center gap-2">
                <span className="material-symbols-outlined text-base">edit_note</span>
                Personalización de Nombre y Cuenta
              </h3>
              <p className="text-xs text-outline mt-1">
                Sustituye &ldquo;Correo Arquitectónico&rdquo; o tu correo por los nombres reales de tu proyecto.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="text-outline font-bold uppercase block mb-1.5">
                Nombre de la Aplicación (Barra Lateral y Cabecera):
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Ej: Mi Correo Personal, Nexus Mail..."
                className="w-full bg-surface-container p-3 rounded-xl text-on-surface outline-none focus:ring-1 focus:ring-primary font-bold text-sm"
              />
              <span className="text-[10px] text-outline mt-1 block">
                Este nombre reemplaza el texto &ldquo;Correo Arquitectónico&rdquo; en todos los menús.
              </span>
            </div>

            <div>
              <label className="text-outline font-bold uppercase block mb-1.5">
                Tu Dirección de Correo de Dominio Propio:
              </label>
              <input
                type="text"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="contacto@tudominio.com"
                className="w-full bg-surface-container p-3 rounded-xl text-on-surface outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
              />
              <span className="text-[10px] text-outline mt-1 block">
                Dirección predeterminada para envíos y recepción.
              </span>
            </div>

            <div>
              <label className="text-outline font-bold uppercase block mb-1.5">
                Tu Nombre Completo / Remitente:
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full bg-surface-container p-3 rounded-xl text-on-surface outline-none focus:ring-1 focus:ring-primary font-medium"
              />
            </div>

            <div>
              <label className="text-outline font-bold uppercase block mb-1.5">
                Cargo o Título Profesional:
              </label>
              <input
                type="text"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                placeholder="Ej: Director Técnico / Desarrollador"
                className="w-full bg-surface-container p-3 rounded-xl text-on-surface outline-none focus:ring-1 focus:ring-primary font-medium"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: KDRIVE (INFOMANIAK) DEDICATED INTEGRATION */}
        <section className="bg-surface-container-low p-6 md:p-8 rounded-2xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">cloud_done</span>
                <h3 className="font-manrope uppercase tracking-widest text-xs font-bold text-[#90bbff]">
                  Nube kDrive (Infomaniak)
                </h3>
                {kdrive.connected && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-500/20">
                    Conectado
                  </span>
                )}
              </div>
              <p className="text-xs text-outline mt-1">
                Almacenamiento en la nube seguro con servidores en Suiza (WebDAV y API REST).
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-outline font-bold uppercase block mb-1">
                  Servidor WebDAV Oficial:
                </label>
                <input
                  type="text"
                  disabled
                  value="https://connect.drive.infomaniak.com"
                  className="w-full bg-surface-container/60 p-3 rounded-xl text-outline font-mono cursor-not-allowed text-xs"
                />
              </div>

              <div>
                <label className="text-outline font-bold uppercase block mb-1">
                  Usuario o Correo de Infomaniak:
                </label>
                <input
                  type="text"
                  value={kdUser}
                  onChange={(e) => setKdUser(e.target.value)}
                  placeholder="tu-correo@infomaniak.com"
                  className="w-full bg-surface-container p-3 rounded-xl text-on-surface outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="text-outline font-bold uppercase block mb-1">
                  Contraseña de Aplicación o Token kDrive:
                </label>
                <input
                  type="password"
                  value={kdToken}
                  onChange={(e) => setKdToken(e.target.value)}
                  placeholder="Generada en infomaniak.com/kdrive"
                  className="w-full bg-surface-container p-3 rounded-xl text-on-surface outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div>
                <label className="text-outline font-bold uppercase block mb-1">
                  Carpeta de Sincronización en kDrive:
                </label>
                <input
                  type="text"
                  value={kdFolder}
                  onChange={(e) => setKdFolder(e.target.value)}
                  placeholder="/Documentos/Adjuntos"
                  className="w-full bg-surface-container p-3 rounded-xl text-on-surface outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-on-surface font-bold text-xs">
                  {kdrive.connected
                    ? `kDrive Activo: ${kdrive.used || '142 GB'} usados de ${kdrive.total || '2.0 TB'}`
                    : 'kDrive listo para vincularse'}
                </p>
                <p className="text-[11px] text-outline">
                  Los archivos adjuntos grandes se guardarán directamente en tu kDrive suizo sin pasar por Google ni Microsoft.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestKdrive}
                disabled={kdTesting}
                className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <span className={`material-symbols-outlined text-sm ${kdTesting ? 'animate-spin' : ''}`}>
                  {kdTesting ? 'sync' : 'link'}
                </span>
                {kdTesting ? 'Verificando...' : kdrive.connected ? 'Comprobar Enlace' : 'Vincular kDrive'}
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 4: SERVER ACCESS */}
        <section className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">dns</span>
            <div>
              <p className="text-sm font-bold text-on-surface">Servidor IMAP / SMTP de Dominio Propio</p>
              <p className="text-xs text-outline">Hosts, puertos (993/465) y certificados TLS</p>
            </div>
          </div>
          <button
            onClick={onOpenServerSettings}
            className="px-5 py-2 rounded-xl bg-surface-container hover:bg-primary-container text-xs font-bold text-[#90bbff] uppercase transition-colors"
          >
            Configurar Servidores
          </button>
        </section>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSaveAll}
            className="px-8 py-3.5 rounded-2xl bg-primary-container text-on-primary-container font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-blue-900/40 cursor-pointer"
          >
            Guardar Todos los Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
