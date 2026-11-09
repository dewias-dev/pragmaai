import { useEffect, useState } from 'react'
import { loadNotifications } from '../services/notificationService.js'
import { useAuth } from './useAuth.js'

/** Mengambil notifikasi pengguna yang sedang login. */
export function useNotifications() {
  const { user, isAdmin } = useAuth()
  const userId = user?.id
  const [state, setState] = useState({ key: null, items: [] })
  const key = `${userId}|${isAdmin}`

  useEffect(() => {
    if (!userId) return
    let active = true
    loadNotifications({ userId, isAdmin })
      .then((items) => active && setState({ key, items }))
      .catch(() => active && setState({ key, items: [] }))
    return () => {
      active = false
    }
  }, [userId, isAdmin, key])

  return { loading: state.key !== key, items: state.key === key ? state.items : [] }
}
