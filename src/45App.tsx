import React, { useState, useEffect } from 'react';
import { AppBranding, Email, FolderType, KdriveConfig, ScreenView, StorageStat } from './types';
import { INITIAL_EMAILS } from './data/emails';
import { INITIAL_DEVICES, STORAGE_STATS } from './data/devices';
import { INITIAL_CONTACTS } from './data/contacts';

import { Sidebar } from './components/Sidebar';
import { MobileHeader, MobileBottomNav } from './components/MobileNav';
import { EmailList } from './components/EmailList';
import { EmailDetail } from './components/EmailDetail';
import { RightWidgets } from './components/RightWidgets';
import { ComposeScreen } from './components/ComposeScreen';
import { SearchScreen } from './components/SearchScreen';
import { CloudScreen } from './components/CloudScreen';
import { ServerScreen } from './components/ServerScreen';
import { ConfigScreen } from './components/ConfigScreen';
import { LoginScreen } from './components/LoginScreen';
import { StorageModal } from './components/StorageModal';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('mail');
  const [currentFolder, setCurrentFolder] = useState<FolderType>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Search Query for Quick Inbox Filter
  const [quickSearch, setQuickSearch] = useState('');

  // Storage Modal State
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [storageFocus, setStorageFocus] = useState<'all' | 'drive' | 'onedrive'>('all');

  // Application Branding & Theme State
  const [branding, setBranding] = useState<AppBranding>(() => {
    const saved = localStorage.getItem('midnight_branding');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      appName: 'TH Correo',
      userName: 'Tlahuisca',
      userEmail: 'contacto@tlahuis.com',
      userRole: 'Dirección Jurídica y Tecnológica',
      theme: 'tlahuis'
    };
  });

  // kDrive Configuration State
  const [kdrive, setKdrive] = useState<KdriveConfig>(() => {
    const saved = localStorage.getItem('midnight_kdrive');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      connected: true,
      webdavUrl: 'https://connect.drive.infomaniak.com',
      username: 'usuario@infomaniak.com',
      token: '',
      remoteFolder: '/Documentos/Adjuntos',
      used: '142 GB',
      total: '2.0 TB',
      lastSync: 'Hace 5 min'
    };
  });

  // Apply dynamic theme class/attribute on root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', branding.theme);
    localStorage.setItem('midnight_branding', JSON.stringify(branding));
  }, [branding]);

  useEffect(() => {
    localStorage.setItem('midnight_kdrive', JSON.stringify(kdrive));
  }, [kdrive]);

  const updateBranding = (partial: Partial<AppBranding>) => {
    setBranding((prev) => ({ ...prev, ...partial }));
  };

  const updateKdrive = (partial: Partial<KdriveConfig>) => {
    setKdrive((prev) => ({ ...prev, ...partial }));
  };

  // Application Data State
  const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [storageStats, setStorageStats] = useState<StorageStat[]>(STORAGE_STATS);
  const [contacts] = useState(INITIAL_CONTACTS);

  // Syncing & Notifications State
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Folder and Status Counts
  const unreadCount = emails.filter((e) => e.folder === 'inbox' && !e.read).length;
  const draftsCount = emails.filter((e) => e.folder === 'drafts').length;
  const starredCount = emails.filter((e) => e.starred).length;
  const sentCount = emails.filter((e) => e.folder === 'sent').length;

  // Handlers
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setCurrentScreen('detalles');
    if (!email.read) {
      setEmails((prev) =>
        prev.map((item) => (item.id === email.id ? { ...item, read: true } : item))
      );
    }
  };

  const handleToggleStar = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmails((prev) =>
      prev.map((mail) => {
        if (mail.id === id) {
          const updated = { ...mail, starred: !mail.starred };
          if (selectedEmail?.id === id) setSelectedEmail(updated);
          return updated;
        }
        return mail;
      })
    );
  };

  const handleToggleRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmails((prev) =>
      prev.map((mail) => {
        if (mail.id === id) {
          const updated = { ...mail, read: !mail.read };
          if (selectedEmail?.id === id) setSelectedEmail(updated);
          return updated;
        }
        return mail;
      })
    );
  };

  const handleDeleteEmail = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmails((prev) => prev.filter((mail) => mail.id !== id));
    if (selectedEmail?.id === id) {
      setSelectedEmail(null);
      setCurrentScreen('mail');
    }
    addToast('Registro eliminado de la bandeja.', 'info');
  };

  const handleSendEmail = (newEmailData: Omit<Email, 'id' | 'time' | 'dateGroup'>) => {
    const newEmail: Email = {
      ...newEmailData,
      id: `email-${Date.now()}`,
      time: 'Ahora',
      dateGroup: 'Hoy'
    };
    setEmails((prev) => [newEmail, ...prev]);
    setCurrentScreen('mail');
    addToast(`Correo transmitido con éxito a ${newEmail.recipient}`);
  };

  const handleDownloadAttachment = (fileName: string) => {
    addToast(`Descargando archivo: ${fileName}`, 'info');
    const blob = new Blob([`Midnight Blueprint Asset: ${fileName}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToDrive = (fileName: string) => {
    addToast(`Guardado en kDrive (Infomaniak): ${fileName}`);
    updateKdrive({ lastSync: 'Justo ahora' });
  };

  const handleSaveToOneDrive = (fileName: string) => {
    addToast(`Guardado en kDrive (Infomaniak): ${fileName}`);
    updateKdrive({ lastSync: 'Justo ahora' });
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          lastSync: d.status === 'connected' ? 'Justo ahora' : d.lastSync
        }))
      );
      addToast('Telemetría de nodos sincronizada: latencia media 1.2ms.');
    }, 1200);
  };

  const handleSyncDevice = (deviceName: string) => {
    addToast(`Probando enlace con ${deviceName}...`);
    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) =>
          d.name === deviceName ? { ...d, status: 'connected', statusText: 'Conectado', latency: '8ms', lastSync: 'Justo ahora' } : d
        )
      );
      addToast(`Enlace verificado con ${deviceName} a 8ms.`);
    }, 900);
  };

  const handleToggleCloudConnect = (serviceName: string) => {
    setStorageStats((prev) =>
      prev.map((s) =>
        s.name === serviceName ? { ...s, status: s.status === 'connected' ? 'disconnected' : 'connected' } : s
      )
    );
    addToast(`Servicio ${serviceName} actualizado.`);
  };

  const handleExpandPlan = (planName: string) => {
    setStorageStats((prev) =>
      prev.map((s) => (s.name === 'Google Drive' ? { ...s, total: '5.0 TB', percentage: 29 } : s))
    );
    addToast(`Almacenamiento expandido a ${planName} exitosamente.`);
  };

  const getHeaderTitle = () => {
    switch (currentScreen) {
      case 'busqueda':
        return 'Búsqueda';
      case 'nube':
        return 'kDrive & Nube';
      case 'servidor':
        return 'Servidor IMAP';
      case 'config':
        return 'Ajustes y Temas';
      case 'login':
        return 'Iniciar Sesión';
      case 'redactar':
        return 'Redactar';
      case 'detalles':
        return 'Detalle de Correo';
      default:
        switch (currentFolder) {
          case 'inbox':
            return 'Recibidos';
          case 'sent':
            return 'Enviados';
          case 'drafts':
            return 'Borradores';
          case 'starred':
            return 'Destacados';
          case 'trash':
            return 'Papelera';
          case 'spam':
            return 'Spam';
          default:
            return 'Todas las bandejas';
        }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-on-surface selection:bg-primary-container selection:text-on-primary-container font-manrope transition-colors duration-300">
      {/* Toast Alert System */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Desktop Navigation Drawer */}
      <Sidebar
        currentFolder={currentFolder}
        onSelectFolder={(folder) => {
          setCurrentFolder(folder);
          setSelectedEmail(null);
          setCurrentScreen('mail');
        }}
        currentScreen={currentScreen}
        onSelectScreen={(screen) => {
          setCurrentScreen(screen);
          setSelectedEmail(null);
        }}
        unreadCount={unreadCount}
        draftsCount={draftsCount}
        starredCount={starredCount}
        sentCount={sentCount}
        isOpenMobile={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        onOpenLogin={() => setCurrentScreen('login')}
        branding={branding}
        kdrive={kdrive}
      />

      {/* Mobile Top App Bar */}
      <MobileHeader
        title={getHeaderTitle()}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
        onAvatarClick={() => {
          setCurrentScreen('config');
          setSelectedEmail(null);
        }}
      />

      {/* Main Content Canvas */}
      <main className="md:ml-80 min-h-screen pb-28 md:pb-16 pt-4 px-4 sm:px-6 md:px-10 lg:px-12 max-w-7xl">
        {currentScreen === 'mail' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Focused List (Emails) */}
            <div className="lg:col-span-8">
              <EmailList
                emails={emails}
                currentFolder={currentFolder}
                onSelectEmail={handleSelectEmail}
                onToggleStar={handleToggleStar}
                onToggleRead={handleToggleRead}
                onDeleteEmail={handleDeleteEmail}
                searchQuery={quickSearch}
                onSearchChange={setQuickSearch}
              />
            </div>

            {/* Sidebar Modules / Widgets (Desktop Right Column) */}
            <div className="hidden lg:block lg:col-span-4 sticky top-6">
              <RightWidgets
                storageStats={storageStats}
                devices={devices}
                kdrive={kdrive}
                onOpenStorageModal={() => {
                  setStorageFocus('all');
                  setIsStorageModalOpen(true);
                }}
                onOpenKdrive={() => setCurrentScreen('nube')}
                onSyncDevice={handleSyncDevice}
              />
            </div>

            {/* For Mobile/Tablet: Show Widgets below email list */}
            <div className="block lg:hidden mt-8">
              <RightWidgets
                storageStats={storageStats}
                devices={devices}
                kdrive={kdrive}
                onOpenStorageModal={() => {
                  setStorageFocus('all');
                  setIsStorageModalOpen(true);
                }}
                onOpenKdrive={() => setCurrentScreen('nube')}
                onSyncDevice={handleSyncDevice}
              />
            </div>
          </div>
        )}

        {currentScreen === 'detalles' && selectedEmail && (
          <EmailDetail
            email={selectedEmail}
            onBack={() => {
              setSelectedEmail(null);
              setCurrentScreen('mail');
            }}
            onToggleStar={(id) => handleToggleStar(id)}
            onToggleRead={(id) => handleToggleRead(id)}
            onDelete={(id) => handleDeleteEmail(id)}
            onReply={() => setCurrentScreen('redactar')}
            onForward={() => setCurrentScreen('redactar')}
            onSaveToDrive={handleSaveToDrive}
            onSaveToOneDrive={handleSaveToOneDrive}
            onDownloadAttachment={handleDownloadAttachment}
          />
        )}

        {currentScreen === 'redactar' && (
          <ComposeScreen
            onBack={() => setCurrentScreen('mail')}
            onSend={handleSendEmail}
            contacts={contacts}
          />
        )}

        {currentScreen === 'busqueda' && (
          <SearchScreen
            emails={emails}
            onSelectEmail={handleSelectEmail}
            onBack={() => setCurrentScreen('mail')}
          />
        )}

        {currentScreen === 'nube' && (
          <CloudScreen
            onBack={() => setCurrentScreen('mail')}
            kdrive={kdrive}
            onUpdateKdrive={updateKdrive}
            storageStats={storageStats}
            onToggleConnect={handleToggleCloudConnect}
            onOpenStorageModal={() => {
              setStorageFocus('all');
              setIsStorageModalOpen(true);
            }}
            onSaveToast={(msg) => addToast(msg)}
          />
        )}

        {currentScreen === 'servidor' && (
          <ServerScreen
            onBack={() => setCurrentScreen('config')}
            onVerifiedToast={(msg) => addToast(msg)}
          />
        )}

        {currentScreen === 'config' && (
          <ConfigScreen
            onBack={() => setCurrentScreen('mail')}
            branding={branding}
            onUpdateBranding={updateBranding}
            kdrive={kdrive}
            onUpdateKdrive={updateKdrive}
            onOpenServerSettings={() => setCurrentScreen('servidor')}
            onOpenLogin={() => setCurrentScreen('login')}
            onSaveToast={(msg) => addToast(msg)}
          />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={(email) => {
              updateBranding({ userEmail: email });
              addToast(`Sesión iniciada como ${email}.`);
              setCurrentScreen('mail');
            }}
            onOpenManualConfig={() => setCurrentScreen('servidor')}
            onCancel={() => setCurrentScreen('mail')}
          />
        )}
      </main>

      {/* Floating Action Button (FAB) from Stitch */}
      {(currentScreen === 'mail' || currentScreen === 'busqueda') && (
        <button
          onClick={() => setCurrentScreen('redactar')}
          className="fixed right-6 bottom-20 md:bottom-8 z-40 h-14 w-14 rounded-2xl bg-primary text-on-primary shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform duration-200 group cursor-pointer"
          aria-label="Redactar nuevo correo"
        >
          <span className="material-symbols-outlined text-2xl font-bold">edit</span>
          <span className="absolute right-full mr-4 bg-surface-container-highest text-on-surface px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg border border-outline-variant/20">
            Redactar
          </span>
        </button>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentScreen={currentScreen}
        onSelectScreen={(screen) => {
          setCurrentScreen(screen);
          setSelectedEmail(null);
        }}
        unreadCount={unreadCount}
      />

      {/* Storage Modal */}
      <StorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        serviceFocus={storageFocus}
        storageStats={storageStats}
        onExpandPlan={handleExpandPlan}
        onTriggerCloudSync={(service) => addToast(`Sincronización completada para ${service}.`)}
      />
    </div>
  );
}
