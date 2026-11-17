import React, { useState } from 'react';
import { Contact, Email } from '../types';

interface ComposeScreenProps {
  onBack: () => void;
  onSend: (email: Omit<Email, 'id' | 'time' | 'dateGroup'>) => void;
  contacts: Contact[];
}

export const ComposeScreen: React.FC<ComposeScreenProps> = ({ onBack, onSend, contacts }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState('');
  const [showBcc, setShowBcc] = useState(false);
  const [bcc, setBcc] = useState('');
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; size: string; type: 'dwg' | 'pdf' | 'json' }[]>([]);

  const handleSend = () => {
    if (!to.trim() || !subject.trim()) {
      alert('Por favor indica un destinatario y un asunto.');
      return;
    }

    onSend({
      sender: 'Julian Vane (pro@midnight.blueprint)',
      senderEmail: 'pro@midnight.blueprint',
      recipient: to,
      subject,
      snippet: body.slice(0, 90) || 'Mensaje enviado...',
      body,
      read: true,
      starred: isHighPriority,
      folder: 'sent',
      badge: isHighPriority ? 'Prioridad Alta' : 'Emitido',
      accentColor: isHighPriority ? '#ff6700' : '#90bbff',
      icon: 'send',
      iconBgColor: 'rgba(144, 187, 255, 0.15)',
      tags: isHighPriority ? ['Urgente', 'Enviado'] : ['Enviado'],
      signature: {
        name: 'Julian Vane',
        role: 'Consultor Arquitectónico Principal',
        location: 'Oslo, Noruega',
        website: 'midnight.blueprint',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIR0E8BK9n65Kol7tyG3P2_TPB77D4X-a7JcpEiotFZQ3I3LkXfQ3g9NRS98mEU2Pnr6QKB_MpMkdCvXrNWWVxa6HSL3BWq8nnzstew7qZJzGkapBRmAMzXizDcziuKsoXZB0SkU8kN5p-EGiR-6Pkw9oc-NmSReitSyvzGtJO9vPzIrjue4TiU3d16kHeN9UQsa2qlmfqb6hywj_O6mKkrW8R0WefGiGUVgd-2NmRtbnIH5NyYGk9svnsFxTOHSTJhNIAvmC7TMnC',
        verified: true
      },
      attachments: attachments.map((a, i) => ({
        id: `att-comp-${i}`,
        name: a.name,
        size: a.size,
        type: a.type
      }))
    });
  };

  const addDriveFile = () => {
    setAttachments((prev) => [...prev, { name: 'Masterplan_Oslo_Phase3.dwg', size: '28.4 MB', type: 'dwg' }]);
  };

  const addOneDriveFile = () => {
    setAttachments((prev) => [...prev, { name: 'Presupuesto_Estructural_2024.pdf', size: '3.6 MB', type: 'pdf' }]);
  };

  const addLocalFile = () => {
    setAttachments((prev) => [...prev, { name: 'Detalle_Fachada_Vidrio.json', size: '120 KB', type: 'json' }]);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Navigation Anchor matching Stitch */}
      <header className="flex items-center justify-between pb-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-[#c2c6d1] hover:bg-[#171f33] transition-colors p-2 rounded-lg cursor-pointer"
            title="Cancelar y volver"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="font-manrope font-bold text-xl tracking-tight text-[#90bbff]">
            Redactar
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => alert('Envío programado activado para mañana 09:00 AM')}
            className="hover:bg-[#171f33] transition-colors p-2 rounded-lg text-[#c2c6d1]"
            title="Programar envío"
          >
            <span className="material-symbols-outlined">schedule</span>
          </button>
          <button
            onClick={handleSend}
            className="bg-[#004a8d] text-[#90bbff] px-6 py-2 rounded-md font-bold text-sm tracking-widest uppercase active:scale-95 duration-200 transition-all flex items-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-blue-900/30"
          >
            <span>Enviar</span>
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex flex-col lg:flex-row gap-8">
        {/* Main Form Area */}
        <section className="flex-1 space-y-6">
          {/* Header Inputs: Architectural Trays */}
          <div className="space-y-4">
            {/* From Selector */}
            <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between group hover:bg-surface-container transition-colors">
              <div className="flex flex-col">
                <span className="font-manrope uppercase tracking-widest text-[10px] font-semibold text-outline">
                  De
                </span>
                <span className="text-on-surface font-medium">pro@midnight.blueprint</span>
              </div>
              <span className="material-symbols-outlined text-outline">expand_more</span>
            </div>

            {/* Field Tray */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden">
              <div className="px-6 py-4 flex items-center gap-4 border-b border-white/5">
                <span className="font-manrope uppercase tracking-widest text-[10px] font-semibold text-outline w-12 flex-shrink-0">
                  Para
                </span>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-on-surface w-full font-medium placeholder:text-outline/40 outline-none text-sm"
                  placeholder="Dirección del destinatario..."
                  type="text"
                />
                <div className="flex gap-2">
                  <span
                    onClick={() => setShowCc(!showCc)}
                    className="text-[10px] font-bold text-primary-container px-2 py-1 bg-surface-container-highest rounded cursor-pointer uppercase hover:text-white"
                  >
                    Cc
                  </span>
                  <span
                    onClick={() => setShowBcc(!showBcc)}
                    className="text-[10px] font-bold text-primary-container px-2 py-1 bg-surface-container-highest rounded cursor-pointer uppercase hover:text-white"
                  >
                    Cco
                  </span>
                </div>
              </div>

              {/* CC input if enabled */}
              {showCc && (
                <div className="px-6 py-3 flex items-center gap-4 border-b border-white/5 bg-surface-container/30">
                  <span className="font-manrope uppercase tracking-widest text-[10px] font-semibold text-outline w-12 flex-shrink-0">
                    Cc
                  </span>
                  <input
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-on-surface w-full font-medium placeholder:text-outline/40 outline-none text-xs"
                    placeholder="Con copia a..."
                    type="text"
                  />
                </div>
              )}

              {/* BCC input if enabled */}
              {showBcc && (
                <div className="px-6 py-3 flex items-center gap-4 border-b border-white/5 bg-surface-container/30">
                  <span className="font-manrope uppercase tracking-widest text-[10px] font-semibold text-outline w-12 flex-shrink-0">
                    Cco
                  </span>
                  <input
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-on-surface w-full font-medium placeholder:text-outline/40 outline-none text-xs"
                    placeholder="Con copia oculta..."
                    type="text"
                  />
                </div>
              )}

              {/* Subject Tray */}
              <div className="px-6 py-4 flex items-center gap-4">
                <span className="font-manrope uppercase tracking-widest text-[10px] font-semibold text-outline w-12 flex-shrink-0">
                  Asunto
                </span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-on-surface w-full font-bold placeholder:text-outline/40 outline-none text-sm"
                  placeholder="Título del mensaje"
                  type="text"
                />
              </div>
            </div>

            {/* Quick Contacts Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] text-outline font-mono">Contactos:</span>
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setTo(c.email)}
                  className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  +{c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area: Tonal Layering */}
          <div className="bg-surface-container-low rounded-xl p-6 md:p-8 min-h-[420px] flex flex-col space-y-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-on-surface-variant leading-relaxed text-base resize-none flex-grow placeholder:text-outline/30 outline-none min-h-[220px]"
              placeholder="Escribe tu mensaje..."
            />

            {/* Attached files preview */}
            {attachments.length > 0 && (
              <div className="pt-4 border-t border-white/5 space-y-2">
                <span className="text-xs font-bold text-outline uppercase tracking-wider block">
                  Archivos adjuntos ({attachments.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-container p-3 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="material-symbols-outlined text-primary text-sm">
                          attachment
                        </span>
                        <span className="text-on-surface font-semibold truncate">{file.name}</span>
                        <span className="text-outline font-mono text-[10px]">({file.size})</span>
                      </div>
                      <button
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-outline hover:text-red-400 p-1"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Professional Signature Component matching Stitch */}
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <img
                    alt="Perfil de Firma"
                    className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover grayscale opacity-80 border border-primary/20 shadow-2xl shadow-primary/10"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIR0E8BK9n65Kol7tyG3P2_TPB77D4X-a7JcpEiotFZQ3I3LkXfQ3g9NRS98mEU2Pnr6QKB_MpMkdCvXrNWWVxa6HSL3BWq8nnzstew7qZJzGkapBRmAMzXizDcziuKsoXZB0SkU8kN5p-EGiR-6Pkw9oc-NmSReitSyvzGtJO9vPzIrjue4TiU3d16kHeN9UQsa2qlmfqb6hywj_O6mKkrW8R0WefGiGUVgd-2NmRtbnIH5NyYGk9svnsFxTOHSTJhNIAvmC7TMnC"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-primary-container text-on-primary-container p-1 rounded-md">
                    <span
                      className="material-symbols-outlined text-xs"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-on-surface tracking-tight text-lg md:text-xl">
                    Julian Vane
                  </h4>
                  <p className="font-manrope uppercase tracking-[0.2em] text-[10px] font-bold text-primary">
                    Consultor Arquitectónico Principal
                  </p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-1 text-[11px] text-outline">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span>Oslo, Noruega</span>
                    </div>
                    <div className="w-1 h-1 bg-outline/30 rounded-full" />
                    <div className="flex items-center gap-1 text-[11px] text-outline">
                      <span className="material-symbols-outlined text-sm">language</span>
                      <span className="font-mono">midnight.blueprint</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar Actions: Utility Cluster matching Stitch */}
        <aside className="w-full lg:w-80 space-y-6">
          {/* Archivos y Recursos */}
          <div className="bg-surface-container-high rounded-xl p-6 space-y-4">
            <h3 className="font-manrope uppercase tracking-widest text-[10px] font-bold text-primary">
              Archivos y Recursos
            </h3>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={addDriveFile}
                className="w-full bg-surface-container-highest hover:bg-[#2d3449] transition-all p-3.5 rounded-xl flex items-center gap-3 group text-left cursor-pointer"
              >
                <div className="bg-primary-container/20 p-2 rounded-lg group-hover:bg-primary-container/40 transition-colors">
                  <span className="material-symbols-outlined text-on-primary-container">cloud</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Google Drive</p>
                  <p className="text-[10px] text-outline">Insertar planos desde la nube</p>
                </div>
              </button>

              <button
                type="button"
                onClick={addOneDriveFile}
                className="w-full bg-surface-container-highest hover:bg-[#2d3449] transition-all p-3.5 rounded-xl flex items-center gap-3 group text-left cursor-pointer"
              >
                <div className="bg-secondary-container/20 p-2 rounded-lg group-hover:bg-secondary-container/40 transition-colors">
                  <span className="material-symbols-outlined text-on-secondary-container">
                    cloud_done
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">OneDrive</p>
                  <p className="text-[10px] text-outline">Sincronizar planos</p>
                </div>
              </button>

              <button
                type="button"
                onClick={addLocalFile}
                className="w-full bg-surface-container-highest hover:bg-[#2d3449] transition-all p-3.5 rounded-xl flex items-center gap-3 group text-left cursor-pointer"
              >
                <div className="bg-outline/10 p-2 rounded-lg group-hover:bg-outline/20 transition-colors">
                  <span className="material-symbols-outlined text-outline">attach_file</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Archivos locales</p>
                  <p className="text-[10px] text-outline">Máx. 25MB adjuntos</p>
                </div>
              </button>
            </div>
          </div>

          {/* Configuración Switches */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="font-manrope uppercase tracking-widest text-[10px] font-bold text-outline mb-4">
              Configuración
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-on-surface-variant font-medium">Prioridad alta</span>
                <input
                  type="checkbox"
                  checked={isHighPriority}
                  onChange={(e) => setIsHighPriority(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container relative"></div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-on-surface-variant font-medium">Encriptado TLS</span>
                <input
                  type="checkbox"
                  checked={isEncrypted}
                  onChange={(e) => setIsEncrypted(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container relative"></div>
              </label>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};
