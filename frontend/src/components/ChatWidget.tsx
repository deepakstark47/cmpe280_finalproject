import React, { useState, useEffect, useRef } from 'react';
import ChatRoom from '../pages/ChatRoom';
import { FiMaximize2, FiMinimize2, FiX } from 'react-icons/fi';
import chatbotImage from '../../assets/unnamed.jpg';
import { MessageInterface } from '../types/types';

const ChatWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const welcomeMessageShown = useRef(false);

  // Welcome message on mount - show after 2 seconds so the intro message stays visible
  useEffect(() => {
    if (!welcomeMessageShown.current && messages.length === 0) {
      const welcomeMessage: MessageInterface = {
        role: 'assistant',
        content: "Hello! Welcome to Merry's Way Coffee Shop!\n\nI'm here to help you with:\n• Ordering your favorite coffee and pastries\n• Getting recommendations\n• Learning about our menu items\n\nHow can I assist you today?"
      };
      setTimeout(() => {
        setMessages([welcomeMessage]);
        welcomeMessageShown.current = true;
      }, 2000);
    }
  }, [messages.length]);

  const toggleChat = () => {
    if (isFullScreen) {
      setIsFullScreen(false);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const minimizeToSmallest = () => {
    setIsFullScreen(false);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Chat Widget Button (Minimized State) */}
      {!isExpanded && !isFullScreen && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
          {/* Helper Message */}
          <div className="bg-white rounded-lg shadow-xl px-4 py-2.5 border border-neutral-200 animate-slide-in-right">
            <p className="text-sm font-medium text-neutral-700 whitespace-nowrap">
              AI Assistant
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Click to chat
            </p>
          </div>
          
          {/* Chat Button */}
          <button
            onClick={toggleChat}
            className="w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center group p-0 border-0 bg-transparent"
            aria-label="Open chat"
          >
            <div className="relative">
              <img 
                src={chatbotImage} 
                alt="Chat" 
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </button>
        </div>
      )}

      {/* Widget Chat Window */}
      {isExpanded && !isFullScreen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] md:w-[500px] md:h-[700px] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col z-50 overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-neutral-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={chatbotImage} 
                  alt="Merry's Way Coffee Shop" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Merry's Way</h3>
                <p className="text-neutral-300 text-xs">Your Coffee Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullScreen}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Expand to full screen"
              >
                <FiMaximize2 className="text-white" size={16} />
              </button>
              <button
                onClick={toggleChat}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Minimize chat"
              >
                <FiX className="text-white" size={16} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            <ChatRoom 
              isWidget={true} 
              messages={messages}
              setMessages={setMessages}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              inputValue={inputValue}
              setInputValue={setInputValue}
              isSending={isSending}
              setIsSending={setIsSending}
            />
          </div>
        </div>
      )}

      {/* Full Screen Chat Window */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header */}
          <div className="bg-neutral-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={chatbotImage} 
                  alt="Merry's Way Coffee Shop" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold text-xl">Merry's Way</h3>
                <p className="text-neutral-300 text-sm">Your Coffee Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullScreen}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Exit full screen"
              >
                <FiMinimize2 className="text-white" size={20} />
              </button>
              <button
                onClick={minimizeToSmallest}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Minimize to smallest"
              >
                <FiX className="text-white" size={20} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            <ChatRoom 
              isWidget={false} 
              isFullScreen={true}
              messages={messages}
              setMessages={setMessages}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              inputValue={inputValue}
              setInputValue={setInputValue}
              isSending={isSending}
              setIsSending={setIsSending}
            />
          </div>
        </div>
      )}

      {/* Backdrop Overlay (when widget is open) */}
      {isExpanded && !isFullScreen && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
          onClick={toggleChat}
        />
      )}
    </>
  );
};

export default ChatWidget;

