'use client'

import { PAGES } from '@/utils/menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { Fragment, useState, useEffect } from 'react'
import { MdOutlineExpandLess, MdOutlineExpandMore } from 'react-icons/md'

export default function ListMenu() {
  const [open, setOpen] = useState('')
  const [openSub, setOpenSub] = useState('')
  const [selectedPage, setSelectedPage] = useState('')
  const [selectedPageBorder, setSelectedPageBorder] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Sincroniza seleção com a rota atual
  useEffect(() => {
    const currentPath = location.pathname
    for (const page of PAGES) {
      for (const item of page.items) {
        if (item.path === currentPath) {
          setSelectedPage(item.ARE_NOME)
          setSelectedPageBorder(page.ARE_NOME)
          setOpen(page.ARE_NOME)
          return
        }
        for (const sub of item.subPages || []) {
          if (sub.path === currentPath) {
            setSelectedPage(sub.ARE_NOME)
            setSelectedPageBorder(page.ARE_NOME)
            setOpen(page.ARE_NOME)
            setOpenSub(item.ARE_NOME)
            return
          }
        }
      }
    }
  }, [location.pathname])

  const handleOpen = (name: string) => {
    setOpen((prev) => (prev === name ? '' : name))
  }

  const handleOpenSub = (name: string) => {
    setOpenSub((prev) => (prev === name ? '' : name))
  }

  return (
    <nav
      className="bg-erp-nav text-white w-full"
      onMouseLeave={() => {
        setOpen('')
        setOpenSub('')
      }}
    >
      {PAGES.map((page, index) => (
        <Fragment key={index}>
          <Collapsible open={open === page.ARE_NOME} onOpenChange={() => handleOpen(page.ARE_NOME)}>
            <CollapsibleTrigger asChild>
              <button
                data-test={page.ARE_NOME}
                className="w-full text-left flex items-center gap-2 px-3 py-2.5 outline-none transition-colors"
                style={{
                  height: 50,
                  borderLeft:
                    selectedPageBorder === page.ARE_NOME ? '4px solid #32C6F4' : '4px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#009FD0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                <span
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    paddingLeft: selectedPageBorder === page.ARE_NOME ? 0 : 4,
                  }}
                >
                  {page.icon}
                </span>
                <span
                  className="whitespace-nowrap flex-1"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500 }}
                >
                  {page.grupo}
                </span>
                {open === page.ARE_NOME ? (
                  <MdOutlineExpandLess size={24} />
                ) : (
                  <MdOutlineExpandMore size={24} />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-col">
                {page.items.map((item) => (
                  <Fragment key={item.ARE_NOME}>
                    {item.subPages.length > 0 ? (
                      <Collapsible
                        open={openSub === item.ARE_NOME}
                        onOpenChange={() => handleOpenSub(item.ARE_NOME)}
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            data-test={item.ARE_NOME}
                            className="w-full text-left flex items-center px-6 py-2.5 outline-none transition-colors"
                            style={{
                              backgroundColor:
                                selectedPage === item.ARE_NOME ? '#E8EEF0' : '#3B4267',
                              color: selectedPage === item.ARE_NOME ? '#464E78' : '#fff',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 14,
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#004678'
                              e.currentTarget.style.color = 'white'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                selectedPage === item.ARE_NOME ? '#E8EEF0' : '#3B4267'
                              e.currentTarget.style.color =
                                selectedPage === item.ARE_NOME ? '#464E78' : '#fff'
                            }}
                          >
                            <span className="flex-1">{item.name}</span>
                            {openSub === item.ARE_NOME ? (
                              <MdOutlineExpandLess size={24} />
                            ) : (
                              <MdOutlineExpandMore size={24} />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="flex flex-col">
                            {item.subPages.map((sub) => (
                              <button
                                key={sub.ARE_NOME}
                                data-test={sub.ARE_NOME}
                                className="w-full text-left px-8 py-2.5 outline-none transition-colors"
                                style={{
                                  backgroundColor:
                                    selectedPage === sub.ARE_NOME ? '#E8EEF0' : '#3B4267',
                                  color: selectedPage === sub.ARE_NOME ? '#464E78' : '#fff',
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: 14,
                                  fontWeight: 500,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#004678'
                                  e.currentTarget.style.color = 'white'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    selectedPage === sub.ARE_NOME ? '#E8EEF0' : '#3B4267'
                                  e.currentTarget.style.color =
                                    selectedPage === sub.ARE_NOME ? '#464E78' : '#fff'
                                }}
                                onClick={() => {
                                  navigate({ to: sub.path })
                                  setSelectedPage(sub.ARE_NOME)
                                  setSelectedPageBorder(page.ARE_NOME)
                                }}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <button
                        data-test={item.ARE_NOME}
                        className="w-full text-left px-6 py-2.5 outline-none transition-colors"
                        style={{
                          backgroundColor:
                            selectedPage === item.ARE_NOME ? '#E8EEF0' : '#3B4267',
                          color: selectedPage === item.ARE_NOME ? '#464E78' : '#fff',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#004678'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            selectedPage === item.ARE_NOME ? '#E8EEF0' : '#3B4267'
                          e.currentTarget.style.color =
                            selectedPage === item.ARE_NOME ? '#464E78' : '#fff'
                        }}
                        onClick={() => {
                          navigate({ to: item.path })
                          setSelectedPage(item.ARE_NOME)
                          setSelectedPageBorder(page.ARE_NOME)
                        }}
                      >
                        {item.name}
                      </button>
                    )}
                  </Fragment>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Fragment>
      ))}
    </nav>
  )
}
