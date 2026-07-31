"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, HelpCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"

interface FAQItem {
  id: string
  question: string
  answer: string
  order: number
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFAQ() {
      try {
        const res = await fetch("/api/public/faq")
        if (res.ok) {
          const data = await res.json()
          setFaqs(data)
        }
      } catch {
        toast.error("Erro ao carregar perguntas frequentes.")
      } finally {
        setLoading(false)
      }
    }
    fetchFAQ()
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#2563eb]">FAQ</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
              Perguntas Frequentes
            </h1>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Encontre respostas para as dúvidas mais comuns sobre o Company Radar.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="bg-white pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="py-20 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhuma pergunta cadastrada no momento.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left text-base font-medium text-gray-900 hover:text-[#2563eb]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm sm:p-10">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Ainda tem dúvidas?
            </h2>
            <p className="mt-2 text-gray-500">
              Entre em contato com nossa equipe. Estamos prontos para ajudar.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                asChild
              >
                <a href="mailto:contato@companyradar.com.br">
                  Falar com suporte
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-700" asChild>
                <Link href="/register">Criar conta gratuita</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário.
          </p>
        </div>
      </section>
    </div>
  )
}
