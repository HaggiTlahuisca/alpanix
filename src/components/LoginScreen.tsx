import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
  onOpenManualConfig: () => void;
  onCancel: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenManualConfig,
  onCancel
}) => {
  const [email, setEmail] = useState('pro@midnight.blueprint');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onLoginSuccess(email);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col md:flex-row bg-[#0b1326] rounded-3xl overflow-hidden border border-outline-variant/15 shadow-2xl my-4">
      {/* Blueprint Grid Background Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #2d3449 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Left Section (Desktop Hero) matching Stitch */}
      <section className="hidden md:flex flex-1 relative overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 opacity-40">
          <img
            alt="Arquitectura"
            className="w-full h-full object-cover grayscale contrast-125"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs_rV62a3wx5EDmpvMJYsE_2OzAjEjzfE3-lYmvyGamcPgjUs4BMrSXJq8hBf5MJ7gzfjlTxkgLTAteENOEtt8ZtQentdCYmnYkll8nrfTl7IowYoQTEx1VUBOdWmp9IUvdKP99JmGJ3GrrpxNeTb7FaGDMUZ59KoV-OSXr28pimUJZTABJmOex_tpe4SSGdjwVJLAaUPIvLnCbue9DrXeyFJauofXoA870mj0Hi_WV2-UBQKkpIKNo6SFkR9sBwnNk3Wb7H_Ago8a"
          />
        </div>

        <div className="relative z-10 p-12 lg:p-16 flex flex-col justify-between w-full h-full">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-4xl">mail</span>
            <h1 className="text-2xl font-manrope tracking-tight font-bold text-on-surface">
              Midnight Mail
            </h1>
          </div>

          <div className="max-w-md">
            <p className="text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] leading-tight mb-6 font-headline">
              La arquitectura <br />
              <span className="text-primary italic font-medium">del enfoque.</span>
            </p>
            <p className="text-on-surface-variant leading-relaxed text-base">
              Diseñado para la precisión. Nuestro enfoque editorial elimina el desorden de tus comunicaciones digitales, brindando un entorno para el trabajo profundo.
            </p>
          </div>

          <div className="flex gap-8 text-[11px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            <span>Precisión</span>
            <span>Privacidad</span>
            <span>Rendimiento</span>
          </div>
        </div>

        <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-transparent via-outline-variant/20 to-transparent" />
      </section>

      {/* Right Section (Form) matching Stitch */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-16 lg:p-24 relative z-20">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="flex items-center justify-between">
            <div className="md:hidden flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">mail</span>
              <h1 className="text-lg font-bold tracking-tight">Midnight Mail</h1>
            </div>
            <button
              onClick={onCancel}
              className="text-xs text-outline hover:text-white uppercase font-bold tracking-wider ml-auto"
            >
              Cerrar
            </button>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-[-0.02em] mb-2 font-headline">
              Iniciar sesión
            </h2>
            <p className="text-on-surface-variant text-sm">
              Ingresa tus credenciales para acceder a tu bandeja de entrada segura.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label
                className="text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant px-1 block"
                htmlFor="email"
              >
                Correo electrónico
              </label>
              <div className="group relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-highest border-none h-14 px-4 text-on-surface focus:ring-0 transition-all rounded-lg outline-none text-sm font-medium"
                  placeholder="nombre@dominio.com"
                  required
                />
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-focus-within:w-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <a
                  className="text-[11px] font-bold uppercase tracking-[0.05em] text-primary hover:underline"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Enlace de restablecimiento enviado.');
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="group relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-highest border-none h-14 px-4 text-on-surface focus:ring-0 transition-all rounded-lg outline-none text-sm"
                  placeholder="••••••••"
                  required
                />
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-focus-within:w-full" />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-4">
              <button
                type="submit"
                className="h-14 w-full bg-primary-container text-on-primary-container font-bold text-sm tracking-[0.05em] uppercase hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-lg shadow-blue-900/30"
              >
                <span>Entrar</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-outline-variant/20" />
                <span className="flex-shrink mx-4 text-[10px] uppercase tracking-[0.2em] text-outline">
                  o configuración manual
                </span>
                <div className="flex-grow border-t border-outline-variant/20" />
              </div>

              <button
                type="button"
                onClick={onOpenManualConfig}
                className="h-14 w-full bg-transparent border border-outline-variant/30 text-primary font-bold text-sm tracking-[0.05em] uppercase hover:bg-surface-container-high active:scale-[0.98] transition-all flex items-center justify-center gap-2 rounded-xl cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">settings_ethernet</span>
                <span>Configuración manual (IMAP/SMTP)</span>
              </button>
            </div>
          </form>

          <div className="pt-8 flex flex-col gap-4 text-center">
            <p className="text-on-surface-variant text-sm">
              ¿Eres nuevo en Midnight Mail?{' '}
              <a
                className="text-primary font-bold hover:underline ml-1"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Invitación solicitada para el nodo arquitectónico.');
                }}
              >
                Solicita una invitación
              </a>
            </p>
            <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest text-outline">
              <a href="#" className="hover:text-on-surface transition-colors">
                Seguridad
              </a>
              <a href="#" className="hover:text-on-surface transition-colors">
                Privacidad
              </a>
              <a href="#" className="hover:text-on-surface transition-colors">
                Arquitectura
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
