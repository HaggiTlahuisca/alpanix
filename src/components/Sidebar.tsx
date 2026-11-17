import React from 'react';
import { AppBranding, FolderType, KdriveConfig, ScreenView } from '../types';

interface SidebarProps {
  currentFolder: FolderType;
  onSelectFolder: (folder: FolderType) => void;
  currentScreen: ScreenView;
  onSelectScreen: (screen: ScreenView) => void;
  unreadCount: number;
  draftsCount: number;
  starredCount: number;
  sentCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onOpenLogin: () => void;
  branding: AppBranding;
  kdrive: KdriveConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  onSelectFolder,
  currentScreen,
  onSelectScreen,
  unreadCount,
  draftsCount,
  starredCount,
  sentCount,
  isOpenMobile,
  onCloseMobile,
  isSyncing,
  onTriggerSync,
  onOpenLogin,
  branding,
  kdrive
}) => {
  const folders: { id: FolderType; label: string; icon: string; count?: number }[] = [
    { id: 'inbox', label: 'Principal', icon: 'inbox', count: unreadCount },
    { id: 'all', label: 'Todas las bandejas', icon: 'all_inbox' },
    { id: 'sent', label: 'Enviados', icon: 'send', count: sentCount },
    { id: 'drafts', label: 'Borradores', icon: 'draft', count: draftsCount },
    { id: 'starred', label: 'Favoritos', icon: 'star', count: starredCount },
    { id: 'trash', label: 'Papelera', icon: 'delete' },
    { id: 'spam', label: 'Spam', icon: 'report' }
  ];

  const content = (
    <div className="flex flex-col h-full py-2">
      {/* Brand & Account Header with customizable App Name */}
      <div className="px-2 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-on-primary font-black shadow-lg shadow-primary/20 text-base flex-shrink-0">
              {branding.appName.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-bold text-[#90bbff] leading-tight truncate">
                {branding.appName || 'Mi Correo'}
              </span>
              <span className="text-xs text-on-surface-variant/70 font-medium truncate">
                {branding.userEmail || 'usuario@dominio.com'}
              </span>
            </div>
          </div>
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-on-surface-variant hover:text-white p-1 rounded-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Active Account Card */}
        <div
          onClick={onOpenLogin}
          className="bg-[#171f33] rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-surface-container-high transition-colors group"
          title="Cambiar cuenta de usuario"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-outline-variant/30 bg-primary-container/30 flex items-center justify-center text-primary font-bold text-xs">
              {branding.userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">{branding.userName}</p>
              <p className="text-[10px] text-primary font-mono truncate">{unreadCount} sin leer</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-base">
            switch_account
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-1 pr-1.5">
        <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
          Carpetas
        </div>

        {folders.map((item) => {
          const isActive = currentScreen === 'mail' && currentFolder === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectScreen('mail');
                onSelectFolder(item.id);
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-left ${
                isActive
                  ? 'bg-[#004a8d] text-[#90bbff] font-bold shadow-md shadow-blue-950/40'
                  : 'text-[#c2c6d1] hover:bg-[#222a3d] hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-lg ${
                    isActive ? 'text-[#90bbff]' : 'text-outline'
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="font-manrope uppercase tracking-widest text-xs font-semibold">
                  {item.label}
                </span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-primary/25 text-[#dae2fd]'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Cloud Storage Section (featuring kDrive at the top) */}
        <div className="pt-5 pb-2">
          <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
            Nube de Archivos
          </div>

          {/* kDrive by Infomaniak as primary */}
          <button
            onClick={() => {
              onSelectScreen('nube');
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg cursor-pointer transition-all text-[#c2c6d1] hover:bg-[#222a3d] hover:text-white text-left group bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-lg text-primary group-hover:scale-110 transition-transform">
                folder_managed
              </span>
              <span className="font-manrope text-xs font-semibold text-primary">kDrive Suiza</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              {kdrive.connected ? 'Activo' : 'Conectar'}
            </span>
          </button>
        </div>

        {/* Tools Section */}
        <div className="pt-5 pb-2">
          <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
            Herramientas
          </div>

          <button
            onClick={() => {
              onSelectScreen('busqueda');
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg cursor-pointer transition-all text-left ${
              currentScreen === 'busqueda'
                ? 'bg-[#004a8d] text-[#90bbff] font-bold'
                : 'text-[#c2c6d1] hover:bg-[#222a3d]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">search</span>
            <span className="font-manrope uppercase tracking-widest text-xs font-semibold">
              Búsqueda
            </span>
          </button>

          <button
            onClick={() => {
              onSelectScreen('servidor');
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg cursor-pointer transition-all text-left ${
              currentScreen === 'servidor'
                ? 'bg-[#004a8d] text-[#90bbff] font-bold'
                : 'text-[#c2c6d1] hover:bg-[#222a3d]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">dns</span>
            <span className="font-manrope uppercase tracking-widest text-xs font-semibold">
              Servidor IMAP/SMTP
            </span>
          </button>

          <button
            onClick={() => {
              onSelectScreen('config');
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg cursor-pointer transition-all text-left ${
              currentScreen === 'config'
                ? 'bg-[#004a8d] text-[#90bbff] font-bold'
                : 'text-[#c2c6d1] hover:bg-[#222a3d]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            <span className="font-manrope uppercase tracking-widest text-xs font-semibold">
              Ajustes y Temas
            </span>
          </button>
        </div>
      </nav>

      {/* Sync Status Footer */}
      <div className="mt-auto pt-4 border-t border-outline-variant/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div
                className={`h-8 w-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant ${
                  isSyncing ? 'animate-spin text-primary' : ''
                }`}
              >
                <span className="material-symbols-outlined text-sm">sync</span>
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-on-surface font-semibold tracking-tight">
                {isSyncing ? 'Sincronizando...' : 'Sistema Sincronizado'}
              </span>
              <span className="text-[9px] text-outline font-mono">
                {kdrive.connected ? 'kDrive WebDAV OK' : 'Enlace Activo'}
              </span>
            </div>
          </div>

          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            title="Sincronizar telemetría"
            className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col p-5 bg-[#131b2e] w-80 shadow-2xl shadow-blue-900/10 border-r border-outline-variant/10">
        {content}
      </aside>

      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-76 max-w-[85vw] bg-[#0b1326] p-5 shadow-2xl flex flex-col z-10 border-r border-outline-variant/10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
