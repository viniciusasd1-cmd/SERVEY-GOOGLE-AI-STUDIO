import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type MembershipRole = 'OWNER' | 'ADMIN' | 'SUPERVISOR' | 'INSPECTOR';
export type UiRoleType = 'OWNER' | 'OPERATOR';
export type AuthProvider = 'google' | 'email' | 'test_sandbox';

export interface AuthenticatedUser {
  name: string;
  email: string;
  company: string;
  role: string;
  roleType: UiRoleType;
  membershipRole: MembershipRole;
  organizationId: string;
  branchId: string | null;
  avatarUrl?: string;
  provider: AuthProvider;
  isTestMode?: boolean;
  testCyclesAllowed?: number;
  testCyclesUsed?: number;
  testCycleCompleted?: boolean;
}

export interface MembershipAccess {
  organizationId: string;
  branchId: string | null;
  role: MembershipRole;
  status: 'ACTIVE';
}

export interface AuthenticatedSession {
  user: User;
  access: MembershipAccess;
}

export type AuthAccessErrorCode =
  | 'SESSION_REQUIRED'
  | 'SESSION_UNAVAILABLE'
  | 'ACCESS_DENIED_NO_MEMBERSHIP'
  | 'ACCESS_DENIED_AMBIGUOUS_MEMBERSHIP'
  | 'ACCESS_DENIED_SUSPENDED_MEMBERSHIP'
  | 'AUTHORIZATION_UNAVAILABLE'
  | 'AUTHENTICATION_UNAVAILABLE';

export class AuthAccessError extends Error {
  constructor(public readonly code: AuthAccessErrorCode, message: string) {
    super(message);
    this.name = 'AuthAccessError';
  }
}

interface MembershipRow {
  organization_id: string;
  branch_id: string | null;
  role: MembershipRole;
  status: 'ACTIVE' | string;
}

const MEMBERSHIP_ROLES: readonly MembershipRole[] = ['OWNER', 'ADMIN', 'SUPERVISOR', 'INSPECTOR'];

function isMembershipRole(value: unknown): value is MembershipRole {
  return typeof value === 'string' && MEMBERSHIP_ROLES.includes(value as MembershipRole);
}

function isMembershipRow(value: unknown): value is MembershipRow {
  if (!value || typeof value !== 'object') return false;

  const row = value as Record<string, unknown>;
  return (
    typeof row.organization_id === 'string' &&
    (typeof row.branch_id === 'string' || row.branch_id === null) &&
    isMembershipRole(row.role) &&
    typeof row.status === 'string'
  );
}

function metadataString(user: User, key: string): string | undefined {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function roleLabel(role: MembershipRole): string {
  switch (role) {
    case 'OWNER':
      return 'Proprietário / Gestor';
    case 'ADMIN':
      return 'Administrador / Co-gestor';
    case 'SUPERVISOR':
      return 'Supervisor Operacional';
    case 'INSPECTOR':
      return 'Inspetor de Campo';
  }
}

export function roleTypeFromMembershipRole(role: MembershipRole): UiRoleType {
  return role === 'SUPERVISOR' || role === 'INSPECTOR' ? 'OPERATOR' : 'OWNER';
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;
  return data;
}

export async function signUpWithPassword(
  email: string,
  password: string,
  metadata: { name: string; company: string; segment: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error) throw error;
  return data;
}

export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
  });

  if (error) throw error;
}

export async function resolveAuthenticatedAccess(userId: string): Promise<MembershipAccess> {
  const { data, error } = await supabase
    .from('memberships')
    .select('organization_id, branch_id, role, status')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE');

  if (error) {
    throw new AuthAccessError(
      'AUTHORIZATION_UNAVAILABLE',
      'Não foi possível validar o acesso à organização.'
    );
  }

  const memberships = (data ?? []) as unknown[];

  if (memberships.length === 0) {
    throw new AuthAccessError(
      'ACCESS_DENIED_NO_MEMBERSHIP',
      'Sua conta ainda não possui acesso ativo a uma organização.'
    );
  }

  if (memberships.length > 1) {
    throw new AuthAccessError(
      'ACCESS_DENIED_AMBIGUOUS_MEMBERSHIP',
      'Não foi possível determinar uma organização única para esta conta.'
    );
  }

  const membership = memberships[0];
  if (!isMembershipRow(membership)) {
    throw new AuthAccessError(
      'AUTHORIZATION_UNAVAILABLE',
      'Não foi possível validar o acesso à organização.'
    );
  }

  if (membership.status !== 'ACTIVE') {
    throw new AuthAccessError(
      'ACCESS_DENIED_SUSPENDED_MEMBERSHIP',
      'O acesso desta conta não está ativo.'
    );
  }

  return {
    organizationId: membership.organization_id,
    branchId: membership.branch_id,
    role: membership.role,
    status: 'ACTIVE',
  };
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new AuthAccessError('SESSION_UNAVAILABLE', 'Não foi possível recuperar a sessão.');
  }

  if (!sessionData.session) {
    throw new AuthAccessError('SESSION_REQUIRED', 'Sessão autenticada não encontrada.');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new AuthAccessError('SESSION_UNAVAILABLE', 'Não foi possível validar a sessão.');
  }

  const access = await resolveAuthenticatedAccess(userData.user.id);
  return { user: userData.user, access };
}

export function createAuthenticatedUser(
  user: User,
  access: MembershipAccess,
  provider: 'email' | 'google' = 'email'
): AuthenticatedUser {
  const email = user.email || '';
  const name = metadataString(user, 'name') || email.split('@')[0] || 'Usuário';
  const company = metadataString(user, 'company') || 'Organização SURVEY';

  return {
    name,
    email,
    company,
    role: roleLabel(access.role),
    roleType: roleTypeFromMembershipRole(access.role),
    membershipRole: access.role,
    organizationId: access.organizationId,
    branchId: access.branchId,
    avatarUrl: metadataString(user, 'avatarUrl'),
    provider,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}
