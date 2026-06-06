/**
 * TopBar — barra superior da área autenticada.
 * Exibe logo "B" à esquerda e dados do usuário logado à direita
 * (saudação + avatar com iniciais + dropdown "Sair").
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { vars } from '#shared/ui/tokens/index.ts'
import { logoutUseCase } from '#modules/auth/public-api/index.ts'

/* ─── Tipos ─── */

export interface TopBarProps {
  readonly user: Readonly<{ userId: string; name?: string }>
}

/* ─── Helpers ─── */

function getInitials(name: string | undefined, userId: string): string {
  if (!name || name.trim().length === 0) {
    return userId.slice(0, 2).toUpperCase()
  }
  const parts = name.trim().split(/\s+/)
  const first = parts[0] ?? ''
  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase()
  }
  const last = parts[parts.length - 1] ?? ''
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase()
}

function getDisplayName(name: string | undefined, userId: string): string {
  return name?.trim() ?? userId
}

/* ─── Ícones inline ─── */

function ChevronDownIcon(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function LogOutIcon(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

/* ─── Componente ─── */

export function TopBar({ user }: TopBarProps): ReactNode {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayName = getDisplayName(user.name, user.userId)
  const initials = getInitials(user.name, user.userId)

  /* Fecha dropdown ao clicar fora */
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => { document.removeEventListener('mousedown', handler) }
  }, [open])

  const handleLogout = useCallback(async (): Promise<void> => {
    setOpen(false)
    await logoutUseCase()
    void navigate({ to: '/login' })
  }, [navigate])

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src="/images/logo-bem-comum.png"
          alt="B"
          width={32}
          height={32}
          style={{ objectFit: 'contain', borderRadius: '6px' }}
        />
        <span
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#1a1a2e',
            fontFamily: vars.font.family.heading,
          }}
        >
          Bem Comum
        </span>
      </div>

      {/* Usuário */}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => { setOpen((p) => !p) }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {/* Avatar */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#32C6F4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: '#fff',
              fontFamily: vars.font.family.body,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          {/* Saudação */}
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              fontFamily: vars.font.family.body,
              whiteSpace: 'nowrap',
            }}
          >
            Olá, {displayName}
          </span>

          <ChevronDownIcon />
        </button>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              minWidth: '160px',
              padding: '4px',
              zIndex: 400,
            }}
            role="menu"
          >
            <button
              type="button"
              onClick={() => { void handleLogout() }}
              role="menuitem"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#334155',
                fontFamily: vars.font.family.body,
                textAlign: 'left',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <LogOutIcon />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
