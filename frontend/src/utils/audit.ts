import {
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  Swords,
  PencilLine,
  Trash2,
  Users,
  Settings2,
  ShieldCheck,
  ScrollText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AuditTone = 'positive' | 'negative' | 'neutral';

interface AuditLabel {
  label: string;
  Icon: LucideIcon;
  tone: AuditTone;
}

/// Traduit un code d'action technique en libellé français clair et lisible.
const AUDIT_LABELS: Record<string, AuditLabel> = {
  GROUP_CREATED: { label: 'Groupe créé', Icon: Users, tone: 'positive' },
  GROUP_UPDATED: { label: 'Paramètres du groupe modifiés', Icon: Settings2, tone: 'neutral' },
  JOIN_REQUESTED: { label: "Nouvelle demande d'adhésion", Icon: UserPlus, tone: 'neutral' },
  REQUEST_ACCEPTED: { label: 'Demande acceptée', Icon: UserCheck, tone: 'positive' },
  REQUEST_REJECTED: { label: 'Demande refusée', Icon: UserX, tone: 'negative' },
  MATCH_CREATED: { label: 'Match enregistré', Icon: Swords, tone: 'positive' },
  MATCH_UPDATED: { label: 'Match modifié', Icon: PencilLine, tone: 'neutral' },
  MATCH_DELETED: { label: 'Match supprimé', Icon: Trash2, tone: 'negative' },
  ROLE_CHANGED: { label: 'Rôle modifié', Icon: ShieldCheck, tone: 'neutral' },
  PLAYER_REMOVED: { label: 'Joueur retiré du groupe', Icon: UserMinus, tone: 'negative' },
};

export function describeAudit(action: string): AuditLabel {
  return AUDIT_LABELS[action] ?? { label: 'Action', Icon: ScrollText, tone: 'neutral' };
}
