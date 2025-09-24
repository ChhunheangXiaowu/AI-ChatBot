import React from 'react';
import { Message } from '../types';
import UserIcon from './icons/UserIcon';
import BotIcon from './icons/BotIcon';

interface ChatMessageProps {
  message: Message;
}

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-slate-900/70 rounded-md p-3 my-2 overflow-x-auto">
        <code className="text-sm text-slate-300 font-mono">
            {children}
        </code>
    </pre>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUserModel = message.role === 'model';

  const renderContent = (content: string) => {
    if (!content) return null;
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) { // It's a code block
        return <CodeBlock key={index}>{part.trim()}</CodeBlock>;
      } else {
        return part.split('\n').map((line, i) => (
          <p key={`${index}-${i}`}>{line}</p>
        ));
      }
    });
  };

  return (
    <div className={`flex items-start gap-4 max-w-4xl mx-auto ${!isUserModel && 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUserModel ? 'bg-slate-700' : 'bg-indigo-600'}`}>
        {isUserModel ? <BotIcon /> : <UserIcon />}
      </div>
      <div className={`p-4 rounded-xl max-w-[80%] animate-fade-in-up ${isUserModel ? 'bg-slate-700' : 'bg-indigo-600'}`}>
        <div className="prose prose-invert text-slate-200 whitespace-pre-wrap">
            {renderContent(message.content)}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-600/50">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">Sources</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              {message.sources.map((source, index) => (
                <li key={index}>
                  <a 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sky-400 hover:text-sky-300 hover:underline truncate block"
                    title={source.title}
                  >
                    {source.title || new URL(source.uri).hostname}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;