
import React from 'react';
import BotIcon from './icons/BotIcon';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-4 max-w-4xl mx-auto animate-fade-in-up">
       <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-slate-700">
        <BotIcon />
      </div>
      <div className="p-4 rounded-xl bg-slate-700 flex items-center space-x-2">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
