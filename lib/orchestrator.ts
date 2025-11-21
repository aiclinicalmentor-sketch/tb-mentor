// lib/orchestrator.ts

import { callModel, ChatMessage, ToolCall } from "./llmClient";
import { tbTools } from "./tools";

async function callRagBackend(question: string): Promise<any> {
  const url = process.env.RAG_QUERY_URL;
  if (!url) throw new Error("Missing RAG_QUERY_URL env var.");

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`RAG backend error: ${resp.status} ${text}`);
  }

  return resp.json();
}

async function callTdaBackend(patientJson: string): Promise<any> {
  const url = process.env.TDA_QUERY_URL;
  if (!url) throw new Error("Missing TDA_QUERY_URL env var.");

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_json: patientJson })
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`TDA backend error: ${resp.status} ${text}`);
  }

  return resp.json();
}

/**
 * One full TB-Mentor step:
 *  - system + user messages → model
 *  - if tool calls: call RAG / TDA → feed back tool results → model again
 *  - return final answer
 */
export async function runTbMentorTurn(
  userMessages: ChatMessage[]
): Promise<{ reply: string; debug?: any }> {
  const systemMessage: ChatMessage = {
    role: "system",
    content: `
You are the TB Clinical Mentor — a supportive, expert AI assistant for clinicians.

Your goals:
- Model how clinicians think, not just what they do.
- Be explicit about reasoning, trade-offs, and uncertainty.
- Use the WHO TB guidance returned by the RAG tool as the primary authority for TB-specific recommendations.
- When pediatric TB treatment questions require the WHO TDA algorithm, call the tda() tool and respect its outputs.

ALWAYS:
- Treat this as educational support, not a replacement for local guidelines or real clinicians.
- Clearly explain your reasoning and link it to the guideline snippets provided by RAG.
`.trim()
  };

  const messages: ChatMessage[] = [systemMessage, ...userMessages];

  // First call: let the model decide if it needs tools
  const first = await callModel(messages, {
    tools: tbTools,
    toolChoice: "auto"
  });

  const assistant1 = first.assistantMessage;
  const toolCalls = assistant1.tool_calls;

  if (!toolCalls || toolCalls.length === 0) {
    // No tools – just return the answer
    return { reply: assistant1.content, debug: { step: "no-tools", raw: first.raw } };
  }

  // Handle tool calls (RAG and/or TDA), single round
  const toolMessages: ChatMessage[] = [];

  for (const call of toolCalls as ToolCall[]) {
    const { name, arguments: argString } = call.function;
    let args: any;
    try {
      args = JSON.parse(argString || "{}");
    } catch (e) {
      args = {};
    }

    if (name === "rag_query") {
      const question = args.question ?? "";
      const ragResult = await callRagBackend(question);

      toolMessages.push({
        role: "tool",
        name: "rag_query",
        tool_call_id: call.id,
        content: JSON.stringify(ragResult)
      });
    } else if (name === "tda") {
      const patientJson = args.patient_json ?? "{}";
      const tdaResult = await callTdaBackend(patientJson);

      toolMessages.push({
        role: "tool",
        name: "tda",
        tool_call_id: call.id,
        content: JSON.stringify(tdaResult)
      });
    } else {
      // Unknown tool; send back an error-like message
      toolMessages.push({
        role: "tool",
        name,
        tool_call_id: call.id,
        content: JSON.stringify({ error: `Unknown tool: ${name}` })
      });
    }
  }

  // Second call: give the model its own tool request + the tool results, force no further tools
  const secondMessages: ChatMessage[] = [
    systemMessage,
    ...userMessages,
    assistant1,
    ...toolMessages
  ];

  const second = await callModel(secondMessages, {
    tools: tbTools,
    toolChoice: "none"
  });

  return {
    reply: second.assistantMessage.content,
    debug: {
      step: "tools-used",
      firstRaw: first.raw,
      secondRaw: second.raw
    }
  };
}
