import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const EMOJIS = ['👍', '❤️', '😂', '🎉', '🤔', '👀'];

// Derive backend socket URL from the API URL or fallback
const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Strip "/api" to get the base backend URL
    return apiUrl.replace(/\/api\/?$/, '');
};

export default function DiscussionForum({ eventId, isOrganizer }) {
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const { user } = useAuth();
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        fetchMessages();

        // Connect to socket
        const socket = io(getSocketUrl(), {
            transports: ['websocket', 'polling']
        });
        socketRef.current = socket;

        socket.emit('joinEvent', eventId);

        socket.on('newMessage', (msg) => {
            setMessages(prev => {
                // Avoid duplicates if we already fetched it
                if (prev.some(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });

        socket.on('messageDeleted', (msgId) => {
            setMessages(prev => prev.filter(m => m._id !== msgId));
        });

        socket.on('messagePinned', ({ messageId, isPinned }) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isPinned } : m));
        });

        socket.on('messageReaction', ({ messageId, reactions }) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
        });

        return () => {
            socket.emit('leaveEvent', eventId);
            socket.disconnect();
        };
    }, [eventId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await API.get(`/forum/${eventId}/messages`);
            setMessages(res.data);
        } catch { }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMsg.trim()) return;
        try {
            const res = await API.post(`/forum/${eventId}/messages`, {
                content: newMsg,
                parentMessage: replyTo?._id || null,
                isAnnouncement
            });
            setNewMsg('');
            setReplyTo(null);
            setIsAnnouncement(false);
            // If socket doesn't deliver the message, add it immediately
            setMessages(prev => {
                if (prev.some(m => m._id === res.data._id)) return prev;
                return [...prev, res.data];
            });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send');
            fetchMessages();
        }
    };

    const handleDelete = async (msgId) => {
        try {
            await API.delete(`/forum/${eventId}/messages/${msgId}`);
        } catch (err) { toast.error('Failed to delete'); }
    };

    const handlePin = async (msgId) => {
        try {
            await API.patch(`/forum/${eventId}/messages/${msgId}/pin`);
        } catch (err) { toast.error('Failed to pin'); }
    };

    const handleReact = async (msgId, emoji) => {
        try {
            await API.post(`/forum/${eventId}/messages/${msgId}/react`, { emoji });
        } catch { }
    };

    const getAuthorName = (author) => {
        if (!author) return 'Unknown';
        if (author.role === 'organizer') return author.organizerName || author.email;
        return `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email;
    };

    // Split into pinned and regular messages
    const pinnedMessages = messages.filter(m => m.isPinned);
    const regularMessages = messages.filter(m => !m.isPinned);

    // Group replies under parent
    const topLevel = regularMessages.filter(m => !m.parentMessage);
    const replies = regularMessages.filter(m => m.parentMessage);

    return (
        <div className="bg-[#12141d] border border-[#1e2030] rounded-2xl flex flex-col" style={{ height: '500px' }}>
            <div className="p-4 border-b border-[#1e2030]">
                <h3 className="text-white font-semibold text-sm">Discussion</h3>
            </div>

            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
                <div className="px-4 py-2 bg-[#78350f]/10 border-b border-[#1e2030]">
                    {pinnedMessages.map(m => (
                        <div key={m._id} className="flex items-start gap-2 text-sm py-1">
                            <span className="text-yellow-400">📌</span>
                            <span className="text-[#8b8fad]"><strong>{getAuthorName(m.author)}</strong>: {m.content}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {topLevel.map(msg => (
                    <div key={msg._id}>
                        <MessageBubble
                            msg={msg}
                            isOrganizer={isOrganizer}
                            isMine={msg.author?._id === user?.id}
                            onDelete={handleDelete}
                            onPin={handlePin}
                            onReact={handleReact}
                            onReply={() => setReplyTo(msg)}
                            getAuthorName={getAuthorName}
                            userId={user?.id}
                        />
                        {/* Threaded replies */}
                        {replies.filter(r => r.parentMessage === msg._id).map(reply => (
                            <div key={reply._id} className="ml-8 mt-1">
                                <MessageBubble
                                    msg={reply}
                                    isOrganizer={isOrganizer}
                                    isMine={reply.author?._id === user?.id}
                                    onDelete={handleDelete}
                                    onPin={handlePin}
                                    onReact={handleReact}
                                    onReply={() => setReplyTo(msg)}
                                    getAuthorName={getAuthorName}
                                    userId={user?.id}
                                    isReply
                                />
                            </div>
                        ))}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#1e2030]">
                {replyTo && (
                    <div className="flex items-center gap-2 text-sm text-[#6b7394] mb-2">
                        <span>Replying to <strong>{getAuthorName(replyTo.author)}</strong></span>
                        <button onClick={() => setReplyTo(null)} className="text-[#f87171] cursor-pointer">✕</button>
                    </div>
                )}
                <form onSubmit={handleSend} className="flex gap-2">
                    <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-[#0c0e14] border border-[#1e2030] rounded-lg text-white text-sm focus:outline-none focus:border-[#6366f1]" />
                    {isOrganizer && (
                        <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer select-none">
                            <input type="checkbox" checked={isAnnouncement} onChange={e => setIsAnnouncement(e.target.checked)} />
                            📢
                        </label>
                    )}
                    <button type="submit" className="px-4 py-2 bg-[#6366f1] hover:bg-[#818cf8] text-white text-sm rounded-lg cursor-pointer transition-all">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}

function MessageBubble({ msg, isOrganizer, isMine, onDelete, onPin, onReact, onReply, getAuthorName, userId, isReply }) {
    const [showReactions, setShowReactions] = useState(false);

    return (
        <div className={`group ${msg.isAnnouncement ? 'bg-[#312e81]/15 border border-[#312e81]/30 rounded-lg p-2' : ''}`}>
            <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${msg.author?.role === 'organizer' ? 'text-[#818cf8]' : 'text-[#8b8fad]'}`}>
                            {getAuthorName(msg.author)}
                        </span>
                        {msg.isAnnouncement && <span className="text-xs text-[#818cf8]">📢</span>}
                        <span className="text-xs text-[#3d4162]">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-[#e2e4ef] mt-0.5">{msg.content}</p>

                    {/* Reactions display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                                <button key={emoji} onClick={() => onReact(msg._id, emoji)}
                                    className={`text-xs px-1.5 py-0.5 rounded-full cursor-pointer transition ${(Array.isArray(users) && users.includes(userId)) ? 'bg-[#312e81]/40 border border-[#4338ca]' : 'bg-[#0c0e14] border border-[#1e2030]'
                                        }`}>
                                    {emoji} {Array.isArray(users) ? users.length : 0}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                    <button onClick={() => setShowReactions(!showReactions)} className="text-gray-500 hover:text-white text-xs cursor-pointer">😀</button>
                    {!isReply && <button onClick={() => onReply()} className="text-gray-500 hover:text-white text-xs cursor-pointer">↩</button>}
                    {isOrganizer && <button onClick={() => onPin(msg._id)} className="text-gray-500 hover:text-yellow-400 text-xs cursor-pointer">📌</button>}
                    {(isOrganizer || isMine) && <button onClick={() => onDelete(msg._id)} className="text-gray-500 hover:text-red-400 text-xs cursor-pointer">🗑</button>}
                </div>
            </div>

            {/* Reaction Picker */}
            {showReactions && (
                <div className="flex gap-1 mt-1 bg-[#0c0e14] border border-[#1e2030] rounded-lg p-1 inline-flex">
                    {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => { onReact(msg._id, emoji); setShowReactions(false); }}
                            className="hover:bg-[#1e2030] px-1 rounded cursor-pointer transition">{emoji}</button>
                    ))}
                </div>
            )}
        </div>
    );
}
