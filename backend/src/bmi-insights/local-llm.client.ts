import { Injectable, Logger } from '@nestjs/common';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

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
    return this.enqueue([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], { json: true, maxTokens: 700 });
  }

  /**
   * A conversation answered in plain text (the BMI Assistant chat), not
   * JSON. Same null-on-failure contract as complete().
   */
  chat(messages: ChatMessage[], maxTokens = 450): Promise<string | null> {
    return this.enqueue(messages, { json: false, maxTokens });
  }

  private enqueue(
    messages: ChatMessage[],
    options: { json: boolean; maxTokens: number },
  ): Promise<string | null> {
    if (!this.enabled) return Promise.resolve(null);

    const run = () => this.run(messages, options);
    const result = this.queue.then(run, run);

    this.queue = result.catch(() => undefined);

    return result;
  }

  private async run(
    messages: ChatMessage[],
    options: { json: boolean; maxTokens: number },
  ): Promise<string | null> {

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
            messages,
            temperature: options.json ? 0.2 : 0.4,
            max_tokens: options.maxTokens,
            stream: false,
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          }),
        });
      } finally {
        clearTimeout(timer);
      }
    };

    // LLM_DEBUG=1 prints every prompt sent to the model and its reply
    // (with timing) to the backend console, to watch how it answers.
    const debug = process.env.LLM_DEBUG === '1';
    const startedAt = Date.now();

    if (debug) {
      this.logger.log(
        `\n===== LLM REQUEST (${this.model}, ${options.json ? 'json' : 'text'}) =====\n` +
          messages.map((m) => `[${m.role}]\n${m.content}`).join('\n\n'),
      );
    }

    try {
      let response = await send(options.json);

      // Some servers reject response_format; ask again without it.
      if (options.json && response.status === 400) {
        response = await send(false);
      }

      if (!response.ok) {
        this.logger.warn(`Local model answered HTTP ${response.status}; using rule-based text.`);
        return null;
      }

      const body: any = await response.json();
      const content = body?.choices?.[0]?.message?.content;

      if (debug) {
        this.logger.log(
          `\n===== LLM REPLY (${((Date.now() - startedAt) / 1000).toFixed(1)}s, ` +
            `${body?.usage?.prompt_tokens ?? '?'} prompt / ${body?.usage?.completion_tokens ?? '?'} reply tokens) =====\n` +
            `${typeof content === 'string' ? content : '(no content)'}\n` +
            '===== END =====',
        );
      }

      return typeof content === 'string' ? content : null;
    } catch (error) {
      this.logger.warn(
        `Local model unavailable (${error instanceof Error ? error.message : 'error'}); using rule-based text.`,
      );
      return null;
    }
  }
}
