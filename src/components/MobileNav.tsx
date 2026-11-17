import React from 'react';
import { ScreenView } from '../types';

interface MobileHeaderProps {
  title: string;
  onOpenDrawer: () => void;
  onAvatarClick: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onOpenDrawer,
  onAvatarClick
}) => {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-[#0b1326]/95 backdrop-blur-md w-full flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <button
          className="text-[#90bbff] active:scale-95 duration-200 p-1 -ml-1 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
          onClick={onOpenDrawer}
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <h1 className="font-manrope font-bold text-xl tracking-tight text-[#90bbff]">
          {title}
        </h1>
      </div>
      <button
        onClick={onAvatarClick}
        className="h-9 w-9 rounded-full bg-surface-container-highest overflow-hidden ring-1 ring-outline-variant/30 hover:ring-primary transition-all relative cursor-pointer"
      >
        <img
          alt="Perfil"
          className="h-full w-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_b9vA8s8cYEQFR9Hph5ycyvY7i6eyimSHA9MNtvZH2JydZdtDDTCGuupOP1z5iwnGIzcYKIB6oX2aivCGQQo2iGge5YfLRzP1BXZ4rMp-bu-1Y3e9nyucLVZ-g08_YFMjXtCzZ_SVwPByyyuGdGUXAm8aUVJ66z7CHt1T2YcRpBfiXNR_oaNhEtHXNhK5RasO7uP9PHxbLXf_-5dUODGNc5xx0E9a63FRIxY4DJnX80pmcWmtnRSGgLRvNPWzMi65RTIh-dPuWj7R"
        />
        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-[#0b1326]" />
      </button>
    </header>
  );
};

interface MobileBottomNavProps {
  currentScreen: ScreenView;
  onSelectScreen: (screen: ScreenView) => void;
  unreadCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onSelectScreen,
  unreadCount = 0
}) => {
  const tabs: { id: ScreenView; label: string; icon: string; count?: number }[] = [
    { id: 'mail', label: 'Correo', icon: 'mail', count: unreadCount },
    { id: 'busqueda', label: 'Búsqueda', icon: 'search' },
    { id: 'nube', label: 'Nube', icon: 'cloud' },
    { id: 'config', label: 'Ajustes', icon: 'settings' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 py-2.5 bg-[#31394d]/80 backdrop-blur-xl border-t border-outline-variant/20 shadow-2xl">
      {tabs.map((tab) => {
        const isActive = currentScreen === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectScreen(tab.id)}
            className={`relative flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer ${
              isActive
                ? 'bg-[#004a8d] text-[#90bbff] shadow-md shadow-blue-950/40'
                : 'text-[#c2c6d1] hover:text-white'
            }`}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {tab.icon}
            </span>
            <span className="font-manrope text-[10px] uppercase tracking-wider mt-0.5 font-semibold">
              {tab.label}
            </span>
            {tab.id === 'mail' && unreadCount > 0 && !isActive && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
