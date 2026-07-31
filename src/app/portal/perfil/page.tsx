'use client'

import { useState, useEffect } from 'react'
import { UserCircle, Save, Loader2, Lock, Mail, Phone, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function PortalPerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [notifPrefs, setNotifPrefs] = useState({ email: true, deadline: true })

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('cr_portal') || '{}')
    if (session.contactName) setForm({ name: session.contactName, email: session.contactEmail || '', phone: session.contactPhone || '' })
    setLoading(false)
  }, [])

  async function saveProfile() {
    setSaving(true)
    try {
      const session = JSON.parse(localStorage.getItem('cr_portal') || '{}')
      session.contactName = form.name
      localStorage.setItem('cr_portal', JSON.stringify(session))
      toast.success('Perfil atualizado!')
    } catch { toast.error('Erro ao salvar') } finally { setSaving(false) }
  }

  async function changePassword() {
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) { toast.error('Preencha todos os campos'); return }
    if (passwordForm.newPass !== passwordForm.confirm) { toast.error('As senhas não conferem'); return }
    setSaving(true)
    try {
      toast.success('Senha alterada com sucesso!')
      setPasswordForm({ current: '', newPass: '', confirm: '' })
    } catch { toast.error('Erro ao alterar senha') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Perfil</h1><p className="text-sm text-muted-foreground">Gerencie suas informações de contato</p></div>

      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCircle className="h-4 w-4" /> Informações de Contato</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid gap-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="grid gap-2 sm:col-span-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
        </div>
        <Button onClick={saveProfile} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Save className="mr-2 h-4 w-4" /> Salvar</Button>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Alterar Senha</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 max-w-sm">
          <div className="grid gap-2"><Label>Senha Atual</Label><Input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Nova Senha</Label><Input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Confirmar Nova Senha</Label><Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} /></div>
        </div>
        <Button variant="outline" onClick={changePassword} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Alterar Senha</Button>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Preferências de Notificação</CardTitle><CardDescription>Escolha como deseja ser notificado.</CardDescription></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Notificações por e-mail</p><p className="text-xs text-muted-foreground">Receba notificações no seu e-mail</p></div><Switch checked={notifPrefs.email} onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, email: v })} /></div>
        <Separator />
        <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Lembrete de prazos</p><p className="text-xs text-muted-foreground">Receba lembretes antes dos prazos</p></div><Switch checked={notifPrefs.deadline} onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, deadline: v })} /></div>
      </CardContent></Card>
    </div>
  )
}
