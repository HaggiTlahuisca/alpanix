import { Capacitor, registerPlugin } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { AppLauncher } from '@capacitor/app-launcher';

const androidBrowser = registerPlugin<{open(options:{url:string}):Promise<void>}>('THExternalLink');

/** Sólo se aceptan URLs web absolutas; nunca se permite la navegación en la WebView principal. */
function validUrl(input: string): string {
  let url: URL;
  try { url = new URL(input.trim()); }
  catch { throw new Error('El enlace del correo no es una dirección web válida.'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error('Solo se abren enlaces HTTP/HTTPS sin credenciales incrustadas.');
  }
  return url.href;
}

/** Navegador externo predeterminado, conservando el correo abierto en Alpanix. */
export async function openExternal(input: string): Promise<void> {
  const url = validUrl(input);
  if (!Capacitor.isNativePlatform()) {
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) throw new Error('No se pudo abrir la pestaña del navegador.');
    return;
  }
  // Android ACTION_VIEW: sin WebView propia y sin compartir datos de la sesión.
  try {
    await androidBrowser.open({ url });
    return;
  } catch {
    // Alternativa nativa del propio ecosistema Capacitor.
    try {
      const result = await AppLauncher.openUrl({ url });
      if (result.completed) return;
    } catch { /* Intentar Chrome Custom Tabs como último recurso. */ }
    await Browser.open({ url });
  }
}

/** Browser de Capacitor: Custom Tabs Android, aislada de la WebView que muestra el correo. */
export async function openInAppBrowser(input: string): Promise<void> {
  const url = validUrl(input);
  if (!Capacitor.isNativePlatform()) return openExternal(url);
  try { await Browser.open({ url, toolbarColor: '#121212' }); }
  catch { await openExternal(url); }
}
