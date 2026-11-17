import {Capacitor,registerPlugin} from '@capacitor/core';
const externalLink=registerPlugin<{open(options:{url:string}):Promise<void>}>('THExternalLink');
/** Abre en el navegador predeterminado: no habilitamos navegación externa en el WebView de correo. */
export async function openExternal(input:string):Promise<void>{
  let url:URL;
  try{url=new URL(input);}catch{throw new Error('Enlace inválido');}
  if(!['http:','https:'].includes(url.protocol)||!url.hostname||url.username||url.password){
    throw new Error('Solo se permiten enlaces HTTP/HTTPS sin credenciales.');
  }
  if(Capacitor.isNativePlatform()){
    await externalLink.open({url:url.href});return;
  }
  const tab=window.open(url.href,'_blank','noopener,noreferrer');
  if(!tab)throw new Error('El navegador bloqueó la apertura del enlace.');
}
