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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Building2, Users, FileText, CheckSquare, Clock, AlertTriangle, TrendingUp,
  Search, Plus, Filter, Eye, Edit2, Trash2, Bell, LayoutDashboard,
  Calendar, BarChart3, ChevronRight, X, Check, Circle, ArrowRight,
  Briefcase, ClipboardList, RefreshCw, Menu, Layers, Shield, Settings,
  Lock, Mail, UserPlus, LogIn, ChevronDown, Star, Zap, Target,
  CalendarDays, Upload, MessageSquare, History, CreditCard, HelpCircle,
  LogOut, Tag, FolderOpen, Globe, Key, Save, Send, Download
} from 'lucide-react'

/* ═══════════════════════ TYPES ═══════════════════════ */
interface Stats { totalClients: number; activeClients: number; pendingTasks: number; overdueTasks: number; totalTemplates: number; publishedTemplates: number; totalDocuments: number; pendingDocuments: number }
interface Client { id: string; name: string; cnpj: string; tradeName: string | null; email: string | null; phone: string | null; city: string | null; state: string | null; status: string; segment: string | null; notes: string | null; portalAccess: boolean; contacts: Contact[]; tagsList?: { id: string; name: string; color: string }[]; _count: { tasks: number; documents: number }; pendingTasks: number }
interface Contact { id: string; name: string; email: string | null; phone: string | null; role: string | null; notes: string | null }
interface Task { id: string; title: string; status: string; priority: string; dueDate: string | null; completedAt: string | null; assignedTo: string | null; clientId: string; description: string | null; recurrenceRule: string | null; checklist: TaskChecklistItem[]; comments: TaskComment[]; subtasks?: Task[]; client: { name: string; tradeName: string | null } }
interface TaskChecklistItem { id: string; text: string; done: boolean; order: number }
interface TaskComment { id: string; userName: string; content: string; createdAt: string }
interface Template { id: string; name: string; description: string | null; category: string | null; department?: { name: string }; isPublished: boolean; version: number; steps: string }
interface OrgMember { id: string; name: string; email: string; role: string; status: string }
interface CalendarEvent { id: string; title: string; description: string | null; startDate: string; endDate: string | null; allDay: boolean; color: string | null; type: string }
interface Document { id: string; name: string; status: string; dueDate: string | null; typeName?: string; client: { name: string } }
interface AuditEntry { id: string; action: string; entity: string | null; entityId: string | null; detail: string | null; userName: string | null; createdAt: string }
interface Plan { id: string; name: string; slug: string; price: number; annualPrice: number | null; maxClients: number; maxUsers: number; features: string }
interface Notification { id: string; title: string; message: string; type: string; read: boolean; link: string | null; createdAt: string }
interface FAQItem { id: string; question: string; answer: string }
interface DashboardData { stats: Stats; tasksByStatus: { status: string; count: number }[]; tasksByPriority: { priority: string; count: number }[]; clientsBySegment: { segment: string; count: number }[]; clientsByState: { state: string; count: number }[]; recentTasks: Task[]; upcomingDeadlines: Task[]; overdueTasksList: Task[]; monthlyData: { month: string; completed: number; created: number }[] }

const SC: Record<string, { l: string; c: string }> = {
  pending: { l: 'Pendente', c: 'bg-amber-100 text-amber-800' }, in_progress: { l: 'Em andamento', c: 'bg-sky-100 text-sky-800' },
  completed: { l: 'Concluido', c: 'bg-emerald-100 text-emerald-800' }, cancelled: { l: 'Cancelado', c: 'bg-gray-100 text-gray-600' },
  overdue: { l: 'Atrasado', c: 'bg-red-100 text-red-800' }, active: { l: 'Ativo', c: 'bg-emerald-100 text-emerald-800' },
  inactive: { l: 'Inativo', c: 'bg-gray-100 text-gray-600' }, archived: { l: 'Arquivado', c: 'bg-gray-200 text-gray-500' },
  received: { l: 'Recebido', c: 'bg-emerald-100 text-emerald-800' }, approved: { l: 'Aprovado', c: 'bg-emerald-100 text-emerald-700' },
  rejected: { l: 'Rejeitado', c: 'bg-red-100 text-red-700' }, expired: { l: 'Expirado', c: 'bg-orange-100 text-orange-700' },
}
const PC: Record<string, { l: string; c: string; d: string }> = {
  low: { l: 'Baixa', c: 'bg-gray-100 text-gray-700', d: 'bg-gray-400' }, medium: { l: 'Media', c: 'bg-amber-100 text-amber-700', d: 'bg-amber-500' },
  high: { l: 'Alta', c: 'bg-orange-100 text-orange-700', d: 'bg-orange-500' }, urgent: { l: 'Urgente', c: 'bg-red-100 text-red-700', d: 'bg-red-500' },
}
const RC: Record<string, { l: string; c: string }> = { owner: { l: 'Proprietario', c: 'bg-purple-100 text-purple-800' }, admin: { l: 'Admin', c: 'bg-emerald-100 text-emerald-800' }, gestor: { l: 'Gestor', c: 'bg-sky-100 text-sky-800' }, collaborator: { l: 'Colaborador', c: 'bg-gray-100 text-gray-700' }, financeiro: { l: 'Financeiro', c: 'bg-amber-100 text-amber-800' } }

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '-'
const fmtDateTime = (d: string) => new Date(d).toLocaleString('pt-BR')
const DynIcon = ({i, c}: {i: React.ElementType; c?: string}) => { const C = i; return c ? <C className={c} /> : <C /> }


/* ═══════════════════════ HELPER COMPONENTS ═══════════════════════ */
function StatCard({ icon: Icon, label, value, sub, accent }: { icon: React.ElementType; label: string; value: number | string; sub?: string; accent?: string }) {
  return (<Card><CardContent className="p-4"><div className="flex items-center justify-between"><div className="space-y-0.5"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="text-2xl font-bold tracking-tight">{value}</p>{sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}</div>
<div className={`rounded-xl p-2.5 ${accent || 'bg-primary/10 text-primary'}`}><Icon className="w-5 h-5" /></div></div></CardContent></Card>)
}

function StatusRing({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <p className="text-sm text-muted-foreground">Sem tarefas</p>
  const colors: Record<string, string> = { pending: '#f59e0b', in_progress: '#0ea5e9', completed: '#10b981', overdue: '#ef4444', cancelled: '#9ca3af' }
  const bgParts: string[] = []; let acc = 0
  for (const d of data) { const pct = (d.count / total) * 100; bgParts.push(`${colors[d.status] || '#ccc'} ${acc}% ${acc + pct}%`); acc += pct }
  return (<div className="flex items-center gap-6"><div className="relative w-28 h-28 rounded-full shrink-0" style={{ background: bgParts.join(', ') }}><div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
<span className="text-lg font-bold">{total}</span></div></div><div className="space-y-1.5">{data.map(d => (<div key={d.status} className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[d.status] || '#ccc' }} />
<span>{SC[d.status]?.l || d.status}</span><span className="font-semibold ml-auto">{d.count}</span></div>))}</div></div>)
}

function MiniBar({ items, maxVal }: { items: { label: string; value: number }[]; maxVal: number }) {
  return (<div className="flex items-end gap-1.5 h-24">{items.map((item, i) => { const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0; return (<TooltipProvider key={i}><Tooltip><TooltipTrigger asChild>
<div className="flex-1 flex flex-col items-center gap-1 cursor-default"><div className="w-full rounded-t-sm bg-primary transition-all duration-500 min-h-[4px]" style={{ height: `${Math.max(pct, 4)}%` }} />
<span className="text-[10px] text-muted-foreground truncate w-full text-center">{item.label}</span></div></TooltipTrigger><TooltipContent><p>{item.label}: {item.value}</p></TooltipContent></Tooltip></TooltipProvider>) })}</div>)
}

