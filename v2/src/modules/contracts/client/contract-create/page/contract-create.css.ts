import { style, globalStyle } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
})

export const topbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  flexShrink: 0,
})

export const backButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink4,
  cursor: 'pointer',
  fontSize: vars.font.size.sm,
  transition: 'color 120ms, background 120ms',
  ':hover': {
    color: vars.color.institutional.ink2,
    background: vars.color.institutional.paperWarm,
  },
})

export const topbarTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: '1.125rem',
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
  letterSpacing: '-0.01em',
  lineHeight: 1.3,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexWrap: 'wrap',
})

export const topbarMeta = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink5,
  background: vars.color.institutional.paperWarm,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const topbarStatus = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.lg,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.semibold,
  background: vars.color.status.pendingBg,
  color: vars.color.status.pendingText,
})

export const mainLayout = style({
  display: 'flex',
  flex: 1,
  gap: vars.space.xl,
  minHeight: 0,
  overflow: 'hidden',
})

export const formCol = style({
  flex: 1,
  minWidth: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingTop: vars.space.lg,
  paddingLeft: vars.space.md,
  paddingRight: vars.space.xs,
  paddingBottom: '4rem',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.institutional.paperRule} transparent`,
})

globalStyle(`${formCol}::-webkit-scrollbar`, {
  width: '0.25rem',
})

globalStyle(`${formCol}::-webkit-scrollbar-track`, {
  background: 'transparent',
})

globalStyle(`${formCol}::-webkit-scrollbar-thumb`, {
  background: vars.color.institutional.paperRule,
  borderRadius: vars.radius.lg,
})

globalStyle(`${formCol}::-webkit-scrollbar-thumb:hover`, {
  background: vars.color.institutional.ink5,
})

export const sidebar = style({
  width: '17.5rem',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  overflowX: 'hidden',
  background: vars.color.surface.default,
  borderLeft: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.institutional.paperRule} transparent`,
})

globalStyle(`${sidebar}::-webkit-scrollbar`, {
  width: '0.25rem',
})

globalStyle(`${sidebar}::-webkit-scrollbar-track`, {
  background: 'transparent',
})

globalStyle(`${sidebar}::-webkit-scrollbar-thumb`, {
  background: vars.color.institutional.paperRule,
  borderRadius: vars.radius.lg,
})

globalStyle(`${sidebar}::-webkit-scrollbar-thumb:hover`, {
  background: vars.color.institutional.ink5,
})

export const section = style({
  padding: `${vars.space.md} 0`,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

export const sectionTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.institutional.blue,
  marginBottom: vars.space.xs,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const sectionSubtitle = style({
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink4,
  marginTop: '-0.25rem',
  marginBottom: '0.75rem',
})

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const fieldLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink4,
})

export const grid2 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: vars.space.lg,
})

export const grid2ValuePeriod = style({
  display: 'grid',
  gridTemplateColumns: '2fr 3fr',
  gap: vars.space.lg,
})

export const grid3 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.lg,
})

export const grid4 = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: vars.space.lg,
})

export const grid4Contract = style({
  display: 'grid',
  gridTemplateColumns: '1.2fr 1.2fr 1.2fr 0.8fr',
  gap: vars.space.lg,
})

export const input = style({
  height: '2.5rem',
  padding: `0 ${vars.space.sm}`,
  fontFamily: vars.font.family.body,
  fontSize: '0.84375rem',
  color: vars.color.institutional.ink2,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 150ms',
  ':hover': {
    borderColor: vars.color.institutional.blueLine,
  },
  ':focus': {
    borderColor: vars.color.institutional.blue,
    boxShadow: `0 0 0 ${vars.borderWidth.thin} ${vars.color.institutional.blueLine}`,
  },
  ':disabled': {
    background: vars.color.institutional.paperWarm,
    color: vars.color.institutional.ink5,
    cursor: 'not-allowed',
  },
})

export const inputError = style({
  borderColor: vars.color.feedback.errorText,
  background: vars.color.feedback.errorBg,
  ':hover': {
    borderColor: vars.color.feedback.errorText,
  },
  ':focus': {
    borderColor: vars.color.feedback.errorText,
    boxShadow: `0 0 0 ${vars.borderWidth.thin} ${vars.color.feedback.errorText}`,
  },
})

