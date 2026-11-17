import React, { useState } from 'react';
import { Email } from '../types';

interface EmailDetailProps {
  email: Email;
  onBack: () => void;
  onToggleStar: (id: string) => void;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (email: Email) => void;
  onForward: (email: Email) => void;
  onSaveToDrive: (fileName: string) => void;
  onSaveToOneDrive: (fileName: string) => void;
  onDownloadAttachment: (fileName: string) => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  onBack,
  onToggleStar,
  onDelete,
  onReply,
  onForward,
  onSaveToDrive,
  onSaveToOneDrive,
  onDownloadAttachment
}) => {
  const [inlineReply, setInlineReply] = useState('');
  const [showQuickBox, setShowQuickBox] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Action Bar matching Stitch detalles.html */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="hover:bg-[#171f33] transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center text-[#c2c6d1]"
            title="Volver a la bandeja"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-manrope font-bold text-xl tracking-tight text-[#90bbff]">
            Bandeja de entrada
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStar(email.id)}
            className="hover:bg-[#171f33] transition-colors p-2 rounded-full text-[#c2c6d1]"
            title={email.starred ? 'Quitar estrella' : 'Destacar'}
          >
            <span
              className={`material-symbols-outlined ${email.starred ? 'text-[#90bbff]' : ''}`}
              style={email.starred ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              star
            </span>
          </button>

          <button
            onClick={() => onDelete(email.id)}
            className="hover:bg-[#171f33] transition-colors p-2 rounded-full text-[#c2c6d1] hover:text-red-400"
            title="Eliminar"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>

          <button
            onClick={() => window.print()}
            className="hover:bg-[#171f33] transition-colors p-2 rounded-full text-[#c2c6d1]"
            title="Imprimir"
          >
            <span className="material-symbols-outlined">print</span>
          </button>
        </div>
      </div>

      {/* Email Header Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface leading-tight font-headline">
            {email.subject}
          </h2>
          <button
            onClick={() => onToggleStar(email.id)}
            className="text-[#90bbff] p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span
              className="material-symbols-outlined text-2xl text-[#90bbff]"
              style={{ fontVariationSettings: email.starred ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          </button>
        </div>

        {/* Sender Tray */}
        <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
          <div className="flex items-center gap-4">
            <img
              alt={email.sender}
              className="w-12 h-12 rounded-full object-cover ring-1 ring-outline-variant/30"
              src={
                email.avatar ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuD9g7w7X190UPEKKfSY06_YkiPfvF3YX1l01LGL42wHzkK84h-E1N7mf2C0RH2RPL5RY8TKKASoN77rCWtgXF8MGFKbMnzbGPWi30hTegFLfvatN4CVGnBHkUXMH10epspZYyVji3AHr1xdaAqLAqsHxJ-SksCExt21IQ7j0clqiaeZ2yHTgY5-VU7T_0fxBx2Ob3vVJUvHMEentp_TLtXi2Dv63HfOOyw8Eg5n-lJLyvragnul64ATdOjNICiJ8WimO8aj5DyauaED'
              }
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-on-surface">{email.sender}</span>
                <span className="text-sm text-on-surface-variant">&lt;{email.senderEmail}&gt;</span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono">
                para mí <span className="text-outline">({email.recipient})</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium text-on-surface-variant font-mono">{email.time}</p>
            <span className="text-[10px] text-outline font-mono">{email.dateGroup}</span>
          </div>
        </div>
      </div>

      {/* Email Body Article matching Stitch */}
      <article className="bg-surface-container rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="text-on-surface-variant leading-relaxed space-y-4 whitespace-pre-line text-base font-body">
          {email.body}
        </div>

        {/* Signature Component matching Stitch detalles.html */}
        {email.signature ? (
          <div className="pt-8 mt-10 border-t border-outline-variant/10 flex flex-col sm:flex-row items-start gap-6">
            <img
              alt={email.signature.name}
              className="w-20 h-20 rounded-lg object-cover grayscale ring-1 ring-outline-variant/20"
              src={email.signature.avatar}
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-[#90bbff] text-lg uppercase tracking-tighter">
                {email.signature.name}
              </span>
              <span className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                {email.signature.role}
              </span>
              <div className="mt-2 flex items-center gap-3 text-[#c2c6d1]">
                <span className="material-symbols-outlined text-sm">language</span>
                <span className="text-xs font-mono">{email.signature.website}</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-[#c2c6d1]">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span className="text-xs">{email.signature.location}</span>
              </div>
            </div>
          </div>
        ) : null}
      </article>

      {/* Attachments Section matching Stitch */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4 px-2 flex-wrap gap-3">
            <h3 className="font-manrope uppercase tracking-widest text-xs font-bold text-[#c2c6d1]">
              Archivos adjuntos ({email.attachments.length})
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => email.attachments?.forEach((a) => onSaveToDrive(a.name))}
                className="flex items-center gap-2 text-xs font-bold text-[#90bbff] hover:underline uppercase tracking-wider cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                Guardar en Drive
              </button>
              <button
                onClick={() => email.attachments?.forEach((a) => onSaveToOneDrive(a.name))}
                className="flex items-center gap-2 text-xs font-bold text-[#90bbff] hover:underline uppercase tracking-wider cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">cloud_sync</span>
                Guardar en OneDrive
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {email.attachments.map((att) => {
              const isPdf = att.type === 'pdf';
              return (
                <div
                  key={att.id}
                  onClick={() => onDownloadAttachment(att.name)}
                  className="bg-surface-container-high rounded-xl p-4 flex items-center gap-4 hover:bg-surface-container-highest transition-colors cursor-pointer group"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isPdf ? 'bg-primary-container/20 text-primary' : 'bg-tertiary-container/20 text-tertiary'
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {isPdf ? 'picture_as_pdf' : att.type === 'image' ? 'image' : 'architecture'}
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                      {att.name}
                    </p>
                    <p className="text-xs text-on-surface-variant font-mono">
                      {att.size} • {att.type.toUpperCase()}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                    download
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons matching Stitch */}
      <div className="flex flex-wrap gap-4 pt-4">
        <button
          onClick={() => {
            setShowQuickBox(true);
            onReply(email);
          }}
          className="flex items-center gap-3 bg-primary-container text-on-primary-container px-8 py-3 rounded-md font-bold text-sm tracking-wider uppercase transition-all duration-300 active:scale-95 hover:shadow-xl hover:shadow-blue-900/20 cursor-pointer"
        >
          <span className="material-symbols-outlined">reply</span>
          RESPONDER
        </button>

        <button
          onClick={() => onForward(email)}
          className="flex items-center gap-3 bg-surface-container-highest text-on-surface px-8 py-3 rounded-md font-bold text-sm tracking-wider uppercase transition-all duration-300 active:scale-95 hover:bg-surface-bright cursor-pointer"
        >
          <span className="material-symbols-outlined">forward</span>
          REENVIAR
        </button>
      </div>

      {/* Quick Reply Form if triggered */}
      {showQuickBox && (
        <div className="bg-surface-container rounded-2xl p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#90bbff] uppercase tracking-wider">
              Respuesta Rápida a {email.sender}
            </span>
            <button
              onClick={() => setShowQuickBox(false)}
              className="text-outline hover:text-white"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <textarea
            value={inlineReply}
            onChange={(e) => setInlineReply(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            rows={4}
            className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowQuickBox(false)}
              className="px-4 py-2 text-xs text-outline hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (inlineReply.trim()) {
                  alert('Respuesta enviada.');
                  setInlineReply('');
                  setShowQuickBox(false);
                }
              }}
              className="px-6 py-2 bg-primary-container text-on-primary-container rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Enviar Respuesta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
