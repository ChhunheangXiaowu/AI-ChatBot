import React, { useState, useRef, useEffect } from 'react';

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`; // max-h-48
        }
    }, [input]);

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700 p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-end gap-2">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="relative flex-1"
                    >
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message here..."
                            rows={1}
                            className="w-full bg-slate-700 text-slate-100 p-3 pr-14 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 max-h-48 rounded-lg"
                            disabled={isLoading}
                            style={{ overflowY: 'auto' }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-3 bottom-2.5 p-2 rounded-full text-indigo-400 hover:bg-indigo-500 hover:text-white disabled:text-slate-500 disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
                            aria-label="Send message"
                        >
                            <SendIcon />
                        </button>
                    </form>
                </div>
                 <p className="text-xs text-slate-500 text-center mt-2">
                    Shift + Enter for new line.
                </p>
            </div>
        </div>
    );
};

export default ChatInput;