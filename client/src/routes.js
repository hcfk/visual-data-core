import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const FileQueues = React.lazy(() => import('./queues/FileQueues'))
const FileUpload = React.lazy(() => import('./queues/FileUpload'))
const YouTubeLinkQueue = React.lazy(() => import('./queues/YouTubeLinkQueue'))
//USer
const ProfileUpdate = React.lazy(() => import('./admin/profileUpdate'))
const PasswordChange = React.lazy(() => import('./admin/passwordChange'))
const Notifiers = React.lazy(() => import('./notifiers/notifiers'))
const NotifiersList = React.lazy(() => import('./notifiers/notifiersList'))
//admin
const UserManagement = React.lazy(() => import('./admin/userManagement'))
//talents
const Chat = React.lazy(() => import('./talents/Chat'))

const Charts = React.lazy(() => import('./views/charts/Charts'))

// Icons

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/queues/filequeues', name: 'FileQueues', element: FileQueues },
  { path: '/queues/fileupload', name: 'FileUpload', element: FileUpload },
  { path: '/queues/youtubelinkqueue', name: 'YouTubeLinkQueue', element: YouTubeLinkQueue },
  { path: '/admin/profileUpdate', name: 'ProfileUpdate', element: ProfileUpdate },
  { path: '/admin/passwordChange', name: 'PasswordChange', element: PasswordChange },
  { path: '/admin/userManagement', name: 'UserManagement', element: UserManagement },
  { path: '/notifiers/notifiers', name: 'Notifiers', element: Notifiers },
  {
    path: '/notifiers/notifiersList',
    name: 'NotifiersList',
    element: NotifiersList,
  },
  { path: '/talents/chat', name: 'Chat', element: Chat },
]

export default routes
