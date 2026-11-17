import React, { useState } from 'react';
import { Email, FolderType } from '../types';

interface EmailListProps {
  emails: Email[];
  currentFolder: FolderType;
  onSelectEmail: (email: Email) => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onToggleRead: (id: string, e: React.MouseEvent) => void;
  onDeleteEmail: (id: string, e: React.MouseEvent) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  currentFolder,
  onSelectEmail,
  onToggleStar,
  onToggleRead,
  onDeleteEmail,
  searchQuery,
  onSearchChange
}) => {
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'starred' | 'attachments'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter based on folder, search query and filterType
  const filteredEmails = emails.filter((item) => {
    // Folder filter
    if (currentFolder === 'starred') {
      if (!item.starred) return false;
    } else if (currentFolder === 'all') {
      // Show all except drafts unless specified
    } else {
      if (item.folder !== currentFolder) return false;
    }

    // Filter pill
    if (filterType === 'unread' && item.read) return false;
    if (filterType === 'starred' && !item.starred) return false;
    if (filterType === 'attachments' && (!item.attachments || item.attachments.length === 0)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSender = item.sender.toLowerCase().includes(q);
      const matchSubject = item.subject.toLowerCase().includes(q);
      const matchSnippet = item.snippet.toLowerCase().includes(q);
      const matchTags = item.tags?.some((t) => t.toLowerCase().includes(q));
      return matchSender || matchSubject || matchSnippet || matchTags;
    }

    return true;
  });

  // Group by dateGroup
  const groups: { [key: string]: Email[] } = {};
  filteredEmails.forEach((mail) => {
    const g = mail.dateGroup || 'Hoy';
    if (!groups[g]) groups[g] = [];
    groups[g].push(mail);
  });

  const groupOrder = ['Hoy', 'Ayer', 'Esta semana', 'Anteriores'];
  const activeGroups = groupOrder.filter((g) => groups[g] && groups[g].length > 0);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEmails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmails.map((e) => e.id));
    }
  };

  const toggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getFolderTitle = () => {
    switch (currentFolder) {
      case 'inbox':
        return 'Espacio de trabajo.';
      case 'sent':
        return 'Mensajes Enviados.';
      case 'drafts':
        return 'Borradores de Proyecto.';
      case 'starred':
        return 'Elementos Destacados.';
      case 'trash':
        return 'Papelera del Sistema.';
      default:
        return 'Todas las bandejas.';
    }
  };

  const getFolderSubtitle = () => {
    switch (currentFolder) {
      case 'inbox':
        return 'Monitoreando la sincronización de dispositivos en tiempo real.';
      case 'sent':
        return 'Comunicaciones emitidas hacia los nodos y equipos externos.';
      case 'drafts':
        return 'Bocetos técnicos y notas pendientes de revisión.';
      case 'starred':
        return 'Registros marcados con alta prioridad arquitectónica.';
      default:
        return 'Registro consolidado de todos los canales de comunicación.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header / Search Section from Stitch */}
      <section className="mb-6 mt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary bg-primary-container/20 px-2 py-0.5 rounded">
                MIDNIGHT BLUEPRINT V2.4
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-on-surface mb-2 font-headline">
              {getFolderTitle()}
            </h2>
            <p className="text-on-surface-variant font-medium text-sm md:text-base">
              {getFolderSubtitle()}
            </p>
          </div>

          <div className="relative w-full md:w-80 group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar registros..."
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-5 py-3 pr-11 text-sm text-on-surface focus:ring-2 focus:ring-primary-container focus:border-primary/50 transition-all placeholder:text-outline/60 outline-none"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            ) : (
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline/60 group-focus-within:text-primary transition-colors pointer-events-none">
                search
              </span>
            )}
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#004a8d] text-[#90bbff] shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Todos ({filteredEmails.length})
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'unread'
                ? 'bg-[#004a8d] text-[#90bbff]'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            No leídos
          </button>
          <button
            onClick={() => setFilterType('starred')}
            className={`px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'starred'
                ? 'bg-[#004a8d] text-[#90bbff]'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-xs text-amber-300">star</span>
            Destacados
          </button>
          <button
            onClick={() => setFilterType('attachments')}
            className={`px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'attachments'
                ? 'bg-[#004a8d] text-[#90bbff]'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-xs">attachment</span>
            Con adjuntos
          </button>
        </div>
      </section>

      {/* Batch toolbar if any items selected */}
      {selectedIds.length > 0 && (
        <div className="bg-[#131b2e] border border-primary/30 rounded-xl p-3 px-4 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.length === filteredEmails.length && filteredEmails.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-outline-variant bg-surface-container cursor-pointer accent-primary"
            />
            <span className="text-on-surface font-semibold">
              {selectedIds.length} seleccionado{selectedIds.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                selectedIds.forEach((id) => {
                  const syntheticEvent = { stopPropagation: () => {} } as React.MouseEvent;
                  onToggleRead(id, syntheticEvent);
                });
                setSelectedIds([]);
              }}
              className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-primary-container text-on-surface transition-colors flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-sm">mark_email_read</span>
              Leído
            </button>
            <button
              onClick={() => {
                selectedIds.forEach((id) => {
                  const syntheticEvent = { stopPropagation: () => {} } as React.MouseEvent;
                  onDeleteEmail(id, syntheticEvent);
                });
                setSelectedIds([]);
              }}
              className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-red-950/60 text-red-300 transition-colors flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Email List Grouped */}
      <section className="space-y-6">
        {filteredEmails.length === 0 ? (
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-surface-container-highest flex items-center justify-center mx-auto mb-4 text-outline">
              <span className="material-symbols-outlined text-3xl">inbox</span>
            </div>
            <h4 className="text-lg font-bold text-on-surface mb-1">No se encontraron registros</h4>
            <p className="text-xs text-outline max-w-sm mx-auto">
              No hay correos que coincidan con los filtros aplicados en esta bandeja.
            </p>
          </div>
        ) : (
          activeGroups.map((groupName) => (
            <div key={groupName} className="space-y-3">
              {/* Divider Header */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Transmisión en Vivo
                </span>
                <div className="h-px flex-grow mx-4 bg-outline-variant/20" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-outline">
                  {groupName}
                </span>
              </div>

              {/* Items in this group */}
              <div className="space-y-3">
                {groups[groupName].map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isUnread = !item.read;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectEmail(item)}
                      className={`group relative bg-surface-container-low hover:bg-surface-container-high transition-all p-5 md:p-6 rounded-2xl cursor-pointer border ${
                        isSelected
                          ? 'border-primary/50 shadow-lg shadow-blue-950/30'
                          : isUnread
                          ? 'border-outline-variant/30 bg-[#131b2e]'
                          : 'border-transparent opacity-85 hover:opacity-100'
                      }`}
                    >
                      {/* Left accent bar matching Stitch */}
                      {item.accentColor && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-9 rounded-r-full transition-all group-hover:h-12"
                          style={{ backgroundColor: item.accentColor }}
                        />
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 md:gap-4 flex-grow min-w-0">
                          {/* Selection Checkbox (visible on hover or when checked) */}
                          <div
                            onClick={(e) => toggleSelectItem(item.id, e)}
                            className="mt-1 flex-shrink-0"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-outline-variant bg-surface-container cursor-pointer accent-primary"
                            />
                          </div>

                          {/* Icon Container with dynamic accent background */}
                          <div
                            className="h-11 w-11 md:h-12 md:w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                            style={{
                              backgroundColor: item.iconBgColor || 'rgba(167, 200, 255, 0.12)'
                            }}
                          >
                            <span
                              className="material-symbols-outlined text-xl md:text-2xl"
                              style={{ color: item.accentColor || '#a7c8ff' }}
                            >
                              {item.icon}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-grow">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3
                                className={`text-base md:text-lg text-on-surface truncate ${
                                  isUnread ? 'font-black text-white' : 'font-semibold'
                                }`}
                              >
                                {item.sender}
                              </h3>

                              {/* Badge from Stitch */}
                              {item.badge && (
                                <span className="px-2 py-0.5 rounded-full bg-primary-container/30 text-[9px] text-on-primary-container font-black uppercase tracking-tighter border border-primary/20">
                                  {item.badge}
                                </span>
                              )}

                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                              )}
                            </div>

                            <p
                              className={`text-xs md:text-sm mb-1.5 truncate ${
                                isUnread ? 'font-bold text-on-surface' : 'font-medium text-on-surface-variant'
                              }`}
                            >
                              {item.subject}
                            </p>

                            <p className="text-xs text-outline leading-relaxed line-clamp-1">
                              {item.snippet}
                            </p>

                            {/* Tags & Attachments preview */}
                            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                              {item.attachments && item.attachments.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-surface-container-highest/60 text-[#a4b7cd] px-2 py-0.5 rounded font-mono">
                                  <span className="material-symbols-outlined text-xs">attachment</span>
                                  {item.attachments.length} adjunto{item.attachments.length > 1 ? 's' : ''}
                                </span>
                              )}

                              {item.tags?.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] uppercase tracking-wider text-outline-variant bg-surface-container-highest/40 px-1.5 py-0.5 rounded font-bold"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right: Time & Hover Quick Actions */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-[10px] font-bold text-outline font-mono">
                            {item.time}
                          </span>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#171f33]/90 backdrop-blur-sm p-1 rounded-lg border border-outline-variant/20 shadow-md">
                            {/* Star Toggle */}
                            <button
                              onClick={(e) => onToggleStar(item.id, e)}
                              title={item.starred ? 'Quitar de destacados' : 'Destacar'}
                              className="p-1 rounded hover:bg-surface-container-highest transition-colors text-outline hover:text-amber-300"
                            >
                              <span
                                className={`material-symbols-outlined text-sm ${
                                  item.starred ? 'text-amber-300' : ''
                                }`}
                              >
                                {item.starred ? 'star' : 'star_border'}
                              </span>
                            </button>

                            {/* Read / Unread toggle */}
                            <button
                              onClick={(e) => onToggleRead(item.id, e)}
                              title={item.read ? 'Marcar como no leído' : 'Marcar como leído'}
                              className="p-1 rounded hover:bg-surface-container-highest transition-colors text-outline hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-sm">
                                {item.read ? 'mark_email_unread' : 'mark_email_read'}
                              </span>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={(e) => onDeleteEmail(item.id, e)}
                              title="Eliminar registro"
                              className="p-1 rounded hover:bg-surface-container-highest transition-colors text-outline hover:text-red-400"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};
