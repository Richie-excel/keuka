import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RoleBadges } from "@/components/role-badge";
import { User, KeyRound, HelpCircle, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function UserMenu() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const initials = user.fullName.split(' ').map((n) => n[0]).join('').toLocaleUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-cocoa-700 text-sm font-semibold text-white"
        aria-label={user.fullName}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-cocoa-100 bg-white p-1.5 shadow-lg">
          <div className="border-b border-cocoa-100 px-2.5 py-2">
            <p className="truncate text-sm font-medium text-cocoa-900 ">{user.fullName}</p>
            {/* One badge per role (the label used to join the whole list into one key). */}
            <RoleBadges roles={user.roles} className="mt-1" />
          </div>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-cocoa-900 hover:bg-cocoa-50"
          >
            <User className="h-4 w-4" />
            {t('profile.title')}
          </Link>
          <Link
            to="/auth/change-password"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-cocoa-900 hover:bg-cocoa-50"
          >
            <KeyRound className="h-4 w-4" />
            {t('changePassword.title')}
          </Link>
          <Link
            to="/help"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-cocoa-900 hover:bg-cocoa-50"
          >
            <HelpCircle className="h-4 w-4" />
            {t('help.title')}
          </Link>
          <button
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-rust-700 hover:bg-rust-100"
          >
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
