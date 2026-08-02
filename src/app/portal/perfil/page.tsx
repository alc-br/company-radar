'use client'

import { useState, useEffect } from 'react'
import { UserCircle, Save, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function PortalPerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })

  useEffect(() => {
    fetch('/api/v1/portal/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setForm({ name: d.name || '', email: d.email || '', phone: d.phone || '' }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function saveProfile() {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/portal/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      })
      if (res.ok) {
        const d = await res.json()
        setForm({ name: d.name, email: d.email, phone: d.phone })
        try {
          const session = JSON.parse(localStorage.getItem('cr_portal') || '{}')
          localStorage.setItem('cr_portal', JSON.stringify({ ...session, contactName: d.name, contactPhone: d.phone }))
        } catch { /* ignore */ }
        toast.success('Perfil atualizado!')
      } else {
        toast.error('Erro ao salvar')
      }
    } catch { toast.error('Erro ao salvar') } finally { setSaving(false) }
  }

  async function changePassword() {
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) { toast.error('Preencha todos os campos'); return }
    if (passwordForm.newPass !== passwordForm.confirm) { toast.error('As senhas não conferem'); return }
    setChangingPassword(true)
    try {
      const res = await fetch('/api/v1/portal/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: passwordForm.current, new_pass: passwordForm.newPass }),
      })
      if (res.ok) {
        toast.success('Senha alterada com sucesso!')
        setPasswordForm({ current: '', newPass: '', confirm: '' })
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Erro ao alterar senha')
      }
    } catch { toast.error('Erro ao alterar senha') } finally { setChangingPassword(false) }
  }

  if (loading) return <div className="max-w-2xl"><p className="text-sm text-muted-foreground">Carregando...</p></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Perfil</h1><p className="text-sm text-muted-foreground">Gerencie suas informações de contato</p></div>

      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCircle className="h-4 w-4" /> Informações de Contato</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid gap-2"><Label>E-mail</Label><Input type="email" value={form.email} disabled className="opacity-60" /></div>
          <div className="grid gap-2 sm:col-span-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
        </div>
        <p className="text-xs text-muted-foreground">O e-mail é o seu identificador de acesso e não pode ser alterado por aqui — fale com o escritório se precisar trocá-lo.</p>
        <Button onClick={saveProfile} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Save className="mr-2 h-4 w-4" /> Salvar</Button>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Alterar Senha</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 max-w-sm">
          <div className="grid gap-2"><Label>Senha Atual</Label><Input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Nova Senha</Label><Input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Confirmar Nova Senha</Label><Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} /></div>
        </div>
        <Button variant="outline" onClick={changePassword} disabled={changingPassword}>{changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Alterar Senha</Button>
      </CardContent></Card>
    </div>
  )
}
