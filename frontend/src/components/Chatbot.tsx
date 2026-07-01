import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Sparkles, MessageSquare, Trash2, ArrowDown } from 'lucide-react';

interface Message {
  sender: 'user' | 'coach';
  text: string;
  timestamp: Date;
}

export const Chatbot: React.FC = () => {
  const { user, apiFetch } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'coach',
      text: `Hello ${user?.name || 'there'}! I am your SnackCheck AI Health Coach. Based on your health records and scanned snacks history, I can answer your diet questions, recommend healthy alternatives, or explain nutrient details. What would you like to discuss today?`,
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const SUGGESTIONS = [
    "What snacks did I eat today?",
    "How can I cut down on sodium?",
    "Is peanut oil safe for a nut allergy?",
    "Recommend a snack high in fiber"
  ];

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    chatEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Monitor scroll height to display "Scroll to bottom" button
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Show button if user scrolled up more than 300px
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    
    const userMsg: Message = {
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    
    try {
      // Map message history to schema expected by backend
      const historyPayload = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));
      
      const res = await apiFetch('/api/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({
          chat_history: historyPayload,
          message: userMsg.text
        })
      });
      
      const coachMsg: Message = {
        sender: 'coach',
        text: res.reply,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, coachMsg]);
    } catch (e: any) {
      const errorMsg: Message = {
        sender: 'coach',
        text: e.message || "I'm having trouble connecting to the server. Please verify the backend is running and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear the conversation history?")) {
      setMessages([
        {
          sender: 'coach',
          text: `History cleared. I'm ready to help you with any questions about your biometrics, diet goals, or scanned foods!`,
          timestamp: new Date()
        }
      ]);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] max-w-4xl mx-auto flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
            <MessageSquare className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
              AI Nutrition Coach
              <span className="flex items-center gap-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                <Sparkles className="w-2.5 h-2.5" />
                Active
              </span>
            </h3>
            <p className="text-xs text-slate-400"> dietitian advisor powered by Google Gemini</p>
          </div>
        </div>
        <button
          onClick={handleClearHistory}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Clear Conversation"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Message History Panel */}
      <div className="flex-1 glass rounded-3xl p-6 border border-slate-800 relative flex flex-col overflow-hidden">
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-smooth"
        >
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-md ${
                  isUser 
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950' 
                    : 'bg-slate-900 border border-slate-850 text-emerald-400'
                }`}>
                  {isUser ? (user?.name || 'U').charAt(0).toUpperCase() : 'AI'}
                </div>

                {/* Text Bubble */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed border transition-all duration-200 ${
                  isUser 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-350 rounded-tr-none' 
                    : 'bg-slate-900/60 border-slate-850 text-slate-200 rounded-tl-none'
                }`}>
                  <p>{msg.text}</p>
                  <span className="text-[9px] text-slate-500 block mt-1.5 text-right font-medium">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Coach Loading State */}
          {loading && (
            <div className="flex gap-3 max-w-[80%] animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-850 text-emerald-400 flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Scroll to bottom floating indicator */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-6 right-8 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-800 shadow-xl transition-all duration-200 animate-bounce"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestion Bubbles */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-xs bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200 rounded-full px-4 py-2.5 transition-all duration-200 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input panel */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
        className="flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about food details, weight metrics, or recipes..."
          className="flex-1 bg-slate-900/60 border border-slate-850 hover:border-slate-800 focus:border-emerald-500/50 rounded-2xl px-5 py-4 text-sm text-slate-200 outline-none transition-all duration-200"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-650 disabled:opacity-50 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-emerald-500/10 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
