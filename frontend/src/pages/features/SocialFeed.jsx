import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, UserPlus, Image as ImageIcon, Send } from 'lucide-react';
import { socialAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function SocialFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    socialAPI.getFeed()
      .then(({ data }) => setPosts(data.data?.posts || data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await socialAPI.createPost({ content: newPost, privacy: 'public' });
      setPosts(prev => [data.data.post, ...prev]);
      setNewPost('');
    } catch (e) {}
    setSubmitting(false);
  };

  const handleLike = async (targetId) => {
    try {
      await socialAPI.toggleLike({ targetId, targetType: 'post' });
      setPosts(prev => prev.map(p =>
        p._id === targetId ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked } : p
      ));
    } catch (e) {}
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Social Feed</h1>

      {user && (
        <Card>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold flex-shrink-0">
              {user.name?.[0] || 'U'}
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder="Share something..."
                rows={2}
                className="w-full input-field resize-none"
              />
              <div className="flex items-center justify-between">
                <button className="flex items-center gap-1 text-gray-500 hover:text-primary-600 text-sm">
                  <ImageIcon className="h-4 w-4" /> Photo
                </button>
                <Button size="sm" onClick={handleCreatePost} disabled={!newPost.trim()} loading={submitting}>
                  <Send className="h-4 w-4 mr-1" /> Post
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card><p className="text-gray-500 text-center py-8">No posts yet. Be the first to share!</p></Card>
      ) : (
        posts.map(post => (
          <Card key={post._id}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                {post.userId?.name?.[0] || 'U'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{post.userId?.name || 'Anonymous'}</p>
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
            {post.images?.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {post.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="rounded-lg w-full h-48 object-cover" />
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t">
              <button
                onClick={() => handleLike(post._id)}
                className={`flex items-center gap-1 text-sm transition-colors ${post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
              >
                <Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} /> {post.likes || 0}
              </button>
              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
                <MessageCircle className="h-4 w-4" /> {post.comments || 0}
              </button>
              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 ml-auto">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
