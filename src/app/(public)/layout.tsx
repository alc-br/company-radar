"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Radar, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/recursos", label: "Recursos" },
  { href: "/planos", label: "Planos" },
  { href: "/faq", label: "FAQ" },
]

function PublicHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb]">
            <Radar className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Company <span className="text-[#2563eb]">Radar</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-[#2563eb] bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login" className="text-gray-700 hover:text-gray-900">
              Entrar
            </Link>
          </Button>
          <Button
            size="sm"
            className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            asChild
          >
            <Link href="/register">Começar agora</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:text-gray-900 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-[#2563eb] bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-gray-200" />
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="mt-1 flex items-center justify-center rounded-md bg-[#2563eb] px-3 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8]"
            >
              Começar agora
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

function PublicFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb]">
                <Radar className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                Company <span className="text-[#2563eb]">Radar</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário.
            </p>
          </div>

          {/* Produto */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Produto</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/recursos" className="text-sm text-gray-500 hover:text-[#2563eb]">
                  Recursos
                </Link>
              </li>
              <li>
                <Link href="/planos" className="text-sm text-gray-500 hover:text-[#2563eb]">
                  Planos
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-500 hover:text-[#2563eb]">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Empresa</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-[#2563eb]">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-[#2563eb]">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Contato</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="mailto:contato@companyradar.com.br" className="text-sm text-gray-500 hover:text-[#2563eb]">
                  contato@companyradar.com.br
                </a>
              </li>
              <li>
                <Link href="/login" className="text-sm text-gray-500 hover:text-[#2563eb]">
                  Acesso ao sistema
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6">
          <p className="text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Company Radar. Todos os direitos reservados.
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <Toaster position="top-right" richColors />
    </div>
  )
}
