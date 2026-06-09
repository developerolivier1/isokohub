import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Users, MessageCircle, Heart, ShoppingBag, X, Send } from 'lucide-react';
import { liveAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function LiveStreamView() {
  const { id } = useParams();
  const [streams, setStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    const fetch = id
      ? liveAPI.getById(id).then(r => setActiveStream(r.data.data))
      : liveAPI.getAll().then(r => setStreams(r.data.data?.streams || r.data.data || []));
    fetch.catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSendComment = async () => {
    if (!commentInput.trim() || !activeStream) return;
    try {
      await liveAPI.addComment(activeStream._id, commentInput);
      setComments(prev => [...prev, { message: commentInput, createdAt: new Date(), user: { name: 'You' } }]);
      setCommentInput('');
    } catch (e) {}
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  if (id && activeStream) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
              <Play className="h-16 w-16 text-white/50" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge variant="danger">LIVE</Badge>
                <span className="flex items-center gap-1 text-white text-sm bg-black/50 px-2 py-1 rounded-full">
                  <Users className="h-4 w-4" /> {activeStream.viewerCount || 0}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">{activeStream.title}</h1>
              <p className="text-gray-500 mt-1">{activeStream.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {activeStream?.vendor?.storeName?.[0] || 'V'}
                </div>
                <span className="font-medium">{activeStream?.vendor?.storeName || 'Vendor'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowProducts(!showProducts)}>
                <ShoppingBag className="h-4 w-4 mr-1" /> Products
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-1" /> Like
              </Button>
            </div>
            {showProducts && activeStream.products?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeStream.products.map(p => (
                  <Card key={p._id} padding={false}>
                    <div className="aspect-square bg-gray-100" />
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-primary-600 font-semibold text-sm">RWF {p.price}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> Live Chat
              </h3>
              <div className="h-80 overflow-y-auto space-y-3 mb-3">
                {comments.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{c.user?.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">{c.message}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-sm text-gray-400 text-center pt-8">No messages yet</p>}
              </div>
              <div className="flex items-center gap-2 border-t pt-3">
                <input
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                  placeholder="Type a message..."
                  className="flex-1 input-field text-sm"
                />
                <button onClick={handleSendComment} className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Live Streams</h1>
      {streams.length === 0 ? (
        <Card><p className="text-gray-500 text-center py-8">No active live streams</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map(s => (
            <Card key={s._id} padding={false} className="cursor-pointer" onClick={() => setActiveStream(s)}>
              <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                <Play className="h-10 w-10 text-white/40" />
                <div className="absolute top-3 left-3"><Badge variant="danger">LIVE</Badge></div>
                <span className="absolute top-3 right-3 flex items-center gap-1 text-white text-xs bg-black/50 px-2 py-1 rounded-full">
                  <Users className="h-3 w-3" /> {s.viewerCount || 0}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{s.vendor?.storeName || 'Vendor'}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
