import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationApi } from '../services/endpoints.js';
import { getSocket } from '../services/socket.js';
import {
  announceNotification,
  ensureNotificationPermission,
  primeAudio,
} from '../utils/notify.js';
import type { AppNotification } from '../types/index.js';

// Ensemble persistant des notifications déjà signalées (toast + son), quel que
// soit le canal (socket temps réel ou rafraîchissement de secours). Évite tout
// double signalement, y compris quand le hook est monté plusieurs fois.
const announcedIds = new Set<string>();

function announceOnce(notification: AppNotification): void {
  if (announcedIds.has(notification.id)) return;
  announcedIds.add(notification.id);
  toast(notification.title, { icon: '🔔' });
  announceNotification(notification.title, notification.message);
}

export function useNotifications(groupId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', groupId],
    queryFn: () => notificationApi.list(groupId),
    enabled: Boolean(groupId),
    // Filet de sécurité : si le temps réel tombe, les notifications remontent
    // malgré tout rapidement, sans rechargement manuel de la page.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Débloque l'audio et demande la permission au premier geste utilisateur.
  useEffect(() => {
    void ensureNotificationPermission();

    const onFirstGesture = () => {
      primeAudio();
      void ensureNotificationPermission();
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true });
    window.addEventListener('keydown', onFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, []);

  // Rejoint la room du groupe et écoute les notifications temps réel. Le socket
  // peut ne pas être encore connecté au montage : on réessaie jusqu'à l'obtenir.
  useEffect(() => {
    if (!groupId) return;
    let socket = getSocket();
    let cleanup: (() => void) | undefined;

    const attach = () => {
      if (!socket) return false;
      const join = () => socket!.emit('group:join', groupId);
      join();

      const onConnect = () => {
        join();
        // À la reconnexion, on rattrape les notifications éventuellement manquées.
        queryClient.invalidateQueries({ queryKey: ['notifications', groupId] });
      };

      const onNew = (notification: AppNotification) => {
        if (notification.groupId !== groupId) return;
        announceOnce(notification);
        queryClient.invalidateQueries({ queryKey: ['notifications', groupId] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', groupId] });
        queryClient.invalidateQueries({ queryKey: ['matches', groupId] });
        queryClient.invalidateQueries({ queryKey: ['rankings', groupId] });
        queryClient.invalidateQueries({ queryKey: ['players', groupId] });
      };

      socket.on('connect', onConnect);
      socket.on('notification:new', onNew);
      cleanup = () => {
        socket!.emit('group:leave', groupId);
        socket!.off('connect', onConnect);
        socket!.off('notification:new', onNew);
      };
      return true;
    };

    if (!attach()) {
      // Socket pas encore prêt : on interroge brièvement jusqu'à sa disponibilité.
      const timer = setInterval(() => {
        socket = getSocket();
        if (attach()) clearInterval(timer);
      }, 500);
      return () => {
        clearInterval(timer);
        cleanup?.();
      };
    }

    return () => cleanup?.();
  }, [groupId, queryClient]);

  // Signale par le son/toast les nouvelles notifications arrivées via un
  // rafraîchissement (polling de secours) quand le temps réel est indisponible.
  const initializedGroup = useRef<string | null>(null);
  useEffect(() => {
    const items = query.data?.items;
    if (!items || !groupId) return;

    if (initializedGroup.current !== groupId) {
      // Premier chargement de ce groupe : on mémorise sans rien signaler.
      items.forEach((n) => announcedIds.add(n.id));
      initializedGroup.current = groupId;
      return;
    }

    items
      .filter((n) => !n.read && n.groupId === groupId)
      .reverse()
      .forEach(announceOnce);
  }, [query.data, groupId]);

  return query;
}
