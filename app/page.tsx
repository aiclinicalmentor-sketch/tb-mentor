import { redirect } from "next/navigation";

export default function Home() {
  // Send root traffic to the chat UI
  redirect("/chat");
}
