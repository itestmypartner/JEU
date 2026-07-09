import {
  Trophy,
  BarChart3,
  Swords,
  Users,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '../components/PageHeader.js';

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const features: Feature[] = [
  {
    icon: BarChart3,
    title: 'Statistiques automatiques',
    body: 'Victoires, défaites, nuls, taux de victoire et buts calculés à chaque match, filtrables par période.',
  },
  {
    icon: Trophy,
    title: 'Classements',
    body: 'Un classement clair du groupe, mis à jour en temps réel.',
  },
  {
    icon: Swords,
    title: 'Face-à-Face',
    body: 'La confrontation directe entre deux joueurs, avec l’historique complet.',
  },
  {
    icon: Users,
    title: 'Multi-groupes',
    body: 'Créez ou rejoignez plusieurs groupes, chacun avec ses membres et ses statistiques.',
  },
  {
    icon: Bell,
    title: 'Notifications en direct',
    body: 'Son et bannière à chaque nouveau match, record ou demande d’adhésion.',
  },
  {
    icon: ShieldCheck,
    title: 'Administration & audit',
    body: 'Gestion des membres, des rôles et des matchs, avec un journal des actions lisible.',
  },
];

export function AboutPage() {
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="À propos" subtitle="Zéro Mensonge dans le Jeu" />

      <div className="card p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Zéro Mensonge dans le Jeu</h2>
            <p className="text-sm italic text-slate-500">« Les statistiques ne mentent jamais. »</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          Une plateforme pour les communautés de football virtuel (FC) : enregistrez vos
          matchs 1 contre 1 et laissez la plateforme calculer automatiquement statistiques,
          classements et confrontations directes. Simple, rapide et transparent.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="card flex items-start gap-3 p-5">
            <div className="rounded-xl bg-brand-500/15 p-2.5 text-brand-600">
              <f.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 text-center text-sm text-slate-500">
        Conçu et développé par <span className="font-semibold text-slate-700">haniel_dev</span>.
        <br />© 2026 — Tous droits réservés.
      </div>
    </div>
  );
}
