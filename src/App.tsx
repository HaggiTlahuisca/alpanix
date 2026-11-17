import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Archive, Activity, Link2, Bell, Check, CircleAlert, Cloud, Eye, FileImage, FileText, Paperclip, FolderPlus, FolderOpen, Download, Upload, Move, Pencil,
  Inbox, LockKeyhole, LogOut, Mail, MailOpen, Menu, PenSquare, Plus, Settings, Server, Palette, Save,
  RefreshCw, Send, ShieldCheck, Trash2, X, Fingerprint, Info, History, KeyRound, ClipboardList,
} from 'lucide-react';
import { startPush, stopPush, enablePush, disablePush, type PushState } from './services/fcm';
import { subscribeDiagnostics, getDiagnostics, clearDiagnostics, type DiagnosticEntry } from './services/diagnostics';
import { openExternal, openInAppBrowser } from './services/external-links';
import { parseAccountImport, type ImportRow, type ImportPreview } from './services/account-import';
import { batteryStatus, requestBatteryExemption, requestBatteryExemptionOnce, openBatterySettings, type BatteryStatus } from './services/battery-settings';
import { api, type Account, type Domain, type DomainConfig, type Mail as MailItem, type Detail, type Folder, type CloudConnection, type CloudCheck, type DavEntry, type MonitorAccount, type ActivityEntry } from './services/api';

type View = 'inbox' | 'detail' | 'compose' | 'settings' | 'settings-domains' | 'settings-appearance' | 'settings-reading' | 'settings-notifications' | 'settings-identity' | 'diagnostics' | 'import-accounts' | 'account-settings' | 'navigation' | 'clouds' | 'cloud-settings' | 'cloud-browser' | 'settings-security' | 'about' | 'changelog' | 'activity';
type DomainForm = {name:string} & DomainConfig;
type AccountForm = {domain_id:number;address:string;display_name:string;password:string};
const newDomainForm = ():DomainForm => ({name:'',imap_host:'',imap_port:993,smtp_host:'',smtp_port:465,smtp_security:'ssl'});
const newAccountForm = (domain_id=0):AccountForm => ({domain_id,address:'',display_name:'',password:''});
type Signature = { text: string; image: string; mime: string };
type ThemeId = 'alpanix' | 'tlahuis' | 'tlahuis-dark' | 'blueprint' | 'emerald' | 'amber' | 'violet' | 'monochrome';
const THEMES: {id:ThemeId;name:string;description:string;bg:string;accent:string}[] = [
  {id:'alpanix',name:'Alpanix · Inframundo privado',description:'Negro, turquesa etrusco y oro',bg:'#000000',accent:'#008080'},
  {id:'blueprint', name:'Azul nocturno', description:'Azul marino y dorado', bg:'#0a1224', accent:'#e9ba71'},
  {id:'tlahuis', name:'Tlahuisca · Día', description:'Claro · lectura diurna con identidad TH', bg:'#edf4f7', accent:'#12B4B4'},
  {id:'tlahuis-dark', name:'Tlahuisca · Noche', description:'Oscuro · turquesa, marino y dorado', bg:'#0B1F53', accent:'#12B4B4'},
  {id:'emerald', name:'Esmeralda', description:'Oscuro · verde', bg:'#061510', accent:'#34d399'},
  {id:'amber', name:'Ámbar', description:'Oscuro · dorado', bg:'#13100b', accent:'#fbbf24'},
  {id:'violet', name:'Violeta', description:'Oscuro · violeta', bg:'#0e0c19', accent:'#c084fc'},
  {id:'monochrome', name:'Grafito', description:'Oscuro · gris y plata', bg:'#0a0e17', accent:'#e2e8f0'},
];
const THEME_KEY = 'thcorreo.theme.v1';
const APP_NAME_KEY = 'alpanix.brand.name.v1';
const LEGACY_NAME_KEY = 'thcorreo.brand.name.v1';
const APP_SUBTITLE_KEY = 'thcorreo.brand.subtitle.v1';
function loadTheme():ThemeId {
  try { const value=localStorage.getItem(THEME_KEY); if(THEMES.some(t=>t.id===value)) return value as ThemeId; } catch {}
  return 'alpanix';
}

const EMPTY_SIGNATURE: Signature = { text: '', image: '', mime: '' };
const SIGNATURE_PREFIX = 'thcorreo.signature.v1.';
const MAX_SIGNATURE_BYTES = 500_000;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
type CloudForm = {provider:'kdrive'|'webdav';name:string;drive_id:string;server_url:string;username:string;password:string};
const freshCloudForm = ():CloudForm => ({provider:'kdrive',name:'kDrive personal',drive_id:'',server_url:'',username:'',password:''});
const REMOTE_IMAGE_PREF='thcorreo.remoteImages.v2';
// Marcador visible y verificable también dentro del archivo APK compilado.
const ALPANIX_BUILD = 'ALPANIX_119_VERIFIED_20261108';

