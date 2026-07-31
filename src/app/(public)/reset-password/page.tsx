"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Radar, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!token) {
      toast.error("Token inválido. Solicite uma nova recuperação de senha.")
    }
  }, [token])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!token) {
      newErrors.token = "Token inválido."
    }
    if (!senha) {
      newErrors.senha = "A nova senha é obrigatória."
    } else if (senha.length < 8) {
      newErrors.senha = "A senha deve ter no mínimo 8 caracteres."
    }
    if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: senha }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Erro ao redefinir senha. Solicite um novo link.")
        return
      }

      setDone(true)
      toast.success("Senha redefinida com sucesso!")
    } catch {
      toast.error("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Senha redefinida</h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
          </p>
          <Button
            className="mt-8 bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            asChild
          >
            <Link href="/login">Ir para o login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb]">
              <Radar className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Company <span className="text-[#2563eb]">Radar</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Redefinir senha</h1>
          <p className="mt-2 text-sm text-gray-500">
            Crie uma nova senha para acessar sua conta.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {errors.token && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errors.token}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="senha">Nova senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value)
                    if (errors.senha) setErrors((prev) => ({ ...prev, senha: "" }))
                  }}
                  className={`pr-10 ${errors.senha ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.senha && <p className="text-xs text-red-500">{errors.senha}</p>}
            </div>

            {/* Confirm */}
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <Input
                id="confirmarSenha"
                type={showPassword ? "text" : "password"}
                placeholder="Repita a nova senha"
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value)
                  if (errors.confirmarSenha) setErrors((prev) => ({ ...prev, confirmarSenha: "" }))
                }}
                className={errors.confirmarSenha ? "border-red-400 focus-visible:ring-red-400" : ""}
                autoComplete="new-password"
              />
              {errors.confirmarSenha && <p className="text-xs text-red-500">{errors.confirmarSenha}</p>}
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
              disabled={loading || !token}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Redefinir senha
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
            >
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
