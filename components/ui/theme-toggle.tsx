import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../lib/theme-context';

interface ThemeToggleProps {
  variant?: 'pill' | 'icon-only' | 'compact' | 'header';
  className?: string;
  id?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'pill',
  className = '',
  id = 'theme-toggle-btn',
  showLabel = true,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        id={id}
        onClick={toggleTheme}
        aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
          color: isDark ? '#fcd34d' : '#475569',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        className={className}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        id={id}
        onClick={toggleTheme}
        aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 8px',
          borderRadius: '6px',
          border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
          color: isDark ? '#f8fafc' : '#334155',
          fontSize: '11.5px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        className={className}
      >
        {isDark ? <Sun size={13} color="#fcd34d" /> : <Moon size={13} color="#64748b" />}
        {showLabel && <span>{isDark ? 'Claro' : 'Escuro'}</span>}
      </button>
    );
  }

  // Header ou Pill completo
  return (
    <button
      type="button"
      id={id}
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#1e293b',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'all 0.15s ease',
      }}
      className={className}
    >
      {isDark ? (
        <>
          <Sun size={14} color="#fcd34d" />
          {showLabel && <span>Tema Claro</span>}
        </>
      ) : (
        <>
          <Moon size={14} color="#475569" />
          {showLabel && <span>Tema Escuro</span>}
        </>
      )}
    </button>
  );
};
