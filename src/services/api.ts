import { Capacitor, registerPlugin } from '@capacitor/core';
import { addDiagnostic } from './diagnostics';

export const API_URL = 'https://api.tlahuisca.com.mx';
export type Account = { id: number; domain_id: number; address: string; display_name: string };
export type Domain = { id: number; name: string; imap_host: string; imap_port: number; smtp_host: string; smtp_port: number; smtp_security: 'ssl' | 'starttls' };
export type DomainConfig = Omit<Domain,'id'|'name'>;
export type AccountUpdate = { domain_id?:number; address?:string; display_name?:string; password?:string };
export type Mail = { account_id: number; uid: string; folder: string; from: string; to?: string; cc?: string; subject: string; date: string; message_id?: string; is_read: boolean };
export type Detail = Mail & { to: string; cc: string; bcc?: string; text_body: string | null; html_body: string | null; attachments: {filename?: string; content_type?: string; size?: number}[] };
export type MailFailure={account_id:number;address:string;error_code:string;error_detail:string};
export type Unified = { messages: Mail[]; failed_account_ids: number[]; failed_accounts?:MailFailure[]; accounts_queried: number; invalid_accounts_skipped?: number };
export type MonitorAccount = {id:number;address:string;imap_host:string;imap_port:number;last_checked:number;last_success:number;last_error:number;error_code:string;error_detail:string;failures:number};
export type ActivityEntry = {timestamp:number;kind:string;action:string;account_id:number|null;status:number};
export type Folder = { name: string; special_use: string | null; delimiter: string | null; unread_count: number; total_count: number; count_error?: boolean };
export type SendResult = { status: string; saved_to_sent: boolean; sent_folder: string | null; warning: string | null; recipient_count?: number };
export type CloudConnection = { id:number; provider:'kdrive'|'webdav'; name:string; drive_id:number|null; server_url:string|null; username:string };
export type CloudCreate = {provider:'kdrive'|'webdav';name:string;drive_id?:number;server_url?:string;username:string;password:string};
export type CloudUpdate = {name?:string;drive_id?:number;server_url?:string;username?:string;password?:string};
export type DavEntry = {name:string;folder:boolean;path:string};
export type CloudCheck = {status:string;url:string;path:string;entries:DavEntry[]};
export type SendData = { account_id: number; to: string; cc: string; bcc: string; subject: string; body: string; signature_text: string; signature_image_base64?: string; signature_image_mime?: string; body_html?: string };

// Cifrado AES-GCM con clave de Android Keystore. La variante web usa solo memoria;
// ni contraseñas maestras ni tokens se guardan en localStorage.
interface NativeSessionStorage {
  load(): Promise<{token: string | null}>;
  save(options:{token:string}): Promise<void>;
  clear(): Promise<void>;
  biometricStatus(): Promise<{available:boolean;enabled:boolean;hasSavedSession:boolean}>;
  enableBiometric(): Promise<void>;
  disableBiometric(): Promise<void>;
  savePreview(options:{payload:string}):Promise<void>;
  loadPreview():Promise<{payload:string|null}>;
}
const secureStorage = registerPlugin<NativeSessionStorage>('THSecureSession');
const onAndroid = Capacitor.isNativePlatform();

