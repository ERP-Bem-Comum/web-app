/**
 * MenuItemIcon — mapeia o `iconId` (dado do menu) → o ícone do design system. Específico do menu do shell
 * (depende de `MenuIconId`), por isso vive aqui e não em `shared/ui` (boundary). Consome a lib de ícones.
 */
import type { ReactNode } from 'react'

import {
  HomeIcon,
  HeartHandshakeIcon,
  UsersIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  WalletIcon,
  type IconComponent,
} from '#shared/ui/icons/index.ts'
import type { MenuIconId } from '#modules/shell/client/root/viewModel/root.view-model.ts'

const MENU_ICONS: Readonly<Record<MenuIconId, IconComponent>> = {
  home: HomeIcon,
  'heart-handshake': HeartHandshakeIcon,
  users: UsersIcon,
  'calendar-check': CalendarCheckIcon,
  'calendar-days': CalendarDaysIcon,
  'trending-up': TrendingUpIcon,
  wallet: WalletIcon,
}

export function MenuItemIcon({ id }: { readonly id: MenuIconId }): ReactNode {
  const Icon = MENU_ICONS[id]
  return <Icon size={18} />
}
