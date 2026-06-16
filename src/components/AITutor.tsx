import { useState } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AITutor({ user }: { user: UserProfile | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/ai/tutor`, {
        prompt: userMessage,
        studentInfo: {
          name: user.name,
          department: user.department || 'General'
        }
      });

      setMessages(prev => [...prev, { role: 'ai', content: response.data.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "I'm sorry, I'm having trouble connecting to the knowledge base right now." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 h-[500px] rounded-3xl shadow-2xl border border-[#008751]/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-[#008751] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <span className="font-bold uppercase tracking-tighter">Academic AI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-xs text-[#008751]">
              Hello {user.name.split(' ')[0]}! I'm your AI academic advisor. How can I help you today?
            </div>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                  msg.role === 'user'
                    ? 'bg-[#008751] text-white rounded-tr-none'
                    : 'bg-slate-50 text-[#008751] rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none">
                  <Loader2 className="w-4 h-4 animate-spin text-[#008751]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about courses, fees, or grades..."
              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-[#008751]"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-[#008751] text-white p-2 rounded-xl hover:bg-[#006e41] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#008751] text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 transition-transform duration-300 group"
        >
          <Bot className="w-7 h-7" />
          <span className="absolute right-full mr-4 bg-[#008751] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask AI Assistant
          </span>
        </button>
      )}
    </div>
  );
}
