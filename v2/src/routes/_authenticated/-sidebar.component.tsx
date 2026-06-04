/**
 * Sidebar — menu de navegação accordion para área autenticada.
 * Suporta modo expandido (com texto) e recolhido (apenas ícones).
 * Estado controlado via props (collapsed + onToggle).
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

import { vars } from '#shared/ui/tokens/index.ts'

/* ─── Ícones inline (SVG) — específicos deste componente ─── */

function HomeIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function HeartHandshakeIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3l-5.591-5.506" />
      <path d="M8 7c0-1.1.9-2 2-2s2 .9 2 2" />
    </svg>
  )
}

function UsersIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CalendarIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ChartIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  )
}

function WalletIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M21 7v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7" />
      <path d="M16 11h6v4h-6z" />
    </svg>
  )
}

function ChevronDownIcon(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ChevronUpIcon(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function PanelLeftIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  )
}

function PanelRightIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
    </svg>
  )
}

/* ─── Tipos ─── */

interface SubItem {
  readonly label: string
  readonly to: string
}

interface MenuSection {
  readonly label: string
  readonly icon: ReactNode
  readonly to?: string
  readonly subItems?: readonly SubItem[]
}

export interface SidebarProps {
  readonly collapsed: boolean
  readonly onToggle: () => void
}

/* ─── Dados do menu ─── */

const MENU: readonly MenuSection[] = [
  { label: 'Dashboard', icon: <HomeIcon />, to: '/dashboard' },
  { label: 'Gestão de Parceiros', icon: <HeartHandshakeIcon /> },
  { label: 'Gestão de Programas', icon: <UsersIcon /> },
  {
    label: 'Gestão de Contratos',
    icon: <CalendarIcon />,
    subItems: [{ label: 'Contratos', to: '/contratos' }],
  },
  { label: 'Plano Orçamentário', icon: <CalendarIcon /> },
  { label: 'Relatórios', icon: <ChartIcon /> },
  { label: 'Financeiro', icon: <WalletIcon /> },
  { label: 'Gestão de Usuários', icon: <UsersIcon /> },
] as const

/* ─── Componente ─── */

export function Sidebar({ collapsed, onToggle }: SidebarProps): ReactNode {
  const [open, setOpen] = useState<Record<string, boolean>>({ 'Gestão de Contratos': true })
  const { location } = useRouterState()
  const currentPath = location.pathname

  const toggleAccordion = (label: string) => {
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <nav
      style={{
        width: collapsed ? '64px' : '260px',
        background: '#3B4B6B',
        color: '#fff',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100dvh',
        transition: 'width 200ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo + Toggle */}
      <div
        style={{
          padding: collapsed ? '16px 8px' : '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            width: collapsed ? '40px' : '36px',
            height: collapsed ? '40px' : '36px',
            background: '#fff',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <img
            src="/images/logo-bem-comum.png"
            alt="B"
            width={collapsed ? 28 : 24}
            height={collapsed ? 28 : 24}
            style={{ objectFit: 'contain' }}
          />
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b0b3c7',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'color 150ms ease',
            }}
            aria-label="Recolher menu"
            title="Recolher menu"
          >
            <PanelLeftIcon />
          </button>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={onToggle}
            style={{
              position: 'absolute',
              left: '64px',
              top: '20px',
              background: '#3B4B6B',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#b0b3c7',
              cursor: 'pointer',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0 4px 4px 0',
              transition: 'color 150ms ease',
              zIndex: 10,
            }}
            aria-label="Expandir menu"
            title="Expandir menu"
          >
            <PanelRightIcon />
          </button>
        )}
      </div>

      {/* Menu */}
      <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {MENU.map((item) => {
          const isOpen = open[item.label] ?? false
          const hasSub = item.subItems !== undefined && item.subItems.length > 0
          const isDirectLink = item.to !== undefined
          const isActive = isDirectLink
            ? currentPath === item.to || currentPath.startsWith(item.to + '/')
            : hasSub && item.subItems.some((s) => currentPath.startsWith(s.to))

          const itemContent = (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                width: '100%',
              }}
            >
              {item.icon}
              {!collapsed && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              )}
            </span>
          )

          return (
            <div key={item.label}>
              {/* Item principal */}
              {isDirectLink ? (
                <Link
                  to={item.to}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: collapsed ? '12px 0' : '12px 16px',
                    background: isActive ? '#32C6F4' : 'transparent',
                    color: isActive ? '#fff' : '#b0b3c7',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: vars.font.family.body,
                    transition: 'all 150ms ease',
                    textAlign: 'left',
                    textDecoration: 'none',
                  }}
                >
                  {itemContent}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => { if (hasSub) toggleAccordion(item.label) }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: collapsed ? '12px 0' : '12px 16px',
                    background: isActive ? '#32C6F4' : 'transparent',
                    color: isActive ? '#fff' : '#b0b3c7',
                    border: 'none',
                    cursor: hasSub ? 'pointer' : 'default',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: vars.font.family.body,
                    transition: 'all 150ms ease',
                    textAlign: 'left',
                  }}
                  aria-expanded={isOpen}
                >
                  {itemContent}
                  {!collapsed && hasSub && (
                    <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: '8px' }}>
                      {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </span>
                  )}
                </button>
              )}

              {/* Sub-itens */}
              {!collapsed && hasSub && isOpen && (
                <div style={{ background: 'rgba(0,0,0,0.15)' }}>
                  {item.subItems.map((sub) => {
                    const isSubActive = currentPath === sub.to || currentPath.startsWith(sub.to + '/')
                    return (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        style={{
                          display: 'block',
                          padding: '10px 16px 10px 46px',
                          color: isSubActive ? '#fff' : '#b0b3c7',
                          background: isSubActive ? 'rgba(50,198,244,0.25)' : 'transparent',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: isSubActive ? 600 : 400,
                          fontFamily: vars.font.family.body,
                          transition: 'all 150ms ease',
                          borderLeft: isSubActive ? '3px solid #32C6F4' : '3px solid transparent',
                        }}
                      >
                        {sub.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