function TaskRow({ t, onToggle, onClick }: { t: Task; onToggle?: () => void; onClick?: () => void }) {
  const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  return (<div onClick={onClick} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
    {onToggle && (<button onClick={e => { e.stopPropagation(); onToggle() }} className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${t.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/30 hover:border-primary'}`}>
<Check className="w-3 h-3 text-white" /></button>)}
    <div className="flex-1 min-w-0"><p className={`text-sm truncate ${t.status === 'completed' ? 'line-through text-muted-foreground' : 'font-medium'}`}>{t.title}</p><p className="text-xs text-muted-foreground truncate">{t.client?.name}{t.assignedTo ? ` · ${t.assignedTo}` : ''}</p>
</div>
    {t.dueDate && (<span className={`text-[11px] whitespace-nowrap px-1.5 py-0.5 rounded hidden sm:inline ${isOverdue ? 'bg-red-50 text-red-600 font-medium' : 'text-muted-foreground'}`}><Clock className="w-3 h-3 inline mr-0.5" />{fmtDate(t.dueDate)}</span>)}
    <Badge variant="secondary" className={`text-[10px] px-1 py-0 ${PC[t.priority]?.c || ''}`}><span className={`w-1.5 h-1.5 rounded-full ${PC[t.priority]?.d || ''} mr-0.5`} />{PC[t.priority]?.l}</Badge>
    <Badge variant="secondary" className={`text-[10px] px-1 py-0 hidden md:inline-flex ${SC[t.status]?.c || ''}`}>{SC[t.status]?.l || t.status}</Badge></div>)
}

function ClientRow({ c, onClick }: { c: Client; onClick?: () => void }) {
  return (<div onClick={onClick} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Building2 className="w-4 h-4 text-primary" /></div>
    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{c.tradeName || c.name}</p><p className="text-xs text-muted-foreground truncate">{c.cnpj} · {c.city}/{c.state}</p></div>
    {c.segment && <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{c.segment}</Badge>}
    <div className="text-right hidden md:block"><p className="text-xs text-muted-foreground">Pendentes</p><p className={`text-sm font-semibold ${c.pendingTasks > 3 ? 'text-red-600' : ''}`}>{c.pendingTasks}</p>
</div>
    <Badge variant="secondary" className={`text-[10px] ${SC[c.status]?.c || ''}`}>{SC[c.status]?.l || c.status}</Badge>
    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /></div>)
}

/* ═══════════════════════ MAIN ═══════════════════════ */
export default function Home() {
  const [view, setView] = useState<'public' | 'auth' | 'app' | 'portal'>('public')
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Data states
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [team, setTeam] = useState<OrgMember[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [publicPlans, setPublicPlans] = useState<Plan[]>([])
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [searchResults, setSearchResults] = useState<{ clients: Client[]; tasks: Task[]; templates: Template[] } | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  // Detail/dialog states
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [showNewMember, setShowNewMember] = useState(false)
  const [taskFilter, setTaskFilter] = useState('all')
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [docFilter, setDocFilter] = useState('all')

  // Form states
  const [loginForm, setLoginForm] = useState({ email: 'ana@demo.com', password: 'demo123' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirm: '', terms: false })
  const [newClientForm, setNewClientForm] = useState({ name: '', cnpj: '', tradeName: '', email: '', phone: '', city: '', state: '', segment: '' })
  const [newTaskForm, setNewTaskForm] = useState({ title: '', clientId: '', priority: 'medium', dueDate: '', description: '' })
  const [newTemplateForm, setNewTemplateForm] = useState({ name: '', description: '', category: '', steps: '' })
  const [newEventForm, setNewEventForm] = useState({ title: '', startDate: '', endDate: '', type: 'meeting' })
  const [newMemberForm, setNewMemberForm] = useState({ name: '', email: '', role: 'collaborator' })
  const [commentText, setCommentText] = useState('')
  const [newChecklistText, setNewChecklistText] = useState('')
  const [portalForm, setPortalForm] = useState({ cnpj: '', password: '' })
  const [forgotEmail, setForgotEmail] = useState('')

  // Auth
  const handleLogin = async () => {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) })
    if (res.ok) { const d = await res.json(); setUser(d.user); setView('app'); loadAll() } else alert('Credenciais invalidas')
  }
  const handleRegister = async () => {
    if (registerForm.password !== registerForm.confirm) return alert('Senhas nao conferem')
    if (!registerForm.terms) return alert('Aceite os termos')
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registerForm) })
    if (res.ok) { const d = await res.json(); setUser(d.user); setView('app'); loadAll() } else alert('Erro ao registrar')
  }
  const handleForgot = async () => {
    await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail }) })
    alert('Se o email existir, enviaremos instrucoes')
  }

  // Data loading
  const loadAll = useCallback(async () => {
    setLoading(true)
    const [d, c, t, tp, tm, pl, nt, au, p] = await Promise.all([
      fetch('/api/dashboard').then(r => r.json()), fetch('/api/clients?limit=100').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()), fetch('/api/templates').then(r => r.json()),
      fetch('/api/team').then(r => r.json()), fetch('/api/plans').then(r => r.json()),
      fetch('/api/notifications').then(r => r.json()), fetch('/api/audit').then(r => r.json()),
      fetch('/api/public/plans').then(r => r.json()),
    ])
    if (d.stats) setDashData(d); if (c.clients) setClients(c.clients)
    setTasks(Array.isArray(t) ? t : []); setTemplates(Array.isArray(tp) ? tp : [])
    setTeam(Array.isArray(tm) ? tm : []); setPlans(Array.isArray(pl) ? pl : [])
    if (nt.notifications) { setNotifications(nt.notifications); setUnreadCount(nt.unread || 0) }
    if (au.logs) setAuditLogs(au.logs); if (Array.isArray(p)) setPublicPlans(p)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch('/api/public/faq').then(r => r.json()).then(d => setFaqs(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/seed', { method: 'POST' }).catch(() => {})
    // Auto-login for demo
    setTimeout(() => {
      fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'ana@demo.com', password: 'demo123' }) })
        .then(r => r.json()).then(d => { if (d.user) { setUser(d.user); setView('app'); loadAll() } else { setLoading(false) } }).catch(() => setLoading(false))
    }, 300)

  // Calendar loading
  useEffect(() => { if (view === 'app') fetch(`/api/calendar?month=${calMonth}&year=${calYear}`).then(r => r.json()).then(d => setCalendarEvents(Array.isArray(d) ? d : [])).catch(() => {}) }, [view, calMonth, calYear])

  // Search
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (searchTerm.length >= 2) { fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`).then(r => r.json()).then(d => { setSearchResults(d); setShowSearch(true) }).catch(() => {}) } else { setSearchResults(null); setShowSearch(false) } }, [searchTerm])

  // CRUD handlers
  const handleTaskStatus = async (id: string, status: string) => { await fetch(`/api/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updateStatus: status }) }); loadAll() }
  const handleCreateClient = async () => { await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClientForm) }); setShowNewClient(false); setNewClientForm({ name: '', cnpj: '', tradeName: '', email: '', phone: '', city: '', state: '', segment: '' }); loadAll() }
  const handleCreateTask = async () => { await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTaskForm) }); setShowNewTask(false); setNewTaskForm({ title: '', clientId: '', priority: 'medium', dueDate: '', description: '' }); loadAll() }
  const handleCreateTemplate = async () => { const steps = newTemplateForm.steps.split('\n').filter(Boolean).map((s, i) => ({ title: s, description: '', responsible: '', daysOffset: (i + 1) * 5, checklist: [] })); await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newTemplateForm, steps }) }); setShowNewTemplate(false); setNewTemplateForm({ name: '', description: '', category: '', steps: '' }); loadAll() }
  const handleCreateEvent = async () => { await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { ...newEventForm, organizationId: 'org-default' } }); setShowNewEvent(false); setNewEventForm({ title: '', startDate: '', endDate: '', type: 'meeting' }); fetch(`/api/calendar?month=${calMonth}&year=${calYear}`).then(r => r.json()).then(d => setCalendarEvents(Array.isArray(d) ? d : [])) }
  const handleCreateMember = async () => { await fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMemberForm) }); setShowNewMember(false); setNewMemberForm({ name: '', email: '', role: 'collaborator' }); loadAll() }
  const handleDeleteClient = async (id: string) => { if (!confirm('Excluir empresa?')) return; await fetch(`/api/clients/${id}`, { method: 'DELETE' }); setSelectedClient(null); loadAll() }
  const handleAddComment = async () => { if (!selectedTask || !commentText.trim()) return; await fetch(`/api/tasks/${selectedTask.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ addComment: { userName: user?.name || 'Usuario', content: commentText } }) }); setCommentText(''); loadAll(); const updated = await fetch(`/api/tasks/${selectedTask.id}`).then(r => r.json()); setSelectedTask(updated) }
  const handleAddChecklist = async () => { if (!selectedTask || !newChecklistText.trim()) return; await fetch(`/api/tasks/${selectedTask.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ addChecklist: newChecklistText }) }); setNewChecklistText(''); loadAll(); const updated = await fetch(`/api/tasks/${selectedTask.id}`).then(r => r.json()); setSelectedTask(updated) }
  const handleToggleChecklist = async (itemId: string) => { if (!selectedTask) return; await fetch(`/api/tasks/${selectedTask.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toggleChecklist: itemId }) }); const updated = await fetch(`/api/tasks/${selectedTask.id}`).then(r => r.json()); setSelectedTask(updated) }
  const handleMarkNotificationsRead = async () => { if (!notifications.length) return; await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: notifications.filter(n => !n.read).map(n => n.id) }) }); setUnreadCount(0) }

  const filteredClients = clients.filter(c => `${c.name} ${c.cnpj} ${c.tradeName || ''} ${c.city || ''} ${c.segment || ''}`.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredTasks = taskFilter === 'all' ? tasks : tasks.filter(t => t.status === taskFilter)
  const filteredDocs = docFilter === 'all' ? documents : documents.filter(d => d.status === docFilter)
  const unread = unreadCount

  const navItems = [
    { id: 'dashboard', label: 'Visao Geral', icon: LayoutDashboard }, { id: 'clients', label: 'Empresas', icon: Building2 },
    { id: 'templates', label: 'Templates', icon: Layers }, { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'calendar', label: 'Calendario', icon: Calendar }, { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'team', label: 'Equipe', icon: Users }, { id: 'notifications', label: 'Notificacoes', icon: Bell },
    { id: 'billing', label: 'Assinatura', icon: CreditCard }, { id: 'audit', label: 'Auditoria', icon: History },
    { id: 'settings', label: 'Configuracoes', icon: Settings },
  ]

  if (loading && view === 'public') return (<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
</div>)

  /* ═══════════════════════ PUBLIC VIEW ═══════════════════════ */
  if (view === 'public') {
    return (<div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="border-b px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Shield className="w-4 h-4 text-primary-foreground" /></div>
          <span className="font-bold text-lg">Company Radar</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => { setAuthMode('login'); setView('auth') }}>Entrar</Button>
          <Button onClick={() => { setAuthMode('register'); setView('auth') }}>Comecar agora</Button>
        </div>
      </header>
      {/* Hero */}
      <section className="py-16 sm:py-24 px-4 text-center max-w-4xl mx-auto">
        <Badge variant="secondary" className="mb-4">Para escritorios contabeis</Badge><h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">Padronize a operacao do escritorio.</h1><p className="text-lg text-muted-foreground mb-2">Nenhum cliente sem processo, nenhum vencimento esquecido e nenhum documento perdido.</p>
<p className="text-sm text-muted-foreground mb-8">Reduza para menos de 5 minutos o tempo para estruturar um novo cliente.</p>
        <div className="flex justify-center gap-3">
          <Button size="lg" onClick={() => { setAuthMode('register'); setView('auth') }}>Criar conta gratuita</Button>
          <Button size="lg" variant="outline" onClick={() => { const el = document.getElementById('features'); if (el) el.scrollIntoView(); }}>Saiba mais</Button>
</div>
      </section>
      {/* How it works */}
      <section className="py-16 px-4 bg-muted/30"><div className="max-w-4xl mx-auto"><h2 className="text-2xl font-bold text-center mb-12">Como funciona</h2><div className="grid sm:grid-cols-3 gap-8">{[{ icon: Layers, title: 'Crie Templates', desc: 'Transforme procedimentos internos em templates reutilizaveis com etapas, prazos e checklists.' }, { icon: Building2, title: 'Aplique aos Clientes', desc: 'Selecione um template e aplique a um ou mais clientes. Tarefas, prazos e documentos sao gerados automaticamente.' }, { icon: CheckSquare, title: 'Acompanhe e Execute', desc: 'Acompanhe o progresso, marque checklists, adicione comentarios e nunca perca um prazo.' }].map((s, i) => (<div key={i} className="text-center">
<div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><DynIcon i={s.icon} c="w-7 h-7 text-primary" /></div><div className="flex items-center justify-center gap-2 mb-2">
<span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{i + 1}</span><h3 className="font-semibold">{s.title}</h3></div><p className="text-sm text-muted-foreground">{s.desc}</p>
</div>))}</div></div></section>
      {/* Features */}
      <section id="features" className="py-16 px-4"><div className="max-w-5xl mx-auto"><h2 className="text-2xl font-bold text-center mb-12">Recursos completos</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[{ icon: Building2, t: 'Carteira de Clientes', d: 'Cadastre empresas, contatos, tags e segmentos' }, { icon: Layers, t: 'Templates Operacionais', d: 'Crie, publique e aplique procedimentos' }, { icon: CheckSquare, t: 'Tarefas e Checklists', d: 'Gere tarefas automaticamente dos templates' }, { icon: Calendar, t: 'Calendario Compartilhado', d: 'Visualize prazos e eventos da equipe' }, { icon: FileText, t: 'Central de Documentos', d: 'Controle entregas e pendencias' }, { icon: Bell, t: 'Alertas e Notificacoes', d: 'Nunca mais esqueca um vencimento' }, { icon: Users, t: 'Portal do Cliente', d: 'Clientes acompanham suas pendencias' }, { icon: BarChart3, t: 'Relatorios Gerenciais', d: 'Dashboard e relatorios exportaveis' }].map((f, i) => (<Card key={i}>
<CardContent className="p-4 text-center"><DynIcon i={f.icon} c="w-8 h-8 text-primary mx-auto mb-2" /><h3 className="text-sm font-semibold mb-1">{f.t}</h3><p className="text-xs text-muted-foreground">{f.d}</p>
</CardContent></Card>))}</div></div></section>
      {/* Plans */}
      <section className="py-16 px-4 bg-muted/30"><div className="max-w-5xl mx-auto"><h2 className="text-2xl font-bold text-center mb-4">Planos e precos</h2><p className="text-center text-muted-foreground mb-12">Escolha o plano ideal para seu escritorio</p>
<div className="grid sm:grid-cols-3 gap-6">{publicPlans.map((p, i) => (<Card key={p.id} className={`relative ${i === 1 ? 'border-primary shadow-lg' : ''}`}><CardContent className="p-6">{i === 1 && <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">Popular</Badge>}<h3 className="font-bold text-lg mb-1">{p.name}</h3>
<div className="mb-4"><span className="text-3xl font-bold">R$ {p.price.toFixed(2)}</span><span className="text-muted-foreground">/mes</span></div><div className="space-y-2 mb-6">{(JSON.parse(p.features || '[]') as string[]).map((f, j) => (<div key={j} className="flex items-center gap-2 text-sm">
<Check className="w-4 h-4 text-emerald-500" />{f}</div>))}</div><Button className="w-full" variant={i === 1 ? 'default' : 'outline'} onClick={() => { setAuthMode('register'); setView('auth') }}>Assinar</Button>
</CardContent></Card>))}</div></div></section>
      {/* FAQ */}
      {faqs.length > 0 && (<section className="py-16 px-4"><div className="max-w-3xl mx-auto"><h2 className="text-2xl font-bold text-center mb-8">Perguntas frequentes</h2><Accordion type="single" collapsible>{faqs.map((f, i) => (<AccordionItem key={f.id} value={`faq-${i}`}>
<AccordionTrigger className="text-left text-sm">{f.question}</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground">{f.answer}</AccordionContent></AccordionItem>))}</Accordion></div>
</section>)}
      {/* Footer */}
      <footer className="mt-auto border-t px-4 py-6 text-center text-xs text-muted-foreground"><p>Company Radar — Ferramenta de organizacao operacional.</p><p className="mt-1">Conteudos, datas e procedimentos sao definidos pelo escritorio usuario, que permanece responsavel por sua validacao tecnica, legal e contabil.</p>
</footer>
    </div>)
  }

  /* ═══════════════════════ AUTH VIEW ═══════════════════════ */
  if (view === 'auth') {
    return (<div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md"><CardHeader className="text-center pb-2"><div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3"><Shield className="w-6 h-6 text-primary-foreground" />
</div><CardTitle className="text-xl">Company Radar</CardTitle><CardDescription>{authMode === 'login' ? 'Acesse sua conta' : authMode === 'register' ? 'Crie sua conta' : authMode === 'forgot' ? 'Recuperar senha' : 'Redefinir senha'}</CardDescription>
</CardHeader><CardContent className="space-y-4">
        {authMode === 'login' && (<><div><Label>Email</Label><Input type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="seu@email.com" /></div>
<div><Label>Senha</Label><Input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Sua senha" /></div><Button className="w-full" onClick={handleLogin}>Entrar</Button>
<div className="text-center"><button className="text-sm text-primary hover:underline" onClick={() => setAuthMode('forgot')}>Esqueci minha senha</button></div><Separator /><p className="text-center text-sm text-muted-foreground">Nao tem conta? <button className="text-primary hover:underline font-medium" onClick={() => setAuthMode('register')}>Criar conta</button>
</p></>)}
        {authMode === 'register' && (<><div><Label>Nome completo</Label><Input value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} /></div><div><Label>Email profissional</Label>
<Input type="email" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} /></div><div><Label>Senha</Label><Input type="password" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
</div><div><Label>Confirmar senha</Label><Input type="password" value={registerForm.confirm} onChange={e => setRegisterForm({ ...registerForm, confirm: e.target.value })} /></div><div className="flex items-center gap-2">
<Checkbox checked={registerForm.terms} onCheckedChange={v => setRegisterForm({ ...registerForm, terms: !!v })} /><label className="text-xs text-muted-foreground">Li e aceito os <span className="text-primary">Termos de Uso</span> e a <span className="text-primary">Politica de Privacidade</span>
</label></div><Button className="w-full" onClick={handleRegister} disabled={!registerForm.name || !registerForm.email || !registerForm.password}>Criar conta</Button><p className="text-center text-sm text-muted-foreground">Ja tem conta? <button className="text-primary hover:underline font-medium" onClick={() => setAuthMode('login')}>Entrar</button>
</p></>)}
        {authMode === 'forgot' && (<><div><Label>Email cadastrado</Label><Input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="seu@email.com" /></div><Button className="w-full" onClick={handleForgot}>Enviar instrucoes</Button>
<p className="text-center text-sm text-muted-foreground"><button className="text-primary hover:underline" onClick={() => setAuthMode('login')}>Voltar ao login</button></p></>)}
        {authMode === 'reset' && (<><div><Label>Nova senha</Label><Input type="password" /></div><div><Label>Confirmar nova senha</Label><Input type="password" /></div><Button className="w-full" onClick={() => setAuthMode('login')}>Redefinir senha</Button>
</>)}
        <button onClick={() => setView('public')} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">Voltar ao site</button>
      </CardContent></Card>
    </div>)
  }

  /* ═══════════════════════ PORTAL VIEW ═══════════════════════ */
  if (view === 'portal') {
    return (<div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md"><CardHeader className="text-center"><Shield className="w-10 h-10 text-primary mx-auto mb-2" /><CardTitle>Portal do Cliente</CardTitle><CardDescription>Acesse suas pendencias e documentos</CardDescription>
</CardHeader><CardContent className="space-y-4"><div><Label>CNPJ</Label><Input value={portalForm.cnpj} onChange={e => setPortalForm({ ...portalForm, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
</div><div><Label>Senha</Label><Input type="password" value={portalForm.password} onChange={e => setPortalForm({ ...portalForm, password: e.target.value })} /></div><Button className="w-full" onClick={() => alert('Portal: funcionalidade demo')}>Acessar</Button>
<button onClick={() => setView('public')} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">Voltar ao site</button></CardContent></Card>
    </div>)
  }

  /* ═══════════════════════ APP VIEW ═══════════════════════ */
  return (<div className="min-h-screen flex bg-background">
    {/* Sidebar */}
    <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-card border-r flex-col transform transition-transform lg:translate-x-0 lg:static lg:flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-0'}`}>
      <div className="p-3 border-b flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Shield className="w-4 h-4 text-primary-foreground" /></div><div className="flex-1 min-w-0">
<h1 className="font-bold text-sm leading-tight">Company Radar</h1><p className="text-[10px] text-muted-foreground truncate">Escritorio Demo</p></div><button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
<X className="w-4 h-4" /></button></div>
      <ScrollArea className="flex-1 p-2"><nav className="space-y-0.5">{navItems.map(item => (<button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
<item.icon className="w-4 h-4" /><span className="flex-1 text-left">{item.label}</span>{item.id === 'tasks' && dashData?.stats.overdueTasks ? (<span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{dashData.stats.overdueTasks}</span>) : null}{item.id === 'notifications' && unread > 0 ? (<span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>) : null}</button>))}<Separator className="my-2" />
<button onClick={() => setView('portal')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted text-muted-foreground"><Globe className="w-4 h-4" /><span>Portal do Cliente</span>
</button><button onClick={() => { setUser(null); setView('public') }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-muted text-muted-foreground"><LogOut className="w-4 h-4" />
<span>Sair</span></button></nav></ScrollArea>
      <div className="p-3 border-t"><div className="flex items-center gap-2"><Avatar className="w-7 h-7"><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{(user?.name || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
</Avatar><div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{user?.name || 'Usuario'}</p><p className="text-[10px] text-muted-foreground truncate">{user?.email || ''}</p></div>
</div></div>
    </aside>
    {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

    {/* Main */}
    <main className="flex-1 min-w-0 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b px-4 py-2.5 flex items-center gap-2">
        <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
        <div className="flex-1 relative max-w-sm"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-8 text-sm" />
          {showSearch && searchResults && (<div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg p-2 z-50 max-h-64 overflow-y-auto">
            {searchResults.clients?.length > 0 && (<><p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">Empresas</p>{searchResults.clients.slice(0, 5).map(c => (<button key={c.id} onClick={() => { setSelectedClient(c); setShowSearch(false); setSearchTerm('') }} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded">{c.tradeName || c.name} <span className="text-muted-foreground">{c.cnpj}</span>
</button>))}</>)}
            {searchResults.tasks?.length > 0 && (<><p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1 mt-1">Tarefas</p>{searchResults.tasks.slice(0, 5).map(t => (<button key={t.id} onClick={() => { setSelectedTask(t); setShowSearch(false); setSearchTerm('') }} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded">{t.title}</button>))}</>)}
            {searchResults.templates?.length > 0 && (<><p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1 mt-1">Templates</p>{searchResults.templates.slice(0, 5).map(t => (<div key={t.id} className="px-2 py-1.5 text-sm text-muted-foreground">{t.name}</div>))}</>)}
            {(!searchResults.clients?.length && !searchResults.tasks?.length && !searchResults.templates?.length) && <p className="text-sm text-muted-foreground p-2">Nenhum resultado</p>}
          </div>)}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadAll}><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => setActiveTab('notifications')}><Bell className="w-4 h-4" />{unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{unread}</span>}</Button>
      </header>

      <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-auto">
        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && dashData && (<>
          <div><h2 className="text-xl font-bold">Visao Geral</h2><p className="text-sm text-muted-foreground">Painel executivo</p></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">  
            <StatCard icon={Building2} label="Empresas Ativas" value={dashData.stats.activeClients} sub={`${dashData.stats.totalClients} total`} accent="bg-emerald-100 text-emerald-700" />
            <StatCard icon={CheckSquare} label="Tarefas Pendentes" value={dashData.stats.pendingTasks} sub={dashData.stats.overdueTasks > 0 ? `${dashData.stats.overdueTasks} atrasadas` : undefined} accent={dashData.stats.overdueTasks > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} />
            <StatCard icon={Layers} label="Templates" value={dashData.stats.publishedTemplates} sub={`${dashData.stats.totalTemplates} total`} accent="bg-violet-100 text-violet-700" />
            <StatCard icon={FileText} label="Documentos" value={dashData.stats.totalDocuments} sub={`${dashData.stats.pendingDocuments} pendentes`} accent="bg-sky-100 text-sky-700" />
          </div>
          <div className="grid lg:grid-cols-2 gap-4"><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tarefas por Status</CardTitle></CardHeader><CardContent><StatusRing data={dashData.tasksByStatus} />
</CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Atividade Mensal</CardTitle></CardHeader><CardContent><MiniBar items={dashData.monthlyData.map(m => ({ label: m.month, value: m.created }))} maxVal={Math.max(...dashData.monthlyData.map(m => Math.max(m.created, m.completed)), 1)} />
</CardContent></Card></div>
          <div className="grid lg:grid-cols-3 gap-4"><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Clientes por Segmento</CardTitle></CardHeader><CardContent><div className="space-y-2">{dashData.clientsBySegment.slice(0, 6).map(s => { const pct = dashData.stats.totalClients > 0 ? (s.count / dashData.stats.totalClients) * 100 : 0; return (<div key={s.segment}>
<div className="flex justify-between text-xs mb-0.5"><span>{s.segment}</span><span className="font-medium">{s.count}</span></div><Progress value={pct} className="h-1.5" /></div>) })}</div></CardContent>
</Card><Card className="lg:col-span-2"><CardHeader className="pb-2"><CardTitle className="text-sm">Prazos</CardTitle></CardHeader><CardContent className="space-y-1">{dashData.overdueTasksList.map(t => <TaskRow key={t.id} t={t} onClick={() => { setSelectedTask(t); setActiveTab('tasks') }} />)}{dashData.upcomingDeadlines.map(t => <TaskRow key={t.id} t={t} onClick={() => { setSelectedTask(t); setActiveTab('tasks') }} />)}</CardContent>
</Card></div>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Atividade Recente</CardTitle></CardHeader><CardContent className="space-y-1">{dashData.recentTasks.map(t => <TaskRow key={t.id} t={t} onToggle={() => handleTaskStatus(t.id, t.status === 'completed' ? 'pending' : 'completed')} />)}</CardContent>
</Card>
        </>)}

        {/* ── CLIENTS ── */}
        {activeTab === 'clients' && (<>
          <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="text-xl font-bold">Empresas-Clientes</h2><p className="text-sm text-muted-foreground">{filteredClients.length} empresa(s)</p>
</div><Dialog open={showNewClient} onOpenChange={setShowNewClient}><DialogTrigger asChild><Button className="gap-1.5" size="sm"><Plus className="w-4 h-4" />Nova Empresa</Button></DialogTrigger><DialogContent>
<DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader><div className="grid gap-3 py-2"><div className="grid grid-cols-2 gap-3"><div><Label>Razao Social</Label><Input value={newClientForm.name} onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })} />
</div><div><Label>CNPJ</Label><Input value={newClientForm.cnpj} onChange={e => setNewClientForm({ ...newClientForm, cnpj: e.target.value })} /></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Fantasia</Label>
<Input value={newClientForm.tradeName} onChange={e => setNewClientForm({ ...newClientForm, tradeName: e.target.value })} /></div><div><Label>Segmento</Label><Input value={newClientForm.segment} onChange={e => setNewClientForm({ ...newClientForm, segment: e.target.value })} />
</div></div><div className="grid grid-cols-3 gap-3"><div><Label>Email</Label><Input type="email" value={newClientForm.email} onChange={e => setNewClientForm({ ...newClientForm, email: e.target.value })} />
</div><div><Label>Telefone</Label><Input value={newClientForm.phone} onChange={e => setNewClientForm({ ...newClientForm, phone: e.target.value })} /></div><div className="grid grid-cols-2 gap-2"><div><Label>Cidade</Label>
<Input value={newClientForm.city} onChange={e => setNewClientForm({ ...newClientForm, city: e.target.value })} /></div><div><Label>UF</Label><Input maxLength={2} value={newClientForm.state} onChange={e => setNewClientForm({ ...newClientForm, state: e.target.value.toUpperCase() })} />
</div></div></div></div><DialogFooter><Button onClick={handleCreateClient} disabled={!newClientForm.name || !newClientForm.cnpj}>Cadastrar</Button></DialogFooter></DialogContent></Dialog></div>
          <Card><CardContent className="p-2"><div className="divide-y">{filteredClients.map(c => <ClientRow key={c.id} c={c} onClick={() => setSelectedClient(c)} />)}{filteredClients.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma empresa</p>}</div>
