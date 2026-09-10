// ChatbotTab.jsx
import { useState, useRef, useEffect } from 'react';
import Icon, { IC } from './MyIcons';
import API from '../api';

const ChatbotTab = ({ dark, theme }) => {
    const { muted, inp, D, text } = theme;

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await API.get('chat/');
                const history = res.data.messages.map(msg => ({
                    id: msg.id,
                    sender: msg.sender,
                    text: msg.text,
                    timestamp: new Date(msg.timestamp),
                }));
                if (history.length > 0) {
                    setMessages(history);
                } else {
                    setMessages([{
                        id: 1,
                        sender: 'bot',
                        text: 'Hi there! 👋 How can I help with your water logistics today?',
                        timestamp: new Date(),
                    }]);
                }
            } catch (err) {
                console.error('Failed to load chat history:', err);
                setMessages([{
                    id: 1,
                    sender: 'bot',
                    text: 'Hi there! 👋 How can I help with your water logistics today?',
                    timestamp: new Date(),
                }]);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text || isLoading) return;

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        const typingId = Date.now() + 1;
        setMessages(prev => [
            ...prev,
            { id: typingId, sender: 'bot', text: '...', timestamp: new Date(), typing: true },
        ]);

        try {
            const res = await API.post('chat/', { message: text });

            // Success
            setMessages(prev =>
                prev
                    .filter(m => m.id !== typingId)
                    .concat({
                        id: Date.now() + 2,
                        sender: 'bot',
                        text: res.data.reply,
                        timestamp: new Date(),
                    })
            );
        } catch (err) {
            // Simple error handling – show a generic message
            setMessages(prev =>
                prev
                    .filter(m => m.id !== typingId)
                    .concat({
                        id: Date.now() + 2,
                        sender: 'bot',
                        text: "Sorry, I'm having trouble connecting. Please try again.",
                        timestamp: new Date(),
                    })
            );
            console.error('Chat error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const botBubble = D ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-800';
    const userBubble = 'bg-blue-600 text-white';

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
                <Icon path={IC.chat} className="w-5 h-5 text-blue-500" />
                <h2 className={`text-xl font-bold ${text}`}>Support Chat</h2>
                {/* New Chat button – back in the header, not floating */}
                <button
                    onClick={async () => {
                        try {
                            await API.delete('chat/');
                        } catch (err) {
                            console.error('Failed to delete session:', err);
                        }
                        setMessages([{
                            id: 1,
                            sender: 'bot',
                            text: 'Hi there! 👋 How can I help with your water logistics today?',
                            timestamp: new Date(),
                        }]);
                    }}
                    className={`ml-auto text-xs px-3 py-1 rounded-lg transition-colors ${
                        D
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    New Chat
                </button>
            </div>

            {initialLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className={muted}>Loading chat history…</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                                        msg.sender === 'user' ? userBubble : botBubble
                                    } ${msg.typing ? 'animate-pulse' : ''}`}
                                >
                                    {msg.typing ? '...' : <p>{msg.text}</p>}
                                    {!msg.typing && (
                                        <div className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-blue-200' : muted}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form
                        onSubmit={handleSend}
                        className={`pt-4 border-t ${D ? 'border-slate-800' : 'border-slate-200'}`}
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder="Type your message…"
                                className={`flex-1 px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${inp}`}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || isLoading}
                                className={`px-5 py-3 rounded-xl font-bold text-sm transition-colors ${
                                    inputText.trim() && !isLoading
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : D
                                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatbotTab;