import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Shield,
  Check,
  X,
  Copy,
  Trash2,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  ScrollText,
} from 'lucide-react';
import { useGroup } from '../context/GroupContext.js';
import { useAuth } from '../context/AuthContext.js';
import { adminApi, groupApi, playerApi } from '../services/endpoints.js';
import { extractError } from '../services/api.js';
import { PageHeader } from '../components/PageHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { Avatar } from '../components/Avatar.js';
import { formatDateTime } from '../utils/format.js';
import { describeAudit } from '../utils/audit.js';
import { cn } from '../utils/cn.js';
import type { Role } from '../types/index.js';

type JoinRequest = Awaited<ReturnType<typeof adminApi.requests>>[number];

const auditToneClasses: Record<string, string> = {
  positive: 'bg-brand-500/10 text-brand-600',
  negative: 'bg-red-500/10 text-red-500',
  neutral: 'bg-surface-800 text-slate-500',
};

export function AdminPage() {
  const { groupId, isAdmin } = useGroup();
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupApi.overview(groupId),
  });
  const { data: requests } = useQuery({
    queryKey: ['requests', groupId],
    queryFn: () => adminApi.requests(groupId),
  });
  const { data: players } = useQuery({
    queryKey: ['players', groupId],
    queryFn: () => playerApi.list(groupId),
  });
  const { data: audit } = useQuery({
    queryKey: ['audit', groupId],
    queryFn: () => adminApi.audit(groupId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['requests', groupId] });
    queryClient.invalidateQueries({ queryKey: ['players', groupId] });
    queryClient.invalidateQueries({ queryKey: ['audit', groupId] });
  };

  // Retire la demande de la liste immédiatement (mise à jour optimiste).
  const removeRequestOptimistically = async (id: string) => {
    await queryClient.cancelQueries({ queryKey: ['requests', groupId] });
    const previous = queryClient.getQueryData<JoinRequest[]>(['requests', groupId]);
    queryClient.setQueryData<JoinRequest[]>(['requests', groupId], (old) =>
      old?.filter((r) => r.id !== id),
    );
    return { previous };
  };

  const restoreRequests = (ctx?: { previous?: JoinRequest[] }) => {
    if (ctx?.previous) queryClient.setQueryData(['requests', groupId], ctx.previous);
  };

  const acceptM = useMutation({
    mutationFn: (id: string) => adminApi.accept(groupId, id),
    onMutate: removeRequestOptimistically,
    onSuccess: () => toast.success('Demande acceptée'),
    onError: (e, _id, ctx) => {
      restoreRequests(ctx);
      toast.error(extractError(e));
    },
    onSettled: invalidate,
  });
  const rejectM = useMutation({
    mutationFn: (id: string) => adminApi.reject(groupId, id),
    onMutate: removeRequestOptimistically,
    onSuccess: () => toast.success('Demande refusée'),
    onError: (e, _id, ctx) => {
      restoreRequests(ctx);
      toast.error(extractError(e));
    },
    onSettled: invalidate,
  });
  const roleM = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => adminApi.setRole(groupId, id, role),
    onSuccess: async () => {
      toast.success('Rôle mis à jour');
      invalidate();
      await refreshUser();
    },
    onError: (e) => toast.error(extractError(e)),
  });
  const removeM = useMutation({
    mutationFn: (id: string) => adminApi.removeMember(groupId, id),
    onSuccess: () => {
      toast.success('Joueur supprimé');
      invalidate();
    },
    onError: (e) => toast.error(extractError(e)),
  });
  const updateM = useMutation({
    mutationFn: () => groupApi.update(groupId, { name: name.trim() }),
    onSuccess: () => {
      toast.success('Groupe mis à jour');
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      setName('');
    },
    onError: (e) => toast.error(extractError(e)),
  });

  if (!isAdmin) return <Navigate to={`/g/${groupId}`} replace />;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié !');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Administration" subtitle="Gérez votre groupe, vos membres et vos matchs." />

      {/* Invitation */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <UserCheck className="h-5 w-5 text-brand-600" /> Invitation
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Code d'invitation</label>
            <div className="flex gap-2">
              <input readOnly value={group?.inviteCode ?? ''} className="input font-mono" />
              <button onClick={() => copy(group?.inviteCode ?? '')} className="btn-secondary shrink-0">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="label">Lien d'invitation</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={`${window.location.origin}/join-group`}
                className="input text-sm"
              />
              <button
                onClick={() => copy(`${window.location.origin}/join-group`)}
                className="btn-secondary shrink-0"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demandes d'inscription */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Shield className="h-5 w-5 text-brand-600" /> Demandes d'inscription
          {(requests?.length ?? 0) > 0 && (
            <span className="badge bg-brand-500/15 text-brand-700">{requests!.length}</span>
          )}
        </h2>
        {!requests?.length ? (
          <p className="py-4 text-sm text-slate-500">Aucune demande en attente.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-surface-850/50 p-3">
                <Avatar name={r.pseudo} src={r.photoUrl} size="md" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{r.pseudo}</p>
                  <p className="text-xs text-slate-500">{r.user.name} · {r.user.email}</p>
                </div>
                <button
                  onClick={() => acceptM.mutate(r.id)}
                  className="btn-primary !px-3 !py-2"
                  aria-label="Accepter"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => rejectM.mutate(r.id)}
                  className="btn-danger !px-3 !py-2"
                  aria-label="Refuser"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membres */}
      <div className="card p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Membres</h2>
        <div className="space-y-2">
          {players?.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl bg-surface-850/50 p-3">
              <Avatar name={p.pseudo} src={p.photoUrl} size="md" />
              <div className="flex-1">
                <p className="font-medium text-slate-900">{p.pseudo}</p>
                <p className="text-xs text-slate-500">
                  {p.role === 'ADMIN' ? 'Administrateur' : 'Joueur'} · {p.matchesPlayed} matchs
                </p>
              </div>
              {p.role === 'PLAYER' ? (
                <button
                  onClick={() => roleM.mutate({ id: p.id, role: 'ADMIN' })}
                  className="btn-ghost !px-2 !py-1.5 text-xs"
                >
                  <ShieldCheck className="h-4 w-4" /> Promouvoir
                </button>
              ) : (
                <button
                  onClick={() => roleM.mutate({ id: p.id, role: 'PLAYER' })}
                  className="btn-ghost !px-2 !py-1.5 text-xs"
                >
                  <ShieldOff className="h-4 w-4" /> Rétrograder
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm(`Supprimer ${p.pseudo} du groupe ?`)) removeM.mutate(p.id);
                }}
                className="btn-ghost !p-1.5 text-red-400"
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Paramètres du groupe */}
      <div className="card p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Paramètres du groupe</h2>
        <label className="label">Nom du groupe</label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={group?.name}
            className="input"
          />
          <button
            onClick={() => updateM.mutate()}
            disabled={!name.trim() || updateM.isPending}
            className="btn-primary shrink-0"
          >
            Enregistrer
          </button>
        </div>
      </div>

      {/* Journal d'audit */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <ScrollText className="h-5 w-5 text-brand-600" /> Journal des actions
        </h2>
        {!audit?.length ? (
          <EmptyState icon={ScrollText} title="Aucune action" />
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {audit.map((log) => {
              const { label, Icon, tone } = describeAudit(log.action);
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-surface-850/60"
                >
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', auditToneClasses[tone])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-slate-800">{label}</span>
                  <span className="ml-auto whitespace-nowrap text-xs text-slate-500">
                    {log.actor?.name ?? 'Système'} · {formatDateTime(log.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