export const fieldError = style({
  fontSize: '0.71875rem',
  color: vars.color.feedback.errorText,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  marginTop: vars.space.xs,
})

export const select = style({
  height: '2.5rem',
  padding: `0 ${vars.space.sm}`,
  fontFamily: vars.font.family.body,
  fontSize: '0.84375rem',
  color: vars.color.institutional.ink2,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  cursor: 'pointer',
  transition: 'border-color 150ms',
  ':hover': {
    borderColor: vars.color.institutional.blueLine,
  },
  ':focus': {
    borderColor: vars.color.institutional.blue,
    boxShadow: `0 0 0 ${vars.borderWidth.thin} ${vars.color.institutional.blueLine}`,
  },
})

export const textarea = style({
  minHeight: '2.5rem',
  padding: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: '0.84375rem',
  color: vars.color.institutional.ink2,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  resize: 'none',
  overflow: 'hidden',
  transition: 'border-color 150ms',
  ':hover': {
    borderColor: vars.color.institutional.blueLine,
  },
  ':focus': {
    borderColor: vars.color.institutional.blue,
    boxShadow: `0 0 0 ${vars.borderWidth.thin} ${vars.color.institutional.blueLine}`,
  },
})

export const footer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.md,
  height: '3.5rem',
  paddingInline: vars.space.lg,
  background: vars.color.institutional.paperWarm,
  borderTop: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  flexShrink: 0,
  position: 'fixed',
  bottom: 0,
  left: 'var(--sidebar-width, 260px)',
  right: 0,
  zIndex: 100,
})

export const buttonPrimary = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  height: '2.5rem',
  padding: `0 ${vars.space.lg}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.surface.default,
  background: vars.color.institutional.blue,
  border: 'none',
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  transition: 'background 150ms, box-shadow 150ms',
  ':hover': {
    background: vars.color.institutional.blueDeep,
  },
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
})

export const buttonSecondary = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  height: '2.5rem',
  padding: `0 ${vars.space.lg}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink4,
  background: vars.color.institutional.paperWarm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  transition: 'background 150ms, border-color 150ms',
  ':hover': {
    background: vars.color.institutional.paperBeige,
    borderColor: vars.color.institutional.ink5,
  },
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
})

export const sidebarCard = style({
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  padding: vars.space.lg,
})

export const valuePreview = style({
  fontFamily: vars.font.family.mono,
  color: vars.color.institutional.ink2,
  textAlign: 'center',
  lineHeight: 1.2,
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: '0.125rem',
})

export const valueCurrency = style({
  fontSize: '0.8125rem',
  fontWeight: vars.font.weight.medium,
})

export const valueInteger = style({
  fontSize: '1.5rem',
  fontWeight: vars.font.weight.bold,
})

export const valueCents = style({
  fontSize: '0.8125rem',
  fontWeight: vars.font.weight.medium,
})

export const valuePreviewLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink5,
  textAlign: 'center',
  marginBottom: vars.space.sm,
})

export const vigenciaPreview = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink3,
  textAlign: 'center',
  marginTop: vars.space.sm,
})

export const checklist = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

export const checklistItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: '0.71875rem',
  color: vars.color.institutional.ink4,
})

export const checklistDone = style({
  color: vars.color.institutional.green,
  fontWeight: vars.font.weight.semibold,
})

export const checklistCircle = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1rem',
  height: '1rem',
  borderRadius: '50%',
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  fontSize: '0.625rem',
  flexShrink: 0,
})

export const checklistCircleDone = style({
  background: vars.color.institutional.green,
  borderColor: vars.color.institutional.green,
  color: vars.color.surface.default,
})

