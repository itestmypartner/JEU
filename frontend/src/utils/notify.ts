// Notifications navigateur robustes : permission, son et bannière système.

let audioContext: AudioContext | null = null;
let permissionRequested = false;

const SOUND_PREF_KEY = 'zmj:sound';

function supportsNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/// Le son est activé par défaut ; l'utilisateur peut le couper.
export function isSoundEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem(SOUND_PREF_KEY) !== 'off';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SOUND_PREF_KEY, enabled ? 'on' : 'off');
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

function scheduleChime(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  [880, 1174.66].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.09);
    osc.connect(gain);
    osc.start(now + i * 0.09);
    osc.stop(now + 0.55);
  });
}

/// Demande la permission d'afficher des notifications (idempotent, silencieux).
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!supportsNotifications()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  if (permissionRequested) return Notification.permission;
  permissionRequested = true;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/// Débloque l'audio (les navigateurs exigent un geste utilisateur au préalable).
export function primeAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume();
  }
}

/// Joue un petit carillon synthétisé (aucun fichier requis, jamais bloquant).
/// Reprend d'abord le contexte audio si nécessaire, puis programme le son :
/// jouer pendant que le contexte est « suspended » ne produit aucun son.
export function playNotificationSound(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => scheduleChime(ctx)).catch(() => undefined);
    } else {
      scheduleChime(ctx);
    }
  } catch {
    // Le son est un bonus : on n'interrompt jamais le flux si l'audio échoue.
  }
}

/// Affiche une bannière système si la permission est accordée.
export function showBrowserNotification(title: string, body?: string): void {
  if (!supportsNotifications() || Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'zmj-notification',
      renotify: true,
    } as NotificationOptions);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Certains navigateurs limitent les notifications hors HTTPS ; on ignore.
  }
}

/// Signale une nouvelle notification : son + bannière système (best-effort).
export function announceNotification(title: string, body?: string): void {
  playNotificationSound();
  showBrowserNotification(title, body);
}
