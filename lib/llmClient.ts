// lib/llmClient.ts

import { tbTools, ToolDefinition } from "./tools";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string; // for tool messages
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface LlmResponse {
  assistantMessage: ChatMessage & { tool_calls?: ToolCall[] };
  raw: any;
}

/**
 * Low-level call to the hosted model (Qwen / Llama) via Together.ai.
 * Adjust the model name if needed according to Together docs.
 */
export async function callModel(
  messages: ChatMessage[],
  options?: {
    tools?: ToolDefinition[];
    toolChoice?: "auto" | "none";
  }
): Promise<LlmResponse> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing TOGETHER_API_KEY environment variable.");
  }

  const body: any = {
    model: process.env.LLM_MODEL_NAME || "qwen2.5-72b-instruct", // adjust as needed
    messages,
    temperature: 0.2,
    top_p: 0.9
  };

  if (options?.tools && options.tools.length > 0) {
    body.tools = options.tools;
    body.tool_choice = options.toolChoice || "auto";
  }

  const resp = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LLM call failed: ${resp.status} ${resp.statusText} – ${text}`);
  }

  const json = await resp.json();

  const choice = json.choices?.[0];
  if (!choice || !choice.message) {
    throw new Error("Unexpected LLM response format: no choices[0].message");
  }

  const assistantMessage: ChatMessage & { tool_calls?: ToolCall[] } = {
    role: choice.message.role,
    content: choice.message.content ?? "",
    tool_calls: choice.message.tool_calls
  };

  return { assistantMessage, raw: json };
}
