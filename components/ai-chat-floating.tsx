"use client"

import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, X } from 'lucide-react'

type Message = { id: string; role: "user" | "assistant"; content: string }

export function AIChatFloating() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: "sys-1", role: "assistant", content: "Hi! Ask me about candidates or employees. Try: 'List all candidates with score above 7'." }
  ])
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("v0:ai:open", handler as any)
    return () => window.removeEventListener("v0:ai:open", handler as any)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  async function send() {
    if (!input.trim()) return
    const prompt = input.trim()
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: prompt }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "AI error")
      }
      // Stream reader fallback to text concat
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages((msgs) => {
          const last = msgs[msgs.length - 1]
          if (last?.role === "assistant" && last.id.startsWith("a-")) {
            return [...msgs.slice(0, -1), { ...last, content: assistantContent }]
          }
          return [...msgs, { id: `a-${Date.now()}`, role: "assistant", content: assistantContent }]
        })
      }
    } catch (e: any) {
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        aria-label="Open AI assistant"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-neutral-900 text-white shadow-lg flex items-center justify-center"
      >
        <Bot className="h-5 w-5" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <SheetHeader>
              <SheetTitle>AI Assistant</SheetTitle>
            </SheetHeader>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                  <div className={m.role === "user" ? "inline-block bg-neutral-900 text-white px-3 py-2 rounded-lg" : "inline-block bg-neutral-100 text-neutral-900 px-3 py-2 rounded-lg"}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </ScrollArea>
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Ask: List all candidates with score above 7"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send() }}
                disabled={loading}
              />
              <Button onClick={send} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
