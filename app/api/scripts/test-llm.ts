// scripts/test-llm.ts

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { callModel, ChatMessage } from "../../../lib/llmClient";

async function main() {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "You are the TB Clinical Mentor."
    },
    {
      role: "user",
      content: "Say hello in one sentence."
    }
  ];

  const res = await callModel(messages);
  console.log("Assistant reply:", res.assistantMessage.content);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
