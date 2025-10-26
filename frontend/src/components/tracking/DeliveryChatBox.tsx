import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  MessageCircle,
  X,
  User,
  Bike,
  Loader2,
  Check,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { deliveryChatService, ChatMessage } from '@/services/deliveryChatService';

interface DeliveryChatBoxProps {
  orderId: number;
  deliveryPartnerName: string;
  deliveryPartnerPhone?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeliveryChatBox: React.FC<DeliveryChatBoxProps> = ({
  orderId,
  deliveryPartnerName,
  deliveryPartnerPhone,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [quickMessages, setQuickMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load messages and quick messages
  useEffect(() => {
    if (isOpen && orderId) {
      loadMessages();
      loadQuickMessages();
    }
  }, [isOpen, orderId]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const stopPolling = deliveryChatService.pollMessages(
      orderId,
      (data) => {
        setMessages(data.messages);
      },
      5000
    );

    return () => {
      stopPolling.then(cleanup => cleanup());
    };
  }, [isOpen, orderId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await deliveryChatService.getChatMessages(orderId);
      setMessages(data.messages);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuickMessages = async () => {
    try {
      const data = await deliveryChatService.getQuickMessages(orderId);
      setQuickMessages(data.quick_messages);
    } catch (error) {
      console.error('Failed to load quick messages:', error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || newMessage.trim();
    
    if (!textToSend) return;

    try {
      setSending(true);
      const response = await deliveryChatService.sendMessage(orderId, {
        message: textToSend,
        message_type: 'text',
      });

      // Add new message to list
      setMessages(prev => [...prev, response.message]);
      setNewMessage('');
      scrollToBottom();
    } catch (error: any) {
      toast({
        title: 'Failed to send',
        description: error.message || 'Could not send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleQuickMessageClick = (message: string) => {
    handleSendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bike className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{deliveryPartnerName}</p>
              {deliveryPartnerPhone && (
                <p className="text-xs opacity-90">{deliveryPartnerPhone}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Start a conversation with your delivery partner
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.message_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex',
                  msg.is_own_message ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg px-3 py-2',
                    msg.is_own_message
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  )}
                >
                  <p className="text-sm break-words">{msg.message}</p>
                  <div
                    className={cn(
                      'flex items-center gap-1 mt-1',
                      msg.is_own_message ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs',
                        msg.is_own_message
                          ? 'text-blue-100'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {deliveryChatService.formatTimestamp(msg.created_at)}
                    </span>
                    {msg.is_own_message && (
                      msg.is_read ? (
                        <CheckCheck className="h-3 w-3 text-blue-100" />
                      ) : (
                        <Check className="h-3 w-3 text-blue-100" />
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Messages */}
        {quickMessages.length > 0 && messages.length === 0 && (
          <div className="p-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Quick messages:</p>
            <div className="flex flex-wrap gap-1">
              {quickMessages.slice(0, 4).map((msg, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickMessageClick(msg)}
                  className="text-xs h-7 px-2"
                  disabled={sending}
                >
                  {msg}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1 text-sm"
            />
            <Button
              size="icon"
              onClick={() => handleSendMessage()}
              disabled={!newMessage.trim() || sending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeliveryChatBox;

