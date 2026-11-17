/** Diagnostics deliberately contains no credentials, email addresses, or payloads. */
export type DiagnosticEntry={time:string;endpoint:string;method:string;status:number;message:string;durationMs:number;suggestion:string};
const logs:DiagnosticEntry[]=[];
const listeners=new Set<(items:DiagnosticEntry[])=>void>();
const notify=()=>listeners.forEach(fn=>fn([...logs]));
export function getDiagnostics():DiagnosticEntry[]{return [...logs];}
export function clearDiagnostics(){logs.length=0;notify();}
export function subscribeDiagnostics(fn:(items:DiagnosticEntry[])=>void){listeners.add(fn);fn(getDiagnostics());return ()=>{listeners.delete(fn);};}
export function addDiagnostic(path:string,method:string,status:number,_message:string,durationMs:number){
  // Never log URL query strings (they may contain a mailbox identifier or folder name).
  const endpoint=path.split('?')[0].replace(/\/messages\/\d+\/[^/]+/g,'/messages/:id/:uid').replace(/\/accounts\/\d+/g,'/accounts/:id');
  const suggestion=status===504?'Agotó el tiempo de espera: revisa Nginx, el estado del backend y la conectividad IMAP.':status===502?'Error del servidor de correo o del proxy: comprueba los servicios en el VPS.':status===401?'La sesión expiró: inicia sesión nuevamente.':status===0?'Comprueba conexión a Internet, DNS y HTTPS.':status===429?'Espera antes de reintentar; hay límite de solicitudes.':'Consulta los registros del VPS si persiste.';
  const entry:DiagnosticEntry={time:new Date().toLocaleString('es-MX'),endpoint,method:method.toUpperCase(),status,message:status===0?'Sin conexión':`Error HTTP ${status}`,durationMs,suggestion};
  logs.push(entry);if(logs.length>75)logs.shift();notify();
}