/* Caixa de seleção do contratado (estado vazio — print v1) */
export const contractorBox = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: `${vars.space.lg} ${vars.space.md}`,
  background: vars.color.institutional.paperWarm,
  border: `${vars.borderWidth.thin} dashed ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  zIndex: 10,
})

export const contractorBoxIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: '50%',
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  color: vars.color.institutional.ink4,
  fontSize: vars.font.size.md,
  flexShrink: 0,
  cursor: 'pointer',
  ':hover': {
    borderColor: vars.color.institutional.blueLine,
    color: vars.color.institutional.blue,
  },
})

export const contractorBoxContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  flex: 1,
})

export const contractorBoxTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink2,
})

export const contractorBoxHint = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink5,
})

export const contractorBoxAction = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blue,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  flexShrink: 0,
  ':hover': {
    textDecoration: 'underline',
  },
})

/* Card do contratado selecionado (print v1) */
export const partnerCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: `${vars.space.md} ${vars.space.md}`,
  background: vars.color.institutional.paperWarm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
})

export const partnerCardBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  flex: 1,
  minWidth: 0,
})

export const partnerLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.institutional.ink5,
})

export const partnerBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.md,
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.semibold,
  background: vars.color.institutional.paperBeige,
  color: vars.color.institutional.ink3,
  width: 'fit-content',
})

export const partnerName = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
  lineHeight: 1.2,
})

export const partnerDoc = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink5,
})

export const partnerSwapButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  height: '2.25rem',
  padding: `0 ${vars.space.md}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blue,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  transition: 'background 120ms, border-color 120ms',
  flexShrink: 0,
  ':hover': {
    background: vars.color.institutional.paperWarm,
    borderColor: vars.color.institutional.blueLine,
  },
})

export const searchWrap = style({
  position: 'relative',
  zIndex: 200,
})

export const searchInputWrap = style({
  position: 'relative',
})

export const searchInputIcon = style({
  position: 'absolute',
  left: vars.space.sm,
  top: '50%',
  transform: 'translateY(-50%)',
  color: vars.color.institutional.ink5,
  fontSize: vars.font.size.sm,
  pointerEvents: 'none',
})

export const searchDropdown = style({
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.cardElevated,
  zIndex: 200,
  maxHeight: '16rem',
  overflowY: 'auto',
})

export const searchDropdownItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
  cursor: 'pointer',
  transition: 'background 80ms',
  ':hover': {
    background: vars.color.institutional.paperWarm,
  },
})

export const searchDropdownAvatar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.75rem',
  height: '1.75rem',
  borderRadius: '50%',
  background: vars.color.institutional.paperBeige,
  color: vars.color.institutional.ink3,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.bold,
  flexShrink: 0,
  textTransform: 'uppercase',
})

export const searchDropdownAvatarPrimary = style({
  background: vars.color.institutional.blue,
  color: vars.color.surface.default,
})

export const searchDropdownEmpty = style({
  padding: `${vars.space.md} ${vars.space.lg}`,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink5,
  textAlign: 'center',
})

export const searchDropdownNewPartner = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blue,
  cursor: 'pointer',
  borderTop: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  transition: 'background 80ms',
  ':hover': {
    background: vars.color.institutional.paperWarm,
  },
})

export const modalOverlay = style({
  position: 'fixed',
  inset: 0,
  background: vars.color.institutional.overlay,
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 300,
  padding: vars.space.md,
})

export const modalContent = style({
  position: 'relative',
  zIndex: 10,
  background: vars.color.surface.default,
  borderRadius: vars.radius.xl,
  boxShadow: vars.shadow.cardElevated,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  width: '100%',
  maxWidth: '32.5rem',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
})

export const modalHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${vars.space.md} ${vars.space.lg}`,
  background: vars.color.institutional.paperWarm,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const modalHeaderIcon = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  borderRadius: vars.radius.md,
  background: vars.color.institutional.blueBg,
  color: vars.color.institutional.blue,
  fontSize: vars.font.size.md,
  flexShrink: 0,
})

export const modalHeaderText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const modalSubtitle = style({
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink4,
})

export const modalTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const modalClose = style({
  width: '1.75rem',
  height: '1.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink4,
  cursor: 'pointer',
  fontSize: '0.875rem',
  transition: 'background 120ms, color 120ms',
  ':hover': {
    background: vars.color.institutional.paperRule,
    color: vars.color.institutional.ink2,
  },
})

export const modalBody = style({
  padding: `${vars.space.lg} ${vars.space.lg}`,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  overflowY: 'auto',
})

export const modalFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  padding: `${vars.space.md} ${vars.space.lg}`,
  background: vars.color.institutional.paperWarm,
  borderTop: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const summaryGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.md,
})

export const summaryCard = style({
  padding: vars.space.md,
  background: vars.color.institutional.paperWarm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
})

export const summaryCardLabel = style({
  fontSize: '0.5625rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink5,
  marginBottom: vars.space.xs,
})

export const summaryCardValue = style({
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const statusBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.md,
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.semibold,
})

export const statusBadgePending = style({
  background: vars.color.status.pendingBg,
  color: vars.color.status.pendingText,
})

export const statusBadgeActive = style({
  background: vars.color.status.activeBg,
  color: vars.color.status.activeText,
})

export const modalStatusRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
})

export const modalStatusLabel = style({
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink5,
})

export const fieldHint = style({
  fontSize: '0.71875rem',
  color: vars.color.institutional.ink5,
  marginTop: vars.space.xs,
})

export const fieldHintError = style({
  fontSize: '0.71875rem',
  color: vars.color.feedback.errorText,
  marginTop: vars.space.xs,
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
})

export const uploadZone = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.lg,
  padding: vars.space.lg,
  border: `${vars.borderWidth.thick} dashed ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  background: vars.color.institutional.paperWarm,
  cursor: 'pointer',
  transition: 'border-color 150ms, background 150ms',
  ':hover': {
    borderColor: vars.color.institutional.blueLine,
    background: vars.color.institutional.blueBg,
  },
})

