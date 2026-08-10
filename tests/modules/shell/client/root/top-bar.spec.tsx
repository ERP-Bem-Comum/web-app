/**
 * TopBar (Vitest/jsdom) — view burra: o dropdown do usuário abre no clique e expõe "Encerrar todas as
 * sessões" (acima) + "Sair". Cada item encaminha o callback correspondente por props (sem navigate/use-case).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { TopBar } from '#modules/shell/client/root/components/top-bar/top-bar.component.tsx'
import type { RootUser } from '#modules/shell/client/root/bind/root.binding.ts'

const user: RootUser = { userId: 'u1', name: 'Maria Silva', permissions: [] }

afterEach(() => {
  cleanup()
})

const openMenu = (): void => {
  // O trigger é o botão do menu do usuário (aria-haspopup="menu").
  fireEvent.click(screen.getByRole('button', { name: /Olá, Maria Silva/ }))
}

describe('TopBar', () => {
  it('dropdown fechado por padrão: não mostra os itens', () => {
    render(<TopBar user={user} onLogout={vi.fn()} onRevokeAllSessions={vi.fn()} />)
    expect(screen.queryByText('Encerrar todas as sessões')).toBeNull()
    expect(screen.queryByText('Sair')).toBeNull()
  })

  it('ao abrir, renderiza "Encerrar todas as sessões" e "Sair"', () => {
    render(<TopBar user={user} onLogout={vi.fn()} onRevokeAllSessions={vi.fn()} />)
    openMenu()
    expect(screen.getByText('Encerrar todas as sessões')).toBeTruthy()
    expect(screen.getByText('Sair')).toBeTruthy()
  })

  it('clicar em "Encerrar todas as sessões" chama onRevokeAllSessions (e não onLogout)', () => {
    const onLogout = vi.fn()
    const onRevokeAllSessions = vi.fn()
    render(<TopBar user={user} onLogout={onLogout} onRevokeAllSessions={onRevokeAllSessions} />)
    openMenu()
    fireEvent.click(screen.getByText('Encerrar todas as sessões'))
    expect(onRevokeAllSessions).toHaveBeenCalledTimes(1)
    expect(onLogout).not.toHaveBeenCalled()
  })

  it('clicar em "Sair" chama onLogout (e não onRevokeAllSessions)', () => {
    const onLogout = vi.fn()
    const onRevokeAllSessions = vi.fn()
    render(<TopBar user={user} onLogout={onLogout} onRevokeAllSessions={onRevokeAllSessions} />)
    openMenu()
    fireEvent.click(screen.getByText('Sair'))
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(onRevokeAllSessions).not.toHaveBeenCalled()
  })
})
