import React, { useState, useEffect } from 'react';

export const ServerScreen: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('midnight_api_url') || 'https://api.tlahuisca.com.mx');
  const [accounts, setAccounts] = useState<any[]>([]);
  
  // Variables para la nueva cuenta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imapHost, setImapHost] = useState('mail.tlahuisca.com.mx');
  const [smtpHost, setSmtpHost] = useState('mail.tlahuisca.com.mx');
  const [statusMsg, setStatusMsg] = useState('');

  // Cargar las cuentas guardadas al abrir la pantalla
  useEffect(() => {
    const saved = localStorage.getItem('midnight_accounts');
    if (saved) {
      setAccounts(JSON.parse(saved));
    }
  }, []);

  const handleAddAccount = () => {
    if (!email || !password) {
      setStatusMsg('Por favor llena el correo y contraseña.');
      return;
    }
    
    // Crear la nueva cuenta y añadirla a la lista
    const newAccount = { email, password, imapHost, smtpHost };
    const updatedAccounts = [...accounts, newAccount];
    
    setAccounts(updatedAccounts);
    localStorage.setItem('midnight_accounts', JSON.stringify(updatedAccounts));
    localStorage.setItem('midnight_api_url', apiUrl); // Guardamos la API global también
    
    // Limpiar las cajas
    setEmail('');
    setPassword('');
    setStatusMsg(`¡Cuenta ${newAccount.email} agregada correctamente!`);
    
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleRemoveAccount = (emailToRemove: string) => {
    const updated = accounts.filter(acc => acc.email !== emailToRemove);
    setAccounts(updated);
    localStorage.setItem('midnight_accounts', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-2xl mx-auto pb-24">
      <div>
        <h2 className="text-3xl font-extrabold text-on-surface mb-2">Conexión y Cuentas</h2>
        <p className="text-on-surface-variant text-sm">
          Añade múltiples cuentas de dominio propio. Los datos se cifran en tu dispositivo.
        </p>
      </div>

      {/* Enlace API */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-3xl p-6 shadow-md">
        <h3 className="text-sm uppercase tracking-wider font-bold text-primary flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-base">dns</span>
          1. API del Servidor VPS
        </h3>
        <div>
          <input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full bg-[#0b1326] border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-primary font-mono outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Cuentas Guardadas */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-3xl p-6 shadow-md">
        <h3 className="text-sm uppercase tracking-wider font-bold text-primary flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-base">list</span>
          2. Cuentas Activas ({accounts.length})
        </h3>
        {accounts.length === 0 ? (
          <p className="text-xs text-outline text-center py-2">No has agregado ninguna cuenta aún.</p>
        ) : (
          <ul className="space-y-3">
            {accounts.map((acc, index) => (
              <li key={index} className="flex justify-between items-center bg-[#0b1326] p-4 rounded-xl border border-outline-variant/10">
                <div>
                  <p className="text-sm font-bold text-white">{acc.email}</p>
                  <p className="text-xs text-primary font-mono">IMAP: {acc.imapHost}</p>
                </div>
                <button onClick={() => handleRemoveAccount(acc.email)} className="text-red-400 hover:text-red-300 p-2">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Agregar Cuenta */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-3xl p-6 shadow-md space-y-4">
        <h3 className="text-sm uppercase tracking-wider font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-base">person_add</span>
          3. Agregar Nueva Cuenta
        </h3>
        
        <div>
          <label className="text-xs font-bold text-outline">Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cuenta@tudominio.com"
            className="w-full bg-[#0b1326] border border-outline-variant/20 rounded-xl px-4 py-3 mt-1 text-sm text-white font-mono outline-none focus:border-primary"
          />
        </div>
        
        <div>
          <label className="text-xs font-bold text-outline">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full bg-[#0b1326] border border-outline-variant/20 rounded-xl px-4 py-3 mt-1 text-sm text-white font-mono outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-outline">Servidor IMAP (Entrada)</label>
            <input
              type="text"
              value={imapHost}
              onChange={(e) => setImapHost(e.target.value)}
              className="w-full bg-[#0b1326] border border-outline-variant/20 rounded-xl px-4 py-3 mt-1 text-sm text-white font-mono outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-outline">Servidor SMTP (Salida)</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              className="w-full bg-[#0b1326] border border-outline-variant/20 rounded-xl px-4 py-3 mt-1 text-sm text-white font-mono outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          onClick={handleAddAccount}
          className="w-full py-4 mt-2 rounded-2xl bg-primary text-on-primary font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95 flex justify-center items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Guardar Cuenta
        </button>
        
        {statusMsg && (
          <p className="text-center text-emerald-400 text-xs font-bold animate-in fade-in">{statusMsg}</p>
        )}
      </div>
    </div>
  );
};