export const uploadZoneActive = style({
  borderColor: vars.color.institutional.blue,
  background: vars.color.institutional.blueBg,
})

export const uploadIconWrap = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: vars.color.institutional.ink4,
})

export const uploadFileInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  minWidth: 0,
  flex: 1,
})

export const uploadFileName = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const uploadFileSize = style({
  fontSize: '0.71875rem',
  color: vars.color.institutional.ink5,
})

export const uploadAction = style({
  fontSize: '0.71875rem',
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blue,
  flexShrink: 0,
  marginLeft: 'auto',
})

export const uploadText = style({
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink4,
})

export const uploadHint = style({
  fontSize: '0.71875rem',
  color: vars.color.institutional.ink5,
})

/* ── Aside (sidebar direito da tela contratos/criar) ── */

export const asideSection = style({
  padding: vars.space.lg,
  ':after': {
    content: '""',
    display: 'block',
    marginTop: vars.space.lg,
    borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  },
})

export const asideSectionLast = style({
  padding: vars.space.lg,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
})

export const asideLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.institutional.blue,
  marginBottom: vars.space.sm,
})

export const asideValueWrap = style({
  fontFamily: vars.font.family.mono,
  color: vars.color.institutional.ink2,
  lineHeight: 1.2,
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.125rem',
})

export const asideValueEmpty = style({
  color: vars.color.institutional.ink5,
})

export const asideValueCurrency = style({
  fontSize: '0.8125rem',
  fontWeight: vars.font.weight.medium,
})

export const asideValueInteger = style({
  fontSize: '1.5rem',
  fontWeight: vars.font.weight.bold,
  letterSpacing: '-0.02em',
})

export const asideValueCents = style({
  fontSize: '0.8125rem',
  fontWeight: vars.font.weight.medium,
})

export const vigenciaCard = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: vars.space.sm,
  background: vars.color.institutional.paperWarm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  padding: `${vars.space.sm} ${vars.space.md}`,
})

export const vigenciaCardItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
})

export const vigenciaCardLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.59375rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink5,
})

export const vigenciaCardValue = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.78125rem',
  color: vars.color.institutional.ink2,
})

export const vigenciaCardValueEmpty = style({
  color: vars.color.institutional.ink5,
})

export const vigenciaArrow = style({
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink5,
})

export const checklistAside = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
})

export const checklistAsideItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: '0.78125rem',
  color: vars.color.institutional.ink5,
  transition: 'color 150ms',
})

export const checklistAsideItemDone = style({
  color: vars.color.institutional.green,
  fontWeight: vars.font.weight.medium,
})

export const checklistAsideCircle = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1rem',
  height: '1rem',
  borderRadius: '50%',
  background: vars.color.institutional.paperRule,
  flexShrink: 0,
})

export const checklistAsideCircleDone = style({
  background: vars.color.institutional.green,
  color: vars.color.surface.default,
})

export const checklistProgress = style({
  marginTop: vars.space.md,
  paddingTop: vars.space.sm,
  borderTop: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const checklistProgressLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink5,
})

export const checklistProgressValue = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const noteText = style({
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink5,
  fontStyle: 'italic',
})

export const modalBodyText = style({
  marginBottom: vars.space.lg,
  color: vars.color.institutional.ink3,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const errorAlert = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
})
