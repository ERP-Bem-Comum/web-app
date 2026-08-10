/**
 * SideBar — VIEW BURRA (ADR-0009): recebe `menuItems` (já filtrado por RBAC na VM), `collapsed`,
 * `onToggle` e `isItemActive` por props. UI-state local (accordion) vem do controller. Hover/active via
 * CSS (`[data-active]`). A recolha ao navegar é tratada no binding (não aqui).
 */
import { useId, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import type { MenuSection } from '#modules/shell/client/root/viewModel/root.view-model.ts'
import { ChevronDownIcon, ChevronUpIcon, MenuIcon } from '#shared/ui/icons/index.ts'
import { useSideBarAccordionController } from './side-bar.controller.ts'
import { MenuItemIcon } from './icons.tsx'
import * as s from './side-bar.css.ts'

export interface SideBarProps {
  readonly collapsed: boolean
  readonly onToggle: () => void
  readonly menuItems: readonly MenuSection[]
  readonly isItemActive: (to: string) => boolean
}

export function SideBar({ collapsed, onToggle, menuItems, isItemActive }: SideBarProps): ReactNode {
  // Nenhuma seção começa aberta (o acordeão inicia recolhido; o usuário abre ao clicar).
  const accordion = useSideBarAccordionController()
  const submenuIdBase = useId()

  return (
    <nav
      aria-label="Navegação principal"
      className={`${s.nav} ${collapsed ? s.navWidth.collapsed : s.navWidth.expanded}`}
    >
      <button
        type="button"
        className={s.toggle}
        onClick={onToggle}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        aria-expanded={!collapsed}
      >
        <MenuIcon />
      </button>

      <div className={s.menuList}>
        {menuItems.map((section, index) => {
          const isOpen = accordion.isOpen(section.label)
          const subItems = section.subItems ?? []
          const hasSub = subItems.length > 0
          const active =
            section.to !== undefined
              ? isItemActive(section.to)
              : hasSub && subItems.some((sub) => isItemActive(sub.to))
          const submenuId = `${submenuIdBase}-${String(index)}`

          const content = (
            <span className={`${s.itemContent} ${collapsed ? s.itemContentCollapsed : ''}`}>
              <MenuItemIcon id={section.iconId} />
              {!collapsed && <span className={s.itemLabel}>{section.label}</span>}
            </span>
          )

          return (
            <div key={section.label}>
              {section.to !== undefined ? (
                <Link
                  to={section.to}
                  className={`${s.item} ${collapsed ? s.itemCollapsed : ''}`}
                  data-active={active ? true : undefined}
                  aria-current={active ? 'page' : undefined}
                  aria-label={collapsed ? section.label : undefined}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  className={`${s.item} ${collapsed ? s.itemCollapsed : ''}`}
                  data-active={active ? true : undefined}
                  onClick={() => {
                    // Recolhida: clicar no ícone EXPANDE a sidebar e abre a seção (revela os submódulos).
                    if (collapsed) {
                      onToggle()
                      if (hasSub && !isOpen) accordion.toggle(section.label)
                      return
                    }
                    if (hasSub) accordion.toggle(section.label)
                  }}
                  aria-expanded={hasSub ? isOpen : undefined}
                  aria-controls={hasSub ? submenuId : undefined}
                  aria-label={collapsed ? section.label : undefined}
                >
                  {content}
                  {!collapsed && hasSub && (
                    <span className={s.chevron}>{isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
                  )}
                </button>
              )}

              {!collapsed && hasSub && isOpen && (
                <div className={s.submenu} id={submenuId}>
                  {subItems.map((sub) => {
                    const subActive = isItemActive(sub.to)
                    return (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        className={s.subItem}
                        data-active={subActive ? true : undefined}
                        aria-current={subActive ? 'page' : undefined}
                      >
                        <span className={s.subItemLabel}>{sub.label}</span>
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
