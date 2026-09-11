// Centralized store for registered company team members and their assigned permission levels
export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: 'OPERATOR' | 'MANAGER' | 'ADMIN';
  branch: string;
  status: 'ACTIVE' | 'INVITED' | 'INACTIVE';
  inspectionsCount: number;
  lastLogin?: string;
  createdAt: string;
}

export const INITIAL_COMPANY_USERS: CompanyUser[] = [
  {
    id: 'usr-1',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@locafrotas.com.br',
    role: 'ADMIN',
    branch: 'Pátio Central - SP',
    status: 'ACTIVE',
    inspectionsCount: 42,
    lastLogin: 'Hoje às 14:15',
    createdAt: '12/01/2026',
  },
  {
    id: 'usr-2',
    name: 'Juliana Paes Silva',
    email: 'juliana.silva@locafrotas.com.br',
    role: 'OPERATOR',
    branch: 'Pátio Congonhas - SP',
    status: 'ACTIVE',
    inspectionsCount: 88,
    lastLogin: 'Hoje às 09:30',
    createdAt: '15/01/2026',
  },
  {
    id: 'usr-3',
    name: 'Marcos Vinicius Santos',
    email: 'marcos.santos@locafrotas.com.br',
    role: 'OPERATOR',
    branch: 'Filial Campinas',
    status: 'ACTIVE',
    inspectionsCount: 19,
    lastLogin: 'Ontem às 17:40',
    createdAt: '28/01/2026',
  },
];

const STORAGE_KEY = 'survey_company_team_users';

/**
 * Retorna todos os usuários da equipe cadastrados pelo proprietário
 */
export function getRegisteredTeamUsers(): CompanyUser[] {
  if (typeof window === 'undefined') return INITIAL_COMPANY_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPANY_USERS));
      return INITIAL_COMPANY_USERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler usuários da equipe:', err);
    return INITIAL_COMPANY_USERS;
  }
}

/**
 * Salva a lista de usuários da equipe
 */
export function saveRegisteredTeamUsers(users: CompanyUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Erro ao salvar usuários da equipe:', err);
  }
}

/**
 * Adiciona um novo usuário cadastrado pelo proprietário
 */
export function addTeamUser(user: CompanyUser): CompanyUser[] {
  const current = getRegisteredTeamUsers();
  const updated = [user, ...current.filter((u) => u.email.toLowerCase() !== user.email.toLowerCase())];
  saveRegisteredTeamUsers(updated);
  return updated;
}

/**
 * Remove um usuário da equipe
 */
export function removeTeamUser(userId: string): CompanyUser[] {
  const current = getRegisteredTeamUsers();
  const updated = current.filter((u) => u.id !== userId);
  saveRegisteredTeamUsers(updated);
  return updated;
}

/**
 * Identifica automaticamente o nível e papel do usuário pelo e-mail
 * Regra de negócio:
 * 1. Quem comprou o sistema é PROPRIETÁRIO / GESTOR (OWNER) por padrão.
 * 2. Quando o proprietário cadastra a equipe, define o nível de usuário (OPERATOR, MANAGER, ADMIN).
 * 3. Portanto, não é necessário selecionar perfil no login: o login consulta este cadastro.
 */
export function resolveUserAccessByEmail(email: string): {
  roleType: 'OWNER' | 'OPERATOR';
  roleLabel: string;
  name?: string;
  company?: string;
} {
  const normalizedEmail = email.trim().toLowerCase();
  const team = getRegisteredTeamUsers();
  const found = team.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (found) {
    if (found.role === 'OPERATOR') {
      return {
        roleType: 'OPERATOR',
        roleLabel: 'Operador de Vistoria de Campo',
        name: found.name,
        company: `Locafrotas - ${found.branch}`,
      };
    }
    if (found.role === 'MANAGER') {
      return {
        roleType: 'OWNER',
        roleLabel: 'Gerente Operacional de Pátio',
        name: found.name,
        company: `Locafrotas - ${found.branch}`,
      };
    }
    return {
      roleType: 'OWNER',
      roleLabel: 'Administrador / Co-gestor',
      name: found.name,
      company: 'Locafrotas Gestão de Veículos',
    };
  }

  // Heurística secundária para contas demonstrativas/específicas
  if (normalizedEmail.includes('operador') || normalizedEmail.includes('vistoria') || normalizedEmail.includes('juliana')) {
    return {
      roleType: 'OPERATOR',
      roleLabel: 'Operador de Vistoria de Campo',
      name: 'Operador de Campo',
      company: 'Locafrotas - Pátio Operacional',
    };
  }

  // Regra padrão: Quem comprou / cadastra conta é Proprietário / Gestor
  return {
    roleType: 'OWNER',
    roleLabel: 'Proprietário / Gestor da Empresa',
    company: 'Locafrotas Gestão de Veículos',
  };
}
