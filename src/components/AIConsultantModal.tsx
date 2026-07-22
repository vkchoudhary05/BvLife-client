/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, Eye, ShieldCheck, HeartPulse, MessageSquare, FileText, Trash2, ShoppingCart, Bot, User, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { Language } from '../lib/translations';

interface AIConsultantModalProps {
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  onNavigate: (page: string, params?: any) => void;
  language: Language;
  currentUser?: any;
  authToken?: string | null;
}

export const AIConsultantModal: React.FC<AIConsultantModalProps> = ({
  onClose,
  products,
  onAddToCart,
  onNavigate,
  language,
  currentUser,
  authToken
}) => {
  // Navigation active tab: 'chat' (default) or 'form'
  const [activeTab, setActiveTab] = useState<'chat' | 'form'>('chat');

  // ==========================================
  // TAB 1: Conversational Live Chat States
  // ==========================================
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>(() => {
    const welcomeMsg = language === 'hi' 
      ? `प्रणाम ${currentUser?.fullName || 'प्रिय साधक'}। मैं बीवी लाइफ एआई वेलनेस गाइड (BV Life AI Wellness Guide) हूँ। आपकी शारीरिक प्रकृति और स्वास्थ्य लक्ष्यों के अनुसार सर्वोत्तम समाधान सुझाने के लिए, मैं आपके स्वास्थ्य और जीवनशैली के बारे में जानना चाहूँगा। मैं आपसे एक-एक करके कुछ छोटे सवाल पूछूँगा। शुरू करने के लिए, क्या मैं आपकी आयु (Age) और लिंग (Gender) जान सकता हूँ?` 
      : `Pranam, ${currentUser?.fullName || 'seeker of wellness'}. I am the BV Life AI Wellness Guide, your intelligent Ayurvedic assistant. To recommend the most suitable remedies for your unique constitution, I would love to learn more about your health and lifestyle. I will ask you a few quick questions one by one. To begin, may I know your age and gender?`;
    return [{ role: 'assistant', content: welcomeMsg }];
  });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load saved history if logged in
  useEffect(() => {
    if (currentUser && authToken) {
      const loadHistory = async () => {
        try {
          const res = await fetch('/api/ai/history', {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              setChatMessages(data.messages);
            }
          }
        } catch (err) {
          console.error("Failed to load chat history", err);
        }
      };
      loadHistory();
    }
  }, [currentUser, authToken]);

  // Auto scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Quick Questions / Starters
  const quickStarters = language === 'hi' ? [
    { text: "पाचन और एसिडिटी के लिए कौन सी जड़ी-बूटी लें?", icon: "🌿" },
    { text: "त्वचा में चमक (Tejas) और झुर्रियां दूर करने के उपाय", icon: "✨" },
    { text: "थकान, कमजोरी और तनाव दूर करने की औषधि", icon: "💪" },
    { text: "बाल झड़ने और डैंड्रफ के लिए कौन सा तेल सही है?", icon: "🧴" }
  ] : [
    { text: "Suggest something for glowing skin & blemishes", icon: "✨" },
    { text: "I feel bloated and have acidity after meals", icon: "🌿" },
    { text: "What can I take for constant stress and fatigue?", icon: "💪" },
    { text: "Which remedy helps with hair fall & dandruff?", icon: "🧴" }
  ];

  const handleQuickStarterClick = (text: string) => {
    if (chatLoading) return;
    triggerChat(text);
  };

  const triggerChat = async (text: string) => {
    const updatedMessages = [
      ...chatMessages,
      { role: 'user' as const, content: text }
    ];
    
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: updatedMessages,
          lang: language
        })
      });

      const data = await response.json();
      if (data.reply) {
        setChatMessages(prev => [
          ...prev,
          { role: 'assistant' as const, content: data.reply }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          { role: 'assistant' as const, content: language === 'hi' 
              ? "क्षमा करें, आचार्य अभी ध्यान में हैं। कृपया थोड़ी देर बाद पुनः प्रयास करें।" 
              : "Apologies, the Acharya is currently silent in deep meditation. Please speak again in a moment." 
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant' as const, content: language === 'hi'
            ? "कनेक्शन में त्रुटि। कृपया ग्राम्स लाइफ सर्वर से पुनः कनेक्ट करें।"
            : "Slight channel disturbance. Please check your connection or try again."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const input = chatInput.trim();
    setChatInput('');
    triggerChat(input);
  };

  const resetChat = async () => {
    if (currentUser && authToken) {
      try {
        await fetch('/api/ai/history', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (err) {
        console.error("Failed to delete chat history on server", err);
      }
    }
    const welcomeMsg = language === 'hi' 
      ? `प्रणाम ${currentUser?.fullName || 'साधक'}। मैं बीवी लाइफ एआई वेलनेस गाइड (BV Life AI Wellness Guide) हूँ। आपकी शारीरिक प्रकृति और स्वास्थ्य लक्ष्यों के अनुसार सर्वोत्तम समाधान सुझाने के लिए, मैं आपके स्वास्थ्य और जीवनशैली के बारे में जानना चाहूँगा। मैं आपसे एक-एक करके कुछ छोटे सवाल पूछूँगा। शुरू करने के लिए, क्या मैं आपकी आयु (Age) और लिंग (Gender) जान सकता हूँ?` 
      : `Pranam, ${currentUser?.fullName || 'seeker of wellness'}. I am the BV Life AI Wellness Guide, your intelligent Ayurvedic assistant. To recommend the most suitable remedies for your unique constitution, I would love to learn more about your health and lifestyle. I will ask you a few quick questions one by one. To begin, may I know your age and gender?`;
    setChatMessages([{ role: 'assistant', content: welcomeMsg }]);
    setChatInput('');
    setChatLoading(false);
  };

  // Extract recommended products from assistant text dynamically
  const getRecommendedProductsFromText = (text: string): Product[] => {
    const textLower = text.toLowerCase();
    return products.filter(p => {
      const namePart = p.name.toLowerCase().split(' ')[0]; // match first word (like "Golden", "Pure", "Kumkumadi")
      return textLower.includes(p.name.toLowerCase()) || 
             (namePart.length > 3 && textLower.includes(namePart)) ||
             textLower.includes(p.category.toLowerCase());
    });
  };

  // Helper to render markdown-like text nicely
  const renderMessageContent = (content: string) => {
    return (
      <div className="space-y-2 text-xs leading-relaxed text-brand-green-900">
        {content.split('\n').map((line, idx) => {
          if (line.startsWith('###')) {
            return (
              <h4 key={idx} className="font-serif text-sm font-bold text-brand-green-800 pt-2 pb-1">
                {line.replace('###', '').trim()}
              </h4>
            );
          } else if (line.startsWith('####')) {
            return (
              <h5 key={idx} className="font-serif text-xs font-bold text-brand-gold-700 pt-1">
                {line.replace('####', '').trim()}
              </h5>
            );
          } else if (line.startsWith('-') || line.startsWith('*')) {
            return (
              <li key={idx} className="list-disc list-inside pl-2 font-medium text-brand-green-900">
                {line.replace(/^[-*]/, '').trim()}
              </li>
            );
          } else if (line.trim() === '') {
            return <div key={idx} className="h-1.5" />;
          } else {
            // Support simple bolding **text**
            const boldRegex = /\*\*(.*?)\*\*/g;
            const parts = [];
            let lastIndex = 0;
            let match;
            while ((match = boldRegex.exec(line)) !== null) {
              if (match.index > lastIndex) {
                parts.push(line.substring(lastIndex, match.index));
              }
              parts.push(<strong key={match.index} className="font-bold text-brand-green-900">{match[1]}</strong>);
              lastIndex = boldRegex.lastIndex;
            }
            if (lastIndex < line.length) {
              parts.push(line.substring(lastIndex));
            }
            return <p key={idx} className="font-medium">{parts.length > 0 ? parts : line}</p>;
          }
        })}
      </div>
    );
  };

  const renderMessageRecommendations = (content: string) => {
    const matched = getRecommendedProductsFromText(content);
    if (matched.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-brand-green-600/10 space-y-2">
        <span className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-gold-600 animate-pulse" />
          <span>{language === 'hi' ? 'अनुशंसित आयुर्वेदिक उत्पाद' : 'Recommended Remedies'}</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {matched.slice(0, 2).map(p => (
            <div key={p.id} className="bg-white/90 border border-brand-green-200 p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <img 
                  src={p.mainImage} 
                  alt={p.name} 
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-brand-green-100"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h6 className="font-serif text-[11px] font-bold text-brand-green-800 truncate">{p.name}</h6>
                  <span className="font-mono text-xs font-bold text-brand-green-900">₹{p.price}</span>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => { onClose(); onNavigate('product', { id: p.id }); }}
                  className="p-1.5 rounded-lg border border-brand-green-700/50 hover:bg-brand-green-50 text-brand-green-800 cursor-pointer"
                  title="View details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onAddToCart(p, 1)}
                  className="px-2 py-1 text-[10px] font-bold bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-50 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <span>Add +</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  // ==========================================
  // TAB 2: Formal Diagnostic Form States
  // ==========================================
  const [symptoms, setSymptoms] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [consultResult, setConsultResult] = useState<string | null>(null);
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setConsultResult(null);
    setMatchedProducts([]);

    try {
      const response = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, bodyType, lifestyle, query, lang: language })
      });

      const data = await response.json();
      if (data.consultation) {
        setConsultResult(data.consultation);

        // Intelligently scan the AI response and find matching products to recommend
        const aiTextLower = data.consultation.toLowerCase();
        const matches = products.filter(p => {
          const namePart = p.name.toLowerCase().split(' ')[0]; // match first word (like "Golden", "Pure", "Kumkumadi")
          return aiTextLower.includes(p.name.toLowerCase()) || 
                 aiTextLower.includes(namePart) ||
                 aiTextLower.includes(p.category.toLowerCase());
        });
        setMatchedProducts(matches.slice(0, 3));
      } else {
        setConsultResult("Our Acharya is resting deeply. Please try with a simplified symptom search.");
      }
    } catch (err) {
      console.error(err);
      setConsultResult("Our Acharya's herbal garden is currently offline. Please try again soon.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-consultant-modal" className="fixed inset-0 z-50 overflow-y-auto bg-brand-green-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-cream-50 w-full max-w-4xl rounded-2xl shadow-2xl border border-brand-green-600/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-brand-green-800 text-brand-cream-100 p-5 flex justify-between items-center relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-brand-gold-500/20 flex items-center justify-center border border-brand-gold-500/40">
              <Sparkles className="w-5 h-5 text-brand-gold-500 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">BV Life AI Wellness Guide</h3>
              <p className="text-xs text-brand-cream-300">Intelligent Traditional Dosha Analysis & Remedies</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-brand-green-700 text-brand-cream-300 hover:text-brand-cream-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector bar */}
        <div className="bg-brand-cream-100/50 border-b border-brand-green-600/10 p-3 flex justify-center">
          <div className="grid grid-cols-2 p-1 bg-brand-cream-200/50 border border-brand-green-200 rounded-xl max-w-md w-full">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`py-2 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? "bg-brand-green-800 text-brand-cream-50 shadow-sm border border-brand-gold-500/20 font-serif"
                  : "text-brand-green-700/70 hover:text-brand-green-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'वैदिक लाइव चैट' : 'Vedic Live Chat'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`py-2 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'form'
                  ? "bg-brand-green-800 text-brand-cream-50 shadow-sm border border-brand-gold-500/20 font-serif"
                  : "text-brand-green-700/70 hover:text-brand-green-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'दोष जाँच पत्र' : 'Diagnostic Checkup'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {!currentUser ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-brand-green-800 text-brand-gold-400 font-serif text-2xl font-bold flex items-center justify-center border border-brand-gold-500/30 shadow-md">
                G
              </div>
              <div className="space-y-2">
                <h4 className="font-serif text-xl font-bold text-brand-green-900">
                  {language === 'hi' ? 'लॉगिन आवश्यक है' : 'Sanctuary Account Required'}
                </h4>
                <p className="text-xs text-brand-green-800/80 leading-relaxed font-semibold">
                  {language === 'hi'
                    ? 'एआई वेलनेस गाइड से बात करने और अपने इतिहास के अनुसार अनुकूलित जड़ी-बूटी परामर्श प्राप्त करने के लिए कृपया पहले अपने बीवी लाइफ खाते में लॉग इन करें।'
                    : 'To experience the BV Life AI Wellness Guide and keep a record of your personalized consultations, please sign in to your sanctuary account.'}
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigate('login');
                }}
                className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-serif font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-brand-gold-500/25 animate-bounce"
              >
                <span>{language === 'hi' ? 'लॉगिन / पंजीकरण करें' : 'Login / Register'}</span>
                <ArrowRight className="w-4 h-4 text-brand-gold-400" />
              </button>
            </div>
          ) : (
            <>
              {/* Disclaimer badge */}
              <div className="bg-brand-green-100/30 border border-brand-green-600/10 p-3.5 rounded-xl flex items-start gap-3 text-xs text-brand-green-800">
                <ShieldCheck className="w-5 h-5 text-brand-green-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Vedic Precision:</strong>{' '}
                  This digital assistant utilizes standard natural-language logic matching Ayurvedic scripts powered by Gemini. It offers holistic insights, and is not a replacement for professional diagnostic physicians.
                </div>
              </div>

          {/* ==========================================
              TAB 1: LIVE CONVERSATIONAL CHAT UI
              ========================================== */}
          {activeTab === 'chat' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              
              {/* Chat view box */}
              <div className="border border-brand-green-600/10 rounded-2xl bg-white overflow-hidden flex flex-col h-[420px] shadow-sm">
                
                {/* Message stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-cream-50/20">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                        msg.role === 'user' 
                          ? 'bg-brand-green-100 border-brand-green-200 text-brand-green-800' 
                          : 'bg-brand-green-800 border-brand-gold-500/30 text-brand-gold-400'
                      }`}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      {/* Content block */}
                      <div className={`p-3.5 rounded-2xl space-y-1 ${
                        msg.role === 'user'
                          ? 'bg-brand-green-800 text-brand-cream-50 rounded-tr-none'
                          : 'bg-brand-cream-100/70 border border-brand-green-200 text-brand-green-900 rounded-tl-none'
                      }`}>
                        {/* Render content */}
                        {msg.role === 'user' ? (
                          <p className="text-xs font-semibold">{msg.content}</p>
                        ) : (
                          renderMessageContent(msg.content)
                        )}

                        {/* Recommend items mentioned in this bubble */}
                        {msg.role === 'assistant' && renderMessageRecommendations(msg.content)}
                      </div>
                    </div>
                  ))}

                  {/* Loading animation bubble */}
                  {chatLoading && (
                    <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brand-green-800 text-brand-gold-400 border border-brand-gold-500/30">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-brand-cream-100 border border-brand-green-200 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-brand-green-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-brand-green-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-brand-green-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider pl-1">
                          {language === 'hi' ? 'गाइड विचार कर रहे हैं...' : 'Guide is brewing response...'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input box form */}
                <form 
                  onSubmit={handleChatSubmit} 
                  className="p-3 bg-brand-cream-100/50 border-t border-brand-green-600/10 flex gap-2 items-center"
                >
                  <button
                    type="button"
                    onClick={resetChat}
                    className="p-2.5 rounded-xl border border-brand-green-600/15 text-brand-green-800 hover:bg-brand-cream-200 cursor-pointer transition-colors"
                    title={language === 'hi' ? 'चैट रीसेट करें' : 'Reset Conversation'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    required
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    placeholder={language === 'hi' ? 'गाइड से अपने स्वास्थ्य या जड़ी-बूटियों के बारे में पूछें...' : 'Answer the question or ask about symptoms & remedies...'}
                    className="flex-1 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl px-4 py-2.5 text-xs font-semibold placeholder-brand-green-600/40"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-brand-green-700 hover:bg-brand-green-800 disabled:bg-brand-green-400 text-brand-cream-50 p-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>

              {/* Quick Questions starters row */}
              {chatMessages.length === 1 && !chatLoading && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-brand-green-800/70 uppercase tracking-wider block">
                    {language === 'hi' ? 'त्वरित प्रश्न शुरू करें' : 'Tap a wellness concern to ask:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quickStarters.map((qs, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickStarterClick(qs.text)}
                        className="p-2.5 text-left border border-brand-green-600/10 hover:border-brand-green-700 bg-white hover:bg-brand-cream-50 rounded-xl text-[11px] font-semibold text-brand-green-900 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span className="text-sm">{qs.icon}</span>
                        <span>{qs.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}


          {/* ==========================================
              TAB 2: DETAILED DIAGNOSTIC FORM UI
              ========================================== */}
          {activeTab === 'form' && (
            <div className="animate-in fade-in duration-300">
              {!consultResult ? (
                /* Consultation Inquiry Form */
                <form onSubmit={handleConsult} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Symptoms / Complaints */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-brand-green-800 flex items-center gap-1.5">
                        <HeartPulse className="w-4 h-4 text-brand-gold-600" />
                        <span>Symptoms & Health Focus</span>
                      </label>
                      <textarea
                        placeholder="E.g., I experience frequent acidity, bloating after meals, poor sleep and general fatigue..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        required
                        rows={3}
                        className="w-full bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl p-3 text-sm placeholder-brand-green-600/30"
                      />
                    </div>

                    {/* Specific Questions */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-brand-green-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-gold-600" />
                        <span>Your Specific Well-Being Query</span>
                      </label>
                      <textarea
                        placeholder="E.g., What daily herbs can I take to boost my metabolic fire (Agni)?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl p-3 text-sm placeholder-brand-green-600/30"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Body Constitution */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-brand-green-800">Your Self-Assessed Body Constitution (Dosha)</label>
                      <select
                        value={bodyType}
                        onChange={(e) => setBodyType(e.target.value)}
                        className="w-full bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl px-4 py-3 text-sm"
                      >
                        <option value="">I am not sure (Let Aacharya evaluate)</option>
                        <option value="Vata (Thin, active, creative, prone to dryness/gas)">Vata (Air/Space element dominance)</option>
                        <option value="Pitta (Medium, competitive, warm, prone to acidity/heat)">Pitta (Fire/Water element dominance)</option>
                        <option value="Kapha (Heavy, steady, relaxed, prone to lethargy/congestion)">Kapha (Water/Earth element dominance)</option>
                        <option value="Tridoshic (Balanced, highly resilient)">Tridoshic (Vata-Pitta-Kapha equilibrium)</option>
                      </select>
                    </div>

                    {/* Lifestyle & Diet */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-brand-green-800">Your Daily Diet & Stress Level</label>
                      <input
                        type="text"
                        placeholder="E.g., High stress, desk job, coffee drinker, vegetarian..."
                        value={lifestyle}
                        onChange={(e) => setLifestyle(e.target.value)}
                        className="w-full bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl px-4 py-3 text-sm placeholder-brand-green-600/30"
                      />
                    </div>

                  </div>

                  {/* Submit button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md w-full sm:w-auto"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-brand-cream-100 border-t-transparent animate-spin" />
                          <span>Brewing Herbal Analysis...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-brand-cream-300" />
                          <span>Initiate Consult with Acharya</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              ) : (
                /* Results Block */
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Consultation details text */}
                  <div className="prose prose-brand max-w-none text-brand-green-900 bg-white border border-brand-green-600/10 p-6 md:p-8 rounded-2xl space-y-4 shadow-sm">
                    {consultResult.split('\n').map((line, idx) => {
                      if (line.startsWith('###')) {
                        return <h3 key={idx} className="font-serif text-lg font-bold text-brand-green-800 pt-3">{line.replace('###', '')}</h3>;
                      } else if (line.startsWith('####')) {
                        return <h4 key={idx} className="font-serif text-base font-bold text-brand-gold-700 pt-2">{line.replace('####', '')}</h4>;
                      } else if (line.startsWith('-') || line.startsWith('*')) {
                        return <li key={idx} className="text-sm list-disc list-inside pl-4 text-brand-green-800">{line.replace(/^[-*]/, '').trim()}</li>;
                      } else if (line.trim() === '') {
                        return <div key={idx} className="h-2" />;
                      } else {
                        return <p key={idx} className="text-sm leading-relaxed">{line}</p>;
                      }
                    })}
                  </div>

                  {/* Recommended Catalog Items */}
                  {matchedProducts.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-serif text-base font-bold text-brand-green-800">🌿 Matched Ayurvedic Products From Our Catalog</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {matchedProducts.map(p => (
                          <div key={p.id} className="bg-brand-cream-100/50 border border-brand-green-600/10 p-4 rounded-xl flex flex-col justify-between hover:shadow-md transition-all gap-3">
                            <div className="flex gap-3">
                              <img 
                                src={p.mainImage} 
                                alt={p.name} 
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h5 className="font-serif text-xs font-bold text-brand-green-800 line-clamp-2">{p.name}</h5>
                                <span className="font-mono text-xs font-bold text-brand-green-900">₹{p.price}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { onClose(); onNavigate('product', { id: p.id }); }}
                                className="flex-1 py-1 px-2.5 rounded-lg border border-brand-green-700 text-brand-green-800 text-[11px] font-bold hover:bg-brand-green-50 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>
                              <button
                                onClick={() => { onAddToCart(p, 1); }}
                                className="flex-1 py-1 px-2.5 rounded-lg bg-brand-green-700 text-brand-cream-100 text-[11px] font-bold hover:bg-brand-green-800 cursor-pointer"
                              >
                                Add +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reset Consult Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setConsultResult(null);
                        setSymptoms('');
                        setQuery('');
                      }}
                      className="px-5 py-2.5 rounded-xl border border-brand-green-600/20 text-brand-green-800 text-xs font-bold hover:bg-brand-green-50 cursor-pointer"
                    >
                      New Consultation
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 text-xs font-bold cursor-pointer"
                    >
                      Thank You, Acharya
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
