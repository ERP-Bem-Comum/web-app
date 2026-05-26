'use client'

import { Modal } from '@mui/material'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  url: string | null
  title: string
}

export const ModalPreviewPDF = ({ open, onClose, url, title }: Props) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: {
            background: 'rgba(31, 28, 26, 0.55)',
            backdropFilter: 'blur(4px)',
          },
        },
      }}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          width: '880px',
          maxWidth: 'calc(100vw - 40px)',
          height: '90vh',
          background: '#fff',
          borderRadius: '12px',
          border: '0.5px solid #e5ded4',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '0.5px solid #e5ded4',
            background: '#faf7f2',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 700,
                color: '#1f1c1a',
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h3>
            <span
              style={{
                fontFamily: 'ui-monospace, JetBrains Mono, monospace',
                fontSize: '10.5px',
                fontWeight: 500,
                color: '#736b61',
                flexShrink: 0,
              }}
            >
              PDF
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#736b61',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 120ms',
              flexShrink: 0,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = '#f2ede5')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'none')
            }
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — PDF viewer */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#f2ede5' }}>
          {url ? (
            <object
              data={url}
              type="application/pdf"
              title={title}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999187',
                  fontSize: '13px',
                }}
              >
                Não foi possível carregar o PDF neste visualizador.
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: '#155366' }}>
                  Abrir em nova aba
                </a>
              </div>
            </object>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999187',
                fontSize: '13px',
              }}
            >
              Nenhum documento disponível para visualização
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
