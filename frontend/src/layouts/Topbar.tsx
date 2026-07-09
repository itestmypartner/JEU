import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Search, UserCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useGroup } from '../context/GroupContext.js';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { searchApi } from '../services/endpoints.js';
import { Avatar } from '../components/Avatar.js';
import { relativeTime } from '../utils/format.js';
import { cn } from '../utils/cn.js';

function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function useOutsideClick<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

function GlobalSearch() {
  const { groupId } = useGroup();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false));
  const navigate = useNavigate();
  const debouncedQ = useDebouncedValue(q.trim(), 200);

  const { data } = useQuery({
    queryKey: ['search', groupId, debouncedQ],
    queryFn: () => searchApi.search(groupId, debouncedQ),
    enabled: debouncedQ.length >= 1,
  });

  const hasResults = data && (data.players.length || data.matches.length || data.teams.length);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher joueur, équipe, match..."
          className="input !py-2 pl-9"
        />
      </div>

      {open && q.trim().length >= 1 && (
        <div className="card absolute z-30 mt-2 max-h-96 w-full overflow-y-auto p-2 animate-scale-in">
          {!hasResults && <p className="px-3 py-4 text-sm text-slate-500">Aucun résultat</p>}

          {data && data.players.length > 0 && (
            <div className="mb-1">
              <p className="px-3 py-1 text-xs font-semibold uppercase text-slate-500">Joueurs</p>
              {data.players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    navigate(`/g/${groupId}/players/${p.id}`);
                    setOpen(false);
                    setQ('');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-800"
                >
                  <Avatar name={p.pseudo} src={p.photoUrl} size="sm" />
                  <span className="text-slate-800">{p.pseudo}</span>
                  <span className="ml-auto text-xs text-slate-500">{p.wins} V</span>
                </button>
              ))}
            </div>
          )}

          {data && data.teams.length > 0 && (
            <div className="mb-1">
              <p className="px-3 py-1 text-xs font-semibold uppercase text-slate-500">Équipes</p>
              {data.teams.map((t) => (
                <div key={t} className="px-3 py-1.5 text-sm text-slate-700">
                  {t}
                </div>
              ))}
            </div>
          )}

          {data && data.matches.length > 0 && (
            <div>
              <p className="px-3 py-1 text-xs font-semibold uppercase text-slate-500">Matchs</p>
              {data.matches.slice(0, 6).map((m) => (
                <div key={m.id} className="px-3 py-1.5 text-sm text-slate-700">
                  {m.player1.pseudo}{' '}
                  <span className="font-semibold text-brand-600">
                    {m.score1}-{m.score2}
                  </span>{' '}
                  {m.player2.pseudo}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const { groupId } = useGroup();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false));
  const { data } = useNotifications(groupId);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-ghost relative !p-2.5" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {(data?.unread ?? 0) > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-surface-950">
            {data!.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="card absolute right-0 z-30 mt-2 max-h-96 w-80 overflow-y-auto p-2 animate-scale-in">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            <Link
              to={`/g/${groupId}/notifications`}
              onClick={() => setOpen(false)}
              className="text-xs text-brand-600 hover:underline"
            >
              Tout voir
            </Link>
          </div>
          {!data?.items.length && (
            <p className="px-3 py-4 text-sm text-slate-500">Aucune notification</p>
          )}
          {data?.items.slice(0, 8).map((n) => (
            <div
              key={n.id}
              className={cn(
                'rounded-lg px-3 py-2 text-sm',
                !n.read && 'bg-brand-500/5',
              )}
            >
              <p className="font-medium text-slate-800">{n.title}</p>
              <p className="text-xs text-slate-600">{n.message}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{relativeTime(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false));
  const navigate = useNavigate();

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-xl p-1 hover:bg-surface-800">
        <Avatar name={user?.name ?? '?'} size="sm" />
      </button>
      {open && (
        <div className="card absolute right-0 z-30 mt-2 w-52 p-2 animate-scale-in">
          <div className="border-b border-surface-700 px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate('/select-group');
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-surface-800"
          >
            <UserCircle className="h-4 w-4" /> Mes groupes
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-surface-800"
          >
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onMenuClick, menuIcon }: { onMenuClick: () => void; menuIcon: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-surface-800 bg-surface-950/80 px-4 py-3 backdrop-blur-md">
      <button onClick={onMenuClick} className="btn-ghost !p-2 lg:hidden" aria-label="Menu">
        {menuIcon}
      </button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1.5">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
