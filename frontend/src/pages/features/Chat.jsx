import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import { Search, Send, ChevronLeft } from 'lucide-react';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    chatAPI.getConversations()
      .then(({ data }) => setConversations(data.data?.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = async (userId) => {
    setShowMobileList(false);
    setActiveChat(userId);
    try {
      const { data } = await chatAPI.getMessages(userId);
      setMessages(data.data?.messages || []);
    } catch (e) {}
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !activeChat || sending) return;
    setSending(true);
    try {
      const { data } = await chatAPI.sendMessage(activeChat, { message: messageInput });
      setMessages(prev => [...prev, data.data.message]);
      setMessageInput('');
    } catch (e) {}
    setSending(false);
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Card padding={false} className="flex h-[calc(100vh-10rem)] min-h-[500px] overflow-hidden">
        <div className={`w-full sm:w-80 border-r flex-shrink-0 ${showMobileList ? 'block' : 'hidden sm:block'}`}>
          <div className="p-4 border-b">
            <h2 className="font-display font-bold text-gray-900 mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input placeholder="Search conversations..." className="input-field pl-9 text-sm" />
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-8rem)]">
            {conversations.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No conversations yet</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv._id}
                  onClick={() => openChat(conv._id)}
                  className={`w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b ${activeChat === conv._id ? 'bg-primary-50' : ''}`}
                >
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                    {conv.user?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{conv.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.message || ''}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="bg-primary-600 text-white text-xs rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${!showMobileList ? 'block' : 'hidden sm:flex'}`}>
          {activeChat ? (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <button className="sm:hidden" onClick={() => setShowMobileList(true)}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                  {conversations.find(c => c._id === activeChat)?.user?.name?.[0] || '?'}
                </div>
                <span className="font-medium text-gray-900">
                  {conversations.find(c => c._id === activeChat)?.user?.name || 'User'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === user?._id;
                  return (
                    <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-primary-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <input
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Type a message..."
                    className="flex-1 input-field"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sending}
                    className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function MessageCircle(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}