</CardContent></Card>
        </>)}

        {/* ── TEMPLATES ── */}
        {activeTab === 'templates' && (<>
          <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="text-xl font-bold">Templates Operacionais</h2><p className="text-sm text-muted-foreground">{templates.length} template(s)</p>
</div><Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}><DialogTrigger asChild><Button className="gap-1.5" size="sm"><Plus className="w-4 h-4" />Novo Template</Button></DialogTrigger><DialogContent>
<DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader><div className="grid gap-3 py-2"><div><Label>Nome</Label><Input value={newTemplateForm.name} onChange={e => setNewTemplateForm({ ...newTemplateForm, name: e.target.value })} />
</div><div><Label>Descricao</Label><Textarea value={newTemplateForm.description} onChange={e => setNewTemplateForm({ ...newTemplateForm, description: e.target.value })} /></div><div><Label>Categoria</Label>
<Input value={newTemplateForm.category} onChange={e => setNewTemplateForm({ ...newTemplateForm, category: e.target.value })} placeholder="Fiscal, Pessoal, Contabil..." /></div><div><Label>Etapas (uma por linha)</Label>
<Textarea rows={5} value={newTemplateForm.steps} onChange={e => setNewTemplateForm({ ...newTemplateForm, steps: e.target.value })} placeholder="Coletar notas fiscais\nApurar ICMS\nGerar SPED" /></div></div>
<DialogFooter><Button onClick={handleCreateTemplate} disabled={!newTemplateForm.name}>Criar</Button></DialogFooter></DialogContent></Dialog></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{templates.map(tpl => { const steps = JSON.parse(tpl.steps || '[]') as { title: string }[]; return (<Card key={tpl.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTemplate(tpl)}>
<CardHeader className="pb-2"><div className="flex items-start justify-between"><div className="space-y-1 flex-1 min-w-0"><CardTitle className="text-sm font-semibold">{tpl.name}</CardTitle><CardDescription className="text-xs line-clamp-2">{tpl.description}</CardDescription>
</div><Badge variant={tpl.isPublished ? 'default' : 'secondary'} className="text-[10px] shrink-0">{tpl.isPublished ? 'Publicado' : 'Rascunho'}</Badge></div></CardHeader><CardContent><div className="flex gap-2 mb-2 flex-wrap">{tpl.category && <Badge variant="outline" className="text-[10px]">{tpl.category}</Badge>}{tpl.department && <Badge variant="outline" className="text-[10px]">{tpl.department.name}</Badge>}<Badge variant="outline" className="text-[10px]">v{tpl.version}</Badge>
</div>{steps.length > 0 && (<div className="space-y-1">{steps.slice(0, 3).map((s, i) => (<div key={i} className="flex items-center gap-2 text-xs"><Circle className="w-1.5 h-1.5 text-muted-foreground" />{s.title}</div>))}{steps.length > 3 && <p className="text-[10px] text-muted-foreground">+{steps.length - 3} mais...</p>}</div>)}</CardContent>
</Card>) })}</div>
        </>)}

        {/* ── TASKS ── */}
        {activeTab === 'tasks' && (<>
          <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="text-xl font-bold">Tarefas</h2><p className="text-sm text-muted-foreground">{filteredTasks.length} tarefa(s)</p></div>
<Dialog open={showNewTask} onOpenChange={setShowNewTask}><DialogTrigger asChild><Button className="gap-1.5" size="sm"><Plus className="w-4 h-4" />Nova Tarefa</Button></DialogTrigger><DialogContent><DialogHeader>
<DialogTitle>Nova Tarefa</DialogTitle></DialogHeader><div className="grid gap-3 py-2"><div><Label>Titulo</Label><Input value={newTaskForm.title} onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })} />
</div><div className="grid grid-cols-2 gap-3"><div><Label>Empresa</Label><Select value={newTaskForm.clientId} onValueChange={v => setNewTaskForm({ ...newTaskForm, clientId: v })}><SelectTrigger><SelectValue placeholder="Selecione" />
</SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.tradeName || c.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Prioridade</Label><Select value={newTaskForm.priority} onValueChange={v => setNewTaskForm({ ...newTaskForm, priority: v })}>
<SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem>
</SelectContent></Select></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Prazo</Label><Input type="date" value={newTaskForm.dueDate} onChange={e => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })} />
</div><div><Label>Descricao</Label><Input value={newTaskForm.description} onChange={e => setNewTaskForm({ ...newTaskForm, description: e.target.value })} /></div></div></div><DialogFooter><Button onClick={handleCreateTask} disabled={!newTaskForm.title || !newTaskForm.clientId}>Criar</Button>
</DialogFooter></DialogContent></Dialog></div>
          <div className="flex gap-2 flex-wrap">{['all', 'pending', 'in_progress', 'completed', 'overdue'].map(s => (<Button key={s} variant={taskFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setTaskFilter(s)}>{s === 'all' ? 'Todas' : SC[s]?.l || s}<Badge variant="secondary" className="ml-1 text-[10px] px-1">{s === 'all' ? tasks.length : tasks.filter(t => t.status === s).length}</Badge>
</Button>))}</div>
          <Card><CardContent className="p-2"><div className="divide-y">{filteredTasks.map(t => <TaskRow key={t.id} t={t} onToggle={() => handleTaskStatus(t.id, t.status === 'completed' ? 'pending' : 'completed')} onClick={() => setSelectedTask(t)} />)}{filteredTasks.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma tarefa</p>}</div>