class Api {
 private token: string | null = null;
 private refreshing: Promise<void> | null = null;
 private lastRefresh = 0;
 hasSession():boolean { return Boolean(this.token); }
 // La vista previa no incluye contraseñas, cuerpos HTML/texto, adjuntos ni tokens.
 async loadInboxPreview():Promise<{accounts:Account[];messages:Mail[];updatedAt:number}|null>{
   if(!onAndroid || !this.token) return null;
   const {payload}=await secureStorage.loadPreview();
   if(!payload) return null;
   try {
     const x=JSON.parse(payload);
     if(x?.version!==1 || !Number.isFinite(x.updatedAt) || Date.now()-x.updatedAt>48*60*60*1000 || x.updatedAt>Date.now()+60000) return null;
     if(!Array.isArray(x.accounts)||!Array.isArray(x.messages)||x.accounts.length>100||x.messages.length>50) return null;
     if(!x.accounts.every((a:Account)=>Number.isInteger(a.id)&&a.id>0&&typeof a.address==='string'&&typeof a.display_name==='string'))return null;
     if(!x.messages.every((m:Mail)=>Number.isInteger(m.account_id)&&m.account_id>0&&typeof m.uid==='string'&&typeof m.folder==='string'&&typeof m.from==='string'&&typeof m.subject==='string'&&typeof m.date==='string'&&typeof m.is_read==='boolean'))return null;
     return {accounts:x.accounts,messages:x.messages,updatedAt:x.updatedAt};
   }catch{return null;}
 }
 async saveInboxPreview(accounts:Account[],messages:Mail[]):Promise<void>{
   if(!onAndroid||!this.token) return;
   // Metadatos reducidos y TTL de 48 h. Los cuerpos y contraseñas nunca se escriben.
   const slimAccounts=accounts.slice(0,100).map(a=>({id:a.id,domain_id:a.domain_id,address:String(a.address).slice(0,200),display_name:String(a.display_name||'').slice(0,200)}));
   const slimMessages=messages.slice(0,50).map(m=>({account_id:m.account_id,uid:String(m.uid).slice(0,150),folder:String(m.folder).slice(0,100),from:String(m.from||'').slice(0,250),to:String(m.to||'').slice(0,250),cc:String(m.cc||'').slice(0,250),subject:String(m.subject||'').slice(0,350),date:String(m.date||'').slice(0,100),is_read:Boolean(m.is_read)}));
   await secureStorage.savePreview({payload:JSON.stringify({version:1,updatedAt:Date.now(),accounts:slimAccounts,messages:slimMessages})});
 }
 private async forget(): Promise<void> {
   this.token = null;
   if(onAndroid) await secureStorage.clear().catch(()=>{});
 }
 async restore(): Promise<boolean> {
   if(!onAndroid) return false;
   const stored = await secureStorage.load();
   if (!stored.token) return false;
   // Nunca consultar el VPS antes de enseñar la interfaz. El refresh se inicia
   // de forma asíncrona desde App y precede a otras consultas al servidor.
   this.token=stored.token;
   return true;
 }
 async refresh(force=false):Promise<void> {
   if(!this.token) return;
   if(!force && Date.now()-this.lastRefresh < 24*60*60*1000) return;
   if(this.refreshing) return this.refreshing;
   this.refreshing = (async () => {
     const session=await this.call<{access_token:string;expires_in:number}>('/sessions/refresh',{method:'POST'});
     if(onAndroid) await secureStorage.save({token:session.access_token});
     this.token=session.access_token;
     this.lastRefresh=Date.now();
   })();
   try { await this.refreshing; } finally { this.refreshing=null; }
 }
 async call<T>(path: string, options: RequestInit = {}): Promise<T> {
   // /sessions/refresh revoca el token anterior. Evitar 401 falsos por
   // consultas concurrentes mientras se realiza esa rotación.
   if(path!=='/sessions/refresh'&&this.refreshing) await this.refreshing;
   const headers: Record<string,string> = {
     'Accept':'application/json', ...(options.body && !(options.body instanceof FormData) ? {'Content-Type':'application/json'} : {}),
     ...(this.token ? {'Authorization':`Bearer ${this.token}`} : {})
   };
   let response:Response;
   const started=Date.now();
   try { response=await fetch(API_URL+path,{...options,headers,cache:'no-store'}); }
   catch { addDiagnostic(path,options.method||'GET',0,'Conexión fallida',Date.now()-started);throw new Error('No hay conexión con la API. Comprueba Internet y HTTPS.'); }
   if(response.status===401 && this.token){ await this.forget(); throw new Error('Sesión caducada o revocada. Vuelve a iniciar sesión.'); }
   if(!response.ok){let message='Error HTTP '+response.status;try{const data=await response.json();if(typeof data.detail==='string')message=data.detail;}catch{}addDiagnostic(path,options.method||'GET',response.status,message,Date.now()-started);throw new Error(message);}
   return response.json() as Promise<T>;
 }
 async login(password:string) {
   const session=await this.call<{access_token:string}>('/sessions',{method:'POST',body:JSON.stringify({master_password:password})});
   if(onAndroid) {
     try { await secureStorage.save({token:session.access_token}); }
     catch { throw new Error('Android no pudo guardar la sesión cifrada. No se conservará el acceso al cerrar Alpanix.'); }
   }
   this.token=session.access_token;
   this.lastRefresh=Date.now();
 }
 async logout() {try{if(this.token) await this.call('/sessions/logout',{method:'POST'});}finally{await this.forget();}}
 biometrics(){return onAndroid?secureStorage.biometricStatus():Promise.resolve({available:false,enabled:false,hasSavedSession:false});}
 enableBiometrics(){if(!onAndroid)throw new Error('Disponible solo en Android');return secureStorage.enableBiometric();}
 disableBiometrics(){if(!onAndroid)throw new Error('Disponible solo en Android');return secureStorage.disableBiometric();}
 changeMasterPassword(current_password:string,new_password:string){return this.call<{status:string;other_sessions_revoked:boolean}>('/admin/change-master-password',{method:'POST',body:JSON.stringify({current_password,new_password})});}
 monitorAccounts(){return this.call<MonitorAccount[]>('/monitor/accounts');}
 activity(){return this.call<ActivityEntry[]>('/activity?limit=100');}
 clearActivity(){return this.call<{status:string}>('/activity',{method:'DELETE'});}
 getAvatar(id:number){return this.call<{data_url:string}>(`/accounts/${id}/avatar`);}
 putAvatar(id:number,data_url:string){return this.call<{status:string}>(`/accounts/${id}/avatar`,{method:'PUT',body:JSON.stringify({data_url})});}
 async cloudDownload(id:number,path:string):Promise<{bytes:string;filename:string}> {
   const token=this.token;
   if(!token)throw new Error('Sesión no iniciada');
   const res=await fetch(API_URL+`/clouds/${id}/download?path=${encodeURIComponent(path)}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
   if(res.status===401){await this.forget();throw new Error('Tu sesión ha caducado');}
   if(!res.ok){let e='Descarga fallida ('+res.status+')';try{e=(await res.json()).detail||e;}catch{}throw new Error(e);}
   const content=await res.blob();
   if(content.size>20*1024*1024)throw new Error('El archivo supera 20 MiB');
   const binary=new Uint8Array(await content.arrayBuffer());
   let raw='';for(let i=0;i<binary.length;i+=8192)raw+=String.fromCharCode(...binary.slice(i,i+8192));
   return {bytes:btoa(raw),filename:path.split('/').pop()||'archivo'};
 }
 cloudBrowse(id:number,path=''){return this.call<CloudCheck>(`/clouds/${id}/browse?path=${encodeURIComponent(path)}`);}
 cloudNewFolder(id:number,parent:string,name:string){return this.call<{status:string}>(`/clouds/${id}/folder`,{method:'POST',body:JSON.stringify({parent,name})});}
 cloudMove(id:number,source:string,destination_folder:string,new_name?:string,is_folder=false){return this.call<{status:string}>(`/clouds/${id}/move`,{method:'POST',body:JSON.stringify({source,destination_folder,new_name,is_folder})});}
 cloudRemove(id:number,path:string,is_folder=false){return this.call<{status:string}>(`/clouds/${id}/remove`,{method:'POST',body:JSON.stringify({path,is_folder})});}
 cloudUpload(id:number,folder:string,file:File){
   const data=new FormData();data.append('folder',folder);data.append('file',file,file.name);
   return this.call<{status:string}>(`/clouds/${id}/upload`,{method:'POST',body:data});
 }
 getSignature(id:number){return this.call<{text:string;image:string;mime:string;has_signature:boolean}>(`/accounts/${id}/signature`);}
 putSignature(id:number,data:{text:string;image:string;mime:string}){return this.call<{status:string}>(`/accounts/${id}/signature`,{method:'PUT',body:JSON.stringify(data)});}
 accounts(){return this.call<Account[]>('/accounts');}
 domains(){return this.call<Domain[]>('/domains');}
 createDomain(data:Omit<Domain,'id'>){return this.call<{id:number}>('/domains',{method:'POST',body:JSON.stringify(data)});}
 updateDomain(id:number,data:DomainConfig){return this.call<{status:string}>(`/domains/${id}`,{method:'PUT',body:JSON.stringify(data)});}
 createAccount(data:{domain_id:number;address:string;password:string;display_name:string}){return this.call<{id:number}>('/accounts',{method:'POST',body:JSON.stringify(data)});}
 updateAccount(id:number,data:AccountUpdate){return this.call<{status:string}>(`/accounts/${id}`,{method:'PATCH',body:JSON.stringify(data)});}
 unified(){return this.call<Unified>('/unified/messages?limit_per_account=30');}
 messages(id:number,folder='INBOX'){return this.call<Mail[]>(`/messages?account_id=${id}&folder=${encodeURIComponent(folder)}&limit=50`);}
 detail(m:Mail){return this.call<Detail>(`/messages/${m.account_id}/${encodeURIComponent(m.uid)}?folder=${encodeURIComponent(m.folder)}`);}
 folders(id:number){return this.call<Folder[]>(`/folders?account_id=${id}`);}
 setRead(m:Mail,is_read:boolean){return this.call<{is_read:boolean}>(`/messages/${m.account_id}/${encodeURIComponent(m.uid)}/read-status?folder=${encodeURIComponent(m.folder)}`,{method:'PATCH',body:JSON.stringify({is_read})});}
 deleteMessage(m:Mail){return this.call<{status:string}>(`/messages/${m.account_id}/${encodeURIComponent(m.uid)}?folder=${encodeURIComponent(m.folder)}`,{method:'DELETE'});}
 send(data:SendData){return this.call<SendResult>('/send',{method:'POST',body:JSON.stringify(data)});}
 sendAttachments(data:SendData, files:File[]){
   const body=new FormData();
   for(const [key,value] of Object.entries(data)) if(value!==undefined && value!==null) body.append(key,String(value));
   files.forEach(file=>body.append('files',file,file.name));
   return this.call<SendResult>('/send/attachments',{method:'POST',body});
 }
 fcmStatus(){return this.call<{configured:boolean;devices:number;notification:string;transport:string}>('/fcm/status');}
 registerFCMDevice(device_id:string,token:string){return this.call<{status:string}>('/fcm/devices',{method:'POST',body:JSON.stringify({device_id,token})});}
 unregisterFCMDevice(device_id:string){return this.call<{status:string}>(`/fcm/devices/${encodeURIComponent(device_id)}`,{method:'DELETE'});}
 fcmTest(){return this.call<{status:string;devices_notified:number;devices_failed:number}>('/fcm/test',{method:'POST'});}
 notificationStatus(){return this.call<{configured:boolean;delivery:string;accounts_initialized:number;poll_seconds:number}>('/notifications/status');}
 notificationTest(){return this.call<{status:string}>('/notifications/test',{method:'POST'});}
 clouds(){return this.call<CloudConnection[]>('/clouds');}
 createCloud(data:CloudCreate){return this.call<{id:number}>('/clouds',{method:'POST',body:JSON.stringify(data)});}
 updateCloud(id:number,data:CloudUpdate){return this.call<{status:string}>(`/clouds/${id}`,{method:'PATCH',body:JSON.stringify(data)});}
 deleteCloud(id:number){return this.call<{status:string}>(`/clouds/${id}`,{method:'DELETE'});}
 testCloud(id:number){return this.call<CloudCheck>(`/clouds/${id}/test`,{method:'POST'});}

}
export const api=new Api();
