import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BellRing,
  Swords,
  UserPlus,
  Crown,
  Award,
  BarChart3,
  Check,
  X,
  CheckCheck,
  Volume2,
  VolumeX,
  Play,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGroup } from '../context/GroupContext.js';
import { notificationApi } from '../services/endpoints.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { PageHeader } from '../components/PageHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { CardSkeleton } from '../components/Skeleton.js';
import { relativeTime } from '../utils/format.js';
import {
  ensureNotificationPermission,
  primeAudio,
  playNotificationSound,
  isSoundEnabled,
  setSoundEnabled,
} from '../utils/notify.js';
import { cn } from '../utils/cn.js';
import type { AppNotification, NotificationType } from '../types/index.js';

interface NotificationsData {
  items: AppNotification[];
  unread: number;
}

function NotificationControls() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied',
  );
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  useEffect(() => {
    if (supported) setPermission(Notification.permission);
  }, [supported]);

  return (
    <div className="card mb-4 flex flex-col gap-3 border-brand-600/40 bg-brand-500/5 p-4 sm:flex-row sm:items-center">
      <div className="rounded-xl bg-brand-500/15 p-2.5 text-brand-600">
        <BellRing className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-900">Alertes en temps réel</p>
        <p className="text-sm text-slate-600">
          {!supported
            ? "Votre navigateur ne gère pas les notifications système, mais le son fonctionne."
            : permission === 'denied'
              ? 'Notifications bloquées : autorisez-les dans les réglages du navigateur. Le son reste disponible.'
              : permission === 'granted'
                ? 'Notifications activées : son + bannière à chaque nouveau match ou demande.'
                : 'Recevez une alerte sonore et une bannière à chaque nouveau match ou demande.'}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {supported && permission === 'default' && (
          <button
            onClick={async () => {
              primeAudio();
              setPermission(await ensureNotificationPermission());
            }}
            className="btn-primary"
          >
            Autoriser
          </button>
        )}
        <button
          onClick={() => {
            primeAudio();
            playNotificationSound();
          }}
          className="btn-secondary"
        >
          <Play className="h-4 w-4" /> Tester le son
        </button>
        <button
          onClick={() => {
            const next = !soundOn;
            setSoundEnabled(next);
            setSoundOn(next);
            if (next) {
              primeAudio();
              playNotificationSound();
            }
          }}
          className="btn-ghost"
          aria-label={soundOn ? 'Couper le son' : 'Activer le son'}
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {soundOn ? 'Son activé' : 'Son coupé'}
        </button>
      </div>
    </div>
  );
}

const icons: Record<NotificationType, LucideIcon> = {
  NEW_MATCH: Swords,
  NEW_PLAYER: UserPlus,
  NEW_NUMBER_ONE: Crown,
  NEW_RECORD: Award,
  RANKING_CHANGED: BarChart3,
  JOIN_REQUEST: UserPlus,
  REQUEST_ACCEPTED: Check,
  REQUEST_REJECTED: X,
};

export function NotificationsPage() {
  const { groupId } = useGroup();
  const queryClient = useQueryClient();
  const { data, isLoading } = useNotifications(groupId);

  const notificationsKey = ['notifications', groupId];

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(groupId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });
      const previous = queryClient.getQueryData<NotificationsData>(notificationsKey);
      if (previous) {
        queryClient.setQueryData<NotificationsData>(notificationsKey, {
          items: previous.items.map((n) => ({ ...n, read: true })),
          unread: 0,
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notificationsKey, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(groupId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });
      const previous = queryClient.getQueryData<NotificationsData>(notificationsKey);
      if (previous) {
        queryClient.setQueryData<NotificationsData>(notificationsKey, {
          items: previous.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unread: Math.max(0, previous.unread - 1),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notificationsKey, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle="Tout ce qui se passe dans votre groupe, en temps réel."
        action={
          (data?.unread ?? 0) > 0 ? (
            <button onClick={() => markAll.mutate()} className="btn-secondary">
              <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
            </button>
          ) : undefined
        }
      />

      <NotificationControls />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState icon={Bell} title="Aucune notification" description="Vous serez prévenu à chaque nouveau match ou record." />
      ) : (
        <div className="space-y-2">
          {data.items.map((n) => {
            const Icon = icons[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markOne.mutate(n.id)}
                className={cn(
                  'card flex cursor-pointer items-start gap-3 p-4 transition-colors',
                  !n.read && 'border-brand-600/40 bg-brand-500/5',
                )}
              >
                <div className="rounded-xl bg-surface-800 p-2.5 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{n.title}</p>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{relativeTime(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
