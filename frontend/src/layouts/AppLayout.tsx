import { useState } from 'react';
import { NavLink, Outlet, useParams, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  History,
  Trophy,
  Swords,
  Bell,
  Shield,
  Menu,
  X,
  BookOpen,
  Info,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { GroupProvider, useGroup } from '../context/GroupContext.js';
import { useAuth } from '../context/AuthContext.js';
import { groupApi } from '../services/endpoints.js';
import { cn } from '../utils/cn.js';
import { PageLoader } from '../components/Spinner.js';
import { Topbar } from './Topbar.js';

// Précharge le chunk de la page au survol/focus → navigation quasi instantanée.
const prefetchers: Record<string, () => Promise<unknown>> = {
  '': () => import('../pages/DashboardPage.js'),
  record: () => import('../pages/RecordMatchPage.js'),
  players: () => import('../pages/PlayersPage.js'),
  history: () => import('../pages/HistoryPage.js'),
  rankings: () => import('../pages/RankingsPage.js'),
  'head-to-head': () => import('../pages/HeadToHeadPage.js'),
  notifications: () => import('../pages/NotificationsPage.js'),
  guide: () => import('../pages/GuidePage.js'),
  about: () => import('../pages/AboutPage.js'),
  admin: () => import('../pages/AdminPage.js'),
};

function prefetchRoute(to: string) {
  void prefetchers[to]?.();
}

const navItems = [
  { to: '', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: 'record', label: 'Enregistrer un match', icon: PlusCircle, end: false },
  { to: 'players', label: 'Joueurs', icon: Users, end: false },
  { to: 'history', label: 'Historique', icon: History, end: false },
  { to: 'rankings', label: 'Classements', icon: Trophy, end: false },
  { to: 'head-to-head', label: 'Face-à-Face', icon: Swords, end: false },
  { to: 'notifications', label: 'Notifications', icon: Bell, end: false },
  { to: 'guide', label: "Guide d'utilisation", icon: BookOpen, end: false },
  { to: 'about', label: 'À propos', icon: Info, end: false },
];

function Sidebar({ groupName, onNavigate }: { groupName: string; onNavigate?: () => void }) {
  const { groupId, isAdmin } = useGroup();
  return (
    <div className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{groupName}</p>
          <p className="text-[11px] text-slate-500">Zéro Mensonge</p>
        </div>
      </div>

      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={`/g/${groupId}/${item.to}`.replace(/\/$/, '')}
          end={item.end}
          onClick={onNavigate}
          onMouseEnter={() => prefetchRoute(item.to)}
          onFocus={() => prefetchRoute(item.to)}
          className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}

      {isAdmin && (
        <NavLink
          to={`/g/${groupId}/admin`}
          onClick={onNavigate}
          onMouseEnter={() => prefetchRoute('admin')}
          onFocus={() => prefetchRoute('admin')}
          className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
        >
          <Shield className="h-5 w-5" />
          Administration
        </NavLink>
      )}
    </div>
  );
}

function LayoutInner() {
  const { groupId } = useGroup();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupApi.overview(groupId),
  });

  const groupName = group?.name ?? 'Groupe';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-surface-800 bg-surface-900/50 lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar groupName={groupName} />
        </div>
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-surface-800 bg-surface-900 animate-fade-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="btn-ghost absolute right-2 top-3 !p-2"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar groupName={groupName} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          menuIcon={<Menu className="h-5 w-5" />}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!groupId) return <Navigate to="/" replace />;

  const membership = user.memberships?.find(
    (m) => m.group.id === groupId && m.status === 'ACCEPTED',
  );
  if (!membership) {
    return <Navigate to="/select-group" replace />;
  }

  return (
    <GroupProvider groupId={groupId}>
      <LayoutInner />
    </GroupProvider>
  );
}
