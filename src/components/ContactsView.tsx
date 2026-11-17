import React, { useState } from 'react';
import { Contact } from '../types';

interface ContactsViewProps {
  contacts: Contact[];
  onComposeTo: (email: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ contacts, onComposeTo }) => {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');

  const departments = ['all', 'Diseño Computacional', 'Sistemas Embebidos', 'Ingeniería de Fachadas', 'Servicios en la Nube'];

  const filtered = contacts.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || c.department === filterDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary bg-primary-container/20 px-2 py-0.5 rounded">
            DIRECTORIO ARQUITECTÓNICO
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-on-surface mt-1 mb-2 font-headline">
            Contactos & Red BIM
          </h2>
          <p className="text-on-surface-variant font-medium text-sm">
            Ingenieros de kernel, arquitectos modeladores y especialistas de sincronización.
          </p>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contactos..."
            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary-container outline-none placeholder:text-outline/50"
          />
        </div>
      </div>

      {/* Dept filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setFilterDept(dept)}
            className={`px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer whitespace-nowrap ${
              filterDept === dept
                ? 'bg-[#004a8d] text-[#90bbff]'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {dept === 'all' ? 'Todos los Departamentos' : dept}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((contact) => (
          <div
            key={contact.id}
            className="bg-surface-container-low border border-outline-variant/15 hover:border-primary/40 rounded-2xl p-5 transition-all shadow-md hover:shadow-lg space-y-4 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-outline-variant/30"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ring-2 ring-[#131b2e] ${
                      contact.status === 'online'
                        ? 'bg-emerald-400'
                        : contact.status === 'busy'
                        ? 'bg-amber-400'
                        : 'bg-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                    {contact.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">{contact.role}</p>
                  <p className="text-[10px] text-outline font-mono">{contact.email}</p>
                </div>
              </div>

              <button
                onClick={() => onComposeTo(contact.email)}
                className="p-2 rounded-xl bg-surface-container hover:bg-primary-container text-primary hover:text-white transition-all"
                title={`Enviar correo a ${contact.name}`}
              >
                <span className="material-symbols-outlined text-lg">mail</span>
              </button>
            </div>

            <div className="pt-2 border-t border-outline-variant/10 flex items-center justify-between text-[11px] text-outline font-mono">
              <span>Dispositivos vinculados:</span>
              <div className="flex items-center gap-1.5">
                {contact.devices.map((d, i) => (
                  <span
                    key={i}
                    className="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] text-[#a4b7cd]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
