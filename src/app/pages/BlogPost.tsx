import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Calendar, User, Tag, ArrowLeft, ChevronRight } from 'lucide-react';

const API_URL = `https://bqtzxoteoucvioxqgfpc.supabase.co/functions/v1/make-server-d1fbc049`;

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  author: string;
  publishedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    Promise.all([
      fetch(`${API_URL}/blog/posts/${slug}`).then(r => r.json()),
      fetch(`${API_URL}/blog/posts`).then(r => r.json()),
    ])
      .then(([single, all]) => {
        if (single.error || !single.post) { setNotFound(true); return; }
        setPost(single.post);
        const others: Post[] = (all.posts || []).filter((p: Post) => p.slug !== slug).slice(0, 3);
        setRelated(others);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
        <Link to="/blog" className="text-blue-600 hover:underline">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Cover */}
      {post.coverImage && (
        <div className="w-full h-72 md:h-96 overflow-hidden">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={14} /> Back to Blog
        </Link>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {post.tags.map(t => (
              <span key={t} className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                <Tag size={10} /> {t}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>

        <div className="flex items-center gap-6 text-sm text-gray-500 mb-8 border-b border-gray-100 pb-6">
          <span className="flex items-center gap-1.5"><User size={14} /> {post.author}</span>
          <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(post.publishedAt)}</span>
        </div>

        {/* Content — rendered as HTML (admin saves rich text) */}
        {post.content ? (
          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed
              prose-headings:font-bold prose-headings:text-gray-900
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:shadow-sm
              prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <p className="text-gray-500 italic">No content yet.</p>
        )}

        {/* CTA */}
        <div className="mt-12 bg-blue-600 text-white rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Need commercial kitchen equipment?</h3>
          <p className="text-blue-100 mb-5">Browse our full range of professional catering equipment at trade prices.</p>
          <Link
            to="/products"
            className="inline-block bg-white text-blue-700 font-bold px-6 py-2.5 rounded-full hover:bg-blue-50 transition"
          >
            Shop Now
          </Link>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-gray-900 mb-5">More Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(p => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="group bg-gray-50 rounded-xl overflow-hidden hover:bg-gray-100 transition">
                  {p.coverImage && (
                    <img src={p.coverImage} alt={p.title} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition leading-snug">{p.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(p.publishedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
