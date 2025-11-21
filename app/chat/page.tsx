// app/chat/page.tsx

"use client";

import React, { useState } from "react";
import type { ChatMessage } from "../../lib/llmClient";

interface UiMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input.trim() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Convert to backend message format (no system message; added server-side)
      const payloadMessages: ChatMessage[] = newMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages })
      });

      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json.error || "Unknown error from /api/chat");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.reply as string }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message || "Something went wrong."}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh"
      }}
    >
      <header
        style={{
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #ddd",
          fontWeight: 600
        }}
      >
        TB Clinical Mentor (prototype)
      </header>

      <main
        style={{
          flex: 1,
          padding: "1rem",
          overflowY: "auto",
          background: "#fafafa"
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#666" }}>
            Ask a TB or TPT question, or paste a clinical scenario to get
            started.
          </p>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "0.75rem",
              textAlign: m.role === "user" ? "right" : "left"
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                backgroundColor: m.role === "user" ? "#0070f3" : "#e5e7eb",
                color: m.role === "user" ? "#fff" : "#111",
                maxWidth: "70%",
                whiteSpace: "pre-wrap"
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            Thinking / checking tools…
          </p>
        )}
      </main>

      <footer
        style={{
          padding: "0.75rem",
          borderTop: "1px solid #ddd",
          display: "flex",
          gap: "0.5rem"
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a question and press Enter to send…"
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            padding: "0.5rem",
            borderRadius: "0.5rem",
            border: "1px solid #ccc"
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "0 1rem",
            borderRadius: "0.5rem",
            border: "none",
            backgroundColor: loading ? "#888" : "#0070f3",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer"
          }}
        >
          Send
        </button>
      </footer>
    </div>
  );
}
