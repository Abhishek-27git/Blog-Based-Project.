import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { BlogDetailSkeleton } from "../components/Skeleton";

const BlogView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // commentId
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fetch blog post and comments
  const fetchData = async () => {
    try {
      const blogResponse = await api.get(`/blogs/post/${slug}`);
      if (blogResponse.data && blogResponse.data.success) {
        const blogData = blogResponse.data.blog;
        setBlog(blogData);
        setLikesCount(blogData.likes.length);

        if (user) {
          setIsLiked(blogData.likes.includes(user._id));
          try {
            const userBookmarksResponse = await api.get("/blogs/bookmarks");
            if (userBookmarksResponse.data && userBookmarksResponse.data.success) {
              const bookmarkedIds = userBookmarksResponse.data.blogs.map((b) => b._id);
              setIsBookmarked(bookmarkedIds.includes(blogData._id));
            }
          } catch (e) {
            console.error("Failed to load user bookmarks for indication", e);
          }
        }

        // Fetch comments
        const commentsResponse = await api.get(`/blogs/${blogData._id}/comments`);
        if (commentsResponse.data && commentsResponse.data.success) {
          setComments(commentsResponse.data.comments);
        }
      }
    } catch (err) {
      console.error("Error loading blog details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug, user]);

  // Handle Like
  const handleLike = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const response = await api.put(`/blogs/${blog._id}/like`);
      if (response.data && response.data.success) {
        setIsLiked(!isLiked);
        setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
      }
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  // Handle Bookmark
  const handleBookmark = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const response = await api.put(`/blogs/${blog._id}/bookmark`);
      if (response.data && response.data.success) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (err) {
      console.error("Bookmark failed:", err);
    }
  };

  // Post Comment
  const handleCommentSubmit = async (e, parentId = null) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    const text = parentId ? replyText : commentText;
    if (!text.trim()) return;

    try {
      const response = await api.post(`/blogs/${blog._id}/comments`, {
        content: text,
        parentComment: parentId,
      });

      if (response.data && response.data.success) {
        if (parentId) {
          setReplyText("");
          setReplyingTo(null);
        } else {
          setCommentText("");
        }
        // Reload comments
        const commentsResponse = await api.get(`/blogs/${blog._id}/comments`);
        if (commentsResponse.data && commentsResponse.data.success) {
          setComments(commentsResponse.data.comments);
        }
      }
    } catch (err) {
      console.error("Comment submission failed:", err);
    }
  };

  // Delete Comment (Owner or Admin)
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const response = await api.delete(`/blogs/${blog._id}/comments/${commentId}`);
      if (response.data && response.data.success) {
        // Reload comments
        const commentsResponse = await api.get(`/blogs/${blog._id}/comments`);
        if (commentsResponse.data && commentsResponse.data.success) {
          setComments(commentsResponse.data.comments);
        }
      }
    } catch (err) {
      console.error("Delete comment failed:", err);
    }
  };

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return <BlogDetailSkeleton />;
  }

  if (!blog) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">
          search_off
        </span>
        <h2 className="font-sans text-headline-md font-bold text-on-surface">Essay Not Found</h2>
        <p className="font-sans text-on-surface-variant mt-2 text-sm">
          The requested manuscript could not be found.
        </p>
        <Link to="/" className="text-primary font-bold hover:underline mt-4 text-xs tracking-wider uppercase">
          Return to Reading List
        </Link>
      </div>
    );
  }

  // Recursive Comment Component to render threads
  const CommentNode = ({ comment }) => {
    const isOwner = user && user._id === comment.author?._id;
    const isAdmin = user && user.role === "admin";

    return (
      <div className="border-l border-outline pl-4 py-1 my-3 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {comment.author?.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-5 h-5 rounded-full border border-outline object-cover grayscale"
              />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant text-[14px]">
                account_circle
              </span>
            )}
            <div>
              <p className="font-sans text-[10px] font-bold text-on-surface">
                {comment.isDeleted ? "Anonymous" : comment.author?.name || "Anonymous"}
              </p>
              <p className="font-mono text-[8px] text-on-surface-variant uppercase tracking-wider">
                {new Date(comment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {!comment.isDeleted && (isOwner || isAdmin) && (
            <button
              onClick={() => handleDeleteComment(comment._id)}
              className="text-error font-mono text-[9px] hover:underline cursor-pointer uppercase tracking-wider"
            >
              Delete
            </button>
          )}
        </div>

        <div className="my-2 font-sans text-xs text-on-surface-variant leading-relaxed">
          {comment.isDeleted ? (
            <span className="italic text-on-surface-variant/75">
              [ This comment has been deleted by its author ]
            </span>
          ) : (
            comment.content
          )}
        </div>

        {!comment.isDeleted && user && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
              className="font-mono text-[9px] text-primary hover:underline uppercase tracking-wider cursor-pointer font-bold"
            >
              {replyingTo === comment._id ? "Cancel" : "Reply"}
            </button>
          </div>
        )}

        {/* Reply Form */}
        {replyingTo === comment._id && (
          <form
            onSubmit={(e) => handleCommentSubmit(e, comment._id)}
            className="mt-3 flex flex-col items-end border border-outline bg-surface-container p-3 rounded-sm"
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-xs font-sans text-on-surface resize-none h-16 outline-none placeholder:text-on-surface-variant/50"
              placeholder="Write your response..."
              required
            />
            <button
              type="submit"
              className="bg-primary text-on-primary px-3 py-1 font-sans text-[9px] uppercase tracking-wider mt-2 hover:bg-secondary transition-colors font-bold"
            >
              Post Reply
            </button>
          </form>
        )}

        {/* Render nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-1">
            {comment.replies.map((reply) => (
              <CommentNode key={reply._id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="max-w-reading-column-max mx-auto px-6 md:px-0 pt-16 pb-40 animate-fade-in">
      {/* Scroll indicator reading bar */}
      <div className="reading-bar" style={{ width: `${scrollProgress}%` }} />
      
      {/* Paper Container matching Obsidian aesthetic */}
      <article className="bg-surface border border-outline shadow-md p-8 md:p-16 text-left relative rounded-sm">
        
        {/* Essay Header */}
        <header className="mb-10 text-left border-b border-outline/30 pb-8">
          <div className="flex items-center gap-2 mb-4 font-mono text-[9px] uppercase tracking-widest text-primary font-bold">
            <span>{blog.category}</span>
            <span>•</span>
            <span>{blog.readTime || 5} Min Read</span>
          </div>

          <h2 className="font-sans text-3xl md:text-4xl font-bold mb-6 leading-tight text-on-surface">
            {blog.title}
          </h2>

          {blog.excerpt && (
            <p className="font-sans text-sm md:text-base text-on-surface-variant/80 italic mb-6 leading-relaxed max-w-2xl border-l-2 border-primary/30 pl-4">
              {blog.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 pt-4">
            {blog.author?.avatar ? (
              <img
                src={blog.author.avatar}
                alt={blog.author?.name}
                className="w-10 h-10 rounded-full grayscale border border-outline object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant leading-none">
                  account_circle
                </span>
              </div>
            )}
            <div>
              <p className="font-sans text-xs font-bold text-on-surface">
                {blog.author ? (
                  <Link to={`/writer/${blog.author._id}`} className="hover:text-primary hover:underline transition-colors">
                    {blog.author.name}
                  </Link>
                ) : (
                  "Anonymous"
                )}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">
                {new Date(blog.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {blog.coverImage && (
          <div className="w-full h-80 overflow-hidden border border-outline mb-10 bg-surface-container relative">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover grayscale"
            />
          </div>
        )}

        {/* Main Content Body */}
        <div
          className="essay-content font-sans text-base md:text-lg text-on-surface-variant space-y-6 leading-relaxed drop-cap select-text"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Author details card at bottom of article */}
        <footer className="mt-16 pt-8 border-t border-outline/30">
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-surface-container-low p-6 border border-outline rounded-sm">
            {blog.author?.avatar ? (
              <img
                src={blog.author.avatar}
                alt={blog.author.name}
                className="w-16 h-16 grayscale border border-primary object-cover rounded-sm"
              />
            ) : (
              <div className="w-16 h-16 bg-surface-container-highest border border-primary rounded-sm flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-[64px] text-on-surface-variant leading-none">
                  account_circle
                </span>
              </div>
            )}
            <div className="text-center sm:text-left flex-1">
              <h4 className="font-sans text-sm font-bold mb-1 text-on-surface">
                About the Writer:{" "}
                {blog.author ? (
                  <Link to={`/writer/${blog.author._id}`} className="text-primary hover:underline transition-colors">
                    {blog.author.name}
                  </Link>
                ) : (
                  "Anonymous"
                )}
              </h4>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                {blog.author?.bio || `${blog.author?.name || "Anonymous"} is a contributing writer to The Manuscripts.`}
              </p>
            </div>
          </div>
        </footer>
      </article>

      {/* Threaded Comments Section */}
      <section className="mt-12 bg-surface border border-outline shadow-sm p-6 md:p-12 text-left rounded-sm">
        <h3 className="font-sans text-lg font-bold text-on-surface mb-6 border-b border-outline/30 pb-3">
          Responses ({comments.length})
        </h3>

        {/* New Response Form */}
        {user ? (
          <form onSubmit={(e) => handleCommentSubmit(e)} className="mb-8 border border-outline bg-surface-container-low p-4 flex flex-col items-end rounded-sm">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm font-sans text-on-surface resize-none h-20 outline-none placeholder:text-on-surface-variant/50"
              placeholder="What are your thoughts on this essay?"
              required
            />
            <button
              type="submit"
              className="bg-primary text-on-primary px-4 py-1.5 font-sans text-[10px] uppercase tracking-widest hover:bg-secondary transition-colors font-bold"
            >
              Publish Response
            </button>
          </form>
        ) : (
          <div className="mb-8 p-6 bg-surface-container-low border border-outline text-center rounded-sm">
            <p className="font-sans text-sm text-on-surface-variant mb-4">
              You must be logged in to participate in the conversation.
            </p>
            <Link
              to="/login"
              className="inline-block bg-primary text-on-primary hover:bg-secondary transition-colors px-6 py-2 font-sans text-xs uppercase tracking-widest font-bold"
            >
              Sign In to Reply
            </Link>
          </div>
        )}

        {/* Comments Tree */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="font-sans text-sm italic text-on-surface-variant text-center py-6">
              No responses yet. Be the first to share your thoughts.
            </p>
          ) : (
            comments.map((comment) => (
              <CommentNode key={comment._id} comment={comment} />
            ))
          )}
        </div>
      </section>

      {/* Floating Action Pill Toolbar at bottom center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface/85 backdrop-blur-md px-6 py-2.5 rounded-full border border-outline shadow-lg flex items-center gap-6">
        
        {/* Like Button */}
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 group cursor-pointer"
        >
          <span
            className={`material-symbols-outlined text-[20px] transition-colors ${
              isLiked ? "text-error" : "text-on-surface-variant group-hover:text-primary"
            }`}
            style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
          <span className="font-mono text-[9px] text-on-surface-variant group-hover:text-primary font-bold">
            {likesCount}
          </span>
        </button>

        <span className="h-4 w-px bg-outline" />

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className="flex items-center gap-1.5 group cursor-pointer"
        >
          <span
            className={`material-symbols-outlined text-[20px] transition-colors ${
              isBookmarked ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
            }`}
            style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark
          </span>
          <span className="font-mono text-[9px] text-on-surface-variant group-hover:text-primary font-bold">
            {isBookmarked ? "Saved" : "Save"}
          </span>
        </button>

        <span className="h-4 w-px bg-outline" />

        {/* Comments shortcut */}
        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
          className="flex items-center gap-1.5 group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary">
            add_comment
          </span>
          <span className="font-mono text-[9px] text-on-surface-variant group-hover:text-primary font-bold">
            Respond
          </span>
        </button>
      </div>
    </main>
  );
};

export default BlogView;
