'use client'
import { PAGES } from '@/utils/menu'
import { Collapse, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'
import { MdOutlineExpandLess, MdOutlineExpandMore, MdOutlineNightShelter } from 'react-icons/md'

export default function ListMenu() {
  const [open, setOpen] = useState('')
  const [openSub, setOpenSub] = useState('')
  const [selectedPage, setSelectedPage] = useState('')
  const [selectedPageBorder, setSelectedPageBorder] = useState('')
  const [onHover, setOnHover] = useState(false)
  const router = useRouter()

  const handleOpen = (name: string) => {
    if (open === name) {
      setOpen('')
    } else {
      setOpen(name)
    }
  }

  const handleOpenSub = (name: string) => {
    if (openSub === name) {
      setOpenSub('')
    } else {
      setOpenSub(name)
    }
  }

  return (
    <List
      onMouseLeave={() => {
        setOpen('')
        setOpenSub('')
        setOnHover(false)
      }}
      onMouseEnter={() => {
        setOnHover(true)
      }}
      component="nav"
      aria-labelledby="nested-list-subheader"
      sx={{ width: '100%' }}
      className="bg-erp-nav text-white "
    >
      <ListItemButton
        key={'dashboard'}
        data-test="dashboard"
        sx={{
          width: '100%',
          height: '50px',
          py: '10px',
          backgroundColor: selectedPage === 'dashboard' ? '#E8EEF0' : '#464E78',
          color: selectedPage === 'dashboard' ? '#464E78' : 'white',
          '&:hover': {
            backgroundColor: '#009FD0',
            color: 'white',
          },
          '&:active': {
            backgroundColor: 'white',
            color: '#464E78',
          },
        }}
        onClick={() => {
          router.push('/')
          setSelectedPage('dashboard')
          setSelectedPageBorder('dashboard')
        }}
      >
        <ListItemIcon sx={{ pl: '4px', minWidth: 0, width: '40px !important' }}>
          <MdOutlineNightShelter
            size={20}
            color={selectedPage === 'dashboard' ? '#464E78' : '#FFF'}
          />
        </ListItemIcon>
        {onHover && (
          <ListItemText
            primary="Dashboard"
            primaryTypographyProps={{
              style: {
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: '500',
              },
            }}
          />
        )}
      </ListItemButton>
      {PAGES.map((page, index) => {
        return (
          <Fragment key={index}>
            <ListItemButton
              data-test={page.ARE_NOME}
              key={`${index}-pages`}
              sx={{
                height: '50px',
                py: '10px',
                textAlign: 'left',
                borderLeft: selectedPageBorder === page.ARE_NOME ? '4px solid #32C6F4' : 'none',
                '&:hover': {
                  backgroundColor: '#009FD0',
                  color: 'white',
                },
                '&:active': {
                  backgroundColor: 'white',
                  color: '#464E78',
                },
              }}
              onClick={() => handleOpen(page.ARE_NOME)}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  width: '40px !important',
                  paddingLeft: selectedPageBorder === page.ARE_NOME ? '0' : '4px',
                }}
              >
                {page.icon}
              </ListItemIcon>
              {onHover && (
                <Fragment>
                  <ListItemText
                    primary={page.grupo}
                    sx={{
                      whiteSpace: 'nowrap',
                    }}
                    primaryTypographyProps={{
                      style: {
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 14,
                        fontWeight: '500',
                      },
                    }}
                  />
                  {open === page.ARE_NOME ? (
                    <MdOutlineExpandLess size={24} />
                  ) : (
                    <MdOutlineExpandMore size={24} />
                  )}
                </Fragment>
              )}
            </ListItemButton>
            <Collapse
              in={open === page.ARE_NOME}
              timeout="auto"
              unmountOnExit
              key={`${index}-collapse`}
            >
              <List component="div" disablePadding>
                {page.items.map((item, index) => {
                  return (
                    <Fragment key={index}>
                      <ListItemButton
                        data-test={item.ARE_NOME}
                        sx={{
                          pl: 4,
                          backgroundColor: selectedPage === item?.ARE_NOME ? '#E8EEF0' : '#3B4267',
                          color: selectedPage === item?.ARE_NOME ? '#464E78' : '#fff',
                          '&:hover': {
                            backgroundColor: '#004678',
                            color: 'white',
                          },
                          '&:active': {
                            backgroundColor: 'white',
                            color: '#464E78',
                          },
                        }}
                        key={item.ARE_NOME}
                        onClick={() =>
                          item.subPages.length > 0
                            ? handleOpenSub(item.ARE_NOME)
                            : (router.push(item.path),
                              setSelectedPage(item.ARE_NOME),
                              setSelectedPageBorder(page.ARE_NOME))
                        }
                      >
                        <ListItemText
                          primary={item.name}
                          primaryTypographyProps={{
                            style: {
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 14,
                              fontWeight: '500',
                            },
                          }}
                        />
                        {item.subPages.length > 0 &&
                          (openSub === item.ARE_NOME ? (
                            <MdOutlineExpandLess size={24} />
                          ) : (
                            <MdOutlineExpandMore size={24} />
                          ))}
                      </ListItemButton>
                      {item.subPages.length > 0 && (
                        <Collapse
                          in={openSub === item.ARE_NOME}
                          key={`${index}-subcollapse`}
                          timeout="auto"
                          unmountOnExit
                        >
                          <List component="div" disablePadding>
                            {item?.subPages?.map(
                              (sub: { ARE_NOME: string; path: string; name: string }) => {
                                return (
                                  <ListItemButton
                                    data-test={sub?.ARE_NOME}
                                    sx={{
                                      pl: 5,
                                      backgroundColor:
                                        selectedPage === sub?.ARE_NOME ? '#E8EEF0' : '#3B4267',
                                      color: selectedPage === sub?.ARE_NOME ? '#464E78' : '#fff',
                                      '&:hover': {
                                        backgroundColor: '#004678',
                                        color: 'white',
                                      },
                                      '&:active': {
                                        backgroundColor: 'white',
                                        color: '#464E78',
                                      },
                                    }}
                                    key={sub.ARE_NOME}
                                    onClick={() => {
                                      router.push(sub?.path)
                                      setSelectedPage(sub?.ARE_NOME)
                                      setSelectedPageBorder(page.ARE_NOME)
                                    }}
                                  >
                                    <ListItemText
                                      primary={sub?.name}
                                      primaryTypographyProps={{
                                        style: {
                                          fontFamily: 'Inter, sans-serif',
                                          fontSize: 14,
                                          fontWeight: '500',
                                        },
                                      }}
                                    />
                                  </ListItemButton>
                                )
                              },
                            )}
                          </List>
                        </Collapse>
                      )}
                    </Fragment>
                  )
                })}
              </List>
            </Collapse>
          </Fragment>
        )
      })}
    </List>
  )
}
