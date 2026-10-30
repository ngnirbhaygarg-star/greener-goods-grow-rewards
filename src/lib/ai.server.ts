// Server-only: streams a Responses API call through the Lovable AI Gateway and
// returns the accumulated final text.
const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function runResponses(body: Record<string, unknown>): Promise<string> {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new AiError(401, "AI is not configured.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      store: false,
      reasoning: { effort: "low" },
      stream: true,
      ...body,
    }),
  });
  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    let msg = "The Eco Agent is unavailable right now.";
    if (res.status === 429) msg = "Too many requests — please wait a moment and try again.";
    else if (res.status === 402) msg = "AI credits are used up for this workspace.";
    else {
      try {
        msg = JSON.parse(txt)?.error?.message ?? JSON.parse(txt)?.message ?? msg;
      } catch {
        /* keep default */
      }
    }
    throw new AiError(res.status, msg);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const data = frame
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("");
      if (!data || data === "[DONE]") continue;
      let evt: { type?: string; delta?: string; message?: string; response?: { error?: { message?: string } } };
      try {
        evt = JSON.parse(data);
      } catch {
        continue;
      }
      if (evt.type === "response.output_text.delta" && evt.delta) text += evt.delta;
      else if (evt.type === "error" || evt.type === "response.failed")
        throw new AiError(500, evt.message ?? evt.response?.error?.message ?? "AI request failed.");
      else if (evt.type === "response.refusal.delta") throw new AiError(400, "The request was declined.");
    }
  }
  return text;
}
