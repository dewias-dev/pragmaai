import { useContext } from 'react'
import { AuthContext } from '../lib/authContext.js'

/**
 * Mengambil data login di komponen mana pun:
 * const { user, profile, isAdmin, signOut } = useAuth()
 */
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth harus dipakai di dalam <AuthProvider>.')
  return value
}
