
import React from 'react';
import BotIcon from './icons/BotIcon';

interface WelcomeScreenProps {
    onPromptClick: (prompt: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptClick }) => {
    const examplePrompts = [
        "Explain quantum computing in simple terms",
        "Write a python script to sort a list",
        "What are some healthy dinner ideas?",
        "Tell me a fun fact about the Roman Empire"
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 animate-fade-in">
            <div className="w-24 h-24 mb-6 text-sky-400">
                <BotIcon />
            </div>
            <h2 className="text-3xl font-bold text-slate-200 mb-2">How can I help you today?</h2>
            <p className="mb-8">Start a conversation by typing below or select an example prompt.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                {examplePrompts.map(prompt => (
                    <button 
                        key={prompt}
                        onClick={() => onPromptClick(prompt)}
                        className="bg-slate-800 p-4 rounded-lg text-left hover:bg-slate-700/80 transition-colors duration-200"
                    >
                        <p className="text-slate-300">{prompt}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WelcomeScreen;
