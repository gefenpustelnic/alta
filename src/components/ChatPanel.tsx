"use client";

import { useState, useRef, useEffect } from "react";
import { AgentConfig } from "@/types/agent";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  onAgentConfig: (config: AgentConfig) => void;
}

export default function ChatPanel({ onAgentConfig }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI agent builder. Describe the voice assistant you want to create — who it calls, what it's selling or offering, and how it should qualify leads. I'll build it for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    // AI integration added in next issue
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-5 py-4 border-t border-gray-800 shrink-0">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="Describe your voice agent..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-emerald-600 text-white rounded-br-sm"
            : "bg-gray-800 text-gray-200 rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
