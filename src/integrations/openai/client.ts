export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const PROXY_URL = import.meta.env.VITE_OPENAI_PROXY_URL || 'http://localhost:5174/api/chat';

export async function chat(messages: ChatMessage[], model?: string) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }
  return (await res.json()) as { role: 'assistant'; content: string };
}