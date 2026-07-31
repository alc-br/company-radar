"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Radar, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [sobrenome, setSobrenome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [aceitarTermos, setAceitarTermos] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const session = localStorage.getItem("cr_session")
    if (session) {
      try {
        const parsed = JSON.parse(session)
        if (parsed.userId && parsed.orgId) {
          router.replace("/app")
        }
      } catch {
        // ignore
      }
    }
  }, [router])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!nome.trim()) newErrors.nome = "O nome é obrigatório."
    if (!sobrenome.trim()) newErrors.sobrenome = "O sobrenome é obrigatório."
    if (!email.trim()) {
      newErrors.email = "O e-mail é obrigatório."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Insira um e-mail válido."
    }
    if (!senha) {
      newErrors.senha = "A senha é obrigatória."
    } else if (senha.length < 8) {
      newErrors.senha = "A senha deve ter no mínimo 8 caracteres."
    }
    if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem."
    }
    if (!aceitarTermos) {
      newErrors.aceitarTermos = "Você deve aceitar os termos de uso."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nome.trim(),
          lastName: sobrenome.trim(),
          email: email.trim(),
          password: senha,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          toast.error("Este e-mail já está cadastrado.")
        } else {
          toast.error(data.error || "Erro ao criar conta.")
        }
        return
      }

      toast.success("Conta criada com sucesso! Faça login para continuar.")
      router.push("/login?message=Conta criada com sucesso. Faça login para continuar.")
    } catch {
      toast.error("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
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
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Criar sua conta</h1>
          <p className="mt-2 text-sm text-gray-500">
            Comece a organizar o seu escritório contábil gratuitamente.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="João"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value)
                    if (errors.nome) setErrors((prev) => ({ ...prev, nome: "" }))
                  }}
                  className={errors.nome ? "border-red-400 focus-visible:ring-red-400" : ""}
                  autoComplete="given-name"
                />
                {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sobrenome">Sobrenome</Label>
                <Input
                  id="sobrenome"
                  placeholder="Silva"
                  value={sobrenome}
                  onChange={(e) => {
                    setSobrenome(e.target.value)
                    if (errors.sobrenome) setErrors((prev) => ({ ...prev, sobrenome: "" }))
                  }}
                  className={errors.sobrenome ? "border-red-400 focus-visible:ring-red-400" : ""}
                  autoComplete="family-name"
                />
                {errors.sobrenome && <p className="text-xs text-red-500">{errors.sobrenome}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@escritorio.com.br"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }))
                }}
                className={errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
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

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar senha</Label>
              <Input
                id="confirmarSenha"
                type={showPassword ? "text" : "password"}
                placeholder="Repita a senha"
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

            {/* Terms */}
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={aceitarTermos}
                  onCheckedChange={(checked) => {
                    setAceitarTermos(checked === true)
                    if (errors.aceitarTermos) setErrors((prev) => ({ ...prev, aceitarTermos: "" }))
                  }}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm font-normal text-gray-600 leading-snug cursor-pointer">
                  Li e aceito os{" "}
                  <Link href="/terms" className="text-[#2563eb] hover:underline" target="_blank">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacy" className="text-[#2563eb] hover:underline" target="_blank">
                    Política de Privacidade
                  </Link>
                  .
                </Label>
              </div>
              {errors.aceitarTermos && <p className="text-xs text-red-500">{errors.aceitarTermos}</p>}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar conta
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-medium text-[#2563eb] hover:text-[#1d4ed8]">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
