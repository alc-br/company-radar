'client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Radar,
  LayoutDashboard,
  Building2,
  Layers,
  CheckSquare,
  CalendarDays,
  FileText,
  BarChart3,
  Users,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Building,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
type Session = {
  userId: string
  email: string
  name: string
  orgId: string
  role: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

// ── Helpers ────────────────────────────────────────────────
function readSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('cr_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const emptySubscribe = () => () => {}

// ── Sidebar Component (declared outside) ────────────────────
function SidebarContent({
  session,
  orgName,
  sidebarCollapsed,
  navItems,
  isActive,
  initials,
  onNavClick,
  onLogout,
}: {
  session: Session
  orgName: string
  sidebarCollapsed: boolean
  navItems: NavItem[]
  isActive: (href: string) => boolean
  initials: string
  onNavClick: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2563eb]">
          <Radar className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight">
            Company <span className="text-[#2563eb]">Radar</span>
          </span>
        )}
      </div>

      {/* Org Name */}
      {!sidebarCollapsed && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
          <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium text-muted-foreground">
            {orgName || <Skeleton className="h-4 w-32" />}
          </span>
        </div>
      )}

      <Separator className="mx-3" />

      {/* Nav Items */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-0.5" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={onNavClick}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      ${
                        active
                          ? 'bg-[#2563eb]/10 text-[#2563eb]'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    aria-current={active ? 'page' : undefined}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#2563eb]" />
                    )}
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-[#2563eb]' : ''}`} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                    {!sidebarCollapsed && item.badge && item.badge > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-auto h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px] font-bold"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                    {sidebarCollapsed && item.badge && item.badge > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator className="mx-3" />

      {/* User Footer */}
      <div className="p-3">
        {sidebarCollapsed ? (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-muted cursor-pointer">
                  <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{session.name}</p>
                <p className="text-xs text-muted-foreground">{session.role || 'Membro'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-[#2563eb]/10 text-[#2563eb] text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{session.name}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {session.role === 'admin' ? 'Administrador' : session.role === 'owner' ? 'Proprietário' : 'Colaborador'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onLogout}
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Layout ────────────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const [session] = useState<Session | null>(() => readSession())
  const [orgName, setOrgName] = useState<string>('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadNotif, setUnreadNotif] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    clients: Array<{ id: string; name: string; cnpj: string; status: string }>
    tasks: Array<{ id: string; title: string; status: string; priority: string; client?: { name: string } }>
    templates: Array<{ id: string; name: string; description: string; category: string }>
  } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const sessionChecked = useRef(false)

  function handleLogout() {
    localStorage.removeItem('cr_session')
    toast.success('Você saiu da sua conta.')
    router.replace('/login')
  }

  function closeMobileMenu() {
    setMobileOpen(false)
  }

  // Check session on mount, fetch org & notifications
  useEffect(() => {
    if (sessionChecked.current) return
    sessionChecked.current = true
    if (!session) {
      router.replace('/login')
      return
    }
    fetch('/api/organizations')
      .then((r) => (r.ok ? r.json() : null))
      .then((org) => { if (org) setOrgName(org.name || 'Minha Organização') })
      .catch(() => setOrgName('Minha Organização'))
    fetch('/api/notifications')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setUnreadNotif(data.unread || 0) })
      .catch(() => {})
  }, [router, session])

  // Search with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) return
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data)
        setSearchOpen(true)
      } catch {
        // ignore
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      setSearchResults(null)
      setSearchOpen(false)
    }
  }, [searchQuery])

  // Close search on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('[data-search-area]')) {
        setSearchOpen(false)
      }
    }
    if (searchOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [searchOpen])

  const initials = session?.name
    ? session.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  const navItems: NavItem[] = [
    { label: 'Visão Geral', href: '/app', icon: LayoutDashboard },
    { label: 'Meu Trabalho', href: '/app/meu-trabalho', icon: CheckSquare },
    { label: 'Empresas', href: '/app/empresas', icon: Building2 },
    { label: 'Templates', href: '/app/templates', icon: Layers },
    { label: 'Tarefas', href: '/app/tarefas', icon: CheckSquare },
    { label: 'Calendário', href: '/app/calendario', icon: CalendarDays },
    { label: 'Documentos', href: '/app/documentos', icon: FileText },
    { label: 'Relatórios', href: '/app/relatorios', icon: BarChart3 },
    { label: 'Equipe', href: '/app/equipe', icon: Users },
    { label: 'Notificações', href: '/app/notificacoes', icon: Bell, badge: unreadNotif },
    { label: 'Assinatura', href: '/app/assinatura', icon: CreditCard },
    { label: 'Configurações', href: '/app/configuracoes', icon: Settings },
    { label: 'Ajuda', href: '/app/ajuda', icon: HelpCircle },
  ]

  function isActive(href: string) {
    if (href === '/app') return pathname === '/app'
    return pathname.startsWith(href)
  }

  if (!mounted || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb]">
            <Radar className="h-6 w-6 text-white animate-pulse" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col border-r border-border bg-white transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-[70px]' : 'w-[280px]'
          }`}
        >
          <SidebarContent
            session={session}
            orgName={orgName}
            sidebarCollapsed={sidebarCollapsed}
            navItems={navItems}
            isActive={isActive}
            initials={initials}
            onNavClick={closeMobileMenu}
            onLogout={handleLogout}
          />
          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-5 z-10 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-muted-foreground hover:text-foreground transition-colors"
            style={{ left: sidebarCollapsed ? '58px' : '268px' }}
            aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navegação</SheetTitle>
            </SheetHeader>
            <SidebarContent
              session={session}
              orgName={orgName}
              sidebarCollapsed={false}
              navItems={navItems}
              isActive={isActive}
              initials={initials}
              onNavClick={closeMobileMenu}
              onLogout={handleLogout}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-white px-4 lg:px-6">
            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search */}
            <div className="relative flex-1 max-w-xl" data-search-area>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes, tarefas, templates..."
                className="h-9 pl-9 pr-8 bg-muted/50 border-0 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-[#2563eb]/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
                aria-label="Busca global"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-muted"
                  onClick={() => { setSearchQuery(''); setSearchResults(null); setSearchOpen(false) }}
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}

              {/* Search Results Dropdown */}
              {searchOpen && searchResults && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border bg-white shadow-xl">
                  {searchResults.clients.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Empresas
                      </p>
                      {searchResults.clients.slice(0, 5).map((c) => (
                        <Link
                          key={c.id}
                          href={`/app/empresas?id=${c.id}`}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors"
                          onClick={() => setSearchOpen(false)}
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.cnpj}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.tasks.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Tarefas
                      </p>
                      {searchResults.tasks.slice(0, 5).map((t) => (
                        <Link
                          key={t.id}
                          href={`/app/tarefas?id=${t.id}`}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors"
                          onClick={() => setSearchOpen(false)}
                        >
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{t.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {t.client?.name} · {t.priority}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.templates.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Templates
                      </p>
                      {searchResults.templates.slice(0, 5).map((t) => (
                        <Link
                          key={t.id}
                          href={`/app/templates?id=${t.id}`}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors"
                          onClick={() => setSearchOpen(false)}
                        >
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{t.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{t.category || 'Sem categoria'}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.clients.length === 0 && searchResults.tasks.length === 0 && searchResults.templates.length === 0 && (
                    <div className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">Nenhum resultado encontrado</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href="/app/notificacoes"
                      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label="Notificações"
                    >
                      <Bell className="h-[18px] w-[18px]" />
                      {unreadNotif > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                          {unreadNotif > 99 ? '99+' : unreadNotif}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Notificações</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#2563eb]/10 text-[#2563eb] text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium max-w-[140px] truncate">
                      {session.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{session.name}</p>
                      <p className="text-xs text-muted-foreground">{session.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/app/configuracoes')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/app/assinatura')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Assinatura
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/app/ajuda')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Ajuda
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair da conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
