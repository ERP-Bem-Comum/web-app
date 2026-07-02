/**
 * TopBar — VIEW BURRA (ADR-0009): recebe `user` + `onLogout` por props. UI-state local (dropdown) vem do
 * controller. Hover via CSS. Sem importar logout/navigate (testável sem mock).
 */
import type { ReactNode } from 'react'

import type { RootUser } from '#modules/shell/client/root/bind/root.binding.ts'
import { ChevronDownIcon, LogOutIcon } from '#shared/ui/icons/index.ts'
import { useTopBarMenuController } from './top-bar.controller.ts'
import * as s from './top-bar.css.ts'

export interface TopBarProps {
  readonly user: RootUser
  readonly onLogout: () => void
}

function getInitials(name: string | undefined, userId: string): string {
  if (name === undefined || name.trim().length === 0) {
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

export function TopBar({ user, onLogout }: TopBarProps): ReactNode {
  const { open, toggle, close, containerRef } = useTopBarMenuController()
  const displayName = getDisplayName(user.name, user.userId)
  const initials = getInitials(user.name, user.userId)

  return (
    <header className={s.header}>
      <div className={s.brand}>
        <img src="/images/logo-bem-comum-b.png" alt="" width={34} height={34} className={s.logoImg} />
        <span className={s.brandTitle}>Bem Comum</span>
      </div>

      <div ref={containerRef} className={s.userMenu}>
        <button
          type="button"
          className={s.userTrigger}
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className={s.avatar}>{initials}</span>
          <span className={s.greeting}>Olá, {displayName}</span>
          <ChevronDownIcon />
        </button>

        {open && (
          <div className={s.dropdown} role="menu">
            <button
              type="button"
              className={s.logoutItem}
              role="menuitem"
              onClick={() => {
                close()
                onLogout()
              }}
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
