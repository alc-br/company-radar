'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Radar, Home, Clock, FileText, CalendarDays, Megaphone, UserCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type PortalSession = { contactId: string; clientId: string; clientName: string; contactName: string }

function getPortalSession(): PortalSession | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('cr_portal') || 'null') } catch { return null }
}

const navItems = [
  { label: 'Início', href: '/portal', icon: Home },
  { label: 'Pendências', href: '/portal/pendencias', icon: Clock },
  { label: 'Documentos', href: '/portal/documentos', icon: FileText },
  { label: 'Cronograma', href: '/portal/cronograma', icon: CalendarDays },
  { label: 'Comunicados', href: '/portal/comunicados', icon: Megaphone },
  { label: 'Perfil', href: '/portal/perfil', icon: UserCircle },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session] = useState<PortalSession | null>(() => getPortalSession())

  useEffect(() => {
    if (!session) { router.replace('/login') }
  }, [session, router])

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb]">
          <Radar className="h-6 w-6 text-white animate-pulse" />
        </div>
      </div>
    )
  }

  function handleLogout() {
    localStorage.removeItem('cr_portal')
    toast.success('Você saiu do portal.')
    router.replace('/login')
  }

  function isActive(href: string) {
    if (href === '/portal') return pathname === '/portal'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border bg-white px-4 lg:px-6">
        <Link href="/portal" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb]">
            <Radar className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-tight hidden sm:inline">Company <span className="text-[#2563eb]">Radar</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-1 ml-8">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-[#2563eb]/10 text-[#2563eb]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />{item.label}
              </Link>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-medium hidden sm:inline">{session.clientName}</span>
          <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className="sr-only">Menu</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-b bg-white p-3 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${active ? 'bg-[#2563eb]/10 text-[#2563eb]' : 'text-muted-foreground hover:bg-muted'}`}>
                <Icon className="h-4 w-4" />{item.label}
              </Link>
            )
          })}
        </nav>
      )}

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl p-4 lg:p-6">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-4 px-4 lg:px-6">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Company Radar. Acesso ao portal é concedido pela sua contabilidade. Os dados são confidenciais e protegidos conforme a LGPD.
        </p>
      </footer>
    </div>
  )
}
