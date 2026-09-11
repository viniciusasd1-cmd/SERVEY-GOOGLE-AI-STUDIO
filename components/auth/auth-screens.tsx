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
import { signInWithPassword } from '../../src/lib/auth';
import { isSupabaseReady } from '../../src/lib/supabase';
import { ThemeToggle } from '../ui/theme-toggle';
import { useTheme } from '../../lib/theme-context';
import { resolveUserAccessByEmail } from '../../lib/team-store';

export type AuthScreenType = 'login' | 'register' | 'forgot-password';

export interface AuthenticatedUser {
  name: string;
  email: string;
  company: string;
  role: string;
  roleType?: 'OWNER' | 'OPERATOR';
  avatarUrl?: string;
  provider: 'google' | 'email' | 'test_sandbox';
  isTestMode?: boolean;
  testCyclesAllowed?: number;
  testCyclesUsed?: number;
  testCycleCompleted?: boolean;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestModeActive, setIsTestModeActive] = useState(false);

  // Modal de Simulação Google Account Chooser
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Limpa mensagens de erro ao mudar de tela
  const switchScreen = (screen: AuthScreenType) => {
    setErrorMessage(null);
    setCurrentScreen(screen);
  };

  // Login via E-mail / Senha (Detecção automática de nível de usuário)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha de acesso.');
      return;
    }

    setIsSubmitting(true);

    // Resolução automática de perfil:
    // 1. Quem comprou o sistema é Proprietário / Gestor (OWNER)
    // 2. Quando o proprietário cadastra a equipe, ele define o nível (Vistoriador de Campo = OPERATOR, etc.)
    const resolvedAccess = resolveUserAccessByEmail(loginEmail);

    // Se o Supabase estiver configurado com publishable key
    if (isSupabaseReady()) {
      try {
        const authData = await signInWithPassword(loginEmail.trim(), loginPassword);
        if (authData?.user) {
          const userMeta = authData.user.user_metadata || {};
          const finalRoleType = (userMeta.roleType as 'OWNER' | 'OPERATOR') || resolvedAccess.roleType;
          onSuccessAuth({
            name: userMeta.name || authData.user.email?.split('@')[0] || resolvedAccess.name || 'Usuário',
            email: authData.user.email || loginEmail.trim(),
            company: userMeta.company || resolvedAccess.company || 'Locafrotas Gestão de Veículos',
            role: userMeta.role || resolvedAccess.roleLabel,
            roleType: finalRoleType,
            provider: 'email',
          });
          return;
        }
      } catch (err: any) {
        console.error('Erro na autenticação Supabase:', err);
        let friendlyMsg = err?.message || 'Falha ao autenticar no Supabase.';
        if (friendlyMsg.includes('Invalid login credentials')) {
          friendlyMsg = 'Credenciais inválidas: e-mail ou senha incorretos.';
        } else if (friendlyMsg.includes('Email not confirmed')) {
          friendlyMsg = 'E-mail cadastrado no Supabase ainda não foi confirmado.';
        }
        setErrorMessage(friendlyMsg);
        setIsSubmitting(false);
        return;
      }
    }

    // Fallback de demonstração ou modo de teste
    setTimeout(() => {
      setIsSubmitting(false);

      const isTesting =
        isTestModeActive ||
        loginEmail.toLowerCase().includes('teste') ||
        loginEmail.toLowerCase().includes('sandbox');

      if (isTesting) {
        onSuccessAuth({
          name: 'Vistoriador em Teste',
          email: loginEmail.trim() || 'teste.sandbox@survey.com.br',
          company: 'Ambiente Sandbox (Degustação)',
          role: 'Operador em Teste (1 Ciclo)',
          roleType: 'OPERATOR',
          provider: 'test_sandbox',
          isTestMode: true,
          testCyclesAllowed: 1,
          testCyclesUsed: 0,
          testCycleCompleted: false,
        });
      } else {
        onSuccessAuth({
          name: resolvedAccess.name || loginEmail.split('@')[0],
          email: loginEmail.trim(),
          company: resolvedAccess.company || 'Locafrotas Brasil Gestão de Frotas',
          role: resolvedAccess.roleLabel,
          roleType: resolvedAccess.roleType,
          provider: 'email',
          isTestMode: false,
        });
      }
    }, 450);
  };

  // Cadastro de Nova Conta (por padrão cria conta de Proprietário/Administrador)
  const handleRegisterSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccessAuth({
        name: regName,
        email: regEmail,
        company: regCompany.trim() || 'Oficina & Gestão de Veículos',
        role: 'Proprietário / Gestor da Empresa',
        roleType: 'OWNER',
        provider: 'email',
      });
    }, 550);
  };

  // Esqueci a Senha
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!forgotEmail.trim()) {
      setErrorMessage('Informe seu e-mail cadastrado para receber as instruções.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setForgotSubmitted(true);
    }, 400);
  };

  // Disparo do Google Sign-In / Sign-Up
  const handleSelectGoogleAccount = (email: string, name: string) => {
    setShowGoogleModal(false);
    setIsSubmitting(true);

    const resolvedAccess = resolveUserAccessByEmail(email);

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccessAuth({
        name,
        email,
        company: resolvedAccess.company || 'Locafrotas Brasil Gestão de Frotas',
        role: resolvedAccess.roleLabel,
        roleType: resolvedAccess.roleType,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        provider: 'google',
      });
    }, 500);
  };

  // Acesso Direto Demonstrativo: Proprietário (vai para o Dashboard de Gestão)
  const handleOwnerDemoLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccessAuth({
        name: 'Carlos Mendes',
        email: 'carlos.mendes@locafrotas.com.br',
        company: 'Locafrotas Brasil Gestão de Frotas',
        role: 'Proprietário / Diretor de Operações',
        roleType: 'OWNER',
        provider: 'email',
        isTestMode: false,
      });
    }, 350);
  };

  // Acesso Direto Demonstrativo: Operador de Pátio (vai DIRETO para a vistoria)
  const handleOperatorDemoLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccessAuth({
        name: 'Juliana Silva',
        email: 'juliana.silva@locafrotas.com.br',
        company: 'Locafrotas - Pátio Congonhas',
        role: 'Operadora de Vistoria de Campo',
        roleType: 'OPERATOR',
        provider: 'email',
        isTestMode: false,
      });
    }, 350);
  };

  // Atalho para preenchimento de teste rápido (Ambiente isolado de 1 ciclo único)
  const handleQuickDemoFill = () => {
    setLoginEmail('teste.sandbox@survey.com.br');
    setLoginPassword('teste1ciclo');
    setIsTestModeActive(true);
  };

  // Entrada imediata no Estado Único de Testes (1 ciclo de vistoria)
  const handleEnterTestMode = () => {
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

            {/* Botão de Conectar com Google */}
            <button
              type="button"
              className={styles.googleBtn}
              onClick={() => setShowGoogleModal(true)}
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
            <div className={styles.demoShortcutCard} id="auth-demo-shortcut-box">
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
            </div>

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
              onClick={() => setShowGoogleModal(true)}
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
