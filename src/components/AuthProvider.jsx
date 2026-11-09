import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../lib/authContext.js'
import { supabase } from '../lib/supabase.js'
import { getProfile } from '../services/profileService.js'

/**
 * Menyimpan status login untuk seluruh aplikasi:
 * - session: sesi Supabase Auth (null jika belum login)
 * - profile: baris tabel profiles (nama, institusi, role)
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)
  // Profil disimpan bersama id pemiliknya, sehingga profil akun lama tidak pernah tertukar.
  const [profileState, setProfileState] = useState({ userId: null, status: 'idle', data: null, error: null })

  // 1. Ambil sesi yang tersimpan dan dengarkan perubahan login/logout.
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setSessionReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setSessionReady(true)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id ?? null

  const fetchProfile = useCallback(async (id) => {
    try {
      const data = await getProfile(id)
      setProfileState({ userId: id, status: data ? 'ready' : 'missing', data, error: null })
    } catch (error) {
      setProfileState({ userId: id, status: 'error', data: null, error })
    }
  }, [])

  // 2. Ambil profil setiap kali pengguna yang login berganti.
  useEffect(() => {
    if (!userId) return
    // Ditunda sedikit agar tidak bertabrakan dengan proses login Supabase.
    const timer = setTimeout(() => fetchProfile(userId), 0)
    return () => clearTimeout(timer)
  }, [userId, fetchProfile])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    // Jika server tidak dapat dihubungi, tetap hapus sesi di browser ini.
    if (error) await supabase.auth.signOut({ scope: 'local' })
  }, [])

  // Memuat ulang profil di latar belakang (misalnya setelah profil diedit) tanpa layar memuat.
  const refreshProfile = useCallback(() => (userId ? fetchProfile(userId) : Promise.resolve()), [userId, fetchProfile])

  const profileCurrent = Boolean(userId) && profileState.userId === userId
  const profile = profileCurrent ? profileState.data : null
  const profileStatus = !userId ? 'idle' : profileCurrent ? profileState.status : 'loading'

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileStatus,
      profileError: profileCurrent ? profileState.error : null,
      isAdmin: profile?.role === 'admin',
      loading: !sessionReady || profileStatus === 'loading',
      signOut,
      refreshProfile,
    }),
    [session, profile, profileStatus, profileCurrent, profileState.error, sessionReady, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
