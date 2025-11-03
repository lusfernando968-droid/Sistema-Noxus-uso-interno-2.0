import { useState } from 'react';
import { chat, ChatMessage } from '../../integrations/openai/client';

export default function OpenAIChat() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    setError(null);
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'Você é um assistente útil.' },
        { role: 'user', content: input },
      ];
      const result = await chat(messages);
      setReply(result.content);
    } catch (e: any) {
      setError(e?.message || 'Erro ao chamar o proxy');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 8 }}>Chat GPT (proxy local)</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta..."
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={send} disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <pre style={{ whiteSpace: 'pre-wrap' }}>{reply}</pre>
    </div>
  );
}