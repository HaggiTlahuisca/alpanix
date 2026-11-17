export type FolderType = 'inbox' | 'all' | 'sent' | 'drafts' | 'starred' | 'trash' | 'spam';

export type ScreenView =
  | 'mail'
  | 'detalles'
  | 'redactar'
  | 'busqueda'
  | 'nube'
  | 'servidor'
  | 'config'
  | 'login'
  | 'contactos'
  | 'calendario';

export type ThemeId = 'tlahuis' | 'blueprint' | 'emerald' | 'amber' | 'violet' | 'monochrome';

export interface KdriveConfig {
  connected: boolean;
  webdavUrl: string;
  username: string;
  token: string;
  remoteFolder: string;
  used: string;
  total: string;
  lastSync?: string;
}

export interface AppBranding {
  appName: string;
  userName: string;
  userEmail: string;
  userRole: string;
  theme: ThemeId;
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: string;
  type: 'dwg' | 'pdf' | 'json' | 'image' | 'zip';
  url?: string;
}

export interface EmailSignature {
  name: string;
  role: string;
  location: string;
  website: string;
  avatar: string;
  verified?: boolean;
}

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  avatar?: string;
  recipient: string;
  subject: string;
  snippet: string;
  body: string;
  time: string;
  dateGroup: 'Hoy' | 'Ayer' | 'Esta semana' | 'Anteriores';
  read: boolean;
  starred: boolean;
  folder: FolderType;
  accentColor?: string;
  icon: string;
  iconBgColor?: string;
  badge?: string;
  tags?: string[];
  signature?: EmailSignature;
  attachments?: EmailAttachment[];
}

export interface DeviceInfo {
  id: string;
  name: string;
  status: 'connected' | 'idle' | 'offline';
  statusText: string;
  latency?: string;
  lastSync: string;
  ip: string;
}

export interface StorageStat {
  name: string;
  percentage: number;
  used: string;
  total: string;
  color: string;
  icon: string;
  status: 'connected' | 'disconnected';
  description: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'online' | 'busy' | 'offline';
  avatar: string;
  devices: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  type: 'sync' | 'architecture' | 'deployment' | 'meeting';
  location: string;
  participants: string[];
}
