import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';

const API_URL = `https://bqtzxoteoucvioxqgfpc.supabase.co/functions/v1/make-server-d1fbc049`;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdHp4b3Rlb3VjdmlveHFnZnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjYwMDIsImV4cCI6MjA4ODM0MjAwMn0.WtWmz2qJ2NNMx7LHnkrYnJqR9b8cC-IDTVyKaWs9Ta4';

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` });

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published';
  createdAt: string;
  publishedAt: string | null;
}

const empty: Omit<Post, 'id' | 'createdAt' | 'publishedAt'> = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tags: [],
  author: 'CostPlus Team',
  status: 'draft',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/admin/blog/posts`, { headers: headers() })
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setEditing({ ...empty });
    setTagInput('');
    setError('');
  };

  const openEdit = (post: Post) => {
    setEditing({ ...post });
    setTagInput('');
    setError('');
  };

  const handleSave = async () => {
    if (!editing?.title?.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const isNew = !editing.id;
      const url = isNew
        ? `${API_URL}/admin/blog/posts`
        : `${API_URL}/admin/blog/posts/${editing.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(editing) });
      if (!res.ok) throw new Error(await res.text());
      load();
      setEditing(null);
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`${API_URL}/admin/blog/posts/${id}`, { method: 'DELETE', headers: headers() });
    load();
  };

  const toggleStatus = async (post: Post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await fetch(`${API_URL}/admin/blog/posts/${post.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ ...post, status: newStatus }),
    });
    load();
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    setEditing(prev => ({ ...prev, tags: [...(prev?.tags || []), t] }));
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setEditing(prev => ({ ...prev, tags: (prev?.tags || []).filter(t => t !== tag) }));
  };

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // ── Editor view ─────────────────────────────────────────────────────────────
  if (editing !== null) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">{editing.id ? 'Edit Post' : 'New Post'}</h1>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={editing.title || ''}
              onChange={e => setEditing(prev => ({
                ...prev,
                title: e.target.value,
                slug: prev?.slug || autoSlug(e.target.value),
              }))}
              placeholder="Article title"
            />
          </div>

          <div>
            <Label>Slug</Label>
            <Input
              value={editing.slug || ''}
              onChange={e => setEditing(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="url-friendly-slug"
            />
          </div>

          <div>
            <Label>Author</Label>
            <Input
              value={editing.author || ''}
              onChange={e => setEditing(prev => ({ ...prev, author: e.target.value }))}
            />
          </div>

          <div>
            <Label>Cover Image URL</Label>
            <Input
              value={editing.coverImage || ''}
              onChange={e => setEditing(prev => ({ ...prev, coverImage: e.target.value }))}
              placeholder="https://..."
            />
            {editing.coverImage && (
              <img src={editing.coverImage} alt="cover" className="mt-2 h-32 rounded-lg object-cover" />
            )}
          </div>

          <div>
            <Label>Excerpt</Label>
            <Textarea
              value={editing.excerpt || ''}
              onChange={e => setEditing(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Short summary shown in the blog list"
              rows={2}
            />
          </div>

          <div>
            <Label>Content (HTML)</Label>
            <Textarea
              value={editing.content || ''}
              onChange={e => setEditing(prev => ({ ...prev, content: e.target.value }))}
              placeholder="<p>Write your article content here. HTML is supported.</p>"
              rows={14}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">HTML supported — use &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;img&gt;, &lt;a&gt; etc.</p>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter"
              />
              <Button type="button" variant="outline" onClick={addTag}>Add</Button>
            </div>
            {editing.tags && editing.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {editing.tags.map(t => (
                  <span key={t} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {t}
                    <button onClick={() => removeTag(t)} className="ml-1 hover:text-red-600"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Status</Label>
            <select
              value={editing.status || 'draft'}
              onChange={e => setEditing(prev => ({ ...prev, status: e.target.value as any }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} className="mr-2" />
              {saving ? 'Saving…' : 'Save Post'}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Manager</h1>
          <p className="text-sm text-gray-500 mt-1">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-2" /> New Post
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-3">No posts yet</p>
          <Button onClick={openNew}><Plus size={16} className="mr-2" /> Create your first post</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              {post.coverImage && (
                <img src={post.coverImage} alt={post.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {post.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  {post.tags?.slice(0, 3).map(t => (
                    <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {post.author} · {formatDate(post.createdAt)}
                  {post.publishedAt && post.status === 'published' && ` · Published ${formatDate(post.publishedAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => toggleStatus(post)} title={post.status === 'published' ? 'Unpublish' : 'Publish'}>
                  {post.status === 'published' ? <EyeOff size={16} className="text-yellow-600" /> : <Eye size={16} className="text-green-600" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(post)}>
                  <Edit2 size={16} className="text-blue-600" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(post.id)}>
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
