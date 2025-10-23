import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  Loader2,
  RotateCcw,
  Bot,
  User as UserIcon,
  Minimize2,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { aiChatService, ChatMessage } from '@/services/aiChatService';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AIChatBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const location = useLocation();

  // Check if we're on a page with the cart button (menu, checkout, cart pages)
  const hasCartButton = location.pathname.includes('/menu') || 
                        location.pathname.includes('/checkout') || 
                        location.pathname.includes('/cart');

  useEffect(() => {
    // Check if AI service is available
    setIsServiceAvailable(aiChatService.isAvailable());
    
    // Add welcome message when chat opens
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: `Hello${user?.name ? ' ' + user.name.split(' ')[0] : ''}! 👋 I'm your ChefSync AI assistant.

I can help you with:
• 🍽️ Finding the perfect meal or chef
• 📝 Understanding how to place orders
• ✨ Explaining platform features
• 🚚 Answering questions about delivery
• 🧭 Navigating the website
• 🎉 Information about bulk orders
• 💳 Payment and pricing questions
• 👤 Account management

${!isServiceAvailable ? '\n*Currently running in smart offline mode - I can still answer your questions about ChefSync!*' : ''}

What would you like to know?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // Auto-focus input after opening
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, user, isServiceAvailable]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    // Simulate typing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const response = await aiChatService.sendMessage(userMessage.content);
      
      // Simulate natural typing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.error) {
        toast.error('AI response may be incomplete');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      // Focus back on input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    aiChatService.resetChat();
    setMessages([]);
    toast.success('Chat reset successfully', {
      icon: '🔄',
    });
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Quick action suggestions
  const quickActions = [
    { icon: "🍽️", label: "How to order?", query: "How do I order food?" },
    { icon: "🚚", label: "Track delivery", query: "How can I track my delivery?" },
    { icon: "🎉", label: "Bulk orders", query: "Tell me about bulk orders" },
    { icon: "👨‍🍳", label: "Find chefs", query: "How do I find good chefs?" },
  ];

  const handleQuickAction = (query: string) => {
    setInput(query);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <>
      {/* Floating Chat Button - Position changes based on cart button presence */}
      <div className={cn(
        "fixed z-50 transition-all duration-300",
        hasCartButton 
          ? "bottom-4 left-4 sm:bottom-5 sm:left-5 md:bottom-6 md:left-6" 
          : "bottom-4 right-4 sm:bottom-5 sm:right-5 md:bottom-6 md:right-6"
      )}>
        {!isOpen && (
          <div className="relative group">
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-red-500 opacity-75 animate-ping"></div>
            
            <Button
              onClick={() => setIsOpen(true)}
              className={cn(
                "relative h-14 w-14 sm:h-15 sm:w-15 md:h-16 md:w-16 rounded-full shadow-2xl transition-all duration-300",
                "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500",
                "hover:scale-110 hover:shadow-orange-500/50",
                "flex items-center justify-center",
                "border-2 border-white/20",
                "group-hover:from-orange-600 group-hover:via-red-600 group-hover:to-pink-600"
              )}
            >
              <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white animate-pulse" />
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-300 absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 animate-bounce" />
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 opacity-50 blur-xl group-hover:opacity-75 transition-opacity"></div>
            </Button>

            {/* Tooltip - Position adjusts based on side */}
            <div className={cn(
              "absolute bottom-full mb-2 sm:mb-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-900/95 backdrop-blur-sm text-white text-xs sm:text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl border border-white/10 transform group-hover:-translate-y-1",
              hasCartButton ? "left-0" : "right-0"
            )}>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Zap className="h-3 w-3 text-yellow-300" />
                <span className="font-medium">Chat with AI</span>
              </div>
              <div className={cn(
                "absolute bottom-0 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900/95 border-r border-b border-white/10",
                hasCartButton ? "left-6 sm:left-8" : "right-6 sm:right-8"
              )}></div>
            </div>
          </div>
        )}

        {/* Chat Window */}
        {isOpen && (
          <Card 
            className={cn(
              "w-[340px] sm:w-[380px] md:w-[400px] shadow-2xl border-0 flex flex-col overflow-hidden",
              "bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl",
              "animate-in slide-in-from-bottom-5 duration-300",
              "transition-all duration-300",
              isMinimized ? "h-[68px]" : "h-[520px] sm:h-[560px] md:h-[580px]"
            )}
            style={{
              boxShadow: '0 20px 40px -12px rgba(251, 146, 60, 0.25), 0 0 0 1px rgba(251, 146, 60, 0.1)'
            }}
          >
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white p-3 sm:p-3.5 relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                    <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-white shadow-lg bg-white/10 backdrop-blur-sm">
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white">
                        <Bot className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-white rounded-full animate-pulse"></span>
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-1.5">
                      ChefSync AI
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse text-yellow-300" />
                    </CardTitle>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 bg-green-300 rounded-full animate-pulse"></div>
                        <p className="text-[10px] sm:text-xs text-white/90 font-medium">Online & Ready</p>
                      </div>
                      {!isServiceAvailable && (
                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 bg-blue-400/20 text-blue-100 border-blue-300/30">
                          Offline
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="hover:bg-white/20 text-white h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full transition-all hover:scale-110"
                    title="Reset chat"
                  >
                    <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMinimize}
                    className="hover:bg-white/20 text-white h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full transition-all hover:scale-110"
                    title={isMinimized ? "Expand" : "Minimize"}
                  >
                    {isMinimized ? <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/20 text-white h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full transition-all hover:scale-110 hover:rotate-90"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <CardContent className="flex-1 p-3 sm:p-3.5 overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
                  <ScrollArea className="h-full pr-2 sm:pr-3">
                    <div className="space-y-3 sm:space-y-3.5">
                      {!isServiceAvailable && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-2.5 sm:p-3 mb-3 sm:mb-3.5 backdrop-blur-sm animate-in fade-in duration-500">
                          <div className="flex items-start gap-2 sm:gap-2.5">
                            <div className="bg-blue-500 rounded-full p-1.5 sm:p-2 mt-0.5">
                              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-0.5 sm:mb-1">
                                Smart Offline Mode
                              </p>
                              <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                I can answer questions about ChefSync!
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex gap-2 sm:gap-2.5 animate-in slide-in-from-bottom-2 duration-300",
                            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          )}
                        >
                          {/* Avatar */}
                          <Avatar className={cn(
                            "h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 shadow-lg border-2",
                            message.role === 'user' 
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-300' 
                              : 'bg-gradient-to-br from-orange-500 to-pink-500 border-orange-300'
                          )}>
                            <AvatarFallback className="text-white">
                              {message.role === 'user' ? (
                                <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              ) : (
                                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              )}
                            </AvatarFallback>
                          </Avatar>

                          {/* Message Bubble */}
                          <div className={cn(
                            "flex flex-col gap-0.5 sm:gap-1 max-w-[78%]",
                            message.role === 'user' ? 'items-end' : 'items-start'
                          )}>
                            <div className={cn(
                              "rounded-xl sm:rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-md backdrop-blur-sm transition-all hover:shadow-lg",
                              message.role === 'user' 
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-sm' 
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-gray-700'
                            )}>
                              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 px-1 sm:px-2">
                              <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
                                {formatTime(message.timestamp)}
                              </span>
                              {message.role === 'user' && (
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex gap-2 sm:gap-2.5 animate-in slide-in-from-bottom-2 duration-300">
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 bg-gradient-to-br from-orange-500 to-pink-500 border-2 border-orange-300 shadow-lg">
                            <AvatarFallback className="text-white">
                              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl rounded-tl-sm px-4 py-2.5 sm:px-5 sm:py-3 shadow-md border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 ml-0.5 sm:ml-1">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Quick Actions */}
                {messages.length <= 1 && (
                  <div className="px-3 py-2 sm:px-3.5 sm:py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2">Quick actions:</p>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickAction(action.query)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-700 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-sm">{action.icon}</span>
                          <span className="truncate">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-2.5 sm:p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 backdrop-blur-sm">
                  <div className="flex gap-1.5 sm:gap-2">
                    <div className="relative flex-1">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        className="pr-8 sm:pr-10 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 transition-all h-9 sm:h-10"
                        disabled={isLoading}
                      />
                      {input && (
                        <button
                          onClick={() => setInput('')}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600",
                        "text-white shadow-lg hover:shadow-xl transition-all rounded-xl h-9 w-9 sm:h-10 sm:w-10 p-0",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "hover:scale-105 active:scale-95"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-center mt-1.5 sm:mt-2 gap-1 sm:gap-1.5">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-500" />
                      <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
                        Powered by {isServiceAvailable ? 'Gemini AI' : 'Smart AI'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </>
  );
};

export default AIChatBox;
