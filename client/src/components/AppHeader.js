import React, { useEffect, useState, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CBadge,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
  CPopover,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilContrast,
  cilEnvelopeOpen,
  cilList,
  cilMenu,
  cilMoon,
  cilSun,
} from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'

// Import your notifiers fetching action or API
import { toggleSidebar, setSidebarVisibility } from '../store/slices/uiSlice' // Import actions from uiSlice

import { fetchUnreadNotifiersCount } from '../notifiers/notifiers' // Adjust path if necessary
const AppHeader = () => {
  const user = useSelector((state) => state.auth.user) // Access user data from Redux
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const unfoldable = useSelector((state) => state.ui.unfoldable) // Access unfoldable state
  const sidebarShow = useSelector((state) => state.ui.sidebarShow) // Access sidebarShow state
  const dispatch = useDispatch()

  // State to manage unread count and notifier list
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifiers, setNotifiers] = useState([])

  useEffect(() => {
    // Add scroll effect for header shadow
    const handleScroll = () => {
      if (headerRef.current) {
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
      }
    }
    document.addEventListener('scroll', handleScroll)

    return () => {
      document.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (user) {
      // Polling for unread notifiers
      const fetchUnreadCount = async () => {
        const count = await fetchUnreadNotifiersCount(user.id)
        setUnreadCount(count)
      }
      fetchUnreadCount()

      const intervalId = setInterval(fetchUnreadCount, 60000) // Poll every 60 seconds
      return () => clearInterval(intervalId) // Cleanup interval on unmount
    }
  }, [user])

  const handleNotifiersClick = async () => {
    if (user) {
      const notifierList = await fetchNotifiers(user.id)
      setNotifiers(notifierList)
    }
  }

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => dispatch(toggleSidebar())} // Toggle unfoldable state
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderNav className="d-none d-md-flex">
          <CNavItem>
            <CNavLink to="/dashboard" as={NavLink}>
              Dashboard
            </CNavLink>
          </CNavItem>
        </CHeaderNav>
        <CHeaderNav className="ms-auto">
          <CNavItem>
            <CNavLink href="#">
              <CIcon icon={cilBell} size="lg" />
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink href="#">
              <CIcon icon={cilList} size="lg" />
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink href="#" onClick={handleNotifiersClick} style={{ position: 'relative' }}>
              {/* Envelope Icon */}
              <CIcon
                icon={cilEnvelopeOpen}
                size="lg"
                style={{ color: unreadCount > 0 ? 'red' : 'green' }}
                title={unreadCount > 0 ? `${unreadCount} unread messages` : 'No unread messages'}
              />

              {/* Badge for Unread Messages */}
              {unreadCount > 0 && (
                <CBadge
                  className="border border-light"
                  color="danger"
                  shape="rounded-circle"
                  style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    transform: 'translate(50%, -50%)',
                    fontSize: '0.75rem',
                    padding: '0.25em 0.5em',
                  }}
                >
                  {unreadCount}
                  <span className="visually-hidden">unread messages</span>
                </CBadge>
              )}
            </CNavLink>
          </CNavItem>
        </CHeaderNav>
        <CHeaderNav>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false}>
              {colorMode === 'dark' ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === 'auto' ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                active={colorMode === 'light'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('light')}
              >
                <CIcon className="me-2" icon={cilSun} size="lg" /> Light
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('dark')}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('auto')}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>
      <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
