import { GoogleGenerativeAI } from "@google/generative-ai";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

if (!API_KEY) {
  // We don't throw here to avoid crashing UI; the caller should handle errors.
  // This log hints missing configuration during development.
  console.warn("VITE_GEMINI_API_KEY is not set. AI chat will be disabled.");
}

// Lista de modelos candidatos estáveis (evita modelos preview/exp)
const CANDIDATE_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro",
  "gemini-1.0-pro",
  "gemini-1.0-pro-001",
];

function isPreviewOrExperimental(name: string) {
  const n = name.toLowerCase();
  return n.includes("preview") || n.includes("-exp") || n.includes("experimental");
}

async function resolveModelName(): Promise<string> {
  if (!API_KEY) return CANDIDATE_MODELS[0];
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`ListModels falhou: status ${res.status}`);
      return CANDIDATE_MODELS[0];
    }
    const data: any = await res.json();
    const models: any[] = data.models || [];
    const supportsGenerate = (m: any) => {
      const methods = m.supportedGenerationMethods || m.supported_generation_methods || [];
      return Array.isArray(methods) && methods.includes("generateContent");
    };
    // Evita modelos preview/exp por risco maior de 404 e quotas zeradas
    const supported = models.filter(supportsGenerate).filter((m) => !isPreviewOrExperimental(String(m.name)));

    // Preferência por estáveis 1.5 (flash/pro)
    const preferred =
      supported.find((m) => String(m.name).includes("gemini-1.5-flash")) ||
      supported.find((m) => String(m.name).includes("gemini-1.5-pro")) ||
      supported.find((m) => String(m.name).includes("gemini-1.0-pro")) ||
      supported[0];
    const name = preferred?.name || CANDIDATE_MODELS[0];
    // API retorna nome como "models/gemini-..."; removemos prefixo
    return String(name).replace(/^models\//, "");
  } catch (err) {
    console.warn("Falha ao resolver modelo Gemini via ListModels:", err);
    return CANDIDATE_MODELS[0];
  }
}

export async function chat(messages: ChatMessage[]) {
  if (!API_KEY) {
    throw new Error("Chave da API Gemini ausente (VITE_GEMINI_API_KEY)");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const resolvedModelName = await resolveModelName();
  console.debug("Usando modelo Gemini:", resolvedModelName);

  // Build a single prompt from conversation for stateless calls
  // Prefer a compact format to keep token usage low
  const systemMsg = messages.find((m) => m.role === "system")?.content || "Você é um assistente útil focado em insights do negócio.";
  const conversation = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
    .join("\n");

  const prompt = `${systemMsg}\n\nHistórico:\n${conversation}\n\nIMPORTANTE: Responda SEMPRE em português brasileiro (pt-BR) com objetividade, clareza e profissionalismo. Nunca use outro idioma.`;

  let lastError: unknown = undefined;
  const tryOrder = [resolvedModelName, ...CANDIDATE_MODELS.filter((m) => m !== resolvedModelName)];
  for (const modelName of tryOrder) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      // Formato estruturado recomendado para v1/v1beta
      const contents = [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      const result = await model.generateContent({ contents });
      const text = result.response.text();
      return { role: "assistant" as const, content: text };
    } catch (err) {
      lastError = err;
      const msgLower = (err as any)?.message?.toLowerCase?.() || "";
      const status = (err as any)?.status ?? (err as any)?.response?.status;

      // 429: rate limit / quota excedida
      if (status === 429 || msgLower.includes("quota") || msgLower.includes("rate limit") || msgLower.includes("retry")) {
        const genericAdvice =
          "Limite/quota da API Gemini atingido para este projeto. \n" +
          "- Verifique quotas em ai.dev/usage (aba 'rate-limit'). \n" +
          "- Se a cota for 0 no Free Tier, vincule faturamento no AI Studio para desbloquear. \n" +
          "- Aguarde ~30–60s e tente novamente.";
        throw new Error(genericAdvice);
      }

      // 403: falta de permissão ou chave inválida
      if (status === 403 || msgLower.includes("permission") || msgLower.includes("api key")) {
        throw new Error(
          "Permissão negada: verifique se a chave VITE_GEMINI_API_KEY está correta e ativa para o projeto."
        );
      }

      // 404/unsupported: tentar próximo modelo
      const isNotFound = status === 404 || msgLower.includes("not found") || msgLower.includes("unsupported");
      if (isNotFound) {
        console.warn(`Modelo não suportado/404: ${modelName}. Tentando próximo...`);
        continue;
      }
      // Qualquer outro erro: parar e reportar
      break;
    }
  }
  const msg = (lastError as any)?.message || String(lastError || "Erro desconhecido");
  throw new Error(`Falha ao gerar resposta com Gemini: ${msg}`);
}