</CardContent></Card>
        </>)}

        {/* ── CALENDAR ── */}
        {activeTab === 'calendar' && (<>
          <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="text-xl font-bold">Calendario</h2><p className="text-sm text-muted-foreground">{['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][calMonth]} {calYear}</p>
</div><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }}>&lt;</Button>
<Button variant="outline" size="sm" onClick={() => { const n = new Date(); setCalMonth(n.getMonth()); setCalYear(n.getFullYear()) }}>Hoje</Button><Button variant="outline" size="sm" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }}>&gt;</Button>
<Dialog open={showNewEvent} onOpenChange={setShowNewEvent}><DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />Evento</Button></DialogTrigger><DialogContent><DialogHeader>
<DialogTitle>Novo Evento</DialogTitle></DialogHeader><div className="grid gap-3 py-2"><div><Label>Titulo</Label><Input value={newEventForm.title} onChange={e => setNewEventForm({ ...newEventForm, title: e.target.value })} />
</div><div className="grid grid-cols-2 gap-3"><div><Label>Data inicio</Label><Input type="datetime-local" value={newEventForm.startDate} onChange={e => setNewEventForm({ ...newEventForm, startDate: e.target.value })} />
</div><div><Label>Data fim</Label><Input type="datetime-local" value={newEventForm.endDate} onChange={e => setNewEventForm({ ...newEventForm, endDate: e.target.value })} /></div></div><div><Label>Tipo</Label>
<Select value={newEventForm.type} onValueChange={v => setNewEventForm({ ...newEventForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="meeting">Reuniao</SelectItem>
<SelectItem value="deadline">Prazo</SelectItem><SelectItem value="task">Tarefa</SelectItem><SelectItem value="holiday">Feriado</SelectItem></SelectContent></Select></div></div><DialogFooter><Button onClick={handleCreateEvent} disabled={!newEventForm.title || !newEventForm.startDate}>Criar</Button>
</DialogFooter></DialogContent></Dialog></div></div>
          <Card><CardContent className="p-4">{(() => { const firstDay = new Date(calYear, calMonth, 1).getDay(); const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate(); const today = new Date(); const days: (number | null)[] = []; for (let i = 0; i < firstDay; i++) days.push(null); for (let i = 1; i <= daysInMonth; i++) days.push(i); const eventMap = new Map<string, CalendarEvent[]>(); calendarEvents.forEach(e => { const d = new Date(e.startDate); if (d.getMonth() === calMonth && d.getFullYear() === calYear) { const key = d.getDate(); const arr = eventMap.get(key) || []; arr.push(e); eventMap.set(key, arr) } }); return (<div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">{['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].map(d => <div key={d} className="bg-muted p-2 text-center text-xs font-medium">{d}</div>)}{days.map((day, i) => { const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear(); const dayEvents = day ? eventMap.get(day) || [] : []; return (<div key={i} className={`bg-card p-1.5 min-h-[60px] sm:min-h-[80px] ${day ? '' : 'bg-muted/30'} ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}>{day && <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{day}</span>}{dayEvents.slice(0, 2).map(e => (<div key={e.id} className="text-[10px] px-1 py-0.5 rounded mt-0.5 truncate" style={{ backgroundColor: e.color || (e.type === 'deadline' ? '#fef2f2' : e.type === 'holiday' ? '#f0fdf4' : '#f0f9ff'), color: e.type === 'deadline' ? '#dc2626' : e.type === 'holiday' ? '#16a34a' : '#0369a1' }}>{e.title}</div>))}{dayEvents.length > 2 && <p className="text-[9px] text-muted-foreground">+{dayEvents.length - 2}</p>}</div>) })}</div>) })()}</CardContent>
</Card>
        </>)}

        {/* ── DOCUMENTS ── */}
        {activeTab === 'documents' && (<>
          <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="text-xl font-bold">Documentos</h2><p className="text-sm text-muted-foreground">Central de documentos</p></div><Button className="gap-1.5" size="sm" onClick={() => fetch('/api/documents?limit=100').then(r => r.json()).then(d => setDocuments(Array.isArray(d) ? d : d.documents || []))}>
<RefreshCw className="w-4 h-4" />Carregar</Button></div>
          <div className="flex gap-2 flex-wrap">{['all', 'pending', 'received', 'approved', 'rejected'].map(s => (<Button key={s} variant={docFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setDocFilter(s)}>{s === 'all' ? 'Todos' : SC[s]?.l || s}</Button>))}</div>
          <Card><CardContent className="p-2"><div className="divide-y">{filteredDocs.map(d => (<div key={d.id} className="flex items-center gap-3 p-3 hover:bg-muted/50"><div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
<FileText className="w-4 h-4 text-amber-700" /></div><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{d.name}</p><p className="text-xs text-muted-foreground truncate">{d.client?.name}{d.dueDate ? ` · Prazo: ${fmtDate(d.dueDate)}` : ''}</p>
</div><Badge variant="secondary" className={`text-[10px] ${SC[d.status]?.c || ''}`}>{SC[d.status]?.l || d.status}</Badge></div>))}{filteredDocs.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum documento. Carregue os documentos.</p>}</div>
</CardContent></Card>
        </>)}

        {/* ── TEAM ── */}
        {activeTab === 'team' && (<>
          <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="text-xl font-bold">Equipe</h2><p className="text-sm text-muted-foreground">{team.length} membro(s)</p></div><Dialog open={showNewMember} onOpenChange={setShowNewMember}>
<DialogTrigger asChild><Button className="gap-1.5" size="sm"><UserPlus className="w-4 h-4" />Convidar</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Convidar membro</DialogTitle></DialogHeader>
<div className="grid gap-3 py-2"><div><Label>Nome</Label><Input value={newMemberForm.name} onChange={e => setNewMemberForm({ ...newMemberForm, name: e.target.value })} /></div><div><Label>Email</Label>
<Input type="email" value={newMemberForm.email} onChange={e => setNewMemberForm({ ...newMemberForm, email: e.target.value })} /></div><div><Label>Papel</Label><Select value={newMemberForm.role} onValueChange={v => setNewMemberForm({ ...newMemberForm, role: v })}>
<SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="gestor">Gestor</SelectItem><SelectItem value="collaborator">Colaborador</SelectItem>
<SelectItem value="financeiro">Financeiro</SelectItem></SelectContent></Select></div></div><DialogFooter><Button onClick={handleCreateMember} disabled={!newMemberForm.name || !newMemberForm.email}>Convidar</Button>
</DialogFooter></DialogContent></Dialog></div>
          <Card><CardContent className="p-2"><div className="divide-y">{team.map(m => (<div key={m.id} className="flex items-center gap-3 p-3"><Avatar className="w-9 h-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{m.name.substring(0, 2).toUpperCase()}</AvatarFallback>
</Avatar><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{m.name}</p><p className="text-xs text-muted-foreground truncate">{m.email}</p></div><Badge variant="secondary" className={`text-[10px] ${RC[m.role]?.c || ''}`}>{RC[m.role]?.l || m.role}</Badge>
<Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{m.status === 'active' ? 'Ativo' : 'Convidado'}</Badge></div>))}{team.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum membro</p>}</div>
</CardContent></Card>
        </>)}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (<>
          <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Notificacoes</h2><p className="text-sm text-muted-foreground">{unread} nao lida(s)</p></div><Button variant="outline" size="sm" onClick={handleMarkNotificationsRead}>Marcar todas como lidas</Button>
</div>
          <Card><CardContent className="p-2"><div className="divide-y">{notifications.map(n => (<div key={n.id} className={`flex items-start gap-3 p-3 ${!n.read ? 'bg-primary/5' : ''}`}><div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'urgent' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
<div className="flex-1 min-w-0"><p className={`text-sm ${!n.read ? 'font-medium' : ''}`}>{n.title}</p><p className="text-xs text-muted-foreground">{n.message}</p><p className="text-[10px] text-muted-foreground mt-1">{fmtDateTime(n.createdAt)}</p>
</div></div>))}{notifications.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma notificacao</p>}</div></CardContent></Card>
        </>)}

        {/* ── BILLING ── */}
        {activeTab === 'billing' && (<>
          <div><h2 className="text-xl font-bold">Assinatura</h2><p className="text-sm text-muted-foreground">Planos e cobranca</p></div>
          <div className="grid sm:grid-cols-3 gap-4">{plans.map((p, i) => (<Card key={p.id} className={i === 1 ? 'border-primary' : ''}><CardContent className="p-5"><h3 className="font-bold mb-1">{p.name}</h3><div className="mb-3">
<span className="text-2xl font-bold">R$ {p.price.toFixed(2)}</span><span className="text-muted-foreground text-sm">/mes</span></div><div className="space-y-1.5 mb-4">{(JSON.parse(p.features || '[]') as string[]).map((f, j) => (<div key={j} className="flex items-center gap-2 text-sm">
<Check className="w-3.5 h-3.5 text-emerald-500" />{f}</div>))}</div><div className="text-xs text-muted-foreground space-y-1"><p>Ate {p.maxClients} clientes</p><p>Ate {p.maxUsers} usuarios</p></div><Button className="w-full mt-3" variant={i === 1 ? 'default' : 'outline'}>Alterar plano</Button>
</CardContent></Card>))}</div>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Aviso legal</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">O Company Radar e uma ferramenta de organizacao operacional. Nao substitui consultoria contabil ou juridica. O escritorio usuario permanece responsavel pela validacao de todos os conteudos e procedimentos.</p>
</CardContent></Card>
        </>)}

        {/* ── AUDIT ── */}
        {activeTab === 'audit' && (<>
          <div><h2 className="text-xl font-bold">Auditoria</h2><p className="text-sm text-muted-foreground">Trilha de auditoria</p></div>
          <Card><CardContent className="p-2"><div className="divide-y">{auditLogs.map(l => (<div key={l.id} className="flex items-center gap-3 p-3"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
<History className="w-4 h-4 text-muted-foreground" /></div><div className="flex-1 min-w-0"><p className="text-sm font-medium">{l.action}</p><p className="text-xs text-muted-foreground truncate">{l.detail || l.entity || ''}</p>
</div><div className="text-right shrink-0"><p className="text-xs text-muted-foreground">{l.userName || 'Sistema'}</p><p className="text-[10px] text-muted-foreground">{fmtDateTime(l.createdAt)}</p></div>
</div>))}{auditLogs.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum registro</p>}</div></CardContent></Card>
        </>)}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (<>
          <div><h2 className="text-xl font-bold">Configuracoes</h2><p className="text-sm text-muted-foreground">Configuracao da organizacao</p></div>
          <div className="grid gap-4 max-w-2xl"><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Dados da Organizacao</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-3">
<div><Label>Nome</Label><Input defaultValue="Escritorio Contabil Demo" /></div><div><Label>CNPJ</Label><Input defaultValue="12.345.678/0001-90" /></div></div><div className="grid grid-cols-3 gap-3"><div>
<Label>Email</Label><Input defaultValue="contato@demo.com.br" /></div><div><Label>Telefone</Label><Input defaultValue="(11) 99999-0000" /></div><div><Label>Cidade/UF</Label><Input defaultValue="Sao Paulo/SP" />
</div></div><Button className="gap-1.5" size="sm"><Save className="w-4 h-4" />Salvar</Button></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Departamentos</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{['Fiscal', 'Pessoal', 'Contabil', 'Societario', 'Legalizacao', 'SST'].map(d => (<Badge key={d} variant="outline">{d}</Badge>))}</div>
</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Preferencias de Notificacao</CardTitle></CardHeader><CardContent className="space-y-3">{['Email ao vencer tarefa', 'Email ao criar tarefa', 'Email resumo diario', 'Notificacao in-app', 'Alerta de atraso'].map(n => (<div key={n} className="flex items-center justify-between">
<span className="text-sm">{n}</span><Checkbox defaultChecked /></div>))}</CardContent></Card></div>
        </>)}
      </div>

      <footer className="border-t px-4 py-2 text-center text-[10px] text-muted-foreground">Company Radar — Ferramenta de organizacao operacional. Conteudos e procedimentos sao definidos pelo escritorio usuario.</footer>
    </main>

    {/* ── CLIENT DETAIL DIALOG ── */}
    <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}><DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">{selectedClient && (<><DialogHeader><DialogTitle>{selectedClient.tradeName || selectedClient.name}</DialogTitle>
<DialogDescription>{selectedClient.cnpj}</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-muted-foreground">Razao Social:</span>
<br />{selectedClient.name}</div><div><span className="text-muted-foreground">Segmento:</span><br />{selectedClient.segment || '-'}</div><div><span className="text-muted-foreground">Cidade/UF:</span><br />{selectedClient.city}/{selectedClient.state}</div>
<div><span className="text-muted-foreground">Email:</span><br />{selectedClient.email || '-'}</div><div><span className="text-muted-foreground">Telefone:</span><br />{selectedClient.phone || '-'}</div>
<div><span className="text-muted-foreground">Status:</span><br /><Badge variant="secondary" className={SC[selectedClient.status]?.c}>{SC[selectedClient.status]?.l}</Badge></div></div>{selectedClient.notes && (<div>
<span className="text-xs text-muted-foreground">Observacoes:</span><p className="text-sm mt-1">{selectedClient.notes}</p></div>)}{selectedClient.tagsList && selectedClient.tagsList.length > 0 && (<div className="flex gap-1.5 flex-wrap">{selectedClient.tagsList.map(t => (<Badge key={t.id} variant="outline" className="text-[10px]" style={{ borderColor: t.color }}>{t.name}</Badge>))}</div>)}<Separator />
<div><p className="text-sm font-medium mb-2">Contatos ({selectedClient.contacts.length})</p>{selectedClient.contacts.length === 0 && <p className="text-xs text-muted-foreground">Nenhum contato</p>}{selectedClient.contacts.map(c => (<div key={c.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50 mb-1">
<div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.email || ''}</p></div><Badge variant="outline" className="text-[10px]">{c.role || 'Contato'}</Badge></div>))}</div>
<Separator /><div className="flex gap-6 text-center"><div><p className="text-2xl font-bold">{selectedClient._count.tasks}</p><p className="text-xs text-muted-foreground">Tarefas</p></div><div><p className="text-2xl font-bold">{selectedClient._count.documents}</p>
<p className="text-xs text-muted-foreground">Documentos</p></div><div><p className="text-2xl font-bold text-red-600">{selectedClient.pendingTasks}</p><p className="text-xs text-muted-foreground">Pendentes</p>
</div></div></div><DialogFooter><Button variant="destructive" size="sm" className="gap-1.5" onClick={() => handleDeleteClient(selectedClient.id)}><Trash2 className="w-3.5 h-3.5" />Excluir</Button></DialogFooter>
</>)}</DialogContent></Dialog>

    {/* ── TASK DETAIL DIALOG ── */}
    <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}><DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">{selectedTask && (<><DialogHeader><DialogTitle className="flex items-center gap-2">{selectedTask.title}<Badge variant="secondary" className={`text-[10px] ${PC[selectedTask.priority]?.c || ''}`}>{PC[selectedTask.priority]?.l}</Badge>
