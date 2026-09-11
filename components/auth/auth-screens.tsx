'use client';

import React, { useState } from 'react';
import styles from './auth.module.css';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  AuthAccessError,
  createAuthenticatedUser,
  resetPasswordForEmail,
  resolveAuthenticatedAccess,
  roleTypeFromMembershipRole,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from '../../src/lib/auth';
import type { AuthenticatedUser } from '../../src/lib/auth';
export type { AuthenticatedUser } from '../../src/lib/auth';
import { isSupabaseReady } from '../../src/lib/supabase';
import { ThemeToggle } from '../ui/theme-toggle';
import { useTheme } from '../../lib/theme-context';

export type AuthScreenType = 'login' | 'register' | 'forgot-password';

interface AuthScreensProps {
  initialScreen?: AuthScreenType;
  onSuccessAuth: (user: AuthenticatedUser) => void;
  onBackToLanding: () => void;
  userEmail?: string;
}

export function AuthScreens({
  initialScreen = 'login',
  onSuccessAuth,
  onBackToLanding,
  userEmail = 'viniciusasd1@gmail.com',
}: AuthScreensProps) {
  const { isDark } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<AuthScreenType>(initialScreen);

  // Estados dos formulários
  // Login (o perfil é detectado automaticamente pelo cadastro corporativo / proprietário)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registro / Cadastro
  const [regName, setRegName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regSegment, setRegSegment] = useState('Oficina Mecânica');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Esqueci a senha
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Estados de feedback & loading
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de Simulação Google Account Chooser
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Limpa mensagens de erro ao mudar de tela
  const switchScreen = (screen: AuthScreenType) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setCurrentScreen(screen);
  };

  const isDevelopment = import.meta.env.DEV;

  function friendlyAuthError(error: unknown): string {
    if (error instanceof AuthAccessError) {
      if (error.code === 'AUTHENTICATION_UNAVAILABLE') {
        return 'A autenticação está temporariamente indisponível. Tente novamente mais tarde.';
      }
      return 'Não foi possível confirmar seu acesso. Verifique suas credenciais ou fale com o administrador da organização.';
    }

    const message = error instanceof Error ? error.message : '';
    if (message.includes('Invalid login credentials')) {
      return 'Credenciais inválidas: e-mail ou senha incorretos.';
    }
    if (message.includes('Email not confirmed')) {
      return 'E-mail cadastrado no Supabase ainda não foi confirmado.';
    }
    return 'Não foi possível concluir a operação. Tente novamente.';
  }

  // Login via E-mail / Senha com membership real
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha de acesso.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isSupabaseReady()) {
        throw new AuthAccessError(
          'AUTHENTICATION_UNAVAILABLE',
          'Supabase não está configurado para autenticação.'
        );
      }

      const authData = await signInWithPassword(loginEmail.trim(), loginPassword);
      if (!authData.user) {
        throw new AuthAccessError('SESSION_UNAVAILABLE', 'Sessão autenticada não encontrada.');
      }

      const access = await resolveAuthenticatedAccess(authData.user.id);
      onSuccessAuth(createAuthenticatedUser(authData.user, access, 'email'));
    } catch (error: unknown) {
      if (error instanceof AuthAccessError && error.code !== 'AUTHENTICATION_UNAVAILABLE') {
        await signOut().catch(() => undefined);
      }
      setErrorMessage(friendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cadastro cria apenas a conta Auth; membership é provisionada fora do frontend.
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage('Preencha os campos obrigatórios para criar sua conta.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem. Verifique e tente novamente.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('É necessário concordar com os termos de uso para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isSupabaseReady()) {
        throw new AuthAccessError(
          'AUTHENTICATION_UNAVAILABLE',
          'Supabase não está configurado para cadastro.'
        );
      }

      const signUpData = await signUpWithPassword(regEmail.trim(), regPassword, {
        name: regName.trim(),
        company: regCompany.trim(),
        segment: regSegment,
      });

      if (signUpData.session) {
        await signOut();
      }

      setSuccessMessage('Conta criada. O acesso à organização ainda precisa ser provisionado.');
      setCurrentScreen('login');
    } catch (error: unknown) {
      setErrorMessage(friendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Esqueci a Senha
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!forgotEmail.trim()) {
      setErrorMessage('Informe seu e-mail cadastrado para receber as instruções.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isSupabaseReady()) {
        throw new AuthAccessError(
          'AUTHENTICATION_UNAVAILABLE',
          'Supabase não está configurado para recuperação de senha.'
        );
      }

      await resetPasswordForEmail(forgotEmail.trim());
      setForgotSubmitted(true);
    } catch (error: unknown) {
      setErrorMessage(friendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disparo do Google Sign-In / Sign-Up
  const handleSelectGoogleAccount = (email: string, name: string) => {
    if (!isDevelopment) {
      setShowGoogleModal(false);
      setErrorMessage('Login com Google ainda não está disponível neste ambiente.');
      return;
    }

    setShowGoogleModal(false);
    setIsSubmitting(true);

    const membershipRole = email.includes('juliana') ? 'INSPECTOR' : 'OWNER';

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccessAuth({
        name,
        email,
        company: 'Ambiente de Desenvolvimento',
        role: membershipRole === 'OWNER' ? 'Proprietário de Demonstração' : 'Inspetor de Demonstração',
        roleType: roleTypeFromMembershipRole(membershipRole),
        membershipRole,
        organizationId: 'dev-demo-organization',
        branchId: null,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        provider: 'google',
      });
    }, 500);
  };

  // Acesso Direto Demonstrativo: Proprietário (vai para o Dashboard de Gestão)
  const handleOwnerDemoLogin = () => {
    if (!isDevelopment) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccessAuth({
        name: 'Carlos Mendes',
        email: 'carlos.mendes@locafrotas.com.br',
        company: 'Locafrotas Brasil Gestão de Frotas',
        role: 'Proprietário / Diretor de Operações',
        roleType: 'OWNER',
        membershipRole: 'OWNER',
        organizationId: 'dev-demo-organization',
        branchId: null,
        provider: 'email',
        isTestMode: false,
      });
    }, 350);
  };

  // Acesso Direto Demonstrativo: Operador de Pátio (vai DIRETO para a vistoria)
  const handleOperatorDemoLogin = () => {
    if (!isDevelopment) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccessAuth({
        name: 'Juliana Silva',
        email: 'juliana.silva@locafrotas.com.br',
        company: 'Locafrotas - Pátio Congonhas',
        role: 'Operadora de Vistoria de Campo',
        roleType: 'OPERATOR',
        membershipRole: 'INSPECTOR',
        organizationId: 'dev-demo-organization',
        branchId: null,
        provider: 'email',
        isTestMode: false,
      });
    }, 350);
  };

  // Entrada imediata no Estado Único de Testes (1 ciclo de vistoria)
  const handleEnterTestMode = () => {
    if (!isDevelopment) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccessAuth({
        name: 'Vistoriador em Teste',
        email: 'teste.sandbox@survey.com.br',
        company: 'Ambiente Sandbox (Degustação)',
        role: 'Operador em Teste (1 Ciclo)',
        roleType: 'OPERATOR',
        membershipRole: 'INSPECTOR',
        organizationId: 'dev-sandbox-organization',
        branchId: null,
        provider: 'test_sandbox',
        isTestMode: true,
        testCyclesAllowed: 1,
        testCyclesUsed: 0,
        testCycleCompleted: false,
      });
    }, 450);
  };

  return (
    <div className={styles.authPageWrapper} id="auth-page-root">
      {/* Barra Superior da Área de Autenticação */}
      <header className={styles.authNavbar}>
        <button 
          type="button" 
          className={styles.authNavBackBtn}
          onClick={onBackToLanding}
          id="auth-back-to-landing-btn"
        >
          <ArrowLeft size={16} />
          Voltar para a página inicial
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle variant="compact" id="auth-header-theme-toggle" />
          <div className={styles.brandLogoCompact}>
            <span className={styles.logoBadge}>SURVEY</span>
            <span className={styles.brandText}>Acesso à Plataforma</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Centralizado */}
      <main className={styles.authContainer}>
        {/* ========================================================= */}
        {/* TELA 1: LOGIN */}
        {/* ========================================================= */}
        {currentScreen === 'login' && (
          <div className={styles.authCard} id="auth-login-card">
            <div className={styles.authHeader}>
              <h1 className={styles.authTitle}>Acessar o SURVEY</h1>
              <p className={styles.authSubtitle}>
                Faça login para iniciar novas vistorias ou gerenciar os laudos da sua frota.
              </p>
            </div>

            {/* Mensagem de Erro */}
            {errorMessage && (
              <div className={`${styles.alertBox} ${styles.alertError}`} id="login-error-alert">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className={`${styles.alertBox} ${styles.alertSuccess}`} id="login-success-alert">
                <CheckCircle2 size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Botão de Conectar com Google */}
            <button
              type="button"
              className={styles.googleBtn}
              onClick={() => {
                if (isDevelopment) {
                  setShowGoogleModal(true);
                } else {
                  setErrorMessage('Login com Google ainda não está disponível neste ambiente.');
                }
              }}
              id="btn-google-login"
            >
              <div className={styles.googleIconWrapper}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                </svg>
              </div>
              Continuar com o Google
            </button>

            {/* Divisor */}
            <div className={styles.divider}>
              <span className={styles.dividerText}>ou entrar com e-mail</span>
            </div>

            {/* Aviso de Detecção Automática de Perfil (Proprietário ou Vistoriador) */}
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: isDark ? '#cbd5e1' : '#475569',
              }}
              id="auth-role-auto-detect-box"
            >
              <ShieldCheck size={16} color={isDark ? '#60a5fa' : '#2563eb'} style={{ flexShrink: 0 }} />
              <span>
                <strong>Acesso Corporativo Inteligente:</strong> O nível de permissão (Proprietário/Gestor ou Vistoriador) é reconhecido automaticamente pelo cadastro corporativo.
              </span>
            </div>

            {/* Formulário Tradicional de Login */}
            <form onSubmit={handleEmailLogin} id="form-login-email">
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="input-login-email">
                  E-mail de trabalho
                </label>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    id="input-login-email"
                    type="email"
                    className={styles.textInput}
                    placeholder="seu.nome@empresa.com.br"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="input-login-password">
                  <span>Senha de acesso</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="input-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    className={styles.textInput}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    title={showLoginPassword ? 'Ocultar senha' : 'Ver senha'}
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.formAuxRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Lembrar neste aparelho
                </label>

                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => switchScreen('forgot-password')}
                  id="link-forgot-password"
                >
                  Esqueci a senha
                </button>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
                id="btn-submit-login"
              >
                {isSubmitting ? 'Validando acesso...' : 'Entrar na plataforma'}
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Atalhos de Demonstração e Perfis */}
            {isDevelopment && <div className={styles.demoShortcutCard} id="auth-demo-shortcut-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#2563eb" />
                  <strong style={{ fontSize: '12px', color: '#1e3a8a' }}>Acessos Rápidos de Demonstração</strong>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    border: '1px solid #bfdbfe',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Modo Avaliação
                </span>
              </div>

              <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 10px 0', lineHeight: 1.35 }}>
                Contas demonstrativas para avaliação (o proprietário define o nível de cada operador no painel):
              </p>

              {/* Grid dos 2 botões principais: Proprietário vs Operador */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  id="btn-demo-owner-login"
                  onClick={handleOwnerDemoLogin}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  title="Acessar como Carlos Mendes (Proprietário) - vai para o Dashboard"
                >
                  <span>👔 Entrar Proprietário</span>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 500 }}>
                    Painel • Histórico • Acessos
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-demo-operator-login"
                  onClick={handleOperatorDemoLogin}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
                  }}
                  title="Acessar como Juliana Silva (Operadora) - vai DIRETO para a vistoria"
                >
                  <span>📱 Entrar Operador</span>
                  <span style={{ fontSize: '9.5px', color: '#bfdbfe', fontWeight: 500 }}>
                    Direto para a Vistoria
                  </span>
                </button>
              </div>

              {/* Botão de 1 Ciclo Sandbox */}
              <button
                type="button"
                id="btn-start-test-direct"
                onClick={handleEnterTestMode}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  backgroundColor: '#f8fafc',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Sparkles size={12} color="#d97706" />
                Degustação Isolada (1 Ciclo Sandbox)
              </button>
            </div>}

            {/* Rodapé: Criar Cadastro */}
            <div className={styles.authCardFooter}>
              <div className={styles.authCardFooterText}>
                Não tem uma conta cadastrada?
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => switchScreen('register')}
                  id="link-go-to-register"
                >
                  Criar cadastro agora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TELA 2: CRIAR CADASTRO (SIGN UP) */}
        {/* ========================================================= */}
        {currentScreen === 'register' && (
          <div className={styles.authCard} id="auth-register-card">
            <div className={styles.authHeader}>
              <h1 className={styles.authTitle}>Criar conta no SURVEY</h1>
              <p className={styles.authSubtitle}>
                Cadastre sua empresa e comece a padronizar laudos e vistorias veiculares.
              </p>
            </div>

            {/* Mensagem de Erro */}
            {errorMessage && (
              <div className={`${styles.alertBox} ${styles.alertError}`} id="reg-error-alert">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Botão de Cadastro via Google */}
            <button
              type="button"
              className={styles.googleBtn}
              onClick={() => {
                if (isDevelopment) {
                  setShowGoogleModal(true);
                } else {
                  setErrorMessage('Cadastro com Google ainda não está disponível neste ambiente.');
                }
              }}
              id="btn-google-register"
            >
              <div className={styles.googleIconWrapper}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                </svg>
              </div>
              Cadastrar com o Google (1 clique)
            </button>

            {/* Divisor */}
            <div className={styles.divider}>
              <span className={styles.dividerText}>ou cadastre com seus dados</span>
            </div>

            {/* Formulário de Registro */}
            <form onSubmit={handleRegisterSubmit} id="form-register">
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="input-reg-name">
                  Nome completo do responsável *
                </label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    id="input-reg-name"
                    type="text"
                    className={styles.textInput}
                    placeholder="Ex: Carlos Eduardo Silva"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="input-reg-company">
                  Nome da Empresa / Oficina / Locadora
                </label>
                <div className={styles.inputWrapper}>
                  <Building2 size={16} className={styles.inputIcon} />
                  <input
                    id="input-reg-company"
                    type="text"
                    className={styles.textInput}
                    placeholder="Ex: Auto Mecânica Centro-Sul"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="select-reg-segment">
                  Segmento de atuação
                </label>
                <select
                  id="select-reg-segment"
                  className={styles.selectInput}
                  value={regSegment}
                  onChange={(e) => setRegSegment(e.target.value)}
                >
                  <option value="Oficina Mecânica">Oficina Mecânica & Centro Automotivo</option>
                  <option value="Loja de Veículos">Loja de Veículos & Revenda</option>
                  <option value="Locadora de Carros">Locadora de Veículos</option>
                  <option value="Autoelétrica">Autoelétrica & Ar Condicionado</option>
                  <option value="Gestão de Frota">Gestão de Frota Corporativa</option>
                  <option value="Outro">Outro segmento automotivo</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="input-reg-email">
                  E-mail corporativo de acesso *
                </label>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    id="input-reg-email"
                    type="email"
                    className={styles.textInput}
                    placeholder="contato@suaempresa.com.br"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="input-reg-password">
                  Criar senha (mínimo 6 dígitos) *
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="input-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    className={styles.textInput}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="input-reg-confirm-pwd">
                  Confirmar senha *
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="input-reg-confirm-pwd"
                    type={showRegPassword ? 'text' : 'password'}
                    className={styles.textInput}
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ margin: '14px 0 20px' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />
                  <span>Concordo com os Termos de Uso e Política de Privacidade</span>
                </label>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
                id="btn-submit-register"
              >
                {isSubmitting ? 'Criando conta...' : 'Concluir cadastro e iniciar'}
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Rodapé: Voltar ao Login */}
            <div className={styles.authCardFooter}>
              <div className={styles.authCardFooterText}>
                Já possui cadastro na plataforma?
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => switchScreen('login')}
                  id="link-go-to-login"
                >
                  Fazer login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TELA 3: ESQUECI A SENHA (FORGOT PASSWORD) */}
        {/* ========================================================= */}
        {currentScreen === 'forgot-password' && (
          <div className={styles.authCard} id="auth-forgot-card">
            <div className={styles.authHeader}>
              <h1 className={styles.authTitle}>Recuperação de Senha</h1>
              <p className={styles.authSubtitle}>
                Informe o e-mail cadastrado da sua conta para receber o link seguro de redefinição.
              </p>
            </div>

            {/* Mensagem de Erro */}
            {errorMessage && (
              <div className={`${styles.alertBox} ${styles.alertError}`} id="forgot-error-alert">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {!forgotSubmitted ? (
              <form onSubmit={handleForgotSubmit} id="form-forgot-password">
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="input-forgot-email">
                    E-mail da sua conta
                  </label>
                  <div className={styles.inputWrapper}>
                    <Mail size={16} className={styles.inputIcon} />
                    <input
                      id="input-forgot-email"
                      type="email"
                      className={styles.textInput}
                      placeholder="exemplo@empresa.com.br"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ margin: '14px 0 20px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Enviaremos um token de segurança de uso único com validade de 30 minutos.
                  </span>
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                  id="btn-submit-forgot"
                >
                  <KeyRound size={16} />
                  {isSubmitting ? 'Enviando instruções...' : 'Enviar link de recuperação'}
                </button>
              </form>
            ) : (
              /* Confirmação de Envio com Sucesso */
              <div id="forgot-success-box">
                <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Instruções enviadas com sucesso!</strong>
                    <div style={{ marginTop: '4px' }}>
                      Enviamos um link para <strong>{forgotEmail}</strong>. Verifique sua caixa de entrada e também a pasta de spam.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={() => switchScreen('login')}
                  style={{ marginTop: '16px' }}
                  id="btn-back-to-login-after-forgot"
                >
                  <ArrowLeft size={16} />
                  Voltar para tela de login
                </button>
              </div>
            )}

            {/* Rodapé: Voltar ao Login */}
            <div className={styles.authCardFooter}>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => switchScreen('login')}
                id="link-return-to-login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowLeft size={14} />
                Lembrei minha senha, voltar ao login
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL SIMULADOR GOOGLE AUTH (ACCOUNT CHOOSER) */}
      {/* ========================================================= */}
      {showGoogleModal && (
        <div className={styles.googleModalOverlay} onClick={() => setShowGoogleModal(false)}>
          <div 
            className={styles.googleModalCard} 
            onClick={(e) => e.stopPropagation()}
            id="google-account-chooser-modal"
          >
            <div className={styles.googleModalHeader}>
              <svg width="28" height="28" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
              </svg>
              <h2 className={styles.googleModalTitle}>Fazer login com o Google</h2>
              <p className={styles.googleModalSubtitle}>
                Escolha uma conta para continuar no SURVEY Vistorias
              </p>
            </div>

            <div className={styles.googleAccountList}>
              {/* Opção 1: Conta do Usuário Atual */}
              <button
                type="button"
                className={styles.googleAccountItem}
                onClick={() => handleSelectGoogleAccount(userEmail, 'Vinicius')}
                id="btn-google-choose-vinicius"
              >
                <div className={styles.googleAvatar} style={{ backgroundColor: '#2563eb' }}>
                  V
                </div>
                <div className={styles.googleAccountDetails}>
                  <div className={styles.googleAccountName}>Vinicius (Conta Google)</div>
                  <div className={styles.googleAccountEmail}>{userEmail}</div>
                </div>
              </button>

              {/* Opção 2: Conta Demo Corporativa */}
              <button
                type="button"
                className={styles.googleAccountItem}
                onClick={() => handleSelectGoogleAccount('gestao.veiculos@empresa.com.br', 'Gestão Operacional')}
                id="btn-google-choose-demo"
              >
                <div className={styles.googleAvatar} style={{ backgroundColor: '#0f172a' }}>
                  G
                </div>
                <div className={styles.googleAccountDetails}>
                  <div className={styles.googleAccountName}>Gestão & Operação de Pátio</div>
                  <div className={styles.googleAccountEmail}>gestao.veiculos@empresa.com.br</div>
                </div>
              </button>
            </div>

            <div className={styles.googleModalFooter}>
              <button
                type="button"
                className={styles.googleModalCancelBtn}
                onClick={() => setShowGoogleModal(false)}
                id="btn-google-modal-cancel"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
