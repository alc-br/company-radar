'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Building2, Users, FileText, CheckSquare, Clock, AlertTriangle, TrendingUp,
  Search, Plus, Filter, MoreHorizontal, Eye, Edit2, Trash2, Bell, LayoutDashboard,
  Calendar, Target, BarChart3, ChevronRight, X, Check, Circle, ArrowUpRight,
  ArrowDownRight, Briefcase, ClipboardList, RefreshCw, Menu, Layers, Shield
} from 'lucide-react'

// ---------- Types ----------
interface Stats {
  totalClients: number; activeClients: number; pendingTasks: number; overdueTasks: number
  totalTemplates: number; publishedTemplates: number; totalDocuments: number; pendingDocuments: number
}
interface Client {
  id: string; name: string; cnpj: string; tradeName: string | null; email: string | null
  phone: string | null; city: string | null; state: string | null; status: string
  segment: string | null; tags: string | null; contacts: { id: string; name: string; email: string | null; role: string | null }[]
  _count: { tasks: number; documents: number }; pendingTasks: number
}
interface Task {
  id: string; title: string; status: string; priority: string; dueDate: string | null
  assignedTo: string | null; clientId: string; checklist: string; description: string | null
  client: { name: string; tradeName: string | null }
}
interface Template {
  id: string; name: string; description: string | null; category: string | null
  department: string | null; isPublished: boolean
}
interface DashboardData {
  stats: Stats; tasksByStatus: { status: string; count: number }[]
  tasksByPriority: { priority: string; count: number }[]
  clientsBySegment: { segment: string; count: number }[]
  clientsByState: { state: string; count: number }[]
  recentTasks: Task[]; upcomingDeadlines: Task[]; overdueTasksList: Task[]
  monthlyData: { month: string; completed: number; created: number }[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendente',    color: 'bg-amber-100 text-amber-800' },
  in_progress:{ label: 'Em andamento', color: 'bg-sky-100 text-sky-800' },
  completed:  { label: 'Concluido',  color: 'bg-emerald-100 text-emerald-800' },
  overdue:    { label: 'Atrasado',   color: 'bg-red-100 text-red-800' },
  active:     { label: 'Ativo',      color: 'bg-emerald-100 text-emerald-800' },
  inactive:   { label: 'Inativo',    color: 'bg-gray-100 text-gray-600' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  low:    { label: 'Baixa',   color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  medium: { label: 'Media',   color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  high:   { label: 'Alta',    color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
}

// ---------- Component: Stat Card ----------
function StatCard({ icon: Icon, label, value, sub, accent, trend }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string
  accent?: string; trend?: 'up' | 'down'
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
            {sub && <p className={`text-xs ${trend === 'down' ? 'text-red-600' : 'text-emerald-600'}`}>{sub}</p>}
          </div>
          <div className={`rounded-xl p-3 ${accent || 'bg-primary/10 text-primary'}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Component: Mini Bar Chart ----------
function MiniBar({ items, maxVal, color = 'bg-primary' }: { items: { label: string; value: number }[]; maxVal: number; color?: string }) {
  return (
    <div className="flex items-end gap-1.5 h-28">
      {items.map((item, i) => {
        const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0
        return (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1 flex flex-col items-center gap-1 cursor-default">
                  <div className="w-full rounded-t-sm transition-all duration-500 min-h-[4px]" style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: 'var(--color, hsl(var(--primary)))' }} />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">{item.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.label}: {item.value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}

// ---------- Component: Status Ring ----------
function StatusRing({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <p className="text-sm text-muted-foreground">Sem tarefas</p>
  const colors: Record<string, string> = { pending: '#f59e0b', in_progress: '#0ea5e9', completed: '#10b981', overdue: '#ef4444' }
  const bgParts: string[] = []
  let acc = 0
  for (const d of data) {
    const pct = (d.count / total) * 100
    bgParts.push(`${colors[d.status] || '#ccc'} ${acc}% ${acc + pct}%`)
    acc += pct
  }
  const bgStyle = bgParts.join(', ')

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32 rounded-full shrink-0" style={{ background: bgStyle }}>
        <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
          <span className="text-xl font-bold">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.status} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[d.status] || '#ccc' }} />
            <span>{STATUS_CONFIG[d.status]?.label || d.status}</span>
            <span className="font-semibold ml-auto">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Component: Task Row ----------
function TaskRow({ task, onStatusChange }: { task: Task; onStatusChange: (id: string, status: string) => void }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending
  const prioCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const fmtDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : ''

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <button
        onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          task.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/30 hover:border-primary'
        }`}
      >
        {task.status === 'completed' && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
        <p className="text-xs text-muted-foreground truncate">{task.client?.name}{task.assignedTo ? ` · ${task.assignedTo}` : ''}</p>
      </div>
      {task.dueDate && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`text-xs whitespace-nowrap px-2 py-1 rounded-md ${isOverdue ? 'bg-red-50 text-red-600 font-medium' : 'text-muted-foreground'}`}>
                <Clock className="w-3 h-3 inline mr-1" />{fmtDate}
              </span>
            </TooltipTrigger>
            <TooltipContent>{isOverdue ? 'Atrasado!' : 'Prazo'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${prioCfg.color}`}><span className={`w-1.5 h-1.5 rounded-full ${prioCfg.dot} mr-1`} />{prioCfg.label}</Badge>
      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${statusCfg.color}`}>{statusCfg.label}</Badge>
    </div>
  )
}

// ---------- Component: Client Row ----------
function ClientRow({ client, onClick }: { client: Client; onClick: () => void }) {
  const statusCfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.active
  return (
    <div onClick={onClick} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Building2 className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{client.tradeName || client.name}</p>
        <p className="text-xs text-muted-foreground truncate">{client.cnpj} · {client.city}/{client.state}</p>
      </div>
      {client.segment && <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{client.segment}</Badge>}
      <div className="text-right hidden md:block">
        <p className="text-xs text-muted-foreground">Tarefas pendentes</p>
        <p className={`text-sm font-semibold ${client.pendingTasks > 3 ? 'text-red-600' : ''}`}>{client.pendingTasks}</p>
      </div>
      <Badge variant="secondary" className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

// ---------- MAIN PAGE ----------
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [taskFilter, setTaskFilter] = useState('all')
  const [newClientForm, setNewClientForm] = useState({ name: '', cnpj: '', tradeName: '', email: '', phone: '', city: '', state: '', segment: '' })
  const [newTaskForm, setNewTaskForm] = useState({ title: '', clientId: '', priority: 'medium', dueDate: '', description: '' })

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [dashRes, clientRes, taskRes, tplRes] = await Promise.all([
      fetch('/api/dashboard'), fetch('/api/clients?limit=100'), fetch('/api/tasks'), fetch('/api/templates')
    ])
    const [dash, cl, tk, tp] = await Promise.all([dashRes.json(), clientRes.json(), taskRes.json(), tplRes.json()])
    if (dash.stats) setData(dash)
    if (cl.clients) setClients(cl.clients)
    setAllTasks(Array.isArray(tk) ? tk : [])
    setTemplates(Array.isArray(tp) ? tp : [])
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    fetch('/api/seed', { method: 'POST' }).catch(() => {})
  }, [])

  const handleTaskStatus = async (id: string, status: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    loadAll()
  }

  const handleCreateClient = async () => {
    await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClientForm) })
    setShowNewClient(false)
    setNewClientForm({ name: '', cnpj: '', tradeName: '', email: '', phone: '', city: '', state: '', segment: '' })
    loadAll()
  }

  const handleCreateTask = async () => {
    await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTaskForm) })
    setShowNewTask(false)
    setNewTaskForm({ title: '', clientId: '', priority: 'medium', dueDate: '', description: '' })
    loadAll()
  }

  const handleDeleteClient = async (id: string) => {
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    setSelectedClient(null)
    loadAll()
  }

  const filteredClients = clients.filter(c =>
    `${c.name} ${c.cnpj} ${c.tradeName || ''} ${c.city || ''} ${c.segment || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTasks = taskFilter === 'all'
    ? allTasks
    : allTasks.filter(t => t.status === taskFilter)

  const navItems = [
    { id: 'dashboard', label: 'Visao Geral', icon: LayoutDashboard },
    { id: 'clients', label: 'Empresas', icon: Building2 },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'templates', label: 'Templates', icon: Layers },
    { id: 'reports', label: 'Relatorios', icon: BarChart3 },
  ]

  if (loading && !data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando Company Radar...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r flex-col transform transition-transform lg:translate-x-0 lg:static lg:flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-0'}`}>
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Company Radar</h1>
            <p className="text-[11px] text-muted-foreground">Escritorio Contabil Demo</p>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.id === 'tasks' && data?.stats.overdueTasks ? (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{data.stats.overdueTasks}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">AC</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Ana Costa</p>
              <p className="text-[11px] text-muted-foreground truncate">Proprietaria</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b px-4 sm:px-6 py-3 flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresas, tarefas, CNPJ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button variant="ghost" size="icon" className="relative" onClick={loadAll}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            {data?.stats.overdueTasks ? <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{data.stats.overdueTasks}</span> : null}
          </Button>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {/* ========== DASHBOARD TAB ========== */}
          {activeTab === 'dashboard' && data && (
            <>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Visao Geral</h2>
                <p className="text-sm text-muted-foreground">Painel executivo do escritorio</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon={Building2} label="Empresas Ativas" value={data.stats.activeClients} sub={`${data.stats.totalClients} total`} accent="bg-emerald-100 text-emerald-700" />
                <StatCard icon={CheckSquare} label="Tarefas Pendentes" value={data.stats.pendingTasks} sub={data.stats.overdueTasks > 0 ? `${data.stats.overdueTasks} atrasadas` : undefined} accent={data.stats.overdueTasks > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} trend={data.stats.overdueTasks > 0 ? 'down' : 'up'} />
                <StatCard icon={Layers} label="Templates" value={data.stats.publishedTemplates} sub={`${data.stats.totalTemplates} total`} accent="bg-violet-100 text-violet-700" />
                <StatCard icon={FileText} label="Documentos" value={data.stats.totalDocuments} sub={`${data.stats.pendingDocuments} pendentes`} accent="bg-sky-100 text-sky-700" />
              </div>

              {/* Charts row */}
              <div className="grid lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Tarefas por Status</CardTitle></CardHeader>
                  <CardContent><StatusRing data={data.tasksByStatus} /></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Atividade Mensal</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex gap-3 mb-2">
                      <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-sm bg-primary" />Criadas</span>
                      <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Concluidas</span>
                    </div>
                    <MiniBar
                      items={data.monthlyData.map(m => ({ label: m.month, value: m.created }))}
                      maxVal={Math.max(...data.monthlyData.map(m => Math.max(m.created, m.completed)), 1)}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Segments + Priority */}
              <div className="grid lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Clientes por Segmento</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.clientsBySegment.slice(0, 6).map(s => {
                        const pct = data.stats.totalClients > 0 ? (s.count / data.stats.totalClients) * 100 : 0
                        return (
                          <div key={s.segment}>
                            <div className="flex justify-between text-xs mb-1"><span>{s.segment}</span><span className="font-medium">{s.count}</span></div>
                            <Progress value={pct} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Prazos Proximos</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    {data.overdueTasksList.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> ATRASADAS</p>
                        {data.overdueTasksList.map(t => <TaskRow key={t.id} task={t} onStatusChange={handleTaskStatus} />)}
                      </>
                    )}
                    {data.upcomingDeadlines.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-amber-600 mb-2 mt-3 flex items-center gap-1"><Clock className="w-3 h-3" /> PROXIMOS PRAZOS</p>
                        {data.upcomingDeadlines.map(t => <TaskRow key={t.id} task={t} onStatusChange={handleTaskStatus} />)}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent activity */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Atividade Recente</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {data.recentTasks.map(t => <TaskRow key={t.id} task={t} onStatusChange={handleTaskStatus} />)}
                </CardContent>
              </Card>
            </>
          )}

          {/* ========== CLIENTS TAB ========== */}
          {activeTab === 'clients' && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Empresas-Clientes</h2>
                  <p className="text-sm text-muted-foreground">{filteredClients.length} empresa(s) encontrada(s)</p>
                </div>
                <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
                  <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />Nova Empresa</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Nova Empresa</DialogTitle><DialogDescription>Cadastre uma nova empresa na carteira</DialogDescription></DialogHeader>
                    <div className="grid gap-3 py-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Razao Social</Label><Input value={newClientForm.name} onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })} placeholder="Ltda" /></div>
                        <div><Label>CNPJ</Label><Input value={newClientForm.cnpj} onChange={e => setNewClientForm({ ...newClientForm, cnpj: e.target.value })} placeholder="00.000.000/0001-00" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Nome Fantasia</Label><Input value={newClientForm.tradeName} onChange={e => setNewClientForm({ ...newClientForm, tradeName: e.target.value })} /></div>
                        <div><Label>Segmento</Label><Input value={newClientForm.segment} onChange={e => setNewClientForm({ ...newClientForm, segment: e.target.value })} placeholder="Tecnologia" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><Label>Email</Label><Input type="email" value={newClientForm.email} onChange={e => setNewClientForm({ ...newClientForm, email: e.target.value })} /></div>
                        <div><Label>Telefone</Label><Input value={newClientForm.phone} onChange={e => setNewClientForm({ ...newClientForm, phone: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label>Cidade</Label><Input value={newClientForm.city} onChange={e => setNewClientForm({ ...newClientForm, city: e.target.value })} /></div>
                          <div><Label>UF</Label><Input maxLength={2} value={newClientForm.state} onChange={e => setNewClientForm({ ...newClientForm, state: e.target.value.toUpperCase() })} /></div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreateClient} disabled={!newClientForm.name || !newClientForm.cnpj}>Cadastrar</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Card>
                <CardContent className="p-2">
                  <div className="divide-y">
                    {filteredClients.map(c => <ClientRow key={c.id} client={c} onClick={() => setSelectedClient(c)} />)}
                    {filteredClients.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma empresa encontrada</p>}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ========== TASKS TAB ========== */}
          {activeTab === 'tasks' && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Tarefas</h2>
                  <p className="text-sm text-muted-foreground">{filteredTasks.length} tarefa(s)</p>
                </div>
                <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
                  <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" />Nova Tarefa</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
                    <div className="grid gap-3 py-2">
                      <div><Label>Titulo</Label><Input value={newTaskForm.title} onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })} placeholder="Descricao da tarefa" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Empresa</Label><Select value={newTaskForm.clientId} onValueChange={v => setNewTaskForm({ ...newTaskForm, clientId: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.tradeName || c.name}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Prioridade</Label><Select value={newTaskForm.priority} onValueChange={v => setNewTaskForm({ ...newTaskForm, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Prazo</Label><Input type="date" value={newTaskForm.dueDate} onChange={e => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })} /></div>
                        <div><Label>Descricao</Label><Input value={newTaskForm.description} onChange={e => setNewTaskForm({ ...newTaskForm, description: e.target.value })} /></div>
                      </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreateTask} disabled={!newTaskForm.title || !newTaskForm.clientId}>Criar</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'in_progress', 'completed', 'overdue'].map(s => (
                  <Button key={s} variant={taskFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setTaskFilter(s)}>
                    {s === 'all' ? 'Todas' : STATUS_CONFIG[s]?.label || s}
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
                      {s === 'all' ? allTasks.length : allTasks.filter(t => t.status === s).length}
                    </Badge>
                  </Button>
                ))}
              </div>
              <Card>
                <CardContent className="p-2">
                  <div className="divide-y">
                    {filteredTasks.map(t => <TaskRow key={t.id} task={t} onStatusChange={handleTaskStatus} />)}
                    {filteredTasks.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma tarefa encontrada</p>}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ========== TEMPLATES TAB ========== */}
          {activeTab === 'templates' && (
            <>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Templates Operacionais</h2>
                <p className="text-sm text-muted-foreground">{templates.length} template(s) cadastrado(s)</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(tpl => {
                  const steps = JSON.parse(tpl.steps || '[]') as { t: string }[]
                  return (
                    <Card key={tpl.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-sm font-semibold">{tpl.name}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2">{tpl.description}</CardDescription>
                          </div>
                          <Badge variant={tpl.isPublished ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                            {tpl.isPublished ? 'Publicado' : 'Rascunho'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 mb-3">
                          {tpl.category && <Badge variant="outline" className="text-[10px]">{tpl.category}</Badge>}
                          {tpl.department && <Badge variant="outline" className="text-[10px]">{tpl.department}</Badge>}
                        </div>
                        {steps.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Etapas</p>
                            {steps.slice(0, 4).map((s, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <Circle className="w-2 h-2 text-muted-foreground" />{s.t}
                              </div>
                            ))}
                            {steps.length > 4 && <p className="text-[10px] text-muted-foreground">+{steps.length - 4} mais...</p>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}

          {/* ========== REPORTS TAB ========== */}
          {activeTab === 'reports' && data && (
            <>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Relatorios</h2>
                <p className="text-sm text-muted-foreground">Analise gerencial da operacao</p>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribuicao por Prioridade</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.tasksByPriority.map(p => {
                        const total = allTasks.length || 1
                        const pct = (p.count / total) * 100
                        const cfg = PRIORITY_CONFIG[p.priority] || PRIORITY_CONFIG.medium
                        return (
                          <div key={p.priority}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />{cfg.label}</span>
                              <span className="font-medium">{p.count} ({pct.toFixed(0)}%)</span>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Clientes por Estado</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.clientsByState.slice(0, 8).map(s => {
                        const pct = data.stats.totalClients > 0 ? (s.count / data.stats.totalClients) * 100 : 0
                        return (
                          <div key={s.state} className="flex items-center gap-3">
                            <span className="text-xs font-medium w-6 text-center">{s.state}</span>
                            <div className="flex-1"><Progress value={pct} className="h-2" /></div>
                            <span className="text-xs font-medium w-6 text-right">{s.count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Volume Mensal de Tarefas</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex gap-3 mb-3">
                      <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-sm bg-primary" />Criadas</span>
                      <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Concluidas</span>
                    </div>
                    <div className="space-y-3">
                      {data.monthlyData.map(m => (
                        <div key={m.month} className="flex items-center gap-4">
                          <span className="text-xs font-medium w-12">{m.month}</span>
                          <div className="flex-1 flex gap-1">
                            <div className="h-4 bg-primary rounded-sm" style={{ width: `${(m.created / (Math.max(...data.monthlyData.map(d => d.created), 1))) * 100}%` }} />
                            <div className="h-4 bg-emerald-500 rounded-sm" style={{ width: `${(m.completed / (Math.max(...data.monthlyData.map(d => d.completed), 1))) * 100}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-20 text-right">{m.completed}/{m.created}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t px-6 py-3 text-center text-[11px] text-muted-foreground">
          Company Radar — Ferramenta de organizacao operacional. Conteudos e procedimentos sao definidos pelo escritorio usuario.
        </footer>
      </main>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-lg">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedClient.tradeName || selectedClient.name}</DialogTitle>
                <DialogDescription>{selectedClient.cnpj}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Razao Social:</span><br />{selectedClient.name}</div>
                  <div><span className="text-muted-foreground">Segmento:</span><br />{selectedClient.segment || '-'}</div>
                  <div><span className="text-muted-foreground">Cidade/UF:</span><br />{selectedClient.city}/{selectedClient.state}</div>
                  <div><span className="text-muted-foreground">Email:</span><br />{selectedClient.email || '-'}</div>
                  <div><span className="text-muted-foreground">Telefone:</span><br />{selectedClient.phone || '-'}</div>
                  <div><span className="text-muted-foreground">Status:</span><br /><Badge variant="secondary" className={STATUS_CONFIG[selectedClient.status]?.color}>{STATUS_CONFIG[selectedClient.status]?.label}</Badge></div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Contatos ({selectedClient.contacts.length})</p>
                  {selectedClient.contacts.length === 0 && <p className="text-xs text-muted-foreground">Nenhum contato cadastrado</p>}
                  <div className="space-y-1">
                    {selectedClient.contacts.map(c => (
                      <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                        <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.email || ''}</p></div>
                        <Badge variant="outline" className="text-[10px]">{c.role || 'Contato'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex gap-6 text-center">
                  <div><p className="text-2xl font-bold">{selectedClient._count.tasks}</p><p className="text-xs text-muted-foreground">Tarefas</p></div>
                  <div><p className="text-2xl font-bold">{selectedClient._count.documents}</p><p className="text-xs text-muted-foreground">Documentos</p></div>
                  <div><p className="text-2xl font-bold text-red-600">{selectedClient.pendingTasks}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => handleDeleteClient(selectedClient.id)}>
                  <Trash2 className="w-3.5 h-3.5" />Excluir
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}