</DialogTitle><DialogDescription>{selectedTask.client?.name}{selectedTask.dueDate ? ` · Prazo: ${fmtDate(selectedTask.dueDate)}` : ''}{selectedTask.assignedTo ? ` · Responsavel: ${selectedTask.assignedTo}` : ''}</DialogDescription>
</DialogHeader><div className="space-y-4">{selectedTask.description && <p className="text-sm">{selectedTask.description}</p>}
<div className="flex gap-2"><Button size="sm" variant={selectedTask.status === 'pending' ? 'default' : 'outline'} onClick={() => { handleTaskStatus(selectedTask.id, 'pending'); const u = { ...selectedTask, status: 'pending' }; setSelectedTask(u as Task) }}>Pendente</Button>
<Button size="sm" variant={selectedTask.status === 'in_progress' ? 'default' : 'outline'} onClick={() => { handleTaskStatus(selectedTask.id, 'in_progress'); const u = { ...selectedTask, status: 'in_progress' }; setSelectedTask(u as Task) }}>Em andamento</Button>
<Button size="sm" variant={selectedTask.status === 'completed' ? 'default' : 'outline'} onClick={() => { handleTaskStatus(selectedTask.id, 'completed'); const u = { ...selectedTask, status: 'completed' }; setSelectedTask(u as Task) }}>Concluido</Button>
</div>{selectedTask.recurrenceRule && (<div className="text-xs bg-muted p-2 rounded">Recorrencia: {selectedTask.recurrenceRule}</div>)}
{/* Checklist */}<div><p className="text-sm font-medium mb-2">Checklist</p><div className="space-y-1">{(selectedTask.checklist || []).map(item => (<div key={item.id} className="flex items-center gap-2">
<Checkbox checked={item.done} onCheckedChange={() => handleToggleChecklist(item.id)} /><span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span></div>))}</div>
<div className="flex gap-2 mt-2"><Input placeholder="Novo item..." value={newChecklistText} onChange={e => setNewChecklistText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChecklist()} />
<Button size="sm" onClick={handleAddChecklist}><Plus className="w-3.5 h-3.5" /></Button></div></div>
{/* Comments */}<Separator /><div><p className="text-sm font-medium mb-2">Comentarios ({(selectedTask.comments || []).length})</p><div className="space-y-2 max-h-40 overflow-y-auto">{(selectedTask.comments || []).map(c => (<div key={c.id} className="bg-muted/50 p-2 rounded">
<div className="flex items-center gap-2 mb-1"><span className="text-xs font-medium">{c.userName}</span><span className="text-[10px] text-muted-foreground">{fmtDateTime(c.createdAt)}</span></div><p className="text-sm">{c.content}</p>
</div>))}</div><div className="flex gap-2 mt-2"><Input placeholder="Comentario..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
<Button size="sm" onClick={handleAddComment}><Send className="w-3.5 h-3.5" /></Button></div></div></div></>)}</DialogContent></Dialog>

    {/* ── TEMPLATE DETAIL DIALOG ── */}
    {selectedTemplate && (
    <Dialog open onOpenChange={() => setSelectedTemplate(null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{selectedTemplate.name}</DialogTitle><DialogDescription>{selectedTemplate.description}</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant={selectedTemplate.isPublished ? "default" : "secondary"}>{selectedTemplate.isPublished ? "Publicado" : "Rascunho"}</Badge>
            {selectedTemplate.category && <Badge variant="outline">{selectedTemplate.category}</Badge>}
            <Badge variant="outline">v{selectedTemplate.version}</Badge>
          </div>
          <div><p className="text-sm font-medium mb-2">Etapas</p>
            {(JSON.parse(selectedTemplate.steps || "[]") as {title:string}[]).map((s,i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{i+1}</span>
                <div><p className="text-sm font-medium">{s.title}</p></div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    )}
  </div>
)

  )
}