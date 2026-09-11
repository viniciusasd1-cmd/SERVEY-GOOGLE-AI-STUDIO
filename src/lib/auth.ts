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

export type MfaGateState =
  | 'NOT_REQUIRED'
  | 'READY'
  | 'SETUP_REQUIRED'
  | 'CHALLENGE_REQUIRED'
  | 'ERROR';

export interface OwnerMfaState {
  state: MfaGateState;
  factorId?: string;
}

export interface TotpEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export type AuthAccessErrorCode =
  | 'SESSION_REQUIRED'
  | 'SESSION_UNAVAILABLE'
  | 'ACCESS_DENIED_NO_MEMBERSHIP'
  | 'ACCESS_DENIED_AMBIGUOUS_MEMBERSHIP'
  | 'ACCESS_DENIED_SUSPENDED_MEMBERSHIP'
  | 'AUTHORIZATION_UNAVAILABLE'
  | 'AUTHENTICATION_UNAVAILABLE'
  | 'MFA_REQUIRED'
  | 'MFA_UNAVAILABLE'
  | 'MFA_MULTIPLE_FACTORS'
  | 'MFA_VERIFICATION_FAILED';

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

async function requireAal2(): Promise<void> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) {
    throw new AuthAccessError(
      'MFA_UNAVAILABLE',
      'Não foi possível validar a autenticação adicional.'
    );
  }

  if (data.currentLevel !== 'aal2') {
    throw new AuthAccessError(
      'MFA_REQUIRED',
      'A autenticação adicional ainda não foi confirmada.'
    );
  }
}

export async function getOwnerMfaState(role: MembershipRole): Promise<OwnerMfaState> {
  if (role !== 'OWNER') {
    return { state: 'NOT_REQUIRED' };
  }

  const { data: assuranceData, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    throw new AuthAccessError(
      'MFA_UNAVAILABLE',
      'Não foi possível validar a autenticação adicional.'
    );
  }

  if (assuranceData.currentLevel === 'aal2') {
    return { state: 'READY' };
  }

  if (assuranceData.currentLevel !== 'aal1') {
    throw new AuthAccessError(
      'MFA_UNAVAILABLE',
      'Não foi possível confirmar o nível de autenticação.'
    );
  }

  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) {
    throw new AuthAccessError(
      'MFA_UNAVAILABLE',
      'Não foi possível consultar os autenticadores da conta.'
    );
  }

  const verifiedTotpFactors = (factorsData?.all ?? []).filter(
    (factor) => factor.factor_type === 'totp' && factor.status === 'verified'
  );

  if (verifiedTotpFactors.length === 0) {
    return { state: 'SETUP_REQUIRED' };
  }

  if (verifiedTotpFactors.length > 1) {
    return { state: 'ERROR' };
  }

  return { state: 'CHALLENGE_REQUIRED', factorId: verifiedTotpFactors[0].id };
}

export async function beginTotpEnrollment(): Promise<TotpEnrollment> {
  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) {
    throw new AuthAccessError(
      'MFA_UNAVAILABLE',
      'Não foi possível consultar os autenticadores da conta.'
    );
  }

  const unverifiedTotpFactors = (factorsData?.all ?? []).filter(
    (factor) => factor.factor_type === 'totp' && factor.status === 'unverified'
  );

  for (const factor of unverifiedTotpFactors) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) {
      throw new AuthAccessError(
        'MFA_UNAVAILABLE',
        'Não foi possível preparar a autenticação adicional.'
      );
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'SURVEY',
  });

  if (error || !data?.id || !data.totp) {
    throw new AuthAccessError(
      'MFA_UNAVAILABLE',
      'Não foi possível configurar a autenticação adicional.'
    );
  }

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

export function totpQrCodeToDataUrl(qrCode: string): string {
  if (qrCode.startsWith('data:')) return qrCode;
  return `data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`;
}

export async function verifyTotpEnrollment(factorId: string, code: string): Promise<void> {
  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });

  if (challengeError || !challengeData?.id) {
    throw new AuthAccessError(
      'MFA_VERIFICATION_FAILED',
      'Não foi possível validar o código. Tente novamente.'
    );
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  });

  if (verifyError) {
    throw new AuthAccessError(
      'MFA_VERIFICATION_FAILED',
      'Não foi possível validar o código. Tente novamente.'
    );
  }

  await requireAal2();
}

export async function beginTotpChallenge(factorId: string): Promise<string> {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });

  if (error || !data?.id) {
    throw new AuthAccessError(
      'MFA_VERIFICATION_FAILED',
      'Não foi possível iniciar a verificação. Tente novamente.'
    );
  }

  return data.id;
}

export async function verifyTotpChallenge(
  factorId: string,
  challengeId: string,
  code: string
): Promise<void> {
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (error) {
    throw new AuthAccessError(
      'MFA_VERIFICATION_FAILED',
      'Não foi possível validar o código. Tente novamente.'
    );
  }

  await requireAal2();
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
