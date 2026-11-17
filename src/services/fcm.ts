/** Notificaciones privadas: FCM transporta SOLO un aviso genérico.
 * Nunca se envían remitentes, asuntos, cuerpos, direcciones o contraseñas a Google.
 * Los mensajes reales se obtienen de FastAPI tras abrir THcorreo.
 */
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from './api';

export type PushState = 'not-supported' | 'off' | 'permission-needed' | 'registering' | 'registered' | 'error';
type Callbacks = { onState: (state: PushState) => void; onIncoming: () => void; onOpened: () => void };

const ID_KEY = 'thcorreo.fcm.device.v1';
const DISABLED_KEY = 'thcorreo.fcm.disabled.v1';
const isAndroid = () => Capacitor.getPlatform() === 'android';
let handles: PluginListenerHandle[] = [];
let callbacks: Callbacks | null = null;
let installed = false;

function deviceId(): string {
  const saved = localStorage.getItem(ID_KEY);
  if (saved && /^[a-z0-9_-]{12,100}$/i.test(saved)) return saved;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const id = 'th-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(ID_KEY, id);
  return id;
}

export async function startPush(opts: Callbacks): Promise<void> {
  callbacks = opts;
  if (!isAndroid()) {opts.onState('not-supported');return;}
  if (installed) return;
  installed = true;
  try {
    // Los listeners se instalan ANTES de register(): evita perder el token FCM.
    handles = [
      await PushNotifications.addListener('registration', async (token) => {
        try {
          if (localStorage.getItem(DISABLED_KEY) === 'true') return;
          await api.registerFCMDevice(deviceId(), token.value);
          callbacks?.onState('registered');
        } catch {
          callbacks?.onState('error');
        }
      }),
      await PushNotifications.addListener('registrationError', () => callbacks?.onState('error')),
      await PushNotifications.addListener('pushNotificationReceived', () => callbacks?.onIncoming()),
      await PushNotifications.addListener('pushNotificationActionPerformed', () => callbacks?.onOpened()),
    ];
    const perms = await PushNotifications.checkPermissions();
    if (localStorage.getItem(DISABLED_KEY) === 'true') {
      callbacks?.onState('off');
    } else if (perms.receive === 'granted') {
      callbacks?.onState('registering');
      await PushNotifications.register();
    } else {
      callbacks?.onState('permission-needed');
    }
  } catch {
    callbacks?.onState('error');
  }
}

export async function enablePush(): Promise<void> {
  if (!isAndroid()) throw new Error('FCM solo se habilita en Android.');
  const result = await PushNotifications.requestPermissions();
  if (result.receive !== 'granted') {
    callbacks?.onState('permission-needed');
    throw new Error('Android no concedió permiso para notificaciones.');
  }
  localStorage.removeItem(DISABLED_KEY);
  callbacks?.onState('registering');
  await PushNotifications.register();
}

export async function disablePush(): Promise<void> {
  localStorage.setItem(DISABLED_KEY, 'true');
  if (isAndroid()) await api.unregisterFCMDevice(deviceId()).catch(() => {});
  callbacks?.onState('off');
}

export async function stopPush(unregister = false): Promise<void> {
  if (unregister && isAndroid()) {
    localStorage.setItem(DISABLED_KEY, 'true');
    // Desregistrar en el VPS antes de borrar la sesión y sin exponer el token.
    await api.unregisterFCMDevice(deviceId()).catch(() => {});
  }
  const old = handles;
  handles = [];
  callbacks = null;
  installed = false;
  await Promise.all(old.map(h => h.remove().catch(() => {})));
}
