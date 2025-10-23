import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageSquare, X, Sparkles, Zap, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import { GlassCard } from "./GlassCard";
import { GradientButton } from "./GradientButton";
import { DraggableWrapper } from "./DraggableWrapper";
import { aiService } from "@/services/aiService";
import { toast } from "@/components/ui/use-toast";

export interface AIAssistantButtonProps {
  className?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  onClick: () => void;
}

/**
 * AIAssistantButton Component
 * 
 * Floating AI assistant button with expandable chat interface
 * Provides quick access to AI features and navigation assistance
 * 
 * Features:
 * - Floating action button with pulsing animation
 * - Expandable chat interface
 * - Quick action shortcuts
 * - Business insights and help
 */
export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: number;
    type: "user" | "ai";
    content: string;
    timestamp: Date;
  }>>([
    {
      id: 1,
      type: "ai" as const,
      content: "👋 Hi! I'm your AI assistant. How can I help you manage your admin tasks today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const quickActions: QuickAction[] = [
    {
      id: "insights",
      label: "Get Insights",
      icon: Sparkles,
      description: "View business insights and analytics",
      onClick: () => {
        handleQuickAction("Show me the latest business insights");
      },
    },
    {
      id: "performance",
      label: "Performance Summary",
      icon: TrendingUp,
      description: "Quick performance overview",
      onClick: () => {
        handleQuickAction("Give me a performance summary for today");
      },
    },
    {
      id: "navigate",
      label: "Quick Navigation",
      icon: Zap,
      description: "Navigate to any admin page",
      onClick: () => {
        handleQuickAction("What can you help me with? Show me available commands");
      },
    },
  ];

  const addMessage = (content: string, type: "user" | "ai") => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue;
    addMessage(userMessage, "user");
    setInputValue("");
    
    // Get AI response from backend
    try {
      const response = await fetch('/api/admin-management/ai/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          message: userMessage,
          context: messages.slice(-5) // Last 5 messages for context
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      const aiResponse = data.data?.message || data.message || "I'm here to help with your admin tasks!";
      
      addMessage(aiResponse, "ai");
      
      // Show a subtle notification if in fallback mode
      if (data.data?.fallback_mode) {
        console.log("AI is running in fallback mode with real data");
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      addMessage("🔧 I'm having a connection issue, but I can still help! Try asking me:\n• 'Are you working?'\n• 'Show me today's performance'\n• 'How many orders today?'\n\nPlease try your question again.", "ai");
      
      // Don't show error toast for every failure - keep UX smooth
      console.warn("Chatbot connection issue:", error);
    }
  };

  const handleQuickAction = async (query: string) => {
    addMessage(query, "user");
    
    try {
      const response = await fetch('/api/admin-management/ai/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          message: query,
          context: messages.slice(-5)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      const aiResponse = data.data?.message || data.message || "Here's what I found for you!";
      
      addMessage(aiResponse, "ai");
      
      if (data.data?.fallback_mode) {
        console.log("Quick action using fallback mode with real data");
      }
    } catch (error) {
      console.error('Quick action error:', error);
      addMessage("🔧 Having trouble with that request, but I'm still here! Try asking:\n• 'Are you working?'\n• 'Performance summary'\n• 'Show orders today'", "ai");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className={cn(
          "fixed bottom-6 right-6 z-[60]",
          className
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative group",
            "w-14 h-14 rounded-full",
            "bg-gradient-to-r from-blue-500 to-purple-600",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-300",
            "flex items-center justify-center",
            "overflow-hidden"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
          
          {/* Icon */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Bot className="h-6 w-6 text-white" />
            )}
          </motion.div>

          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.button>
      </motion.div>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <DraggableWrapper
            initialPosition={{ x: window.innerWidth - 420, y: window.innerHeight - 580 }}
            storageKey="ai-assistant-position"
            zIndex={55}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-96 h-[500px]"
            >
            <GlassCard gradient="blue" className="h-full flex flex-col p-0 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">AI Assistant</h3>
                    <p className="text-xs text-blue-200">Always here to help</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-3 border-b border-white/10">
                <div className="grid grid-cols-3 gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className={cn(
                        "p-2 rounded-lg",
                        "bg-white/5 hover:bg-white/10",
                        "border border-white/10 hover:border-white/20",
                        "transition-all duration-200",
                        "flex flex-col items-center gap-1",
                        "text-xs text-white/80 hover:text-white"
                      )}
                    >
                      <action.icon className="h-4 w-4" />
                      <span className="text-[10px] text-center leading-tight">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-2",
                      message.type === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.type === "ai" && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-sm",
                        message.type === "user"
                          ? "bg-blue-500 text-white rounded-br-sm"
                          : "bg-white/10 text-white rounded-bl-sm backdrop-blur-sm"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg",
                      "bg-white/10 border border-white/20",
                      "text-white placeholder-white/60",
                      "focus:outline-none focus:ring-2 focus:ring-blue-400/50",
                      "backdrop-blur-sm"
                    )}
                  />
                  <GradientButton
                    size="sm"
                    gradient="blue"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    icon={MessageSquare}
                  >
                    Send
                  </GradientButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
          </DraggableWrapper>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistantButton;
