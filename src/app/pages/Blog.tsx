import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Calendar, Tag, User, ChevronRight, Search } from 'lucide-react';

const API_URL = `https://bqtzxoteoucvioxqgfpc.supabase.co/functions/v1/make-server-d1fbc049`;

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  author: string;
  publishedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/blog/posts`)
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
      const matchTag = !activeTag || p.tags?.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [posts, search, activeTag]);

  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-4xl font-bold text-gray-900">CostPlus Blog</h1>
          <p className="mt-2 text-gray-500 text-lg">Tips, news and guides for commercial kitchen equipment.</p>

          {/* Search */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveTag('')}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${!activeTag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${activeTag === tag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No articles found.</div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <Link to={`/blog/${featured.slug}`} className="group block mb-10">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition md:flex">
                  {featured.coverImage ? (
                    <img src={featured.coverImage} alt={featured.title} className="w-full md:w-80 h-56 object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-full md:w-80 h-56 bg-gradient-to-br from-blue-600 to-blue-800 flex-shrink-0 flex items-center justify-center text-white text-4xl font-bold">
                      {featured.title.charAt(0)}
                    </div>
                  )}
                  <div className="p-6 flex flex-col justify-center">
                    <div className="flex gap-2 flex-wrap mb-3">
                      {featured.tags?.map(t => (
                        <span key={t} className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition mb-2">{featured.title}</h2>
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4">{featured.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><User size={12} />{featured.author}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(featured.publishedAt)}</span>
                    </div>
                    <span className="mt-4 text-sm font-semibold text-blue-600 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read article <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {rest.map(post => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-3xl font-bold">
                        {post.title.charAt(0)}
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex gap-1 flex-wrap mb-2">
                        {post.tags?.slice(0, 2).map(t => (
                          <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition text-sm leading-snug mb-1">{post.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 flex-1">{post.excerpt}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(post.publishedAt)}</span>
                        <span className="text-blue-600 font-medium inline-flex items-center gap-0.5">Read <ChevronRight size={11} /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
