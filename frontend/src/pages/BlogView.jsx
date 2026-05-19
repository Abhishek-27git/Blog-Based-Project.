import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

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
          // Bookmarks can be verified via user bookmarks or a bookmark indicator from API
          // We can check if this blog ID is in the user's bookmarks list or run a get bookmarks call
          // For simplicity, let's load user bookmarks if user is logged in
          try {
            const userBookmarksResponse = await api.get("/blogs/bookmarks");
            if (userBookmarksResponse.data && userBookmarksResponse.data.success) {
              const bookmarkedIds = userBookmarksResponse.data.bookmarks.map((b) => b._id);
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

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-secondary animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">
          search_off
        </span>
        <h2 className="font-display-lg text-headline-md">Essay Not Found</h2>
        <p className="font-body-md text-on-surface-variant mt-2">
          The requested manuscript could not be found.
        </p>
        <Link to="/" className="text-secondary font-bold hover:underline mt-4">
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
      <div className="border-l border-outline-variant/50 pl-4 py-2 my-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {comment.author?.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-6 h-6 rounded-full border border-outline grayscale"
              />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant text-base">
                account_circle
              </span>
            )}
            <div>
              <p className="font-ui-label text-xs font-bold text-primary">
                {comment.isDeleted ? "Anonymous" : comment.author?.name || "Anonymous"}
              </p>
              <p className="font-ui-small text-[10px] text-on-surface-variant">
                {new Date(comment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {!comment.isDeleted && (isOwner || isAdmin) && (
            <button
              onClick={() => handleDeleteComment(comment._id)}
              className="text-error font-ui-small text-[10px] hover:underline"
            >
              Delete
            </button>
          )}
        </div>

        <div className="my-2 font-body-md text-sm text-on-surface">
          {comment.isDeleted ? (
            <span className="italic text-on-surface-variant/70">
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
              className="font-ui-small text-[10px] text-secondary hover:underline uppercase tracking-wider"
            >
              {replyingTo === comment._id ? "Cancel" : "Reply"}
            </button>
          </div>
        )}

        {/* Reply Form */}
        {replyingTo === comment._id && (
          <form
            onSubmit={(e) => handleCommentSubmit(e, comment._id)}
            className="mt-3 flex flex-col items-end border border-outline-variant bg-background p-2"
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm font-body-md resize-none h-16 outline-none"
              placeholder="Write your response..."
              required
            />
            <button
              type="submit"
              className="bg-primary text-on-primary px-3 py-1 font-ui-label text-[10px] uppercase tracking-wider mt-2 hover:bg-on-surface-variant"
            >
              Post Reply
            </button>
          </form>
        )}

        {/* Render nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {comment.replies.map((reply) => (
              <CommentNode key={reply._id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="max-w-reading-column-max mx-auto px-margin-mobile md:px-0 pt-stack-lg pb-40">
      <article>
        
        {/* Essay Header */}
        <header className="mb-stack-lg text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <span className="bg-surface-container-high px-2 py-0.5 font-ui-small text-ui-small border border-outline-variant uppercase tracking-tighter">
              {blog.category}
            </span>
            <span className="text-on-surface-variant font-ui-small text-ui-small">
              {blog.readTime || 5} Min Read
            </span>
          </div>

          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-stack-md leading-tight">
            {blog.title}
          </h2>

          <div className="flex items-center justify-center md:justify-start gap-4 pt-4 border-t border-outline-variant max-w-xs mx-auto md:mx-0">
            {blog.author?.avatar ? (
              <img
                src={blog.author.avatar}
                alt={blog.author?.name}
                className="w-12 h-12 grayscale border border-outline object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
                account_circle
              </span>
            )}
            <div className="text-left">
              <p className="font-ui-label text-ui-label font-bold text-primary">
                {blog.author?.name || "Anonymous"}
              </p>
              <p className="font-ui-small text-ui-small text-on-surface-variant">
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
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-96 object-cover grayscale my-stack-lg border border-outline-variant"
          />
        )}

        {/* Main Content */}
        <div
          className="essay-content font-body-lg text-body-lg text-on-surface space-y-stack-md leading-relaxed drop-cap"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Author Footer */}
        <footer className="mt-stack-lg pt-stack-md border-t border-outline-variant">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-surface-container-low p-8">
            {blog.author?.avatar ? (
              <img
                src={blog.author.avatar}
                alt={blog.author.name}
                className="w-24 h-24 grayscale border border-primary object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-[96px] text-on-surface-variant">
                account_circle
              </span>
            )}
            <div className="text-center md:text-left">
              <h4 className="font-headline-sm text-headline-sm mb-2">About the Author</h4>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-lg">
                {blog.author?.bio || `${blog.author?.name || "Anonymous"} is a contributing writer to The Manuscript platform.`}
              </p>
            </div>
          </div>
        </footer>
      </article>

      {/* Threaded Comments Section */}
      <section className="mt-16 pt-8 border-t border-outline-variant">
        <h3 className="font-headline-sm text-headline-sm text-primary mb-6">Responses ({comments.length})</h3>

        {/* New Comment Form */}
        {user ? (
          <form onSubmit={(e) => handleCommentSubmit(e)} className="mb-8 border border-outline-variant bg-surface-container-low p-4 flex flex-col items-end">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm font-body-md resize-none h-24 outline-none"
              placeholder="What are your thoughts on this essay?"
              required
            />
            <button
              type="submit"
              className="bg-primary text-on-primary px-4 py-2 font-ui-label text-xs uppercase tracking-widest hover:bg-on-surface-variant transition-colors"
            >
              Publish Response
            </button>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-surface-container border border-outline-variant text-center">
            <p className="font-body-md text-sm text-on-surface-variant mb-3">
              You must be logged in to participate in the conversation.
            </p>
            <Link
              to="/login"
              className="inline-block bg-primary text-on-primary px-6 py-2 font-ui-label text-xs uppercase tracking-widest"
            >
              Sign In to Reply
            </Link>
          </div>
        )}

        {/* Comments Tree */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="font-body-md text-sm italic text-on-surface-variant">
              No responses yet. Be the first to share your thoughts.
            </p>
          ) : (
            comments.map((comment) => (
              <CommentNode key={comment._id} comment={comment} />
            ))
          )}
        </div>
      </section>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-surface dark:bg-tertiary-container border-t border-outline-variant dark:border-tertiary shadow-lg md:px-margin-page">
        <div className="max-w-reading-column-max mx-auto flex justify-around items-center py-4 px-margin-mobile">
          
          {/* Like Button */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1 group transition-all"
          >
            <span
              className={`material-symbols-outlined transition-colors ${
                isLiked ? "text-error" : "text-on-surface-variant group-hover:text-primary"
              }`}
              style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
            <span className="font-ui-small text-ui-small text-on-surface-variant group-hover:text-primary">
              {likesCount}
            </span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className="flex flex-col items-center gap-1 group transition-all"
          >
            <span
              className={`material-symbols-outlined transition-colors ${
                isBookmarked ? "text-secondary" : "text-on-surface-variant group-hover:text-primary"
              }`}
              style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
            <span className="font-ui-small text-ui-small text-on-surface-variant group-hover:text-primary">
              {isBookmarked ? "Saved" : "Save"}
            </span>
          </button>

          {/* Comments Navigation shortcut */}
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            className="flex flex-col items-center gap-1 group transition-all"
          >
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">
              add_comment
            </span>
            <span className="font-ui-small text-ui-small text-on-surface-variant group-hover:text-primary">
              Respond
            </span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default BlogView;
