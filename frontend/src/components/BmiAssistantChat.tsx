import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Bot, Send, User, Database, Sparkles, Info, Table2 } from "lucide-react";
import "./BmiAssistantChat.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:3000`;

type Message = {
  role: "user" | "assistant";
  content: string;
  /** Where an assistant answer came from (see backend BmiAssistantService). */
  source?: "local-model" | "rules" | "records";
  error?: boolean;
};

type Props = {
  /** Backend path, e.g. "/bmi-assistant/me/ask". */
  endpoint: string;
  /** localStorage key of the JWT to send. */
  tokenKey: string;
  title: string;
  subtitle: string;
  greeting: string;
  suggestions: string[];
};

/*
 * BMI Assistant chat: the conversation lives only in this page (it is sent
 * along with each question for context and is never stored server-side).
 */
export default function BmiAssistantChat({
  endpoint,
  tokenKey,
  title,
  subtitle,
  greeting,
  suggestions,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;

    // Only real exchanges go back as context, not error notices.
    const history = messages
      .filter((m) => !m.error)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(tokenKey) ?? ""}`,
        },
        body: JSON.stringify({ question, history }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          response.status === 401
            ? "Your session has expired. Please sign in again."
            : response.status === 429
            ? "Too many questions at once. Please wait a minute and try again."
            : data?.message || `Something went wrong (HTTP ${response.status}).`;
        throw new Error(Array.isArray(message) ? message.join(" ") : message);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, source: data.source },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          error: true,
          content:
            err instanceof Error && err.message !== "Failed to fetch"
              ? err.message
              : "Unable to reach the BMI System. Check your connection and try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="bmi-assistant">
      <div className="bmi-assistant-header">
        <span className="bmi-assistant-header-icon"><Bot size={20} strokeWidth={2} /></span>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="bmi-assistant-panel">
        <div className="bmi-assistant-messages" ref={listRef}>
          <div className="bmi-assistant-row assistant">
            <span className="bmi-assistant-avatar"><Bot size={16} strokeWidth={2} /></span>
            <div className="bmi-assistant-bubble">{greeting}</div>
          </div>

          {messages.length === 0 && (
            <div className="bmi-assistant-suggestions">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} disabled={busy}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`bmi-assistant-row ${m.role}`}>
              <span className="bmi-assistant-avatar">
                {m.role === "user" ? <User size={16} strokeWidth={2} /> : <Bot size={16} strokeWidth={2} />}
              </span>
              <div className={`bmi-assistant-bubble ${m.error ? "error" : ""}`}>
                {m.content}
                {m.source && (
                  <small className="bmi-assistant-source">
                    {m.source === "records" ? (
                      <><Table2 size={11} strokeWidth={2} /> Computed from the BMI System records</>
                    ) : m.source === "rules" ? (
                      <><Database size={11} strokeWidth={2} /> From the BMI System (exact figures and PNP standards)</>
                    ) : (
                      <><Sparkles size={11} strokeWidth={2} /> AI-generated guidance</>
                    )}
                  </small>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="bmi-assistant-row assistant">
              <span className="bmi-assistant-avatar"><Bot size={16} strokeWidth={2} /></span>
              <div className="bmi-assistant-bubble bmi-assistant-typing" aria-label="Thinking">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        <div className="bmi-assistant-input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about your BMI, weight, food or exercise..."
            maxLength={500}
            rows={2}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            aria-label="Send question"
          >
            <Send size={17} strokeWidth={2} />
          </button>
        </div>
      </div>

      <p className="bmi-assistant-disclaimer">
        <Info size={13} strokeWidth={2} />
        Health guidance only, not a medical diagnosis. AI answers can be wrong; for any
        health concern, consult the PNP Health Service.
      </p>
    </div>
  );
}
