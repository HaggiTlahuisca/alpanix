import React, { useState } from 'react';
import { CalendarEvent } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, onAddEvent }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('Hoy');
  const [type, setType] = useState<CalendarEvent['type']>('architecture');
  const [location, setLocation] = useState('');

  const filtered = events.filter((e) => filterType === 'all' || e.type === filterType);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddEvent({
      id: `ev-${Date.now()}`,
      title,
      time: time || '12:00 PM',
      date,
      type,
      location: location || 'Estudio Midnight',
      participants: ['Tú']
    });

    setTitle('');
    setTime('');
    setLocation('');
    setShowAddModal(false);
  };

  const getTypeBadge = (t: CalendarEvent['type']) => {
    switch (t) {
      case 'sync':
        return { label: 'Sincronización', color: 'bg-primary-container/30 text-primary border-primary/20' };
      case 'architecture':
        return { label: 'Arquitectura BIM', color: 'bg-sky-950/40 text-sky-300 border-sky-400/20' };
      case 'deployment':
        return { label: 'Despliegue Kernel', color: 'bg-emerald-950/40 text-emerald-300 border-emerald-400/20' };
      default:
        return { label: 'Reunión Técnica', color: 'bg-amber-950/40 text-amber-300 border-amber-400/20' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary bg-primary-container/20 px-2 py-0.5 rounded">
            CRONOGRAMA DE INFRAESTRUCTURA
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-on-surface mt-1 mb-2 font-headline">
            Calendario & Hitos
          </h2>
          <p className="text-on-surface-variant font-medium text-sm">
            Revisiones de modelos 3D, despliegues de Kernel y coordinación estructural.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Nuevo Hito
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['all', 'architecture', 'sync', 'deployment', 'meeting'].map((key) => {
          const labels: { [k: string]: string } = {
            all: 'Todos',
            architecture: 'Arquitectura BIM',
            sync: 'Sincronización',
            deployment: 'Despliegues',
            meeting: 'Reuniones'
          };
          return (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                filterType === key
                  ? 'bg-[#004a8d] text-[#90bbff]'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {labels[key]}
            </button>
          );
        })}
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const badge = getTypeBadge(item.type);
          return (
            <div
              key={item.id}
              className="bg-surface-container-low border border-outline-variant/15 hover:border-primary/40 rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-surface-container-highest flex flex-col items-center justify-center flex-shrink-0 text-primary font-mono border border-outline-variant/20">
                  <span className="text-[10px] uppercase text-outline">DIA</span>
                  <span className="text-sm font-bold">{item.date === 'Hoy' ? 'HOY' : item.date.slice(0, 3).toUpperCase()}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs text-outline font-mono flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    {item.time} • {item.location}
                  </p>

                  <div className="flex items-center gap-1 mt-2 text-[11px] text-on-surface-variant">
                    <span className="text-outline text-[10px]">Participantes:</span>
                    {item.participants.join(', ')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => alert(`Enlace de sala para "${item.title}" copiado al portapapeles.`)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-xs text-primary hover:bg-primary-container hover:text-white transition-colors font-medium flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">link</span>
                  Acceder a Sala
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Event */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#131b2e] border border-outline-variant/30 rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-on-surface">Agendar Nuevo Hito</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-outline hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-outline block mb-1">Título del Hito:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Revisión Estructural Nivel +50"
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-2.5 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-outline block mb-1">Horario:</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="10:00 - 11:00 AM"
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-2.5 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                <div>
                  <label className="text-xs text-outline block mb-1">Día:</label>
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-2.5 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                  >
                    <option value="Hoy">Hoy</option>
                    <option value="Mañana">Mañana</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-outline block mb-1">Categoría:</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CalendarEvent['type'])}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-2.5 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                >
                  <option value="architecture">Arquitectura BIM</option>
                  <option value="sync">Sincronización de Dispositivos</option>
                  <option value="deployment">Despliegue de Kernel</option>
                  <option value="meeting">Reunión Técnica</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-outline block mb-1">Ubicación / Canal:</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Sala Virtual Alpha o Estudio"
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-2.5 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-outline hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider"
                >
                  Guardar Hito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
