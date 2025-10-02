import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageSquare, X, Sparkles, Zap, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import { GlassCard } from "./GlassCard";
import { GradientButton } from "./GradientButton";

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
        addMessage("Show me the latest business insights", "user");
        addMessage("📊 Here are your key insights:\n• Revenue up 12% this month\n• Peak order time: 7-9 PM\n• Top performing food: Chicken Biryani\n• 3 pending complaints need attention", "ai");
      },
    },
    {
      id: "performance",
      label: "Performance Summary",
      icon: TrendingUp,
      description: "Quick performance overview",
      onClick: () => {
        addMessage("Give me a performance summary", "user");
        addMessage("🚀 Performance Summary:\n• Total Users: 108 (↑5%)\n• Orders Today: 23 (↑15%)\n• Revenue: LKR 2,840 (↑8%)\n• Customer Satisfaction: 4.6/5", "ai");
      },
    },
    {
      id: "navigate",
      label: "Quick Navigation",
      icon: Zap,
      description: "Navigate to any admin page",
      onClick: () => {
        addMessage("Help me navigate to user management", "user");
        addMessage("🧭 I can help you navigate! Try:\n• 'Go to analytics' - View reports\n• 'Show orders' - Order management\n• 'User approvals' - Pending approvals\n• 'AI insights' - AI dashboard", "ai");
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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    addMessage(inputValue, "user");
    setInputValue("");
    
    // Simulate AI response
    setTimeout(() => {
      addMessage("I understand you need help with that. Let me assist you with your admin tasks!", "ai");
    }, 1000);
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
          "fixed bottom-6 right-6 z-50",
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
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-40 w-96 h-[500px]"
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
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistantButton;
