import { Injectable, Logger } from '@nestjs/common';

/*
 * Talks to a model running on this machine (or on the same LAN) through
 * the OpenAI-compatible chat endpoint that Ollama, LM Studio and the
 * llama.cpp server all expose. No data leaves the network, and no
 * third-party API or key is involved.
 *
 * Configure with environment variables (see backend/.env.example):
 *   LLM_MODEL        model name to use, e.g. "qwen2.5:3b". Leave empty to
 *                    disable the model; insights then use the built-in rules.
 *   LLM_BASE_URL     default http://127.0.0.1:11434/v1 (Ollama)
 *   LLM_TIMEOUT_MS   default 60000
 */
@Injectable()
export class LocalLlmClient {
  private readonly logger = new Logger(LocalLlmClient.name);

  // Calls run one after another: a small local model can only do one job at
  // a time, and quick filter changes on the dashboard must not pile up.
  private queue: Promise<unknown> = Promise.resolve();

  get model(): string {
    return (process.env.LLM_MODEL ?? '').trim();
  }

  get enabled(): boolean {
    return this.model !== '';
  }

  private get baseUrl(): string {
    return (process.env.LLM_BASE_URL || 'http://127.0.0.1:11434/v1').replace(/\/+$/, '');
  }

  private get timeoutMs(): number {
    return Number(process.env.LLM_TIMEOUT_MS) || 60_000;
  }

  /**
   * One system + user exchange. Returns the model text, or null when the
   * model is disabled, unreachable, slow or answers with an error; callers
   * treat null as "use the rule-based text".
   */
  complete(system: string, user: string): Promise<string | null> {
    if (!this.enabled) return Promise.resolve(null);

    const run = () => this.run(system, user);
    const result = this.queue.then(run, run);

    this.queue = result.catch(() => undefined);

    return result;
  }

  private async run(system: string, user: string): Promise<string | null> {

    const send = async (jsonMode: boolean) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        return await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            temperature: 0.2,
            max_tokens: 700,
            stream: false,
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          }),
        });
      } finally {
        clearTimeout(timer);
      }
    };

    try {
      let response = await send(true);

      // Some servers reject response_format; ask again without it.
      if (response.status === 400) {
        response = await send(false);
      }

      if (!response.ok) {
        this.logger.warn(`Local model answered HTTP ${response.status}; using rule-based text.`);
        return null;
      }

      const body: any = await response.json();
      const content = body?.choices?.[0]?.message?.content;

      return typeof content === 'string' ? content : null;
    } catch (error) {
      this.logger.warn(
        `Local model unavailable (${error instanceof Error ? error.message : 'error'}); using rule-based text.`,
      );
      return null;
    }
  }
}
