import React, { useState } from 'react';
import { Contact, Email } from '../types';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendEmail: (email: Omit<Email, 'id' | 'time' | 'dateGroup'>) => void;
  onSaveDraft: (email: Omit<Email, 'id' | 'time' | 'dateGroup'>) => void;
  contacts: Contact[];
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onSendEmail,
  onSaveDraft,
  contacts
}) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; type: 'dwg' | 'pdf' | 'json' }[]>([]);

  if (!isOpen) return null;

  const templates = [
    {
      title: 'Reporte Sincronización',
      subject: 'Reporte de Telemetría y Sincronización Kernel',
      body: `Equipo de Sistemas,\n\nSe han validado los registros de enlace entre dispositivos. La latencia media se mantiene en 1.2ms con cero pérdida de paquetes.\n\nFavor verificar métricas adjuntas.`
    },
    {
      title: 'Solicitud Planos CAD',
      subject: 'Solicitud de Revisión de Planos Estructurales DWG',
      body: `Estimados arquitectos,\n\nRemitimos la última actualización del modelo volumétrico para su aprobación sismorresistente. Quedamos a la espera de sus observaciones.`
    },
    {
      title: 'Incidencia de Nodo',
      subject: 'Alerta de latencia en enlace Workstation Alpha',
      body: `Atención Soporte,\n\nEl nodo Workstation Alpha ha pasado a estado inactivo tras el ciclo de compilación de texturas 8K. Se requiere reinicio del daemon de sincronización.`
    }
  ];

  const applyTemplate = (tmpl: typeof templates[0]) => {
    setSubject(tmpl.subject);
    setBody(tmpl.body);
  };

  const handleAddSampleAttachment = (type: 'dwg' | 'pdf' | 'json') => {
    if (type === 'dwg') {
      setAttachedFiles((prev) => [...prev, { name: 'Estructura_Modulo_RevB.dwg', size: '24.1 MB', type: 'dwg' }]);
    } else if (type === 'pdf') {
      setAttachedFiles((prev) => [...prev, { name: 'Especificaciones_BIM.pdf', size: '4.8 MB', type: 'pdf' }]);
    } else {
      setAttachedFiles((prev) => [...prev, { name: 'telemetry_dump.json', size: '88 KB', type: 'json' }]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim()) return;

    onSendEmail({
      sender: 'Tú (pro@midnight.blueprint)',
      senderEmail: 'pro@midnight.blueprint',
      recipient: to,
      subject,
      snippet: body.slice(0, 90) + (body.length > 90 ? '...' : ''),
      body,
      read: true,
      starred: priority === 'high',
      folder: 'sent',
      badge: priority === 'high' ? 'Alta Prioridad' : 'Emitido',
      accentColor: priority === 'high' ? '#ff6700' : '#a7c8ff',
      icon: 'send',
      iconBgColor: 'rgba(167, 200, 255, 0.15)',
      tags: priority === 'high' ? ['Urgente', 'Enviado'] : ['Enviado'],
      attachments: attachedFiles.map((f, i) => ({
        id: `att-new-${i}`,
        name: f.name,
        size: f.size,
        type: f.type
      }))
    });

    onClose();
  };

  const handleDraft = () => {
    if (!to.trim() && !subject.trim() && !body.trim()) {
      onClose();
      return;
    }

    onSaveDraft({
      sender: 'Tú (pro@midnight.blueprint)',
      senderEmail: 'pro@midnight.blueprint',
      recipient: to || 'Sin destinatario',
      subject: subject || '(Sin asunto)',
      snippet: body.slice(0, 90) || 'Borrador sin contenido...',
      body: body || '',
      read: true,
      starred: false,
      folder: 'drafts',
      badge: 'Borrador',
      accentColor: '#ffa46a',
      icon: 'draft',
      iconBgColor: 'rgba(255, 164, 106, 0.15)',
      tags: ['Borrador'],
      attachments: attachedFiles.map((f, i) => ({
        id: `att-draft-${i}`,
        name: f.name,
        size: f.size,
        type: f.type
      }))
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#131b2e] border border-outline-variant/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-blue-950/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-outline-variant/15 bg-[#0b1326]/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-container/30 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">edit</span>
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-on-surface">
                Redactar Mensaje Arquitectónico
              </h3>
              <span className="text-[10px] text-outline font-mono">
                De: pro@midnight.blueprint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-outline hover:text-white hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 overflow-y-auto space-y-4 flex-grow">
          {/* Quick Templates */}
          <div>
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider block mb-2">
              Plantillas Rápidas:
            </span>
            <div className="flex flex-wrap gap-2">
              {templates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="text-xs bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary px-3 py-1.5 rounded-lg border border-outline-variant/20 transition-all font-medium cursor-pointer"
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Destinatario */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wider block">
              Para:
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="nombre@midnight.blueprint, arquitecto..."
              className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary-container outline-none"
              required
            />
            {/* Quick Contacts suggestion chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTo(c.email)}
                  className="text-[10px] bg-surface-container-highest/60 hover:bg-primary-container text-on-surface-variant hover:text-white px-2 py-0.5 rounded-md transition-colors"
                >
                  +{c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Asunto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wider block">
              Asunto:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del registro o modelo BIM..."
              className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary-container outline-none"
              required
            />
          </div>

          {/* Prioridad */}
          <div className="flex items-center gap-4 text-xs pt-1">
            <span className="text-outline font-bold">Nivel de Prioridad:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="priority"
                checked={priority === 'normal'}
                onChange={() => setPriority('normal')}
                className="accent-primary"
              />
              <span className="text-on-surface-variant">Estándar</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="priority"
                checked={priority === 'high'}
                onChange={() => setPriority('high')}
                className="accent-[#ff6700]"
              />
              <span className="text-[#ff6700] font-bold">Alta Prioridad / Sincronización</span>
            </label>
          </div>

          {/* Mensaje */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wider block">
              Contenido:
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe los parámetros de arquitectura, avances o instrucciones del kernel..."
              rows={6}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-4 text-xs text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary-container outline-none resize-none leading-relaxed"
              required
            />
          </div>

          {/* Adjuntos */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-outline uppercase tracking-wider">
                Adjuntos ({attachedFiles.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddSampleAttachment('dwg')}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">add</span> +DWG Plano
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSampleAttachment('pdf')}
                  className="text-[11px] text-secondary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">add</span> +PDF Informe
                </button>
              </div>
            </div>

            {attachedFiles.length > 0 && (
              <div className="space-y-1.5">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-surface-container px-3 py-2 rounded-lg text-xs border border-outline-variant/20"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">
                        attachment
                      </span>
                      <span className="text-on-surface font-medium">{file.name}</span>
                      <span className="text-[10px] text-outline font-mono">({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-outline hover:text-red-400 p-1"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15">
            <button
              type="button"
              onClick={handleDraft}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Guardar Borrador
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-outline hover:text-white transition-colors"
              >
                Descartar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                Enviar Correo
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
