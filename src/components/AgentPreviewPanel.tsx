"use client";

import { useState } from "react";
import { AgentConfig } from "@/types/agent";

interface AgentPreviewPanelProps {
  config: AgentConfig | null;
  assistantId: string | null;
}

export default function AgentPreviewPanel({ config, assistantId }: AgentPreviewPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-800 shrink-0">
        <h2 className="text-sm font-medium text-gray-300">Agent Preview</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {config ? (
          <AgentFields config={config} />
        ) : (
          <EmptyState />
        )}
      </div>

      <CallTrigger assistantId={assistantId} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-2xl">
        🤖
      </div>
      <p className="text-gray-500 text-sm max-w-xs">
        Your agent will appear here once you describe it in the chat.
      </p>
    </div>
  );
}

function AgentFields({ config }: { config: AgentConfig }) {
  return (
    <>
      <Field label="Name" value={config.name} />
      <Field label="Voice" value={config.voice} />
      <Field label="First Message" value={config.firstMessage} />
      <Field label="System Prompt" value={config.systemPrompt} multiline />
      <div>
        <p className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Qualification Questions
        </p>
        <ol className="space-y-2">
          {(config.qualificationQuestions ?? []).map((q, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-200">
              <span className="text-emerald-400 font-mono shrink-0">{i + 1}.</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </div>
      <Field label="Calendly URL" value={config.calendlyUrl} />
    </>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <div
        className={`bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 ${
          multiline ? "whitespace-pre-wrap leading-relaxed" : "truncate"
        }`}
      >
        {value == null ? (
          <span className="text-gray-600">—</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function CallTrigger({ assistantId }: { assistantId: string | null }) {
  const [phone, setPhone] = useState("");
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canCall = !!assistantId && phone.trim().length > 0 && !calling;

  const handleCall = async () => {
    if (!canCall) return;
    setCalling(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantId, phoneNumber: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to initiate call.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="px-5 py-4 border-t border-gray-800 shrink-0 space-y-3">
      <input
        type="tel"
        placeholder="+1 (555) 000-0000"
        value={phone}
        onChange={(e) => { setPhone(e.target.value); setSuccess(false); setError(null); }}
        disabled={!assistantId || calling}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      />
      <button
        onClick={handleCall}
        disabled={!canCall}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {calling ? "Calling..." : "📞 Call Me Now"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">Call initiated! Your phone should ring shortly.</p>}
    </div>
  );
}
