import React, { useState } from 'react';
import { Email } from '../types';

interface SearchScreenProps {
  emails: Email[];
  onSelectEmail: (email: Email) => void;
  onBack: () => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ emails, onSelectEmail, onBack }) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [recentSearches, setRecentSearches] = useState([
    'Reporte trimestral Q3 2023',
    'Facturas Amazon Web Services',
    'Planos Terminal Norte',
    'Kernel 2.0 Xiaomi'
  ]);
  const [searchResults, setSearchResults] = useState<Email[] | null>(null);

  const executeSearch = () => {
    const q = query.toLowerCase().trim();
    const results = emails.filter((mail) => {
      if (activeFilter === 'unread' && mail.read) return false;
      if (activeFilter === 'attachments' && (!mail.attachments || mail.attachments.length === 0)) return false;
      if (activeFilter === 'this_week' && mail.dateGroup !== 'Hoy' && mail.dateGroup !== 'Esta semana') return false;

      if (fromFilter && !mail.sender.toLowerCase().includes(fromFilter.toLowerCase()) && !mail.senderEmail.toLowerCase().includes(fromFilter.toLowerCase())) {
        return false;
      }
      if (toFilter && !mail.recipient.toLowerCase().includes(toFilter.toLowerCase())) {
        return false;
      }
      if (subjectFilter && !mail.subject.toLowerCase().includes(subjectFilter.toLowerCase())) {
        return false;
      }

      if (q) {
        const inSender = mail.sender.toLowerCase().includes(q);
        const inSubject = mail.subject.toLowerCase().includes(q);
        const inSnippet = mail.snippet.toLowerCase().includes(q);
        const inBody = mail.body.toLowerCase().includes(q);
        return inSender || inSubject || inSnippet || inBody;
      }

      return true;
    });

    setSearchResults(results);
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches((prev) => [query.trim(), ...prev.slice(0, 3)]);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in max-w-4xl mx-auto pb-16">
      {/* TopAppBar matching Stitch */}
      <header className="flex items-center justify-between pb-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-[#90bbff] hover:bg-[#222a3d] transition-colors p-2 rounded-xl active:scale-95 duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-manrope font-semibold tracking-tight text-on-surface text-xl">
            Búsqueda Avanzada
          </h1>
        </div>
        <button
          onClick={executeSearch}
          className="text-[#90bbff] hover:bg-[#222a3d] transition-colors p-2 rounded-xl active:scale-95 duration-200 cursor-pointer"
        >
          <span className="material-symbols-outlined">tune</span>
        </button>
      </header>

      {/* Search Input Hero */}
      <section className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-primary text-2xl">search</span>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
          className="w-full bg-surface-container-high border-none rounded-2xl py-5 pl-14 pr-6 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary transition-all duration-300 text-lg shadow-2xl outline-none"
          placeholder="Buscar mensajes, archivos o personas..."
          type="text"
        />
      </section>

      {/* Filtros Rápidos (Chips) */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.15em] font-bold text-on-surface-variant px-1">
          Filtros Rápidos
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setActiveFilter(activeFilter === 'unread' ? null : 'unread');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors text-sm font-medium cursor-pointer ${
              activeFilter === 'unread'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-secondary-container text-on-secondary-container hover:bg-surface-bright'
            }`}
          >
            <span className="material-symbols-outlined text-sm">mail</span>
            No leídos
          </button>

          <button
            onClick={() => {
              setActiveFilter(activeFilter === 'attachments' ? null : 'attachments');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors text-sm font-medium cursor-pointer ${
              activeFilter === 'attachments'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-sm">attachment</span>
            Con archivos adjuntos
          </button>

          <button
            onClick={() => {
              setActiveFilter(activeFilter === 'this_week' ? null : 'this_week');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors text-sm font-medium cursor-pointer ${
              activeFilter === 'this_week'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-sm">event</span>
            Esta semana
          </button>
        </div>
      </section>

      {/* Búsquedas Recientes */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-xs uppercase tracking-[0.15em] font-bold text-on-surface-variant">
            Búsquedas Recientes
          </h2>
          <button
            onClick={() => setRecentSearches([])}
            className="text-xs text-primary font-bold hover:underline cursor-pointer"
          >
            Limpiar historial
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentSearches.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                setQuery(item);
                setTimeout(executeSearch, 50);
              }}
              className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors group cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                history
              </span>
              <span className="text-sm font-medium text-on-surface">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Búsqueda por Atributos (Bento Grid Style) */}
      <section className="space-y-6">
        <h2 className="text-xs uppercase tracking-[0.15em] font-bold text-on-surface-variant px-1">
          Búsqueda por Atributos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* De / Para */}
          <div className="md:col-span-6 space-y-4">
            <div className="bg-surface-container p-6 rounded-xl space-y-4 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                  De:
                </label>
                <input
                  value={fromFilter}
                  onChange={(e) => setFromFilter(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-lg py-3 px-4 focus:ring-1 focus:ring-primary text-sm text-on-surface outline-none"
                  placeholder="elena@blueprint.design..."
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                  Para:
                </label>
                <input
                  value={toFilter}
                  onChange={(e) => setToFilter(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-lg py-3 px-4 focus:ring-1 focus:ring-primary text-sm text-on-surface outline-none"
                  placeholder="pro@midnight.blueprint..."
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* Asunto */}
          <div className="md:col-span-6 bg-surface-container p-6 rounded-xl flex flex-col justify-center space-y-2 shadow-sm">
            <label className="text-xs font-bold text-primary uppercase tracking-wider block">
              Asunto:
            </label>
            <textarea
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full h-full bg-surface-container-highest border-none rounded-lg py-3 px-4 focus:ring-1 focus:ring-primary text-sm resize-none text-on-surface outline-none min-h-[110px]"
              placeholder="Palabras clave en el título del correo..."
            />
          </div>

          {/* Selector de Rango de Fecha */}
          <div className="md:col-span-12 bg-surface-container-low p-6 rounded-xl space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">
                Rango de Fecha
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setDateRange('today')}
                className={`py-3 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  dateRange === 'today'
                    ? 'bg-primary-container text-on-primary-container shadow-lg'
                    : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setDateRange('week')}
                className={`py-3 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  dateRange === 'week'
                    ? 'bg-primary-container text-on-primary-container shadow-lg'
                    : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright'
                }`}
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                onClick={() => setDateRange('month')}
                className={`py-3 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  dateRange === 'month'
                    ? 'bg-primary-container text-on-primary-container shadow-lg'
                    : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright'
                }`}
              >
                Último mes
              </button>
              <button
                type="button"
                onClick={() => setDateRange('all')}
                className={`py-3 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  dateRange === 'all'
                    ? 'bg-primary-container text-on-primary-container shadow-lg'
                    : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright'
                }`}
              >
                Cualquier fecha
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Action Button */}
      <section className="pt-4 flex justify-center">
        <button
          onClick={executeSearch}
          className="bg-gradient-to-r from-primary-container to-[#003060] text-on-primary-container px-12 py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-primary/20 active:scale-95 transition-all duration-200 flex items-center gap-3 cursor-pointer"
        >
          <span className="material-symbols-outlined">search</span>
          Buscar en todo el correo
        </button>
      </section>

      {/* Search Results Display */}
      {searchResults !== null && (
        <section className="space-y-4 pt-6 border-t border-outline-variant/15">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-on-surface">
              Resultados de Búsqueda ({searchResults.length})
            </h3>
            <button
              onClick={() => setSearchResults(null)}
              className="text-xs text-outline hover:text-white"
            >
              Cerrar resultados
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-surface-container-low p-8 rounded-xl text-center text-outline text-sm">
              No se encontraron coincidencias para los criterios especificados.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((mail) => (
                <div
                  key={mail.id}
                  onClick={() => onSelectEmail(mail)}
                  className="bg-surface-container-low hover:bg-surface-container-high transition-colors p-5 rounded-2xl cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface text-sm">{mail.sender}</span>
                      <span className="text-[10px] text-outline font-mono">({mail.time})</span>
                    </div>
                    <p className="text-xs font-semibold text-primary truncate">{mail.subject}</p>
                    <p className="text-xs text-outline line-clamp-1">{mail.snippet}</p>
                  </div>
                  <span className="material-symbols-outlined text-outline">chevron_right</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
