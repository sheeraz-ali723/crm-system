import { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiCpu,
  FiUser,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiPackage,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";
const AI_API = ENDPOINTS.AI_CHAT;

function AIAssistant() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      text: "Hello Sheeraz! 👋 I am your Nexora AI Co-Pilot. I have direct access to your live MongoDB database (Orders, Customers, Products, Deals, and Invoices). How can I assist you today?",
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const suggestions = [
    "How are my sales performing?",
    "Which products are low on stock?",
    "Which customers are most valuable?",
    "What tasks are currently pending?",
  ];

  const handleSendMessage = async (textToSend) => {
    const userQuery = typeof textToSend === "string" ? textToSend : input;
    if (!userQuery.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      type: "user",
      text: userQuery,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(AI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userQuery }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to get AI response");

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: data.reply,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: `⚠️ **Error:** ${err.message || "Could not reach database AI service."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[850px] space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <FiCpu size={20} />
            </span>
            Nexora AI Co-Pilot
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time conversational intelligence directly connected to your MongoDB collections.
          </p>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 1,
                type: "ai",
                text: "Chat cleared! How can I assist you with your business data today?",
              },
            ])
          }
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition"
        >
          <FiRefreshCw size={12} /> Clear Chat
        </button>
      </div>

      {/* QUICK SUGGESTIONS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-semibold text-slate-400 shrink-0">Try asking:</span>
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(sug)}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 shadow-2xs transition"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* CHAT MESSAGES WINDOW */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.type === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                m.type === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-white shadow-sm"
              }`}
            >
              {m.type === "user" ? <FiUser size={15} /> : <FiCpu size={15} />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                m.type === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-50 border border-slate-200 text-slate-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <FiCpu size={15} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              Analyzing real database records...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your orders, customers, stock, or deals..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition shrink-0"
        >
          <FiSend size={16} /> Send
        </button>
      </form>
    </div>
  );
}

export default AIAssistant;