function displayName(value: string): string {
  const trimmed = (value || '').trim();
  const match = trimmed.match(/^\s*"?([^"<>]+)"?\s*<[^>]+>/);
  return (match?.[1] || trimmed.split('<')[0] || trimmed || 'Desconocido').trim();
}
function emailAddress(value: string): string {
  return (value || '').match(/<([^>]+)>/)?.[1] || (value.includes('@') ? value.trim() : '');
}
function dateShort(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function folderLabel(f: Folder) {
  const labels: Record<string,string> = { inbox:'Recibidos', sent:'Enviados', drafts:'Borradores', trash:'Papelera', spam:'Spam', archive:'Archivados' };
  return f.special_use ? (labels[f.special_use] || f.name) : f.name;
}
function folderIcon(value: string|null) {
  if(value === 'sent') return <Send size={16}/>;
  if(value === 'trash') return <Trash2 size={16}/>;
  if(value === 'archive') return <Archive size={16}/>;
  if(value === 'drafts') return <FileText size={16}/>;
  return <Inbox size={16}/>;
}
function getSignature(accountId: number): Signature {
  if (!accountId) return { ...EMPTY_SIGNATURE };
  try {
    const parsed = JSON.parse(localStorage.getItem(SIGNATURE_PREFIX + accountId) || 'null');
    if (parsed && typeof parsed.text === 'string' && typeof parsed.image === 'string' && typeof parsed.mime === 'string') {
      return { text: parsed.text, image: parsed.image, mime: parsed.mime };
    }
  } catch { /* Sin firma guardada o almacenamiento deshabilitado. */ }
  return { ...EMPTY_SIGNATURE };
}
function dateOf(seconds:number):string {return seconds?new Date(seconds*1000).toLocaleString('es-MX'):'Sin datos';}
function saveSignature(accountId: number, signature: Signature) {
  if (!accountId) return;
  try { localStorage.setItem(SIGNATURE_PREFIX + accountId, JSON.stringify(signature)); }
  catch { throw new Error('No hay espacio para guardar la firma. Prueba una imagen más pequeña.'); }
}

function findSafeEmailLinks(html: string): string[] {
  // La extracción se hace en memoria; nunca se cargan imágenes remotas ni se ejecuta HTML.
  // También cubre URLs visibles sin etiqueta <a>, frecuentes en correo de texto o HTML simple.
  const sources = [
    ...Array.from(html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi), m => m[2]),
    ...Array.from(html.matchAll(/<a\b[^>]*\bhref\s*=\s*([^\s>"']+)/gi), m => m[1]),
    ...Array.from(html.replace(/<[^>]*>/g, ' ').matchAll(/https?:\/\/[^\s\u003c\u003e"']+/gi), m => m[0]),
  ];
  const unique = new Set<string>();
  for (const source of sources) {
    const decoded = source.replace(/&amp;/gi, '&').replace(/&#38;/g, '&')
      .replace(/&#x26;/gi, '&').replace(/&quot;/gi, '"').trim()
      .replace(/[.,;!?\])]+$/g, '');
    try {
      const url = new URL(decoded);
      if ((url.protocol === 'https:' || url.protocol === 'http:') && url.hostname && !url.username && !url.password) {
        unique.add(url.href);
      }
    } catch { /* URL relativa o no web: no se muestra como enlace externo. */ }
    if (unique.size >= 24) break;
  }
  return Array.from(unique);
}

function SecureMailHtml({html, allowRemoteImages, onLinkError}: {html:string;allowRemoteImages:boolean;onLinkError:(msg:string)=>void}) {
  const frameRef=useRef<HTMLIFrameElement>(null);
  const [linksExpanded,setLinksExpanded]=useState(false);
  useEffect(()=>setLinksExpanded(false),[html]);
  const externalLinks=findSafeEmailLinks(html);
  // El iframe no puede navegar a otra web ni acceder a cookies/sesiones de Alpanix.
  // Su único permiso es avisar a la pantalla principal qué enlace tocó el usuario.
  useEffect(()=>{
    const handler=(event:MessageEvent)=>{
      if(event.source!==frameRef.current?.contentWindow || event.data?.type!=='alpanix:link') return;
      void openInAppBrowser(String(event.data.url||'')).catch(e=>onLinkError((e as Error).message));
    };
    window.addEventListener('message',handler);
    return ()=>window.removeEventListener('message',handler);
  },[onLinkError]);
  const imagePolicy = allowRemoteImages ? 'data: https:' : 'data:';
  const nonce=useRef(Array.from(crypto.getRandomValues(new Uint8Array(16)), x=>x.toString(16).padStart(2,'0')).join('')).current;
  const doc = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${imagePolicy}; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; font-src 'none'; form-action 'none'; base-uri 'none'; connect-src 'none'; object-src 'none'; frame-src 'none';"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:#fff;color:#202124;font:15px/1.6 Arial,sans-serif;overflow-wrap:anywhere}body{padding:15px}table{max-width:100%}img{max-width:100%;height:auto}pre{white-space:pre-wrap;word-break:break-word}</style><script nonce="${nonce}">document.addEventListener('click',function(e){var x=e.target;if(!x||!x.closest)return;var a=x.closest('a[href]');if(!a)return;var h=a.getAttribute('href')||'';if(!/^https?:\\/\\//i.test(h))return;e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:'alpanix:link',url:h},'*');},true);</script></head><body>${html}</body></html>`;
  return <>
    <div className="security-note"><LockKeyhole size={14}/> HTML del correo protegido. Los enlaces se abren fuera de este visor.</div>
    <iframe ref={frameRef} key={allowRemoteImages ? 'remote' : 'local'} title="Contenido HTML del correo" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={doc} className="mail-html-frame"/>
    {externalLinks.length>0&&<section className="external-links-fallback" aria-label="Enlaces de este correo">
      <button type="button" className="external-links-toggle" aria-expanded={linksExpanded}
        onClick={()=>setLinksExpanded(v=>!v)}>
        <span aria-hidden="true">{linksExpanded?'▾':'▸'}</span> Enlaces de este correo ({externalLinks.length})
      </button>
      {linksExpanded&&<div className="external-links-content">
        {externalLinks.map((url,i)=><div className="external-link-row" key={i}>
          <span title={url}><Link2 size={15}/>{new URL(url).hostname}{new URL(url).pathname.slice(0,35)}</span>
          <button type="button" onClick={()=>void openInAppBrowser(url).catch(e=>onLinkError((e as Error).message))} aria-label="Abrir enlace en navegador integrado">Abrir</button>
          <button type="button" onClick={()=>void openExternal(url).catch(e=>onLinkError((e as Error).message))} aria-label="Abrir enlace en navegador predeterminado">Externo</button>
        </div>)}
      </div>}
    </section>}
  </>;
}

export default function App() {
  const [logged,setLogged] = useState(false);
  const [restoring,setRestoring] = useState(true);
  const [restoreAttempt,setRestoreAttempt] = useState(0);
  const [canRetryBiometric,setCanRetryBiometric] = useState(false);
  const [domains,setDomains] = useState<Domain[]>([]);
  const [domainEditId,setDomainEditId] = useState(0);
  const [domainForm,setDomainForm] = useState<DomainForm>(newDomainForm);
  const [accountEditId,setAccountEditId] = useState(0);
  const accountEditRef = useRef(0);
  const [accountForm,setAccountForm] = useState<AccountForm>(newAccountForm);
  const [expandedAccount,setExpandedAccount] = useState<number|null>(null);
  const [navigationFolders,setNavigationFolders] = useState<Record<number,Folder[]>>({});
  const [navigationBusy,setNavigationBusy] = useState<number|null>(null);
  const [navigationErrors,setNavigationErrors] = useState<Record<number,string>>({});
  const [password,setPassword] = useState('');
  const [accounts,setAccounts] = useState<Account[]>([]);
  const [chosen,setChosen] = useState(0);
  const [folder,setFolder] = useState('INBOX');
  const [folders,setFolders] = useState<Folder[]>([]);
  const [folderLoadError,setFolderLoadError] = useState('');
  const [messages,setMessages] = useState<MailItem[]>([]);
  const unifiedCache = useRef<MailItem[]>([]);
  // Vista previa cifrada con Android Keystore, nunca HTML ni cuerpo de mensajes.
  const previewAccounts = useRef<Account[]>([]);
  const [cachedPreviewAt,setCachedPreviewAt] = useState(0);
  const [initialSync,setInitialSync] = useState(true);
  const [selected,setSelected] = useState<Detail|null>(null);
  const [view,setView] = useState<View>('inbox');
  const [busy,setBusy] = useState(false);
  const [mailLoading,setMailLoading] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [drawer,setDrawer] = useState(false);
  const [drawerAccountsExpanded,setDrawerAccountsExpanded] = useState(false);
  const [to,setTo] = useState('');
  const [cc,setCc] = useState('');
  const [bcc,setBcc] = useState('');
  const [subject,setSubject] = useState('');
  const [body,setBody] = useState('');
  const [sender,setSender] = useState(0);
  const [signature,setSignature] = useState<Signature>({...EMPTY_SIGNATURE});
  const [accountSignature,setAccountSignature] = useState<Signature>({...EMPTY_SIGNATURE});
  const [accountSignatureBusy,setAccountSignatureBusy] = useState(false);
  const [accountSignatureInfo,setAccountSignatureInfo] = useState('');
  const accountSignatureRequest=useRef(0);
  const [showCc,setShowCc] = useState(false);
  const [showBcc,setShowBcc] = useState(false);
  const [signatureSaving,setSignatureSaving] = useState(false);
  const [signatureSyncError,setSignatureSyncError] = useState('');
  const signatureTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const signatureDirty = useRef(new Set<number>());
  const signatureSerial = useRef(0);
  const [theme,setTheme] = useState<ThemeId>(loadTheme);
  const [files,setFiles] = useState<File[]>([]);
  const [clouds,setClouds] = useState<CloudConnection[]>([]);
  const [cloudEditId,setCloudEditId] = useState(0);
  const [cloudForm,setCloudForm] = useState(freshCloudForm);
  const [cloudCheck,setCloudCheck] = useState<CloudCheck|null>(null);
  const [cloudBrowserId,setCloudBrowserId] = useState(0);
  const [cloudPath,setCloudPath] = useState('');
  const [cloudBusy,setCloudBusy] = useState(false);
  const [avatars,setAvatars] = useState<Record<number,string>>({});
  const [avatarBusy,setAvatarBusy] = useState(false);
  const [brandName,setBrandName] = useState(()=>{try{return localStorage.getItem(APP_NAME_KEY)||(/^th\s*correo$/i.test((localStorage.getItem(LEGACY_NAME_KEY)||'').trim())?'Alpanix':localStorage.getItem(LEGACY_NAME_KEY))||'Alpanix';}catch{return 'Alpanix';}});
  const [brandSubtitle,setBrandSubtitle] = useState(()=>{try{return localStorage.getItem(APP_SUBTITLE_KEY)||'';}catch{return '';}});

  const [gotifyStatus,setGotifyStatus] = useState<{configured:boolean;delivery:string;accounts_initialized:number;poll_seconds:number}|null>(null);
  const [gotifyBusy,setGotifyBusy] = useState(false);
  const [fcmState,setFcmState] = useState<PushState>('off');
  const [fcmStatus,setFcmStatus] = useState<{configured:boolean;devices:number}|null>(null);
  const [fcmBusy,setFcmBusy] = useState(false);
  const [diagnostics,setDiagnostics] = useState<DiagnosticEntry[]>(getDiagnostics);
  const [importRows,setImportRows] = useState<ImportRow[]>([]);
  const [,setImportPreview] = useState<ImportPreview|null>(null);
  const [selectedImport,setSelectedImport] = useState<string[]>([]);
  const [monitorAccounts,setMonitorAccounts] = useState<MonitorAccount[]>([]);
  const [activityEntries,setActivityEntries] = useState<ActivityEntry[]>([]);
  const [securityBusy,setSecurityBusy] = useState(false);
  const [biometric,setBiometric] = useState({available:false,enabled:false});
  const [masterOld,setMasterOld] = useState('');
  const [masterNew,setMasterNew] = useState('');
  const [masterVerify,setMasterVerify] = useState('');
  const [importBusy,setImportBusy] = useState(false);
  const [importResult,setImportResult] = useState('');
  const [swipeBusy,setSwipeBusy] = useState<string>('');
  const [swipeVisual,setSwipeVisual] = useState<{key:string;dx:number;dragging:boolean}|null>(null);
  const swipeStart=useRef<{key:string;x:number;y:number;time:number;axis:'x'|'y'|null}|null>(null);
  const [battery,setBattery] = useState<BatteryStatus|null>(null);
  const [batteryBusy,setBatteryBusy] = useState(false);
  const skipOpenAfterSwipe=useRef(false);
  useEffect(()=>subscribeDiagnostics(setDiagnostics),[]);

  const [preferHtml,setPreferHtml] = useState(true);
  const [remoteImages,setRemoteImages] = useState(true);
  const [autoRemoteImages,setAutoRemoteImages] = useState(() => {try{return localStorage.getItem(REMOTE_IMAGE_PREF)!=='false';}catch{return true;}});
  const latest = useRef(0);
  const stateRef = useRef({chosen,folder});
  stateRef.current = {chosen,folder};
  accountEditRef.current=accountEditId;

  useEffect(()=>{
    try{localStorage.setItem(APP_NAME_KEY,brandName);localStorage.setItem(APP_SUBTITLE_KEY,brandSubtitle);}catch{}
  },[brandName,brandSubtitle]);
  useEffect(()=>{
    if(!logged || !accounts.length)return;
    let cancelled=false;
    void Promise.all(accounts.map(async a=>{
      try{return {id:a.id,src:(await api.getAvatar(a.id)).data_url};}
      catch{return {id:a.id,src:''};}
    })).then(list=>{if(!cancelled)setAvatars(Object.fromEntries(list.map(x=>[x.id,x.src])));});
    return ()=>{cancelled=true;};
  },[logged,accounts]);
  const avatar=(a:Account)=>avatars[a.id]
    ? <img className="account-profile-picture" src={avatars[a.id]} alt={`Perfil de ${a.address}`}/>
    : <span className="account-avatar">{(a.display_name||a.address).charAt(0).toUpperCase()}</span>;
  const chooseAvatar=async(event:React.ChangeEvent<HTMLInputElement>)=>{
    const f=event.target.files?.[0];event.target.value='';if(!f||!accountEditId)return;
    if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>5*1024*1024){setError('Selecciona JPG, PNG o WebP de máximo 5 MB.');return;}
    setAvatarBusy(true);setError('');
    try{
      const bitmap=await createImageBitmap(f);
      const canvas=document.createElement('canvas');canvas.width=112;canvas.height=112;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No se pudo procesar la imagen');
      const size=Math.min(bitmap.width,bitmap.height);
      ctx.drawImage(bitmap,(bitmap.width-size)/2,(bitmap.height-size)/2,size,size,0,0,112,112);
      bitmap.close();
      const data=canvas.toDataURL('image/jpeg',0.83);
      await api.putAvatar(accountEditId,data);
      setAvatars(old=>({...old,[accountEditId]:data}));
      setNotice('Imagen de perfil guardada para esta dirección.');
    }catch(e){setError((e as Error).message);}finally{setAvatarBusy(false);}
  };
  const removeAvatar=async()=>{
    if(!accountEditId)return;
    setAvatarBusy(true);setError('');
    try{await api.putAvatar(accountEditId,'');setAvatars(old=>({...old,[accountEditId]:''}));setNotice('Imagen eliminada.');}
    catch(e){setError((e as Error).message);}finally{setAvatarBusy(false);}
  };

  // Un único origen para los colores; aplicar el tema incluso en la pantalla
  // de inicio de sesión y mantenerlo tras reiniciar la Activity.
  useEffect(() => {
    document.documentElement.dataset.thcorreoTheme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* Privacidad o almacenamiento bloqueado. */ }
  }, [theme]);
  useEffect(()=>{try{localStorage.setItem(REMOTE_IMAGE_PREF,String(autoRemoteImages));}catch{}},[autoRemoteImages]);

  // El acceso se recupera primero de Android Keystore (y biometría, si está
  // habilitada). Nunca bloqueamos la interfaz esperando al servidor ni al IMAP.
  // La rotación de sesión se realiza ANTES de las solicitudes paralelas porque
  // el backend revoca el token anterior al renovarlo.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const restored = await api.restore();
        if (!alive || !restored) return;
        setCanRetryBiometric(false);
        setLogged(true);
        setRestoring(false);
        // Solo lectura local de metadatos limitados y cifrados.
        const preview = await api.loadInboxPreview().catch(() => null);
        if (!alive) return;
        if (preview) {
          previewAccounts.current = preview.accounts;
          setAccounts(preview.accounts);
          setSender(preview.accounts[0]?.id || 0);
          unifiedCache.current = preview.messages;
          setMessages(preview.messages);
          setCachedPreviewAt(preview.updatedAt);
        }
        try {
          await api.refresh(true);
          if (!alive) return;
          const list = await api.accounts();
          if (!alive) return;
          previewAccounts.current = list;
          setAccounts(list);
          setSender(list[0]?.id || 0);
          if (list[0]?.id) void hydrateSignature(list[0].id);
          await load(0, 'INBOX', {silent: Boolean(preview)});
        } catch (e) {
          if (!alive) return;
          if (!api.hasSession()) {
            // Token revocado: el método forget() ya eliminó también la vista previa.
            setLogged(false);
            setCanRetryBiometric(false);
            setAccounts([]); setMessages([]); unifiedCache.current=[];
            previewAccounts.current=[]; setCachedPreviewAt(0);
            setError('La sesión caducó o fue revocada. Inicia sesión nuevamente.');
          } else {
            // Sin Internet la vista previa local es consultable, pero queda marcada
            // explícitamente como no sincronizada y no se dan datos por actuales.
            setError(preview
              ? 'Sin conexión al VPS. Estás viendo la última vista previa guardada.'
              : (e as Error).message);
          }
        }
      } catch (e) {
        if (alive) {
          setError((e as Error).message);
          // Cancelar BiometricPrompt NO desactiva el permiso ni borra el token.
          // Si sigue cifrado, ofrecer otro intento sin exigir la frase maestra.
          try {
            const bio = await api.biometrics();
            if (alive) setCanRetryBiometric(Boolean(bio.enabled && bio.available && bio.hasSavedSession));
          } catch { setCanRetryBiometric(false); }
        }
      } finally {
        if (alive) {setRestoring(false);setInitialSync(false);}
      }
    })();
    return () => {alive=false;};
  }, [restoreAttempt]); // Inicio y reintento biométrico, sin recargar la WebView.

  const retryBiometric = () => {
    setError('');
    setRestoring(true);
    setRestoreAttempt(n => n + 1);
  };

  useEffect(() => {
    if (!logged) return;
    // La petición nativa de excepción aparece como máximo una vez por
    // instalación, y solo si Android no otorgó ya la exención.
    // Nunca bloquea la bandeja ni la sesión y nunca se repite si se rechaza.
    void requestBatteryExemptionOnce().catch(() => {});
  }, [logged]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 5500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const load = useCallback(async (accountId: number, selectedFolder='INBOX', options:{silent?:boolean}={}) => {
    const id = ++latest.current;
    const silent=Boolean(options.silent);
    setMailLoading(!silent);
    if(!silent) setError('');
    try {
      if (accountId === 0) {
        const result = await api.unified();
        if (latest.current === id) {
          unifiedCache.current=result.messages;
          setMessages(result.messages);
          setCachedPreviewAt(0);
          // Nunca bloquear la lectura ni la sincronización por el guardado local.
          void api.saveInboxPreview(previewAccounts.current,result.messages).catch(()=>{});
          const badIds = result.failed_account_ids.filter(value => Number.isInteger(value) && value > 0);
          if (!silent && badIds.length) {
            const details=badIds.map(id=>{
              const failed=result.failed_accounts?.find(x=>x.account_id===id);
              return failed?`${failed.address} (${failed.error_detail||failed.error_code})`:`Cuenta ${id}`;
            });
            setError(`Falló la sincronización de: ${details.join('; ')}. Las demás cuentas continúan disponibles.`);
          }
          else if (!silent && result.failed_account_ids.length) setError('La API notificó un fallo de sincronización con un identificador de cuenta no válido. Puedes consultar las carpetas individualmente.');
          else if(!silent && result.invalid_accounts_skipped) setNotice(`Se omitieron ${result.invalid_accounts_skipped} registros incompletos; las demás cuentas siguen disponibles.`);
        }
      } else {
        // Una falla al consultar contadores o carpetas NO debe bloquear la bandeja.
        // Se procesan las dos peticiones de forma independiente.
        if(!silent)setFolderLoadError('');
        const [mailResult, folderResult] = await Promise.allSettled([
          api.messages(accountId,selectedFolder), api.folders(accountId),
        ]);
        if (latest.current !== id) return;
        if (mailResult.status === 'fulfilled') setMessages(mailResult.value);
        else if(!silent) { setMessages([]); setError(`No se pudo abrir la carpeta ${selectedFolder}: ${mailResult.reason instanceof Error ? mailResult.reason.message : 'error de conexión'}`); }
        if (folderResult.status === 'fulfilled') { setFolders(folderResult.value); setFolderLoadError(''); }
        else {
          // Conservar la navegación aunque la consulta de carpetas falle.
          setFolders(old => old.length ? old : [{
            name: 'INBOX', special_use: 'inbox', delimiter: '/',
            unread_count: 0, total_count: 0, count_error: true,
          }]);
          setFolderLoadError('No se pudo cargar la lista de carpetas. Pulsa Reintentar; la bandeja puede seguir funcionando.');
        }
      }
    } catch (e) { if (latest.current === id && !silent) setError((e as Error).message); }
    finally { if (latest.current === id) setMailLoading(false); }
  }, []);
  const reload = useCallback((options:{silent?:boolean}={}) => load(stateRef.current.chosen, stateRef.current.folder, options), [load]);
  const choose = async (accountId:number, nextFolder='INBOX', keepDrawer=false) => {
    const previousAccount = stateRef.current.chosen;
    const previousFolder = stateRef.current.folder;
    const sameFolder=previousAccount===accountId&&previousFolder===nextFolder;
    const hasCachedUnified=accountId===0&&unifiedCache.current.length>0;
    const refreshQuietly=(sameFolder&&messages.length>0)||hasCachedUnified;
    stateRef.current={chosen:accountId,folder:nextFolder};
    if(!sameFolder) setMessages(hasCachedUnified?unifiedCache.current:[]);
    setChosen(accountId); setFolder(nextFolder); setView('inbox'); setDrawer(keepDrawer); setSelected(null);
    if (accountId === 0 || accountId !== previousAccount) {
      // No mostrar accidentalmente carpetas de la cuenta anterior.
      setFolders([]); setFolderLoadError('');
    }
    await load(accountId,nextFolder,{silent:refreshQuietly});
  };
  const expandAccount = async (accountId:number) => {
    // Mostrar las carpetas sin alterar la bandeja ni ocultar las demás cuentas.
    await toggleNavigationAccount(accountId);
  };
  const refreshConfiguration = async () => {
    const [newAccounts,newDomains]=await Promise.all([api.accounts(),api.domains()]);
    previewAccounts.current=newAccounts;
    setAccounts(newAccounts); setDomains(newDomains);
    if(!sender && newAccounts.length) {setSender(newAccounts[0].id);void hydrateSignature(newAccounts[0].id);}
  };
  // Navegador completo en vez de un panel modal: siempre accesible desde barra
  // superior e inferior, incluso si el WebView falla al mostrar un overlay.
  const openNavigation = () => {
    setDrawer(false);
    setView('navigation');
    setSelected(null);
    void refreshConfiguration().catch(e => setError((e as Error).message));
  };
  const toggleNavigationAccount = async (id:number,force=false) => {
    if (!Number.isInteger(id) || id <= 0) {
      setError('Se encontró una cuenta con ID 0 en el servidor. Revisa ese registro antes de utilizarla.');
      return;
    }
    if(expandedAccount === id && !force) {setExpandedAccount(null);return;}
    setExpandedAccount(id);
    if(navigationFolders[id]) return;
    setNavigationBusy(id);
    setNavigationErrors(old=>({...old,[id]:''}));
    try {
      const folderList = await api.folders(id);
      setNavigationFolders(old=>({...old,[id]:folderList}));
    } catch(e) {
      setNavigationErrors(old=>({...old,[id]:(e as Error).message}));
    } finally {setNavigationBusy(current=>current===id?null:current);}
  };
  const manage = async (createAccount=false) => {
    setDrawer(false); setView('settings'); setError(''); setNotice('');
    if(createAccount) {setAccountEditId(0);setAccountForm(newAccountForm(domains[0]?.id||0));}
    try {await refreshConfiguration(); await checkGotify();} catch(e) {setError((e as Error).message);}
  };
  const pickDomain = (id:number) => {
    setDomainEditId(id);
    const d=domains.find(item=>item.id===id);
    setDomainForm(d?{name:d.name,imap_host:d.imap_host,imap_port:d.imap_port,smtp_host:d.smtp_host,smtp_port:d.smtp_port,smtp_security:d.smtp_security}:newDomainForm());
  };
  const loadAccountSignature = async (id:number) => {
    const request=++accountSignatureRequest.current;
    setAccountSignatureInfo('');
    if(!id){setAccountSignature({...EMPTY_SIGNATURE});return;}
    setAccountSignature(getSignature(id));
    try {
      const result=await api.getSignature(id);
      if(request!==accountSignatureRequest.current)return;
      setAccountSignature(result.has_signature?{text:result.text,image:result.image,mime:result.mime}:getSignature(id));
    } catch {if(request===accountSignatureRequest.current)setAccountSignatureInfo('Se muestra la firma guardada en este teléfono. No se pudo consultar el VPS.');}
  };
  const openAccountSettings = async (id:number=0) => {
    setDrawer(false);setView('account-settings');setError('');setNotice('');
    try {await refreshConfiguration();} catch(e){setError((e as Error).message);}
    // pickAccount carga el editor y la firma desde el VPS independientemente
    // de la firma activa en un correo que esté redactándose.
    pickAccount(id);
  };
  const saveAccountSignature = async () => {
    if(!accountEditId)return;
    setAccountSignatureBusy(true);setAccountSignatureInfo('');setError('');
    try {
      await api.putSignature(accountEditId,accountSignature);
      saveSignature(accountEditId,accountSignature);
      if(sender===accountEditId) {setSignature(accountSignature);signatureDirty.current.delete(accountEditId);}
      setNotice('Firma guardada cifrada para esta dirección en el VPS.');
    } catch(e){setAccountSignatureInfo(`No pudo guardarse la firma: ${(e as Error).message}`);}
    finally{setAccountSignatureBusy(false);}
  };
  const selectAccountSignatureFile = (event:React.ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    if(file.size>MAX_SIGNATURE_BYTES||!['image/png','image/jpeg','image/gif','image/webp'].includes(file.type)) {
      setError('Selecciona una imagen PNG, JPG, GIF o WebP de máximo 500 KB.');return;
    }
    const account=accountEditId;
    const reader=new FileReader();
    reader.onload=()=>{if(accountEditRef.current===account&&typeof reader.result==='string')
      setAccountSignature(old=>({...old,image:reader.result as string,mime:file.type}));};
    reader.onerror=()=>setError('No se pudo leer la imagen de firma.');
    reader.readAsDataURL(file);
  };
  const pickAccount = (id:number) => {
    setAccountEditId(id);
    const a=accounts.find(item=>item.id===id);
    setAccountForm(a?{domain_id:a.domain_id,address:a.address,display_name:a.display_name,password:''}:newAccountForm(domains[0]?.id||0));
    void loadAccountSignature(id);
  };
  const saveDomain = async (event:React.FormEvent) => {
    event.preventDefault(); setBusy(true);setError('');
    try {
      const config:DomainConfig={imap_host:domainForm.imap_host.trim(),imap_port:Number(domainForm.imap_port),smtp_host:domainForm.smtp_host.trim(),smtp_port:Number(domainForm.smtp_port),smtp_security:domainForm.smtp_security};
      if(domainEditId) await api.updateDomain(domainEditId,config);
      else await api.createDomain({name:domainForm.name.trim().toLowerCase(),...config});
      await refreshConfiguration();
      setNotice(domainEditId?'Configuración del dominio actualizada.':'Dominio registrado. Ya puedes añadir direcciones.');
      pickDomain(0);
    } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  };
  const saveAccount = async (event:React.FormEvent) => {
    event.preventDefault();setBusy(true);setError('');
    try {
      if(!accountForm.domain_id) throw new Error('Selecciona un dominio primero.');
      if(accountEditId) {
        const updated:{domain_id:number;address:string;display_name:string;password?:string}={domain_id:accountForm.domain_id,address:accountForm.address.trim().toLowerCase(),display_name:accountForm.display_name.trim()};
        if(accountForm.password) updated.password=accountForm.password;
        await api.updateAccount(accountEditId,updated);
      } else {
        if(!accountForm.password) throw new Error('La contraseña de la cuenta nueva es obligatoria.');
        const created=await api.createAccount({domain_id:accountForm.domain_id,address:accountForm.address.trim().toLowerCase(),display_name:accountForm.display_name.trim(),password:accountForm.password});
        setAccountEditId(created.id);accountEditRef.current=created.id;setAccountSignature({...EMPTY_SIGNATURE});
      }
      await refreshConfiguration();
      setNotice(accountEditId?'Cuenta actualizada. La nueva contraseña se cifró en el VPS.':'Cuenta registrada correctamente.');
      setAccountForm(old=>({...old,password:''}));
      await reload();
    } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  };
  const login = async (event:React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api.login(password); setPassword(''); setCanRetryBiometric(false);
      const [list,domainsList] = await Promise.all([api.accounts(),api.domains()]); previewAccounts.current=list; setAccounts(list); setDomains(domainsList);
      const initial = list[0]?.id || 0;
      setSender(initial); if(initial) void hydrateSignature(initial); setLogged(true);
      setChosen(0); setFolder('INBOX'); stateRef.current={chosen:0,folder:'INBOX'};
      await load(0);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const setRead = async (message:MailItem, read:boolean) => {
    setBusy(true); setError('');
    try {
      await api.setRead(message,read);
      setMessages(old=>old.map(m=>m.account_id===message.account_id&&m.uid===message.uid&&m.folder===message.folder?{...m,is_read:read}:m));
      setSelected(old=>old&&old.account_id===message.account_id&&old.uid===message.uid&&old.folder===message.folder?{...old,is_read:read}:old);
      await reload();
    } catch(e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const open = async (message:MailItem) => {
    setBusy(true); setError('');
    try {
      const detail = await api.detail(message);
      setSelected({...detail,is_read:message.is_read}); setPreferHtml(Boolean(detail.html_body)); setRemoteImages(autoRemoteImages); setView('detail');
      if(!message.is_read) {
        try {
          await api.setRead(message,true);
          setSelected(old=>old?{...old,is_read:true}:old);
          setMessages(old=>old.map(m=>m.account_id===message.account_id&&m.uid===message.uid&&m.folder===message.folder?{...m,is_read:true}:m));
        } catch(e) { setError(`El mensaje abrió, pero no pudo marcarse leído: ${(e as Error).message}`); }
      }
    } catch(e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  // El VPS es el almacén permanente; el almacenamiento local conserva las firmas
  // anteriores y permite trabajar temporalmente sin conexión.
  const hydrateSignature = async (accountId:number) => {
    const serial = ++signatureSerial.current;
    const cached = getSignature(accountId);
    setSignature(cached);
    setSignatureSyncError('');
    try {
      const server = await api.getSignature(accountId);
      if(signatureDirty.current.has(accountId)) return;
      if(!server.has_signature && (cached.text || cached.image)) {
        // Migración automática desde la firma que ya existía en la 1.0.7.
        await api.putSignature(accountId,cached);
      } else {
        const remote = {text:server.text,image:server.image,mime:server.mime};
        saveSignature(accountId,remote);
        if(serial===signatureSerial.current) setSignature(remote);
      }
    } catch {
      if(serial===signatureSerial.current) setSignatureSyncError('Sin conexión con las firmas del VPS. Se conserva la copia local.');
    }
  };
  const changeSender = (accountId:number) => {
    // Una firma pendiente no debe perderse al cambiar rápidamente de cuenta.
    if (signatureTimer.current) { clearTimeout(signatureTimer.current); signatureTimer.current=null; }
    if (sender && signatureDirty.current.has(sender)) {
      void persistSignature(sender, getSignature(sender));
    }
    setSender(accountId);
    void hydrateSignature(accountId);
  };
  const persistSignature = async (accountId:number,value:Signature) => {
    setSignatureSaving(true);
    try {
      await api.putSignature(accountId,value);
      const current=getSignature(accountId);
      // Una edición posterior a la petición sigue pendiente de sincronización.
      if(current.text===value.text && current.image===value.image && current.mime===value.mime) {
        signatureDirty.current.delete(accountId);
      }
      setSignatureSyncError('');
    } catch(e) {
      setSignatureSyncError(`No se guardó en el VPS: ${(e as Error).message}. La copia del teléfono se conserva.`);
    } finally {setSignatureSaving(false);}
  };
  const editSignature = (next: Signature) => {
    try {
      saveSignature(sender,next); setSignature(next); setSignatureSyncError('');
      signatureDirty.current.add(sender);
      if(signatureTimer.current) clearTimeout(signatureTimer.current);
      const accountId=sender;
      signatureTimer.current=setTimeout(()=>{void persistSignature(accountId,next);},900);
    } catch(e) { setError((e as Error).message); }
  };
  const selectSignature = (event:React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if(!file) return;
    if (file.size > MAX_SIGNATURE_BYTES || !['image/png','image/jpeg','image/gif','image/webp'].includes(file.type)) {
      setError('La firma debe ser PNG, JPEG, GIF o WebP y ocupar menos de 500 KB.'); event.target.value=''; return;
    }
    const sourceAccount=sender;
    const reader = new FileReader();
    reader.onload = () => {
      if(typeof reader.result==='string' && sourceAccount===sender) editSignature({...getSignature(sourceAccount),image:reader.result as string,mime:file.type});
    };
    reader.onerror = () => setError('No se pudo leer la imagen.');
    reader.readAsDataURL(file); event.target.value='';
  };
  const clearCompose = () => { setTo(''); setCc(''); setBcc(''); setShowCc(false); setShowBcc(false); setSubject(''); setBody(''); setFiles([]); };
  const selectAttachments = (event:React.ChangeEvent<HTMLInputElement>) => {
    const added=Array.from(event.target.files||[]);event.target.value='';
    const byKey=new Map<string,File>();
    for (const file of [...files,...added]) byKey.set(`${file.name}/${file.size}/${file.lastModified}`,file);
    const next=Array.from(byKey.values());
    if(next.length>MAX_FILES || next.some(file=>file.size===0||file.size>MAX_FILE_BYTES) || next.reduce((sum,file)=>sum+file.size,0)>MAX_TOTAL_BYTES) {
      setError('Máximo 5 adjuntos: 8 MiB por archivo y 20 MiB en total; no se aceptan archivos vacíos.');return;
    }
    setFiles(next);setError('');
  };
  const newCompose = (accountId:number) => { changeSender(accountId); clearCompose(); setNotice(''); setError(''); setView('compose'); };
  const startReply = (forward=false) => {
    if(!selected) return;
    changeSender(selected.account_id); setTo(forward?'':emailAddress(selected.from)); setCc(''); setBcc('');setShowCc(false);setShowBcc(false);
    setSubject(`${forward?'Fwd:':'Re:'} ${selected.subject.replace(/^(Re:|Fwd:)\s*/i,'')}`);
    setBody(`\n\n--- Mensaje original ---\nDe: ${selected.from}\nFecha: ${selected.date}\n\n${selected.text_body||'[Contenido HTML no citado]'}`);
    setView('compose');
  };
  const submit = async (event:React.FormEvent) => {
    event.preventDefault(); if(!sender || !to.trim()) return;
    setBusy(true); setError('');
    try {
      const sendData={account_id:sender,to,cc,bcc,subject,body,signature_text:signature.text,
        ...(signature.image?{signature_image_base64:signature.image,signature_image_mime:signature.mime}:{})};
      // Persistir la configuración separadamente del envío. El correo sí incluye la
      // firma aunque un fallo temporal del endpoint impida guardar los ajustes.
      if(signatureTimer.current) {clearTimeout(signatureTimer.current);signatureTimer.current=null;}
      if(signatureDirty.current.has(sender)) void persistSignature(sender,signature);
      const result = files.length ? await api.sendAttachments(sendData,files) : await api.send(sendData);
      clearCompose();
      const copyMessage = result.saved_to_sent
        ? 'Correo enviado; copia guardada en Enviados.'
        : `Correo enviado, pero no se confirmó su copia en Enviados. ${result.warning||''} No lo reenvíes sin comprobar primero.`;
      setNotice(copyMessage);
      // Abrir la cuenta y la carpeta REAL que devolvió el backend IMAP,
      // no volver a cargar la carpeta que estaba abierta antes de enviar.
      const targetFolder = result.saved_to_sent && result.sent_folder ? result.sent_folder : 'INBOX';
      stateRef.current={chosen:sender,folder:targetFolder}; setChosen(sender); setFolder(targetFolder);
      setView('inbox'); setDrawer(false); setSelected(null);
      await load(sender,targetFolder);
    } catch(e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const logout = async () => {
    await stopPush(true);
    await api.logout().catch(()=>{}); unifiedCache.current=[]; previewAccounts.current=[]; setCachedPreviewAt(0); setLogged(false); setAccounts([]); setDomains([]); setMessages([]); setSelected(null); setExpandedAccount(null);
    setView('inbox'); setError(''); setCanRetryBiometric(false); setNotice(''); setSignature({...EMPTY_SIGNATURE});
  };
  useEffect(() => {
    if(!logged) return;
    const visible=()=>{if(document.visibilityState==='visible') void api.refresh().catch(()=>{}).finally(()=>void reload({silent:true}));};
    const timer=window.setInterval(()=>{if(document.visibilityState==='visible'&&view==='inbox') void reload({silent:true});},120000);
    document.addEventListener('visibilitychange',visible);
    return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[logged,reload,view]);

  // El plugin nativo recibe FCM cuando THcorreo está en segundo plano.
  // React procesa únicamente el evento de primer plano o cuando se toca el aviso.
  // No se envían datos del correo a FCM: el contenido siempre llega de nuestra API.
  useEffect(() => {
    if (!logged) {setFcmState('off');return;}
    void startPush({
      onState:setFcmState,
      onIncoming:() => void reload({silent:true}),
      onOpened:() => {stateRef.current={chosen:0,folder:'INBOX'};setChosen(0);setFolder('INBOX');setSelected(null);setView('inbox');void load(0,'INBOX',{silent:true});},
    });
    return () => {void stopPush(false);};
  }, [logged,reload,load]);

  const checkBattery = async () => {
    try{setBattery(await batteryStatus());}
    catch(e){setError('No se pudo consultar la optimización de batería: '+(e as Error).message);}
  };
  useEffect(()=>{if(logged&&view==='settings-notifications')void checkBattery();},[logged,view]);
  const requestBattery = async () => {
    setBatteryBusy(true);
    try{await requestBatteryExemption();setNotice('Revisa el aviso de Android y concede la excepción si deseas usarla.');}
    catch(e){setError((e as Error).message);}
    finally{setBatteryBusy(false);}
    // El estado se actualizará al volver a la pantalla desde los ajustes.
  };
  const openPowerSettings = async () => {
    try{await openBatterySettings();}
    catch(e){setError((e as Error).message);}
  };
  const checkFcm = async () => {
    try{setFcmStatus(await api.fcmStatus());}
    catch(e){setError((e as Error).message);}
  };
  const enableFcm = async () => {
    setFcmBusy(true);setError('');
    try{await enablePush();setNotice('Android está registrando Alpanix para notificaciones.');}
    catch(e){setError((e as Error).message);}
    finally{setFcmBusy(false);}
  };
  const testFcm = async () => {
    setFcmBusy(true);setError('');
    try{const result=await api.fcmTest();setNotice(`FCM aceptó ${result.devices_notified} notificación(es) genéricas.`);}
    catch(e){setError((e as Error).message);}
    finally{setFcmBusy(false);}
  };
  const disableFcm = async () => {
    setFcmBusy(true);setError('');
    try{await disablePush();setFcmState('off');setNotice('Este teléfono dejó de recibir FCM.');await checkFcm();}
    finally{setFcmBusy(false);}
  };

  const loadMonitor=async()=>{
    try{setMonitorAccounts(await api.monitorAccounts());}
    catch(e){setError('No se pudo consultar el diagnóstico de cuentas: '+(e as Error).message);}
  };
  const loadActivity=async()=>{
    try{setActivityEntries(await api.activity());}
    catch(e){setError('No se pudo obtener el registro de actividad: '+(e as Error).message);}
  };
  const loadBiometric=async()=>{
    try{setBiometric(await api.biometrics());}catch(e){setError((e as Error).message);}
  };
  const toggleBiometric=async()=>{
    setSecurityBusy(true);setError('');
    try{
      if(biometric.enabled)await api.disableBiometrics();else await api.enableBiometrics();
      await loadBiometric();setNotice('Preferencia biométrica actualizada en este dispositivo.');
    }catch(e){setError('No se modificó la biometría: '+(e as Error).message);}
    finally{setSecurityBusy(false);}
  };
  const submitMasterChange=async(event:React.FormEvent)=>{
    event.preventDefault();setError('');
    if(masterNew.length<12||masterNew!==masterVerify){setError('Introduce una contraseña nueva de 12 caracteres o más y confírmala.');return;}
    setSecurityBusy(true);
    try{
      await api.changeMasterPassword(masterOld,masterNew);
      setMasterOld('');setMasterNew('');setMasterVerify('');
      setNotice('Contraseña maestra cambiada. Se revocaron otras sesiones; esta sigue activa.');
    }catch(e){setError((e as Error).message);}finally{setSecurityBusy(false);}
  };
  const checkGotify = async () => {
    try { setGotifyStatus(await api.notificationStatus()); }
    catch(e) { setError((e as Error).message); }
  };
  const testGotify = async () => {
    setGotifyBusy(true);setError('');
    try {await api.notificationTest();setNotice('Aviso enviado a Gotify. Comprueba la aplicación Gotify instalada en Android.');}
    catch(e){setError((e as Error).message);}finally{setGotifyBusy(false);}
  };
  const loadCloudConnections = async () => {
    setBusy(true);
    try { setClouds(await api.clouds()); } catch(e){setError((e as Error).message);} finally {setBusy(false);}
  };
  const openClouds = async () => {
    setView('clouds');setDrawer(false);setError('');setCloudCheck(null);setCloudBrowserId(0);setCloudPath('');
    await loadCloudConnections();
  };
  const openCloudSettings = async () => {
    setView('cloud-settings');setDrawer(false);setError('');setCloudCheck(null);setCloudBrowserId(0);setCloudPath('');
    await loadCloudConnections();
  };
  const openCloudBrowser = async (id:number) => {
    setView('cloud-browser');setDrawer(false);setCloudCheck(null);setCloudBrowserId(id);setCloudPath('');
    await browseCloud(id,'');
  };
  const pickCloud = (id:number) => {
    const cloud=clouds.find(item=>item.id===id);
    setCloudEditId(id);setCloudCheck(null);setCloudBrowserId(0);setCloudPath('');
    setCloudForm(cloud?{provider:cloud.provider,name:cloud.name,drive_id:cloud.drive_id?String(cloud.drive_id):'',server_url:cloud.server_url||'',username:cloud.username,password:''}:freshCloudForm());
  };
  const saveCloud = async (event:React.FormEvent) => {
    event.preventDefault();setError('');setBusy(true);
    try {
      const common={name:cloudForm.name.trim(),username:cloudForm.username.trim(),...(cloudForm.password?{password:cloudForm.password}:{})};
      const fields=cloudForm.provider==='kdrive'
        ? {...common,drive_id:Number(cloudForm.drive_id)}
        : {...common,server_url:cloudForm.server_url.trim()};
      if(cloudForm.provider==='kdrive'&&(!Number.isSafeInteger(Number(cloudForm.drive_id))||Number(cloudForm.drive_id)<=0))
        throw new Error('Indica un ID válido de kDrive.');
      if(cloudForm.provider==='webdav'&&!cloudForm.server_url.trim())throw new Error('Indica la URL HTTPS del servidor WebDAV.');
      if(cloudEditId) await api.updateCloud(cloudEditId,fields);
      else {
        if(!cloudForm.password)throw new Error('Introduce la contraseña de acceso o de aplicación.');
        await api.createCloud({...fields,provider:cloudForm.provider,password:cloudForm.password});
      }
      setClouds(await api.clouds());setCloudForm(freshCloudForm());setCloudEditId(0);setCloudCheck(null);
      setNotice('Conexión WebDAV guardada; utiliza Probar conexión para comprobar el acceso.');
    } catch(e){setError((e as Error).message);} finally {setBusy(false);}
  };
  const testCloud = async (id:number) => {
    setBusy(true);setError('');setCloudCheck(null);
    try{setCloudCheck(await api.testCloud(id));setCloudBrowserId(0);setCloudPath('');setNotice('El servidor WebDAV respondió correctamente.');}
    catch(e){setError((e as Error).message);} finally{setBusy(false);}
  };
  const browseCloud=async(id:number,path='')=>{
    setCloudBusy(true);setError('');
    try {const result=await api.cloudBrowse(id,path);setCloudCheck(result);setCloudBrowserId(id);setCloudPath(result.path);}
    catch(e){setError((e as Error).message);}finally{setCloudBusy(false);}
  };
  const cloudOperation=async(job:()=>Promise<unknown>,message:string)=>{
    if(!cloudBrowserId)return;
    setCloudBusy(true);setError('');
    try{await job();setNotice(message);const refreshed=await api.cloudBrowse(cloudBrowserId,cloudPath);setCloudCheck(refreshed);}
    catch(e){setError((e as Error).message);}finally{setCloudBusy(false);}
  };
  const newCloudFolder=()=>{
    if(!cloudBrowserId)return;
    const name=window.prompt('Nombre de la nueva carpeta:');if(!name)return;
    void cloudOperation(()=>api.cloudNewFolder(cloudBrowserId,cloudPath,name),'Carpeta creada.');
  };
  const renameCloudItem=(entry:DavEntry)=>{
    const name=window.prompt('Nuevo nombre:',entry.name);if(!name||name===entry.name)return;
    void cloudOperation(()=>api.cloudMove(cloudBrowserId,entry.path,cloudPath,name,entry.folder),'Elemento renombrado.');
  };
  const moveCloudItem=(entry:DavEntry)=>{
    const destination=window.prompt('Ruta de la carpeta destino desde la raíz. Deja vacío para la raíz:','');
    if(destination===null)return;
    void cloudOperation(()=>api.cloudMove(cloudBrowserId,entry.path,destination,undefined,entry.folder),'Elemento movido.');
  };
  const deleteCloudItem=(entry:DavEntry)=>{
    if(!window.confirm(`¿Eliminar ${entry.folder?'la carpeta y su contenido':'el archivo'} «${entry.name}» de forma definitiva?`))return;
    void cloudOperation(()=>api.cloudRemove(cloudBrowserId,entry.path,entry.folder),'Elemento eliminado del servidor remoto.');
  };
  const uploadCloudFile=async(event:React.ChangeEvent<HTMLInputElement>)=>{
    const selected=Array.from(event.target.files||[]);event.target.value='';if(!selected.length||!cloudBrowserId)return;
    if(selected.some(f=>f.size>8*1024*1024)){setError('Máximo 8 MiB por archivo.');return;}
    await cloudOperation(async()=>{for(const file of selected)await api.cloudUpload(cloudBrowserId,cloudPath,file);},'Archivos cargados.');
  };
  const downloadCloudFile=async(entry:DavEntry)=>{
    setCloudBusy(true);setError('');
    try{
      const result=await api.cloudDownload(cloudBrowserId,entry.path);
      const native=await import('@capacitor/core');
      if(native.Capacitor.isNativePlatform()){
        const saver=native.registerPlugin<{save(options:{name:string;data:string}):Promise<{name:string}>}>('THFileSave');
        await saver.save({name:result.filename,data:result.bytes});
        setNotice(`Archivo guardado en Descargas: ${result.filename}`);
      }else{
        const raw=atob(result.bytes);const u8=Uint8Array.from(raw,ch=>ch.charCodeAt(0));
        const url=URL.createObjectURL(new Blob([u8]));const link=document.createElement('a');
        link.href=url;link.download=result.filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
      }
    }catch(e){setError((e as Error).message);}finally{setCloudBusy(false);}
  };

  const removeCloud = async (id:number) => {
    if(!window.confirm('¿Eliminar esta conexión WebDAV del VPS? Los archivos remotos no se eliminarán.')) return;
    setBusy(true);setError('');
    try{await api.deleteCloud(id);setClouds(await api.clouds());setCloudCheck(null);pickCloud(0);setNotice('Conexión eliminada.');}
    catch(e){setError((e as Error).message);} finally{setBusy(false);}
  };

  // Una única función de retorno, llamada desde Android (dispatcher), el historial
  // WebView o el botón visual. El ref evita callbacks con estado obsoleto.
  const mailKey=(m:MailItem)=>`${m.account_id}/${m.folder}/${m.uid}`;
  const swipeStartMail=(e:React.TouchEvent, m:MailItem)=>{
    if(e.touches.length!==1)return;
    const touch=e.touches[0];
    swipeStart.current={key:mailKey(m),x:touch.clientX,y:touch.clientY,time:Date.now(),axis:null};
    setSwipeVisual(null);
  };
  const swipeMoveMail=(e:React.TouchEvent,m:MailItem)=>{
    const st=swipeStart.current;
    if(!st||st.key!==mailKey(m)||e.touches.length!==1)return;
    const touch=e.touches[0];
    const dx=touch.clientX-st.x,dy=touch.clientY-st.y;
    if(st.axis===null && Math.max(Math.abs(dx),Math.abs(dy))>12){st.axis=Math.abs(dx)>Math.abs(dy)*1.35?'x':'y';}
    if(st.axis==='x'){
      setSwipeVisual({key:st.key,dx:Math.max(-114,Math.min(114,dx)),dragging:true});
    }
  };
  const swipeEndMail=(e:React.TouchEvent,m:MailItem)=>{
    const st=swipeStart.current;swipeStart.current=null;
    setSwipeVisual(null);
    if(!st||st.key!==mailKey(m)||st.axis!=='x'||e.changedTouches.length!==1)return;
    const touch=e.changedTouches[0];const dx=touch.clientX-st.x,dy=touch.clientY-st.y;
    // Una exploración lateral corta no debe abrir accidentalmente el correo.
    if(Math.abs(dx)>15){skipOpenAfterSwipe.current=true;setTimeout(()=>{skipOpenAfterSwipe.current=false;},600);}
    if(Math.abs(dx)<85||Math.abs(dx)<Math.abs(dy)*1.5||Date.now()-st.time>1800)return;
    if(dx>0){ if(!m.is_read)void setRead(m,true);else setNotice('El mensaje ya está marcado como leído.'); }
    else void removeMail(m);
  };
  const removeMail=async(m:MailItem)=>{
    if(!window.confirm('¿Mover este correo a la Papelera? Esta acción se sincronizará con tu servidor IMAP.'))return;
    const key=mailKey(m);setSwipeBusy(key);setError('');
    try{const result=await api.deleteMessage(m);setMessages(old=>old.filter(x=>mailKey(x)!==key));
      if(chosen===0)unifiedCache.current=unifiedCache.current.filter(x=>mailKey(x)!==key);
      setNotice(result.status==='moved'?'Correo movido a Papelera.':'Correo marcado para eliminación en IMAP.');
    }catch(e){setError('No se eliminó el correo: '+(e as Error).message);}finally{setSwipeBusy('');}
  };
  const importFile=async(event:React.ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    setImportRows([]);setSelectedImport([]);setImportPreview(null);setImportResult('');setError('');
    if(file.size>5_000_000){setError('Archivo demasiado grande: máximo 5 MB.');return;}
    try{
      const preview=parseAccountImport(await file.text(),domains.map(d=>d.name),accounts.map(a=>a.address));
      setImportRows(preview.rows);setImportPreview(preview);setSelectedImport(preview.rows.map(row=>row.address));
      setImportResult(`${preview.rows.length} buzones elegibles de ${preview.scanned} registros; ${preview.ignoredDomain} de dominios no configurados, ${preview.ignoredExisting} ya existentes, ${preview.invalid} no válidos y ${preview.duplicates} duplicados se omitieron. La selección no se almacena en el teléfono.`);
    }
    catch(e){setError((e as Error).message);}
  };
  const runImport=async()=>{
    const rowsToImport=importRows.filter(row=>selectedImport.includes(row.address));
    if(!rowsToImport.length)return;
    if(!window.confirm(`¿Dar de alta ${rowsToImport.length} cuentas seleccionadas de dominios configurados?`))return;
    setImportBusy(true);setError('');let ok=0;const failures:string[]=[];
    for(const row of rowsToImport){
      const domain=domains.find(d=>d.name.toLowerCase()===row.address.split('@')[1].toLowerCase());
      if(!domain){failures.push(`${row.address}: dominio sin configurar`);continue;}
      if(accounts.some(a=>a.address.toLowerCase()===row.address.toLowerCase())){failures.push(`${row.address}: ya existe`);continue;}
      try{await api.createAccount({domain_id:domain.id,address:row.address,display_name:row.displayName,password:row.password});ok++;}
      catch(e){failures.push(`${row.address}: ${(e as Error).message}`);}
    }
    setImportRows([]);setSelectedImport([]);setImportPreview(null);setImportResult(`${ok} cuentas importadas. ${failures.length} omitidas o fallidas. ${failures.slice(0,8).join(' | ')}`);
    try{await refreshConfiguration();}catch{}setImportBusy(false);
  };
  const backAction = useRef<() => 'stay'|'exit'>(() => 'stay');
  backAction.current = () => {
    if (drawer) { setDrawer(false); return 'stay'; }
    if (view === 'detail') { setView('inbox'); setSelected(null); void reload({silent:true}); return 'stay'; }
    if (view === 'cloud-browser') {if(cloudPath){void browseCloud(cloudBrowserId,cloudPath.split('/').slice(0,-1).join('/'));return 'stay';}void openClouds();return 'stay';}
    if (view === 'cloud-settings') {setView('settings');return 'stay';}
    if (view === 'clouds') {setView('inbox');void reload({silent:true});return 'stay';}
    if (view === 'account-settings' || view === 'diagnostics' || view === 'import-accounts' || view === 'about' || view === 'changelog' || view === 'activity' || view.startsWith('settings-')) {setView('settings');return 'stay';}
    if (view === 'compose' || view === 'settings' || view === 'navigation') {
      setView('inbox'); setError(''); void reload({silent:true}); return 'stay';
    }
    if (chosen !== 0 || folder !== 'INBOX') { void choose(0, 'INBOX'); return 'stay'; }
    return 'exit'; // Android finalizará la Activity cuando estemos en la raíz.
  };
  useEffect(() => {
    const handleBack = () => backAction.current();
    // Tanto el puente nativo como el historial del WebView son compatibles.
    (window as Window & {__thcorreoBack?:()=>void}).__thcorreoBack = handleBack;
    window.addEventListener('thcorreo:native-back', handleBack);
    const onPop = () => { handleBack(); window.history.pushState({thcorreo:true}, '', window.location.href); };
    window.history.pushState({thcorreo:true}, '', window.location.href);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('thcorreo:native-back', handleBack);
      window.removeEventListener('popstate', onPop);
      delete (window as Window & {__thcorreoBack?:()=>void}).__thcorreoBack;
    };
  }, []);

  const accountTitle=chosen===0?'Todas las cuentas':accounts.find(a=>a.id===chosen)?.address||'Cuenta';
  const currentFolder=folders.find(f=>f.name===folder);
  const sentView=Boolean(chosen!==0 && currentFolder?.special_use==='sent');
  const unreadShown=messages.filter(m=>!m.is_read).length;
  if(restoring) return <div className="login-bg" aria-label="Iniciando Alpanix"><img className="startup-brand" src="/alpanix-icon.png" alt="Alpanix"/></div>;
  if(!logged) return <div className="login-bg"><form onSubmit={login} className="login-card">
    <div className="login-brand"><img className="alpanix-login-icon" src="/alpanix-icon.png" alt=""/><div><h1>Alpanix</h1><small>Correo privado</small></div></div>
    <img className="alpanix-main-logo" src="/alpanix-logo.png" alt="Logotipo oficial Alpanix"/>
    <h2>Acceder a tus cuentas</h2><p>Introduce la contraseña maestra. Las claves de los buzones permanecen en el VPS.</p>
    <input aria-label="Contraseña maestra" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña maestra"/>
    {error&&<div role="alert" className="error-box">{error}</div>}
    {canRetryBiometric&&<button type="button" className="primary-btn" disabled={busy} onClick={retryBiometric}>
      <Fingerprint size={18}/> Reintentar con huella
    </button>}
    <button disabled={busy} className="primary-btn">{busy?'Conectando…':'Iniciar sesión'}</button>
    <small className="login-foot"><ShieldCheck size={14}/> Sesión cifrada con Android Keystore; no se guarda tu contraseña. El token se renueva mientras siga vigente.</small>
  </form></div>;

  return <div className="shell">
    <header className="topbar"><button className="icon-btn" type="button" aria-label="Cuentas y carpetas" title="Cuentas y carpetas" onClick={()=>{setDrawer(true);setDrawerAccountsExpanded(false);}}><Menu/></button>
      <img src="/alpanix-icon.png" alt="" className="topbar-brand-icon"/><div className="header-title"><strong>{brandName||'Alpanix'}</strong><span>{brandSubtitle|| (view==='navigation'?'Cuentas y carpetas':view==='account-settings'?'Configuración de cuenta':view==='settings'?'Configuración':view.startsWith('settings-')?'Ajustes':(view==='clouds'||view==='cloud-browser')?'Nube de archivos':view==='cloud-settings'?'Configuración de nube':chosen===0?'Bandeja unificada':accountTitle)}</span></div>
      <button className="icon-btn" type="button" aria-label="Abrir kDrive" title="Almacenamiento en la nube" onClick={()=>void openClouds()}><Cloud size={21}/></button>
      <button className="icon-btn" type="button" aria-label="Administrar cuentas y servidores" title="Ajustes" onClick={()=>void manage()}><Settings size={21}/></button>
      <button className="icon-btn" type="button" disabled={busy||mailLoading} aria-label="Sincronizar" onClick={()=>void reload()}><RefreshCw size={22} className={(busy||mailLoading)?'spinning':''}/></button>
    </header>
    {drawer&&<div className="drawer-backdrop" onClick={()=>setDrawer(false)}><aside className="drawer" onClick={e=>e.stopPropagation()}>
      <div className="drawer-head"><b>{brandName||'Alpanix'}</b><button className="icon-btn" aria-label="Cerrar" onClick={()=>setDrawer(false)}><X/></button></div>
      <button type="button" className="drawer-section-toggle" onClick={()=>setDrawerAccountsExpanded(old=>!old)} aria-expanded={drawerAccountsExpanded}><span>CUENTAS DISPONIBLES</span><span aria-hidden="true">{drawerAccountsExpanded?'▴':'▾'}</span></button>
      <button className={`drawer-choice ${chosen===0?'active':''}`} onClick={()=>choose(0,'INBOX')}><Inbox size={18}/> Bandeja unificada</button>
      {drawerAccountsExpanded&&<><p className="drawer-hint">Toca una cuenta para desplegar sus carpetas IMAP.</p>
      {accounts.map(a=><React.Fragment key={a.id}>
        <button className={`drawer-choice ${chosen===a.id?'active':''}`} onClick={()=>expandAccount(a.id)} aria-expanded={expandedAccount===a.id}>
          {avatar(a)}<span className="account-label"><b>{a.display_name||a.address}</b><small>{a.address}</small></span>
          <span className="account-expand" aria-hidden="true">{expandedAccount===a.id?'▾':'▸'}</span>
        </button>
        {expandedAccount===a.id&&<div className="account-folders">
          <p className="drawer-label">CARPETAS IMAP {navigationBusy===a.id?'· Cargando…':''}</p>
          {navigationErrors[a.id]&&<div className="drawer-folder-warning" role="status">
            <span>{navigationErrors[a.id]}</span>
            <button type="button" onClick={()=>{setNavigationFolders(old=>{const copy={...old};delete copy[a.id];return copy;});void toggleNavigationAccount(a.id,true);}}>Reintentar</button>
          </div>}
          {(navigationFolders[a.id]?.length?navigationFolders[a.id]:[{name:'INBOX',special_use:'inbox',delimiter:'/',unread_count:0,total_count:0,count_error:true}]).map(f=><button key={f.name}
            className={`drawer-choice folder-choice ${folder===f.name?'active':''}`}
            onClick={()=>choose(a.id,f.name)}>
            {folderIcon(f.special_use)} <span className="folder-name">{folderLabel(f)}</span>
            <span className="folder-counter">{f.count_error?'—':f.unread_count}</span>
          </button>)}
        </div>}
      </React.Fragment>)}</>}
      <div className="drawer-divider"/>
      <button className="drawer-choice" onClick={()=>void openAccountSettings(0)}><Plus size={18}/> Añadir cuenta</button>
      <button className="drawer-choice" onClick={()=>void openAccountSettings(accounts[0]?.id||0)}><Mail size={18}/> Configuración por dirección</button>
      <button className="drawer-choice" onClick={()=>manage()}><Settings size={18}/> Administrar cuentas y servidores</button>
      <button className="drawer-choice" onClick={()=>void openClouds()}><Cloud size={18}/> Nube de archivos · WebDAV</button>
      <button onClick={logout} className="drawer-choice logout"><LogOut size={18}/> Cerrar sesión</button>
    </aside></div>}
    <main className="content">
      {error&&<div role="alert" className="error-box"><CircleAlert size={18}/>{error}</div>}
      {notice&&<div role="status" className="notice-box"><span>{notice}</span><button aria-label="Cerrar aviso" onClick={()=>setNotice('')}><X size={16}/></button></div>}
      {view==='inbox'&&<>
        <div className="section-heading"><div>{chosen!==0&&<span className="overline">{accountTitle}</span>}<h2>{chosen===0?'Bandeja unificada':currentFolder?folderLabel(currentFolder):folder}</h2><p>{accountTitle}</p></div>
          <button className="icon-btn" onClick={()=>void reload()} aria-label="Actualizar" disabled={busy||mailLoading}><RefreshCw size={20} className={(busy||mailLoading)?'spinning':''}/></button></div>
        <p className="swipe-hint">Desliza a la derecha para marcar leído o a la izquierda para enviar a Papelera.</p>
        {cachedPreviewAt>0 && <p className="mail-preview-note" role="status">Vista previa cifrada del {new Date(cachedPreviewAt).toLocaleString('es-MX')}. Se actualizará al conectarse al VPS.</p>}
        {initialSync && messages.length===0 && <p className="mail-preview-note" role="status">Preparando tu bandeja en segundo plano…</p>}
        <div className="stats-row"><span><Inbox size={16}/> {messages.length} mostrados</span><span><MailOpen size={16}/> {unreadShown} sin leer</span>
          {chosen!==0&&currentFolder&&!currentFolder.count_error&&<span><Eye size={15}/> {currentFolder.total_count} en carpeta</span>}</div>
        {mailLoading&&!messages.length&&<p className="loading-message">Sincronizando con IMAP…</p>}
        <div className="mail-list">{!initialSync&&!busy&&!mailLoading&&messages.length===0&&<div className="empty-box">No hay mensajes en esta carpeta.</div>}
          {messages.map(m=>{const peer=sentView?(m.to||m.from):m.from;const key=mailKey(m);const drag=swipeVisual?.key===key?swipeVisual.dx:0;return <div key={key} className={`mail-row ${m.is_read?'is-read':'is-unread'}`}>
            <div className={`mail-swipe-backdrop ${drag>0?'mail-swipe-read':'mail-swipe-delete'}`} aria-hidden="true">
              {drag>=0?<span><Check size={22}/> Marcar leído</span>:<span><Trash2 size={22}/> Papelera</span>}
            </div>
            <div className={`mail-row-content ${swipeVisual?.key===key&&swipeVisual.dragging?'mail-row-dragging':''}`} style={{transform:`translateX(${drag}px)`}}>
            <button className="mail-main" onTouchStart={e=>swipeStartMail(e,m)} onTouchMove={e=>swipeMoveMail(e,m)} onTouchCancel={()=>{swipeStart.current=null;setSwipeVisual(null);}} onTouchEnd={e=>swipeEndMail(e,m)} onClick={e=>{if(skipOpenAfterSwipe.current||swipeBusy){e.preventDefault();return;}void open(m);}}><div className="avatar">{displayName(peer).charAt(0).toUpperCase()||'?'}</div>
              <div className="mail-info"><div className="mail-top"><b>{sentView?'Para: ':''}{displayName(peer)}</b><time>{dateShort(m.date)}</time></div>
              <p className="mail-subject">{m.subject||'(Sin asunto)'}</p><span className="mail-account">{avatars[m.account_id]&&<img className="mail-account-photo" src={avatars[m.account_id]} alt=""/>}{sentView?(m.to||'Destinatario'):accounts.find(a=>a.id===m.account_id)?.address||`Cuenta ${m.account_id}`}</span></div>
              {!m.is_read&&<i className="new-dot"/>}</button>
            <button title={m.is_read?'Marcar como no leído':'Marcar como leído'} className="read-switch" onClick={()=>setRead(m,!m.is_read)} disabled={busy||Boolean(swipeBusy)}>{m.is_read?<Mail size={18}/>:<Check size={18}/>}</button>
            <button className="delete-mail-btn" type="button" aria-label="Mover a Papelera" onClick={()=>void removeMail(m)} disabled={Boolean(swipeBusy)}><Trash2 size={16}/></button>
            </div>
          </div>;})}
        </div>
      </>}
      {view==='navigation'&&<>
        <div className="section-heading"><div><span className="overline">NAVEGACIÓN</span><h2>Cuentas y carpetas</h2><p>Las carpetas se pueden abrir sin cerrar esta pantalla.</p></div></div>
        <div className="navigation-page">
          <button type="button" className="navigation-primary" onClick={()=>void choose(0,'INBOX')}><Inbox size={19}/> Bandeja unificada</button>
          {accounts.map(a=><section className="navigation-account" key={a.id}>
            <div className="navigation-account-row">
              <button type="button" className="navigation-expand" aria-expanded={expandedAccount===a.id}
                onClick={()=>void toggleNavigationAccount(a.id)}>
                {avatar(a)}
                <span className="navigation-account-name"><strong>{a.display_name||a.address}</strong><small>{a.address}</small></span>
                <span aria-hidden="true">{expandedAccount===a.id?'▾':'▸'}</span>
              </button>
              <button type="button" className="navigation-inbox" disabled={a.id<=0}
                onClick={()=>void choose(a.id,'INBOX')} title="Abrir entrada">Entrada</button>
            </div>
            {a.id<=0&&<p className="navigation-warning">Cuenta con identificador 0: requiere revisión en SQLite.</p>}
            {expandedAccount===a.id&&a.id>0&&<div className="navigation-folder-list">
              {navigationBusy===a.id&&<p className="form-note">Consultando carpetas IMAP…</p>}
              {navigationErrors[a.id]&&<div className="navigation-warning">{navigationErrors[a.id]}<button type="button" onClick={()=>{setNavigationFolders(old=>{const x={...old};delete x[a.id];return x;});setExpandedAccount(null);}}>Reintentar</button></div>}
              {(navigationFolders[a.id]||[]).map(f=><button key={f.name} type="button" className="navigation-folder"
                onClick={()=>void choose(a.id,f.name)}>{folderIcon(f.special_use)}<span>{folderLabel(f)}</span>
                <small>{f.count_error?'—':f.unread_count}</small></button>)}
              {!navigationBusy&&!navigationErrors[a.id]&&!(navigationFolders[a.id]?.length)&&<button type="button" className="navigation-folder" onClick={()=>void choose(a.id,'INBOX')}><Inbox size={16}/> Recibidos</button>}
            </div>}
          </section>)}
          <button type="button" className="navigation-primary" onClick={()=>void openAccountSettings(0)}><Plus size={18}/> Añadir cuenta</button>
          <button type="button" className="navigation-primary" onClick={()=>void openAccountSettings(accounts[0]?.id||0)}><Mail size={18}/> Firmas y ajustes por cuenta</button>
          <button type="button" className="navigation-primary" onClick={()=>void manage()}><Settings size={18}/> Administrar dominios y cuentas</button>
          <button type="button" className="navigation-primary" onClick={()=>void openClouds()}><Cloud size={18}/> Servidores WebDAV y kDrive</button>
          <button type="button" className="navigation-primary navigation-logout" onClick={()=>void logout()}><LogOut size={18}/> Cerrar sesión</button>
        </div>
      </>}
      {view==='settings'&&<>
        <div className="section-heading"><div><span className="overline">CONFIGURACIÓN</span><h2>Ajustes de Alpanix</h2><p>Selecciona la sección que deseas configurar.</p></div></div>
        <div className="settings-menu">
          <button onClick={()=>setView('settings-identity')}><Pencil size={21}/><span><b>Identidad y cabecera</b><small>Nombre visible y subtítulo superior</small></span></button>
          <button onClick={()=>setView('settings-domains')}><Server size={21}/><span><b>Servidores y dominios</b><small>IMAP, SMTP y nuevas direcciones</small></span></button>
          <button onClick={()=>void openAccountSettings(accounts[0]?.id||0)}><Mail size={21}/><span><b>Configuración por cuenta</b><small>Nombre de remitente, contraseña, foto y firma</small></span></button>
          <button onClick={()=>void openCloudSettings()}><Cloud size={21}/><span><b>Almacenamiento en nube</b><small>Añadir, editar y probar conexiones WebDAV</small></span></button>
          <button onClick={()=>setView('settings-appearance')}><Palette size={21}/><span><b>Temas visuales</b><small>Incluye Tlahuisca Día y Noche</small></span></button>
          <button onClick={()=>setView('settings-reading')}><Eye size={21}/><span><b>Lectura de mensajes</b><small>HTML e imágenes externas</small></span></button>
          <button onClick={()=>setView('settings-notifications')}><Bell size={21}/><span><b>Notificaciones</b><small>Alpanix FCM y respaldo Gotify</small></span></button>
          <button onClick={()=>{setView('settings-security');void loadBiometric();}}><ShieldCheck size={21}/><span><b>Seguridad y contraseña maestra</b><small>Biometría y cambio de clave</small></span></button>
          <button onClick={()=>{setView('diagnostics');void loadMonitor();}}><Activity size={21}/><span><b>Diagnóstico por cuenta</b><small>Últimos fallos IMAP y sugerencias</small></span></button>
          <button onClick={()=>{setView('activity');void loadActivity();}}><ClipboardList size={21}/><span><b>Registro de actividad</b><small>Operaciones y errores, sin datos secretos</small></span></button>
          <button onClick={()=>setView('changelog')}><History size={21}/><span><b>Registro de cambios</b><small>Historial de Alpanix</small></span></button>
          <button onClick={()=>setView('about')}><Info size={21}/><span><b>Acerca de Alpanix</b><small>Información de esta aplicación privada</small></span></button>
          <button onClick={()=>{setImportRows([]);setImportResult('');setView('import-accounts');void refreshConfiguration();}}><Upload size={21}/><span><b>Importar cuentas</b><small>Bitwarden, CSV o JSON · vista previa</small></span></button>
        </div>
      </>}
      {view==='diagnostics'&&<>
        <button className="back-link" onClick={()=>setView('settings')}><ArrowLeft size={18}/> Ajustes</button>
        <div className="section-heading"><div><span className="overline">DIAGNÓSTICO</span><h2>Registros y errores</h2><p>Actividad de API de esta sesión; no se guardan cuerpos, claves ni tokens.</p></div></div>
        <section className="compose-card settings-card">
          <h2><Mail size={18}/> Estado de cada buzón</h2>
          <p className="form-note">Últimas revisiones del VPS, tanto del monitor IMAP de 45 segundos como de las bandejas. Las contraseñas no se registran.</p>
          <button type="button" onClick={()=>void loadMonitor()}><RefreshCw size={16}/> Actualizar estado de buzones</button>
          {monitorAccounts.length===0?<p className="form-note">Sin datos del monitor todavía.</p>:monitorAccounts.map(a=><div className="diagnostic-entry" key={a.id}>
            <strong>Cuenta {a.id} · {a.address}</strong>
            <small>Servidor: {a.imap_host}:{a.imap_port} · Último intento: {dateOf(a.last_checked)}</small>
            <small>Último éxito: {dateOf(a.last_success)}</small>
            {a.error_code?<><p className="account-check-error">{a.error_code}: {a.error_detail}</p><small>Último fallo: {dateOf(a.last_error)} · Fallos consecutivos: {a.failures}</small></>:<p>Sin errores en la última revisión registrada.</p>}
          </div>)}
        </section>
        <section className="compose-card settings-card"><h2>Errores de la aplicación</h2><div className="diagnostic-actions"><button type="button" onClick={()=>setDiagnostics(getDiagnostics())}>Actualizar registros</button><button type="button" onClick={()=>{clearDiagnostics();setDiagnostics([]);}}>Borrar historial</button></div>
          <p className="form-note">Un error HTTP 504 suele indicar que Nginx o el VPS agotó el tiempo de espera: verifica el servicio email-api-v2, conectividad e IMAP. Un 502 indica un fallo aguas arriba; un 401 requiere volver a iniciar sesión.</p>
          {diagnostics.length===0?<p>Sin errores registrados en esta sesión.</p>:diagnostics.slice().reverse().map((d,i)=><div className="diagnostic-entry" key={i}><strong>{d.time} · {d.status||'Red'} · {d.method} {d.endpoint}</strong><small>{d.message} · {d.durationMs} ms</small><p>{d.suggestion}</p></div>)}
        </section>
      </>}
      {view==='import-accounts'&&<>
        <button className="back-link" onClick={()=>{setImportRows([]);setView('settings');}}><ArrowLeft size={18}/> Ajustes</button>
        <div className="section-heading"><div><span className="overline">IMPORTACIÓN PRIVADA</span><h2>Importar cuentas</h2><p className="import-explanation">CSV, JSON o Bitwarden. Primero se filtran las direcciones de dominios configurados y después se aplica el límite de 100 buzones.</p></div></div>
        <section className="compose-card settings-card"><label>Archivo local<input type="file" accept=".csv,.json,text/csv,application/json" onChange={importFile}/></label>
          <p className="form-note">Columnas CSV: address,password,display_name. En Bitwarden se leen las entradas de inicio de sesión cuyo usuario es un correo. No se admite exportación cifrada ni se almacenan las contraseñas en el navegador.</p>
          {importResult&&<p role="status">{importResult}</p>}
          {importRows.length>0&&<><h3>Vista previa ({selectedImport.length} seleccionados de {importRows.length})</h3>
            <p className="form-note">Revisa que cada registro corresponda realmente a un buzón IMAP y no solo a una contraseña de acceso web. Nunca importaremos automáticamente todos los accesos de Bitwarden.</p>
            <div className="import-preview">{importRows.map((r,i)=><label className="import-choice" key={i}>
              <input type="checkbox" checked={selectedImport.includes(r.address)} onChange={e=>setSelectedImport(prev=>e.target.checked?[...prev,r.address]:prev.filter(a=>a!==r.address))}/>
              <span><b>{r.address}</b><small>{r.displayName||'Sin nombre'} · Dominio configurado</small></span>
            </label>)}</div>
            <button type="button" className="primary-btn" disabled={importBusy||!selectedImport.length} onClick={()=>void runImport()}>{importBusy?'Importando…':`Confirmar ${selectedImport.length} buzones`}</button>
            <button type="button" onClick={()=>{setImportRows([]);setSelectedImport([]);setImportPreview(null);setImportResult('Importación cancelada.');}}>Cancelar y descartar claves</button></>}
        </section>
      </>}
      {view==='settings-security'&&<>
        <button className="back-link" onClick={()=>setView('settings')}><ArrowLeft size={18}/> Ajustes</button>
        <div className="section-heading"><h2>Seguridad y acceso</h2></div>
        <section className="compose-card settings-card">
          <h2><Fingerprint size={20}/> Autenticación biométrica</h2>
          <p>Si está activada, Android pedirá tu huella antes de recuperar la sesión cifrada al abrir la aplicación. Si no puedes usarla, podrás ingresar mediante contraseña maestra.</p>
          <p className="form-note">Estado: {biometric.enabled?'Activada':biometric.available?'Disponible y desactivada':'Biometría fuerte no disponible'}.</p>
          <button type="button" className="primary-btn" disabled={securityBusy||!biometric.available} onClick={()=>void toggleBiometric()}>
            <Fingerprint size={17}/>{biometric.enabled?'Desactivar biometría':'Activar biometría'}</button>
          <p className="form-note">La preferencia de huella se conserva tras cerrar sesión, renovar el token y actualizar Alpanix sin desinstalarla. Si la sesión caduca o Android invalida su clave, deberás iniciar sesión con la contraseña maestra una vez. Cancelar el diálogo no desactiva la huella.</p>
        </section>
        <form className="compose-card settings-card" onSubmit={submitMasterChange}>
          <h2><KeyRound size={20}/> Cambiar contraseña maestra</h2>
          <label>Contraseña actual<input required type="password" autoComplete="current-password" value={masterOld} onChange={e=>setMasterOld(e.target.value)}/></label>
          <label>Nueva contraseña (mínimo 12 caracteres)<input required minLength={12} type="password" autoComplete="new-password" value={masterNew} onChange={e=>setMasterNew(e.target.value)}/></label>
          <label>Confirmar nueva contraseña<input required minLength={12} type="password" autoComplete="new-password" value={masterVerify} onChange={e=>setMasterVerify(e.target.value)}/></label>
          <button className="primary-btn" disabled={securityBusy}><KeyRound size={17}/> Actualizar contraseña</button>
          <p className="form-note">El cambio requiere la contraseña actual. Se conservan los buzones y esta sesión, y se revocan las demás sesiones.</p>
        </form>
        <section className="compose-card settings-card"><h2>¿Olvidaste la contraseña?</h2>
          <p>Por seguridad no hay recuperación remota con un botón. El propietario puede restablecerla por SSH mediante <code>scripts/reset_master_password.py</code> en el VPS, como en el procedimiento que ya utilizaste.</p>
          <p className="form-note">La recuperación nunca debe revelar la clave Fernet ni enviar una nueva contraseña por correo electrónico.</p>
        </section>
      </>}
      {view==='about'&&<>
        <button className="back-link" onClick={()=>setView('settings')}><ArrowLeft size={18}/> Ajustes</button>
        <section className="compose-card settings-card alpanix-about">
          <img src="/alpanix-logo.png" alt="Logotipo ornamental de Alpanix"/>
          <h2>Alpanix · 1.1.9-alfa</h2><p className="form-note">Identificador de compilación: {ALPANIX_BUILD}</p>
          <p>Cliente privado de correo para Android. Bandeja unificada con IMAP/SMTP, firmas por dirección, adjuntos y almacenamiento WebDAV.</p>
          <p>La aplicación consulta un backend FastAPI en tu VPS. Las claves de buzones y las conexiones WebDAV se cifran en el servidor. El token de sesión se guarda en Android Keystore.</p>
          <p>Las notificaciones FCM son genéricas, sin remitentes, asuntos ni contenido. Gotify puede continuar como respaldo independiente.</p>
          <p className="form-note">Identidad visual: Inframundo Privado · Turquesa etrusco y dorado. Uso personal.</p>
        </section>
      </>}
      {view==='changelog'&&<>
        <button className="back-link" onClick={()=>setView('settings')}><ArrowLeft size={18}/> Ajustes</button>
        <section className="compose-card settings-card"><h2><History size={19}/> Registro de cambios</h2>
          <div className="change-entry"><h3>1.1.7-alfa · Noviembre 2026</h3><p>Sección de enlaces colapsada de manera predeterminada. Inicio rápido con restauración local, actualización de sesión en segundo plano y vista previa de bandeja cifrada con Android Keystore.</p></div>
          <div className="change-entry"><h3>1.1.6-alfa</h3><p>Paquete Android definitivo com.tlahuis.alpanix y apertura de enlaces desde correos mediante navegador integrado y externo.</p></div>
          <div className="change-entry"><h3>1.1.5-alfa · Noviembre 2026</h3><p>Paleta oficial y tipografía, importación filtrada, enlaces externos nativos, diagnóstico por cuenta, actividad, biometría y cambio de contraseña.</p></div>
          <div className="change-entry"><h3>1.1.4-alfa</h3><p>Identidad Alpanix, gestos de lectura/Papelera, importación inicial y diagnóstico de errores HTTP.</p></div>
          <div className="change-entry"><h3>1.1.9-alfa</h3><p>Conservación de la preferencia biométrica, botón de reintento cuando el diálogo se cancela y solicitud nativa de excepción de batería una sola vez tras acceder.</p></div>
          <div className="change-entry"><h3>1.1.8-alfa</h3><p>Enlaces plegados mediante React, gesto de desplazamiento visual, acceso a ajustes de batería y verificación de recursos compilados.</p></div>
          <div className="change-entry"><h3>1.1.3-alfa</h3><p>Notificaciones Android propias con Firebase Cloud Messaging y avisos genéricos. Gotify conserva su servicio.</p></div>
          <div className="change-entry"><h3>1.1.2-alfa y anteriores</h3><p>Explorador WebDAV, temas, avatares, firmas, adjuntos y sesiones protegidas.</p></div>
        </section>
      </>}
      {view==='activity'&&<>
        <button className="back-link" onClick={()=>setView('settings')}><ArrowLeft size={18}/> Ajustes</button>
        <section className="compose-card settings-card"><h2><ClipboardList size={20}/> Registro de actividad</h2>
          <p>Acciones y errores del VPS, sin contraseñas, tokens, cuerpos de mensajes ni archivos.</p>
          <div className="diagnostic-actions"><button type="button" onClick={()=>void loadActivity()}><RefreshCw size={16}/> Actualizar</button>
            <button type="button" onClick={()=>{if(window.confirm('¿Borrar el historial de actividad del VPS?'))void api.clearActivity().then(()=>setActivityEntries([])).catch(e=>setError(e.message));}}>Borrar historial</button></div>
          {activityEntries.length===0?<p className="form-note">Aún no se han registrado operaciones.</p>:activityEntries.map((event,i)=><div key={i} className="diagnostic-entry">
            <strong>{dateOf(event.timestamp)} · {event.status}</strong>
            <span>{event.action}</span>
          </div>)}
        </section>
      </>}
      {view==='settings-identity'&&<>
        <button className="back-link" onClick={()=>setView('settings')}><ArrowLeft size={18}/> Ajustes</button>
        <section className="compose-card settings-card"><h2><Pencil size={20}/> Personalizar cabecera</h2>
          <label>Nombre visible<input maxLength={28} value={brandName} onChange={e=>setBrandName(e.target.value)} placeholder="Alpanix"/></label>
          <label>Subtítulo fijo (opcional)<input maxLength={56} value={brandSubtitle} onChange={e=>setBrandSubtitle(e.target.value)} placeholder="Vacío = nombre de la pantalla actual"/></label>
          <p className="form-note">Estos cambios solo afectan el encabezado de este teléfono. No cambian tus direcciones de correo ni el identificador de la aplicación.</p>
          <button type="button" className="primary-btn" onClick={()=>{setBrandName('Alpanix');setBrandSubtitle('');}}>Restaurar nombre predeterminado</button>
        </section>
      </>}
      {view==='settings-domains'&&<>
        <button type="button" className="back-link" onClick={()=>{setView('inbox');void reload({silent:true});}}><ArrowLeft size={18}/> Volver a correos</button>
        <div className="section-heading"><div><span className="overline">CONFIGURACIÓN PRIVADA</span><h2>Cuentas y servidores</h2><p>Una configuración IMAP/SMTP por dominio; contraseña individual por buzón.</p></div></div>
        <form className="compose-card settings-card" onSubmit={saveDomain}>
          <h2><Server size={20}/> Configuración de dominios</h2>
          <label>Dominio a configurar
            <select value={domainEditId} onChange={e=>pickDomain(Number(e.target.value))}>
              <option value={0}>+ Añadir dominio</option>
              {domains.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label>Nombre del dominio
            <input required disabled={domainEditId!==0} value={domainForm.name} autoCapitalize="none" onChange={e=>setDomainForm(old=>({...old,name:e.target.value}))} placeholder="ejemplo.com"/>
          </label>
          <div className="settings-two">
            <label>Servidor IMAP<input required autoCapitalize="none" value={domainForm.imap_host} onChange={e=>setDomainForm(old=>({...old,imap_host:e.target.value}))} placeholder="mail.ejemplo.com"/></label>
            <label>Puerto IMAP<input required type="number" min="1" max="65535" value={domainForm.imap_port} onChange={e=>setDomainForm(old=>({...old,imap_port:Number(e.target.value)}))}/></label>
            <label>Servidor SMTP<input required autoCapitalize="none" value={domainForm.smtp_host} onChange={e=>setDomainForm(old=>({...old,smtp_host:e.target.value}))} placeholder="mail.ejemplo.com"/></label>
            <label>Puerto SMTP<input required type="number" min="1" max="65535" value={domainForm.smtp_port} onChange={e=>setDomainForm(old=>({...old,smtp_port:Number(e.target.value)}))}/></label>
          </div>
          <label>Seguridad de SMTP
            <select value={domainForm.smtp_security} onChange={e=>setDomainForm(old=>({...old,smtp_security:e.target.value as 'ssl'|'starttls',smtp_port:e.target.value==='ssl'?465:587}))}>
              <option value="ssl">SSL/TLS (465)</option><option value="starttls">STARTTLS (587)</option>
            </select>
          </label>
          <p className="form-note">IMAP utiliza SSL/TLS en 993. Cambiar estos servidores afecta a todas las cuentas de este dominio. El servidor valida las direcciones.</p>
          <button type="submit" className="primary-btn" disabled={busy}>{busy?'Guardando…':domainEditId?'Guardar cambios de servidor':'Crear dominio'}</button>
        </form>
        <section className="compose-card settings-card">
          <h2><Mail size={20}/> Configuración de cada cuenta</h2>
          <p>Edita el nombre del remitente, contraseña del buzón y firma guardada de cada dirección, sin modificar los servidores compartidos.</p>
          <div className="account-settings-list">
            {accounts.map(a=><button key={a.id} type="button" onClick={()=>void openAccountSettings(a.id)}>
              <Mail size={17}/><span><b>{a.display_name||a.address}</b><small>{a.address}</small></span><Settings size={17}/>
            </button>)}
          </div>
          <button type="button" className="primary-btn" onClick={()=>void openAccountSettings(0)}><Plus size={17}/> Añadir nueva dirección</button>
        </section>
        <div className="compose-card settings-card"><h2><Cloud size={20}/> Almacenamiento en nube</h2>
          <p>Conecta Infomaniak kDrive u otros servidores WebDAV HTTPS.</p>
          <button type="button" className="primary-btn" onClick={()=>void openCloudSettings()}><Cloud size={18}/> Administrar almacenamiento WebDAV</button>
        </div>
      </>}
      {view==='account-settings'&&<>
        <button type="button" className="back-link" onClick={()=>setView('settings')}><ArrowLeft size={18}/> Volver a Ajustes</button>
        <div className="section-heading"><div><span className="overline">IDENTIDAD POR DIRECCIÓN</span>
          <h2>Configuración de cuenta</h2><p>Nombre visible, contraseña y firma independiente de cada buzón.</p></div></div>
        <form className="compose-card settings-card" onSubmit={saveAccount}>
          <h2><Mail size={19}/> {accountEditId?'Editar dirección':'Añadir dirección'}</h2>
          <label>Cuenta a configurar
            <select value={accountEditId} onChange={e=>pickAccount(Number(e.target.value))}>
              <option value={0}>+ Nueva dirección</option>
              {accounts.map(a=><option key={a.id} value={a.id}>{a.address}</option>)}
            </select>
          </label>
          {accountEditId>0&&<div className="avatar-editor">
            {avatars[accountEditId]?<img className="avatar-editor-image" src={avatars[accountEditId]} alt="Foto de perfil de cuenta"/>:<div className="avatar-editor-fallback">{(accountForm.display_name||accountForm.address||'@').charAt(0).toUpperCase()}</div>}
            <div><strong>Imagen de perfil de la cuenta</strong><p className="form-note">Se muestra en la lista de cuentas. JPG, PNG o WebP, recortada y cifrada en el VPS.</p>
              <label className="avatar-upload">Elegir imagen<input type="file" accept="image/png,image/jpeg,image/webp" disabled={avatarBusy} onChange={e=>void chooseAvatar(e)}/></label>
              {avatars[accountEditId]&&<button type="button" className="avatar-remove" disabled={avatarBusy} onClick={()=>void removeAvatar()}>Quitar foto</button>}
            </div>
          </div>}
          <label>Dominio compartido
            <select value={accountForm.domain_id} required onChange={e=>setAccountForm(old=>({...old,domain_id:Number(e.target.value)}))}>
              <option value={0}>Selecciona un dominio</option>{domains.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label>Dirección de correo<input required type="email" autoCapitalize="none" value={accountForm.address} onChange={e=>setAccountForm(old=>({...old,address:e.target.value}))}/></label>
          <label>Nombre para mostrar al enviar<input value={accountForm.display_name} onChange={e=>setAccountForm(old=>({...old,display_name:e.target.value}))} placeholder="Nombre y apellido, empresa, etc."/></label>
          <label>{accountEditId?'Cambiar contraseña del buzón (opcional)':'Contraseña del buzón'}
            <input required={!accountEditId} type="password" autoComplete="new-password" value={accountForm.password} onChange={e=>setAccountForm(old=>({...old,password:e.target.value}))} placeholder={accountEditId?'Dejar en blanco para conservarla':'Contraseña IMAP/SMTP'}/>
          </label>
          <p className="form-note">La contraseña se guarda cifrada en el VPS. Si no la cambias, se conserva la actual.</p>
          <button className="primary-btn" disabled={busy||!domains.length}>{busy?'Guardando…':accountEditId?'Guardar identidad y credenciales':'Crear dirección'}</button>
        </form>
        {accountEditId>0&&<section className="compose-card settings-card">
          <h2><FileImage size={20}/> Firma de {accounts.find(a=>a.id===accountEditId)?.address||accountForm.address}</h2>
          <p>Se añade automáticamente al final de los mensajes enviados desde esta dirección y se muestra al redactar.</p>
          <label>Texto de firma<textarea rows={4} value={accountSignature.text} onChange={e=>setAccountSignature(old=>({...old,text:e.target.value}))} placeholder="Nombre, cargo, teléfono, datos de contacto…"/></label>
          <label>Imagen o tarjeta de firma (hasta 500 KB)
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={selectAccountSignatureFile}/>
          </label>
          {accountSignature.image&&<div className="account-signature-preview"><img src={accountSignature.image} alt="Firma gráfica"/>
            <button type="button" onClick={()=>setAccountSignature(old=>({...old,image:'',mime:''}))}><X size={15}/> Quitar imagen</button></div>}
          <div className="compose-signature-inline"><div className="compose-signature-label">Vista previa de firma</div>
            {accountSignature.text&&<div className="compose-signature-text">{accountSignature.text}</div>}
            {accountSignature.image&&<img src={accountSignature.image} alt="Imagen de firma"/>}
            {!accountSignature.text&&!accountSignature.image&&<p className="form-note">Sin firma configurada.</p>}
          </div>
          {accountSignatureInfo&&<p role="status" className="form-note">{accountSignatureInfo}</p>}
          <button type="button" className="primary-btn" onClick={()=>void saveAccountSignature()} disabled={accountSignatureBusy}>
            <Save size={17}/>{accountSignatureBusy?'Guardando…':'Guardar firma de esta cuenta'}
          </button>
        </section>}
      </>}
      {view==='settings-appearance'&&<section className="compose-card settings-card">
        <h2><Palette size={20}/> Apariencia · temas visuales</h2>
        <p>Se guarda en este dispositivo. Puedes cambiar de tema sin modificar los correos ni las cuentas.</p>
        <div className="theme-grid" role="group" aria-label="Temas de Alpanix">
          {THEMES.map(option=><button type="button" key={option.id} className={`theme-choice ${theme===option.id?'active':''}`}
            onClick={()=>setTheme(option.id)} aria-pressed={theme===option.id}>
            <span className="theme-swatches" style={{background:option.bg,borderColor:option.accent}}><i style={{background:option.accent}}/></span>
            <span><strong>{option.name}</strong><small>{option.description}{theme===option.id?' · Tema aplicado':''}</small></span>
            {theme===option.id&&<Check size={18}/>}
          </button>)}
        </div>
      </section>}
      {view==='settings-reading'&&<section className="compose-card settings-card">
        <h2><Eye size={20}/> Lectura y contenido HTML</h2>
        <p>El formato HTML y las imágenes incrustadas se muestran por defecto. Las imágenes remotas HTTPS también pueden cargarse automáticamente; podrían confirmar al remitente la apertura del correo.</p>
        <label className="reading-preference"><input type="checkbox" checked={autoRemoteImages} onChange={e=>setAutoRemoteImages(e.target.checked)}/>
          Cargar imágenes externas HTTPS automáticamente</label>
        <p className="form-note">Puedes bloquearlas individualmente al leer cualquier mensaje. Los scripts, formularios y otros contenidos activos permanecen bloqueados.</p>
      </section>}
      {view==='settings-notifications'&&<section className="compose-card settings-card">
        <h2><Bell size={20}/> Notificaciones privadas · Alpanix / Gotify</h2>
        <p>Puedes recibir avisos directamente de Alpanix mediante FCM. Google solo recibe el título «Alpanix» y el texto genérico «Tienes correo nuevo»; nunca remitentes, asuntos, direcciones ni contenido. Gotify permanece activo como respaldo durante las pruebas.</p>
        <div className="fcm-options">
          <h3><Bell size={18}/> Notificaciones propias de Alpanix (FCM)</h3>
          <p className="form-note">Estado Android: {fcmState==='registered'?'Registrado correctamente':fcmState==='permission-needed'?'Falta conceder permisos':fcmState==='registering'?'Registrando dispositivo…':fcmState==='error'?'Error de registro':fcmState==='not-supported'?'Solo Android': 'Sin activar'}.</p>
          <div className="cloud-actions">
            <button type="button" disabled={fcmBusy} onClick={()=>void enableFcm()}><Bell size={16}/> Activar notificaciones en Alpanix</button>
            <button type="button" disabled={fcmBusy} onClick={()=>void checkFcm()}><RefreshCw size={16}/> Consultar estado FCM</button>
            <button type="button" disabled={fcmBusy||!fcmStatus?.configured||fcmState!=='registered'} onClick={()=>void testFcm()}><Bell size={16}/> Enviar aviso genérico de prueba</button>
            <button type="button" disabled={fcmBusy} onClick={()=>void disableFcm()}><X size={16}/> Desactivar FCM en este teléfono</button>
          </div>
          {fcmStatus&&<p className="form-note">VPS: {fcmStatus.configured?'FCM configurado':'FCM pendiente de configurar'} · Dispositivos registrados: {fcmStatus.devices}. Google puede conocer metadatos de entrega, no el contenido del correo.</p>}
        </div>
        <div className="fcm-options">
          <h3><ShieldCheck size={18}/> Batería y segundo plano</h3>
          <p className="form-note">Alpanix solicita la excepción nativa una sola vez al acceder, si aún no está concedida. Si la rechazas, no volverá a preguntarlo automáticamente. Puedes solicitarla manualmente aquí. Los avisos FCM pueden llegar aunque Alpanix esté cerrada; la excepción no garantiza actividad permanente.</p>
          <p className="form-note">{battery===null?'Estado: no consultado':!battery.available?'Exención de optimización no disponible en este dispositivo':battery.exempt?'Estado: exenta de optimización estándar de batería':'Estado: optimización estándar de batería activa'}.</p>
          <div className="cloud-actions">
            <button type="button" disabled={batteryBusy||battery?.exempt} onClick={()=>void requestBattery()}><ShieldCheck size={16}/> Solicitar uso sin restricciones</button>
            <button type="button" onClick={()=>void openPowerSettings()}><Settings size={16}/> Abrir ajustes de batería de Alpanix</button>
            <button type="button" onClick={()=>void checkBattery()}><RefreshCw size={16}/> Actualizar estado de batería</button>
          </div>
          <p className="form-note">En Samsung, también puedes seleccionar Ajustes → Aplicaciones → Alpanix → Batería → Sin restricciones y añadir Alpanix a «Aplicaciones que nunca se suspenden».</p>
        </div>
        <h3><Bell size={18}/> Gotify (respaldo)</h3>
        <div className="cloud-actions">
          <button type="button" onClick={()=>void checkGotify()}><RefreshCw size={16}/> Consultar monitor</button>
          <button type="button" disabled={gotifyBusy || !gotifyStatus?.configured} onClick={()=>void testGotify()}><Bell size={16}/> Enviar notificación de prueba</button>
        </div>
        <p className="form-note">{gotifyStatus ? gotifyStatus.configured
          ? `Servidor configurado · ${gotifyStatus.accounts_initialized} cuentas inicializadas · revisión cada ${gotifyStatus.poll_seconds} segundos. El estado del proceso se comprueba en systemd.`
          : 'Gotify no está configurado en el VPS. Consulta la guía del parche 0.1.8.'
          : 'Pulsa Consultar monitor para conocer su configuración.'}</p>
      </section>}
      {view==='clouds'&&<>
        <div className="section-heading"><div><span className="overline">TUS NUBES</span><h2>Almacenamiento en nube</h2><p>Selecciona una conexión para ver y administrar sus archivos.</p></div></div>
        <div className="cloud-connections-list">
          {clouds.map(cloud=><button className="cloud-connection-card" type="button" key={cloud.id} onClick={()=>void openCloudBrowser(cloud.id)}>
            <span className="cloud-connection-icon"><Cloud size={28}/></span>
            <span className="cloud-connection-description"><strong>{cloud.name}</strong><small>{cloud.provider==='kdrive'?'Infomaniak kDrive':'Servidor WebDAV'} · {cloud.username}</small></span>
            <span aria-hidden="true" className="cloud-connection-chevron">›</span>
          </button>)}
          {busy&&<p role="status" className="form-note">Cargando conexiones de nube…</p>}
          {!busy&&!clouds.length&&<section className="compose-card settings-card"><h2><Cloud size={20}/> Sin nubes configuradas</h2><p>Agrega una conexión en Ajustes → Almacenamiento en nube.</p><button type="button" className="cloud-explore-button" onClick={()=>void openCloudSettings()}>Ir a Ajustes de nube</button></section>}
        </div>
      </>}
      {view==='cloud-settings'&&<>
        <button className="back-link" type="button" onClick={()=>setView('settings')}><ArrowLeft size={18}/> Ajustes</button>
        <div className="section-heading"><div><span className="overline">CONFIGURACIÓN</span><h2>Conexiones WebDAV</h2><p>Administra los servidores asociados a Alpanix.</p></div></div>
        <form className="compose-card settings-card" onSubmit={saveCloud}>
          <h2><Cloud size={19}/> {cloudEditId?'Editar conexión':'Añadir conexión WebDAV'}</h2>
          <label>Conexión
            <select value={cloudEditId} onChange={e=>pickCloud(Number(e.target.value))}>
              <option value={0}>+ Nueva conexión</option>
              {clouds.map(cloud=><option value={cloud.id} key={cloud.id}>{cloud.name}</option>)}
            </select>
          </label>
          <label>Proveedor
            <select value={cloudForm.provider} disabled={cloudEditId>0} onChange={e=>setCloudForm(old=>({...freshCloudForm(),provider:e.target.value as 'kdrive'|'webdav',name:e.target.value==='webdav'?'WebDAV personal':'kDrive personal'}))}>
              <option value="kdrive">Infomaniak kDrive</option><option value="webdav">Otro servidor WebDAV HTTPS</option>
            </select>
          </label>
          <label>Nombre visible<input required value={cloudForm.name} onChange={e=>setCloudForm(old=>({...old,name:e.target.value}))}/></label>
          {cloudForm.provider==='kdrive'?<label>ID de kDrive<input required inputMode="numeric" pattern="[0-9]+" value={cloudForm.drive_id} onChange={e=>setCloudForm(old=>({...old,drive_id:e.target.value}))} placeholder="Número después de /drive/ en Infomaniak"/></label>
            :<label>URL del servidor WebDAV HTTPS<input required type="url" autoCapitalize="none" value={cloudForm.server_url}
              onChange={e=>setCloudForm(old=>({...old,server_url:e.target.value}))} placeholder="https://nube.ejemplo.com/remote.php/dav/files/usuario/"/></label>}
          <label>Usuario del servidor WebDAV<input required autoCapitalize="none" value={cloudForm.username} onChange={e=>setCloudForm(old=>({...old,username:e.target.value}))} placeholder="cuenta@dominio.com"/></label>
          <label>{cloudEditId?'Nueva contraseña de aplicación (opcional)':'Contraseña específica de aplicación'}
            <input required={!cloudEditId} type="password" autoComplete="new-password" value={cloudForm.password} onChange={e=>setCloudForm(old=>({...old,password:e.target.value}))}/>
          </label>
          <p className="form-note">kDrive requiere su ID numérico; otros proveedores requieren la URL HTTPS de WebDAV. Solo se permiten servidores públicos por el puerto 443. Usa una contraseña específica de aplicación cuando tu proveedor lo permita. No se expone a Android después de guardarla.</p>
          <button className="primary-btn" type="submit" disabled={busy}>{busy?'Guardando…':cloudEditId?'Actualizar conexión':'Guardar conexión'}</button>
          {cloudEditId>0&&<button type="button" className="cloud-explore-button" onClick={()=>void openCloudBrowser(cloudEditId)} disabled={cloudBusy}>
            <FolderOpen size={18}/> Explorar archivos de esta nube
          </button>}
          {cloudEditId>0&&<div className="cloud-actions">
            <button type="button" disabled={busy} onClick={()=>void testCloud(cloudEditId)}><RefreshCw size={16}/> Probar conexión y listar carpeta raíz</button>
            <button type="button" className="danger-link" disabled={busy} onClick={()=>void removeCloud(cloudEditId)}><Trash2 size={16}/> Quitar conexión</button>
          </div>}
        </form>
      </>}
      {view==='cloud-browser'&&cloudBrowserId>0&&<>
        <button className="back-link" type="button" onClick={()=>{void openClouds();}}><ArrowLeft size={18}/> Mis nubes</button>
        <div className="section-heading"><div><span className="overline">EXPLORADOR WEBDAV</span><h2>{clouds.find(c=>c.id===cloudBrowserId)?.name||'Archivos en nube'}</h2><p>Administra carpetas y archivos de esta conexión.</p></div></div>
        <section className="compose-card settings-card cloud-browser">
          <h2><FolderOpen size={20}/> Explorador de archivos</h2>
          <p className="cloud-breadcrumb">/{cloudPath||'Raíz'}</p>
          <div className="cloud-browser-actions">
            <button type="button" disabled={cloudBusy} onClick={()=>void browseCloud(cloudBrowserId,cloudPath.split('/').slice(0,-1).join('/'))}><ArrowLeft size={16}/> Subir nivel</button>
            <button type="button" disabled={cloudBusy} onClick={()=>void browseCloud(cloudBrowserId,cloudPath)}><RefreshCw size={16}/> Actualizar</button>
            <button type="button" disabled={cloudBusy} onClick={newCloudFolder}><FolderPlus size={16}/> Nueva carpeta</button>
            <label className="cloud-upload-control"><Upload size={16}/> Subir archivo(s)
              <input type="file" multiple disabled={cloudBusy} onChange={e=>void uploadCloudFile(e)}/>
            </label>
          </div>
          {cloudBusy&&<p role="status">Procesando archivo o carpeta…</p>}
          {(cloudCheck?.entries||[]).map(entry=><div className="cloud-file-row" key={entry.path}>
            <button type="button" className="cloud-file-name" onClick={()=>entry.folder?void browseCloud(cloudBrowserId,entry.path):void downloadCloudFile(entry)}>
              {entry.folder?<FolderOpen size={20}/>:<FileText size={20}/>} <span>{entry.name}</span>
            </button>
            <div className="cloud-file-actions">
              {!entry.folder&&<button type="button" onClick={()=>void downloadCloudFile(entry)} disabled={cloudBusy} aria-label={`Descargar ${entry.name}`} title="Descargar"><Download size={16}/></button>}
              <button type="button" onClick={()=>renameCloudItem(entry)} disabled={cloudBusy} title="Renombrar"><Pencil size={16}/></button>
              <button type="button" onClick={()=>moveCloudItem(entry)} disabled={cloudBusy} title="Mover"><Move size={16}/></button>
              <button type="button" onClick={()=>deleteCloudItem(entry)} disabled={cloudBusy} title="Eliminar"><Trash2 size={16}/></button>
            </div>
          </div>)}
          {!cloudCheck?.entries.length&&<p className="form-note">La carpeta está vacía.</p>}
          <p className="form-note">Máximo 8 MiB para subir cada archivo y 20 MiB para descargar. Las eliminaciones se confirman.</p>
        </section>
      </>}
      {view==='cloud-settings'&&cloudCheck&&!cloudBrowserId&&<section className="compose-card settings-card"><h2><Check size={18}/> Conexión verificada</h2><p className="form-note">{cloudCheck.url}</p>
          <h3>Elementos en la raíz (máximo 100)</h3>
          <ul className="cloud-items">{cloudCheck.entries.map((entry,i)=><li key={`${entry.name}-${i}`}>{entry.folder?'📁':'📄'} {entry.name}</li>)}</ul>
          {!cloudCheck.entries.length&&<p>La carpeta raíz no devolvió elementos.</p>}
        </section>}
      {view==='detail'&&selected&&<>
        <button onClick={()=>{setView('inbox');void reload({silent:true});}} className="back-link"><ArrowLeft size={18}/> Volver a la carpeta</button>
        <article className="detail-card"><h2>{selected.subject||'(Sin asunto)'}</h2>
          <div className="from-block"><div className="avatar big">{displayName(selected.from).charAt(0).toUpperCase()||'?'}</div>
            <div className="from-meta"><strong>{displayName(selected.from)}</strong><small>{emailAddress(selected.from)}</small>
              <small><b>Para:</b> {selected.to||'No especificado'}</small>
              {selected.cc&&<small><b>CC:</b> {selected.cc}</small>}
              {selected.bcc&&<small><b>CCO (solo copia guardada):</b> {selected.bcc}</small>}
              <small>{dateShort(selected.date)}</small></div></div>
          <div className="detail-actions"><button onClick={()=>setRead(selected,!selected.is_read)}>{selected.is_read?<Mail size={16}/>:<MailOpen size={16}/>} {selected.is_read?'Marcar no leído':'Marcar leído'}</button>
            <button onClick={()=>startReply(false)}><ArrowLeft size={16}/> Responder</button><button onClick={()=>startReply(true)}><Send size={16}/> Reenviar</button></div>
          {selected.html_body&&<div className="view-toggle"><button className={preferHtml?'chosen':''} onClick={()=>setPreferHtml(true)}>HTML original</button>
            <button className={!preferHtml?'chosen':''} onClick={()=>setPreferHtml(false)} disabled={!selected.text_body}>Texto</button></div>}
          {preferHtml&&selected.html_body?<><label className="remote-images-toggle"><input type="checkbox" checked={remoteImages} onChange={e=>setRemoteImages(e.target.checked)}/> Mostrar imágenes externas HTTPS (pueden revelar tu dirección IP al remitente)</label>
              <SecureMailHtml html={selected.html_body} allowRemoteImages={remoteImages} onLinkError={setError}/></>
            :<div className="plain-body">{selected.text_body||'No hay versión de texto disponible.'}</div>}
          {selected.attachments?.length>0&&<div className="attachments"><FileText size={18}/> {selected.attachments.length} adjunto(s) identificados. Descarga pendiente.</div>}
        </article>
      </>}
      {view==='compose'&&<>
        <button onClick={()=>setView('inbox')} className="back-link"><ArrowLeft size={18}/> Volver</button>
        <form onSubmit={submit} className="compose-card compose-workspace">
          <div className="workspace-head"><div><span className="overline">ALPANIX · ESPACIO DE TRABAJO</span><h2>Redactar mensaje</h2><p>Composición privada · envío SMTP real</p></div>
            <button type="submit" className="workspace-send" disabled={busy||!sender}><Send size={17}/>{busy?'Enviando…':'Enviar'}</button></div>
          <div className="workspace-fields"><h3>Destinatarios y mensaje</h3>
          <label>De<select value={sender} onChange={e=>changeSender(Number(e.target.value))}>{accounts.map(a=><option key={a.id} value={a.id}>{a.address}</option>)}</select></label>
          <label>Para (varios separados por coma o punto y coma)<input required type="text" inputMode="email" autoCapitalize="none" value={to} onChange={e=>setTo(e.target.value)} placeholder="uno@dominio.com, dos@dominio.com"/></label>
          <div className="recipient-extras">
            <button type="button" aria-expanded={showCc} onClick={()=>setShowCc(v=>!v)}>{showCc?'Ocultar CC':'Añadir CC'}</button>
            <button type="button" aria-expanded={showBcc} onClick={()=>setShowBcc(v=>!v)}>{showBcc?'Ocultar CCO':'Añadir CCO'}</button>
          </div>
          {(showCc||!!cc)&&<label>CC · Con copia<input type="text" inputMode="email" autoCapitalize="none" value={cc} onChange={e=>setCc(e.target.value)} placeholder="Direcciones separadas por coma"/></label>}
          {(showBcc||!!bcc)&&<label>CCO · Copia oculta<input type="text" inputMode="email" autoCapitalize="none" value={bcc} onChange={e=>setBcc(e.target.value)} placeholder="Solo tú ves estos destinatarios"/></label>}
          <label>Asunto<input value={subject} onChange={e=>setSubject(e.target.value)}/></label>
          <label>Mensaje<textarea rows={12} className="workspace-editor" value={body} onChange={e=>setBody(e.target.value)} placeholder="Escribe aquí tu mensaje…" /></label>
          <div className="compose-signature-inline" aria-label="Firma que acompañará a este mensaje">
            <div className="compose-signature-label"><FileImage size={15}/> Firma automática de {accounts.find(a=>a.id===sender)?.address||'esta dirección'}</div>
            {signature.text||signature.image?<div className="compose-signature-content">
              {signature.text&&<div className="compose-signature-text">{signature.text}</div>}
              {signature.image&&<img src={signature.image} alt="Imagen de firma que se incluirá en el correo"/>}
            </div>:<div className="compose-signature-empty">Esta dirección todavía no tiene firma. Puedes configurarla en «Archivos y firma».</div>}
          </div>
          <div className="workspace-hint">La firma aparece al final como vista previa y se incluirá una sola vez al enviar. El mensaje conserva sus saltos de línea.</div></div>
          <div className="workspace-tools"><div className="workspace-tools-head"><Paperclip size={18}/><strong>Archivos y firma</strong></div>
          <div className="signature-options attachment-options">
            <label className="attachment-label workspace-attach"><Paperclip size={18}/> Seleccionar archivos adjuntos · varios archivos
              <input type="file" multiple onChange={selectAttachments} aria-label="Seleccionar adjuntos"/>
            </label>
            <p className="form-note">Hasta 8 MiB por archivo, máximo 20 MiB en total. Los documentos se envían como adjuntos normales, independientes de la firma CID.</p>
            {files.length>0&&<ul className="attachment-list">{files.map((f,i)=><li key={`${f.name}-${f.size}-${f.lastModified}`}>
              <span><FileText size={15}/> {f.name} ({(f.size/1024).toFixed(0)} KB)</span>
              <button type="button" title="Quitar adjunto" onClick={()=>setFiles(old=>old.filter((_,idx)=>idx!==i))}><X size={16}/></button>
            </li>)}</ul>}
          </div>
          <fieldset className="signature-options"><legend>Firma automática de esta dirección (sincronizada con el VPS)</legend>
            <label>Texto de firma<textarea rows={3} value={signature.text} onChange={e=>editSignature({...signature,text:e.target.value})} placeholder="Nombre, puesto, teléfono…"/></label>
            <label>Imagen de firma · PNG/JPEG/GIF/WebP, máximo 500 KB<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={selectSignature}/></label>
            {signature.image&&<div className="signature-preview"><img src={signature.image} alt="Vista previa de la firma"/><button type="button" onClick={()=>editSignature({...signature,image:'',mime:''})}><X size={15}/> Quitar imagen</button></div>}
            <p className="form-note"><FileImage size={14}/> La firma se guarda cifrada en tu VPS y también se conserva una copia local. Se inserta al final del mensaje, como se muestra arriba. La imagen viaja como MIME inline (CID); algunos proveedores también la clasifican como adjunto.</p>
            <button type="button" className="signature-save" disabled={signatureSaving||!sender} onClick={()=>{if(signatureTimer.current)clearTimeout(signatureTimer.current);void persistSignature(sender,signature)}}><Save size={16}/>{signatureSaving?'Guardando…':'Guardar firma ahora'}</button>
            {signatureSyncError&&<p className="signature-sync-error" role="status">{signatureSyncError}</p>}
          </fieldset>
          <button type="button" className="workspace-cloud-link" onClick={()=>void openClouds()}><Cloud size={16}/> Administrar kDrive</button>
          <p className="form-note">Envío SMTP real con versión HTML y texto cuando hay firma. CCO nunca se incluye en las cabeceras que reciben los destinatarios.</p>
          <button className="primary-btn send-btn" disabled={busy||!sender}><Send size={17}/>{busy?'Enviando…':'Enviar mensaje'}</button>
          </div>
        </form>
      </>}
    </main>
    {view!=='compose'&&<nav className="permanent-nav" aria-label="Navegación principal">
      <button type="button" className={view==='inbox'&&chosen===0?'selected':''} onClick={()=>void choose(0,'INBOX')}><Inbox size={19}/> Unificada</button>
      <button type="button" className={(view==='clouds'||view==='cloud-browser')?'selected':''} onClick={()=>void openClouds()}><Cloud size={19}/> Nube</button>
      <button type="button" className={(view==='settings'||view.startsWith('settings-')||view==='account-settings'||view==='cloud-settings')?'selected':''} onClick={()=>void manage()}><Settings size={19}/> Ajustes</button>
    </nav>}
    {view==='inbox'&&<button className="compose-fab" onClick={()=>newCompose(chosen||accounts[0]?.id||0)} disabled={!accounts.length}><PenSquare size={20}/> Redactar</button>}
  </div>;
}
