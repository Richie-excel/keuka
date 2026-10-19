import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { navItemsForUser } from '@/shared/layout/nav-config'
import { useAuth } from '../hooks/useAuth'

/**
 * SHARED-03 "Application Search" in the PRD. This searches PAGES the
 * person can navigate to, not business records (purchases, farmers) — that
 * kind of data search needs a real backend and belongs on each list
 * screen's own search/filter bar (per the PRD's "Search and Filtering"
 * section), not bolted onto this global shell search.
 */
export function SearchPalette() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const items = useMemo(() => (user ? navItemsForUser(user) : []), [user])
  const results = useMemo(
    () => items.filter((item) => t(item.labelKey).toLowerCase().includes(query.toLowerCase())),
    [items, query, t],
  )

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuery('')
    }
  }

  function selectPage(path: string) {
    setQuery('')
    setOpen(false)
    navigate(path)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon-lg" aria-label={t('search.openSearch')} className='px-2.5 py-3 hover:bg-cocoa-50'>
          <Search className='h-5 w-5' />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-24 translate-y-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('search.openSearch')}</DialogTitle>
          <DialogDescription>{t('search.placeholder')}</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
        />
        <div className="max-h-72 overflow-y-auto hide-scrollbar">
          {results.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              {t('search.noResults', { query })}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className="justify-start text-left"
                  onClick={() => selectPage(item.path)}
                >
                  {t(item.labelKey)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
