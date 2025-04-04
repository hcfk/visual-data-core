import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilNotes,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Management Panel',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: { color: 'info', text: 'NEW' },
  },
/*  ****Will be updated  {
    component: CNavGroup,
    name: 'Process Management',
    to: '/queues',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    items: [
      { component: CNavItem, name: 'İşlem Sıraları Durumu', to: '/queues/filequeues' },
      { component: CNavItem, name: 'Dosya Yükleme', to: '/queues/fileupload' },
      { component: CNavItem, name: 'Youtube İndirme', to: '/queues/youtubelinkqueue' },
      { component: CNavItem, name: 'İşlem Uyarıları', to: '/notifiers/notifiersList' },
    ],
  }, */
  {
    component: CNavGroup,
    name: 'Yetenekler',
    to: '/talents',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    items: [{ component: CNavItem, name: 'Metin Üret', to: '/talents/chat' }],
  },
  {
    component: CNavGroup,
    name: 'Kullanıcı İşlemleri',
    to: '/admin',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    items: [
      { component: CNavItem, name: 'Profilimi Güncelle', to: '/admin/profileUpdate' },
      { component: CNavItem, name: 'Şifremi Değiştir', to: '/admin/passwordChange' },
    ],
  },
  {
    component: CNavGroup,
    name: 'Yönetici İşlemleri',
    to: '/admin',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    items: [{ component: CNavItem, name: 'Kullanıcı Yönetimi', to: '/admin/userManagement' }],
  },

  // Additional components, forms, charts, icons, etc.
]

export default _nav
