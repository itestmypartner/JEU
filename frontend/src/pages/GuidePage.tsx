import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Trophy,
  Swords,
  Bell,
  Users,
  History,
  Shield,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGroup } from '../context/GroupContext.js';
import { PageHeader } from '../components/PageHeader.js';

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  to?: string;
  linkLabel?: string;
}

const steps: Step[] = [
  {
    icon: UserPlus,
    title: '1. Rejoindre ou créer un groupe',
    body: "Créez un groupe (vous en devenez l'administrateur) ou rejoignez-en un avec son code d'invitation. Votre demande est validée par un administrateur.",
  },
  {
    icon: PlusCircle,
    title: '2. Enregistrer un match',
    body: "Choisissez les deux joueurs, leurs équipes et le score. Le vainqueur et toutes les statistiques sont calculés automatiquement.",
    to: 'record',
    linkLabel: 'Enregistrer un match',
  },
  {
    icon: Trophy,
    title: '3. Suivre classements et statistiques',
    body: "Consultez victoires, défaites, nuls, taux de victoire et buts, filtrables par semaine, mois, année ou depuis toujours.",
    to: 'rankings',
    linkLabel: 'Voir les classements',
  },
  {
    icon: Swords,
    title: '4. Comparer en Face-à-Face',
    body: "Confrontez deux joueurs pour voir leur historique complet et qui domine la rivalité.",
    to: 'head-to-head',
    linkLabel: 'Ouvrir le Face-à-Face',
  },
  {
    icon: History,
    title: '5. Parcourir l’historique',
    body: "Retrouvez tous les matchs enregistrés, du plus récent au plus ancien.",
    to: 'history',
    linkLabel: "Voir l'historique",
  },
  {
    icon: Bell,
    title: '6. Activer les notifications',
    body: "Sur la page Notifications, cliquez sur « Autoriser » puis « Tester le son ». Vous serez alors prévenu (son + bannière) à chaque nouveau match, record ou demande.",
    to: 'notifications',
    linkLabel: 'Régler les notifications',
  },
  {
    icon: Shield,
    title: '7. Administrer le groupe',
    body: "Les administrateurs valident les demandes, gèrent les membres et leurs rôles, modifient les matchs et consultent le journal des actions.",
    to: 'admin',
    linkLabel: "Ouvrir l'administration",
  },
];

export function GuidePage() {
  const { groupId, isAdmin } = useGroup();

  const visible = steps.filter((s) => s.to !== 'admin' || isAdmin);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Guide d'utilisation"
        subtitle="Prenez en main la plateforme en quelques étapes simples."
      />

      {visible.map((step) => (
        <div key={step.title} className="card flex items-start gap-4 p-5">
          <div className="rounded-xl bg-brand-500/15 p-2.5 text-brand-600">
            <step.icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">{step.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{step.body}</p>
            {step.to && (
              <Link
                to={`/g/${groupId}/${step.to}`}
                className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                {step.linkLabel} →
              </Link>
            )}
          </div>
        </div>
      ))}

      <div className="card flex items-center gap-3 p-5">
        <Users className="h-5 w-5 text-brand-600" />
        <p className="text-sm text-slate-600">
          Une question ? Contactez l’administrateur de votre groupe.
        </p>
      </div>
    </div>
  );
}
