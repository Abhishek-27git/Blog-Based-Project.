import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { BlogDetailSkeleton } from "../components/Skeleton";
import { marked } from "marked";

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

  // Reading Customization States
  const [showSettings, setShowSettings] = useState(false);
  const [readerFont, setReaderFont] = useState("sans"); // sans, serif
  const [readerSize, setReaderSize] = useState("md"); // sm, md, lg, xl
  const [readerHeight, setReaderHeight] = useState("normal"); // tight, normal, relaxed
  const [readerTheme, setReaderTheme] = useState("default"); // default, sepia, high-contrast

  // Speech TTS States
  const [speechState, setSpeechState] = useState("stopped"); // playing, paused, stopped
  const [speechRate, setSpeechRate] = useState(1);
  const [synth, setSynth] = useState(window.speechSynthesis);
  const [utterance, setUtterance] = useState(null);

  // Follow States
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Collections States
  const [myCollections, setMyCollections] = useState([]);
  const [showCollectionsList, setShowCollectionsList] = useState(false);
  const [showShareDrawer, setShowShareDrawer] = useState(false);

  const fetchMyCollections = async (userId) => {
    try {
      const response = await api.get(`/collections?creator=${userId}`);
      if (response.data && response.data.success) {
        setMyCollections(response.data.collections);
      }
    } catch (err) {
      console.error("Failed to load user collections", err);
    }
  };

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

          // Fetch follow info and user collections
          if (blogData.author) {
            try {
              const profileRes = await api.get(`/users/profile/${blogData.author._id}`);
              if (profileRes.data && profileRes.data.success) {
                setIsFollowing(profileRes.data.profile.followers.includes(user._id));
                setFollowersCount(profileRes.data.profile.followers.length);
              }
            } catch (e) {
              console.error("Failed to load user follow status", e);
            }
          }

          await fetchMyCollections(user._id);
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

  // Handle Follow
  const handleFollow = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const response = await api.put(`/users/${blog.author._id}/follow`);
      if (response.data && response.data.success) {
        setIsFollowing(response.data.isFollowing);
        setFollowersCount((prev) => (response.data.isFollowing ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    }
  };

  // Handle Collection Adding
  const handleAddBlogToCollection = async (collectionId) => {
    try {
      const response = await api.put(`/collections/${collectionId}/add`, { blogId: blog._id });
      if (response.data && response.data.success) {
        alert(response.data.message);
        if (user) await fetchMyCollections(user._id);
        setShowCollectionsList(false);
      }
    } catch (err) {
      alert("Failed to add manuscript to collection.");
    }
  };

  const handleCreateAndAddCollection = async () => {
    const name = prompt("Enter new collection name:");
    if (!name || !name.trim()) return;

    try {
      const response = await api.post("/collections", { name: name.trim() });
      if (response.data && response.data.success) {
        const newCol = response.data.collection;
        await handleAddBlogToCollection(newCol._id);
      }
    } catch (err) {
      alert("Failed to create collection.");
    }
  };

  // TTS Speech Control Functions
  const startSpeech = () => {
    if (!synth) return;
    if (speechState === "paused") {
      synth.resume();
      setSpeechState("playing");
      return;
    }

    synth.cancel();

    // Strip HTML tags for clean utterance text
    const parsedHtml = marked.parse(blog.content || "");
    const doc = new DOMParser().parseFromString(parsedHtml, "text/html");
    const plainText = doc.body.textContent || "";
    const speechText = `${blog.title}. Written by ${blog.author?.name || "Anonymous"}. ${plainText}`;

    const newUtterance = new SpeechSynthesisUtterance(speechText);
    newUtterance.rate = speechRate;
    newUtterance.onend = () => setSpeechState("stopped");
    newUtterance.onerror = () => setSpeechState("stopped");

    setUtterance(newUtterance);
    synth.speak(newUtterance);
    setSpeechState("playing");
  };

  const pauseSpeech = () => {
    if (synth && speechState === "playing") {
      synth.pause();
      setSpeechState("paused");
    }
  };

  const stopSpeech = () => {
    if (synth) {
      synth.cancel();
      setSpeechState("stopped");
    }
  };

  // Update speech speed dynamically
  useEffect(() => {
    if (utterance) {
      utterance.rate = speechRate;
      if (speechState === "playing") {
        synth.cancel();
        synth.speak(utterance);
      }
    }
  }, [speechRate]);

  // Cancel any active SpeechSynthesis when leaving page
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Class definitions for reading settings
  const getReaderClasses = () => {
    let classes = "essay-content select-text leading-relaxed ";
    if (readerFont === "serif") classes += "font-serif ";
    else classes += "font-sans ";

    if (readerSize === "sm") classes += "text-sm ";
    else if (readerSize === "md") classes += "text-base md:text-lg ";
    else if (readerSize === "lg") classes += "text-lg md:text-xl ";
    else if (readerSize === "xl") classes += "text-xl md:text-2xl ";

    if (readerHeight === "tight") classes += "leading-snug ";
    else if (readerHeight === "normal") classes += "leading-relaxed ";
    else if (readerHeight === "relaxed") classes += "leading-loose ";

    return classes;
  };

  const getPaperThemeClasses = () => {
    let classes = "border shadow-md p-8 md:p-16 text-left relative rounded-sm transition-all duration-300 ";
    if (readerTheme === "sepia") {
      classes += "bg-[#f4ecd8] border-[#dfd4b7] text-[#5b4636] ";
    } else if (readerTheme === "high-contrast") {
      classes += "bg-white border-zinc-300 text-black ";
    } else {
      classes += "bg-surface border-outline text-on-surface ";
    }
    return classes;
  };

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
      <article className={getPaperThemeClasses()}>
        {/* Settings button inside article top-right */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-surface-container-low hover:bg-surface-container border border-outline rounded-full text-on-surface-variant hover:text-primary transition-all cursor-pointer flex items-center justify-center"
            title="Reading Settings"
          >
            <span className="material-symbols-outlined text-lg leading-none">settings</span>
          </button>
        </div>

        {/* Audio Narrator Widget */}
        <div className="mb-6 bg-surface-container-low border border-outline p-3 rounded-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">volume_up</span>
            <span className="font-sans text-xs font-bold text-on-surface">Audio Narration</span>
            {speechState === "playing" && (
              <span className="font-mono text-[9px] text-green-600 uppercase tracking-wider animate-pulse">
                [ Playing ]
              </span>
            )}
            {speechState === "paused" && (
              <span className="font-mono text-[9px] text-amber-500 uppercase tracking-wider">
                [ Paused ]
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Controls */}
            <div className="flex items-center gap-2">
              {speechState !== "playing" ? (
                <button
                  onClick={startSpeech}
                  className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  title="Play"
                >
                  <span className="material-symbols-outlined text-lg leading-none">play_arrow</span>
                </button>
              ) : (
                <button
                  onClick={pauseSpeech}
                  className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  title="Pause"
                >
                  <span className="material-symbols-outlined text-lg leading-none">pause</span>
                </button>
              )}
              <button
                onClick={stopSpeech}
                disabled={speechState === "stopped"}
                className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer disabled:opacity-30"
                title="Stop"
              >
                <span className="material-symbols-outlined text-lg leading-none">stop</span>
              </button>
            </div>
            
            <span className="h-4 w-px bg-outline" />

            {/* Speed Selector */}
            <div className="flex items-center gap-1.5 font-mono text-[9px]">
              <span className="uppercase text-on-surface-variant/70">Speed:</span>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="bg-surface border border-outline/50 rounded px-1.5 py-0.5 outline-none focus:border-primary text-[9px] font-bold text-on-surface"
              >
                <option value={0.75}>0.75x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>
            </div>
          </div>
        </div>

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
              <div className="flex items-center gap-2">
                <p className="font-sans text-xs font-bold text-on-surface">
                  {blog.author ? (
                    <Link to={`/writer/${blog.author._id}`} className="hover:text-primary hover:underline transition-colors">
                      {blog.author.name}
                    </Link>
                  ) : (
                    "Anonymous"
                  )}
                </p>
                {blog.author && user && user._id !== blog.author._id && (
                  <button
                    onClick={handleFollow}
                    className={`px-2 py-0.5 border text-[9px] font-sans uppercase tracking-wider font-bold transition-all rounded-sm cursor-pointer ${
                      isFollowing
                        ? "border-primary/50 text-primary/80 bg-primary/5 hover:bg-primary/10"
                        : "border-primary bg-primary text-on-primary hover:bg-primary/90"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
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
          className={getReaderClasses()}
          dangerouslySetInnerHTML={{ __html: marked.parse(blog.content || "") }}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h4 className="font-sans text-sm font-bold text-on-surface">
                  About the Writer:{" "}
                  {blog.author ? (
                    <Link to={`/writer/${blog.author._id}`} className="text-primary hover:underline transition-colors">
                      {blog.author.name}
                    </Link>
                  ) : (
                    "Anonymous"
                  )}
                </h4>
                {blog.author && user && user._id !== blog.author._id && (
                  <button
                    onClick={handleFollow}
                    className={`self-center sm:self-auto px-3 py-1 border text-[9px] font-sans uppercase tracking-widest font-bold transition-all rounded-sm cursor-pointer ${
                      isFollowing
                        ? "border-primary/50 text-primary/80 bg-primary/5 hover:bg-primary/10"
                        : "border-primary bg-primary text-on-primary hover:bg-primary/90"
                    }`}
                  >
                    {isFollowing ? "Following" : `Follow (${followersCount})`}
                  </button>
                )}
              </div>
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

        {/* Add to Collection Button */}
        <button
          onClick={() => {
            if (!user) {
              navigate("/login");
              return;
            }
            setShowCollectionsList(!showCollectionsList);
            setShowShareDrawer(false);
          }}
          className="flex items-center gap-1.5 group cursor-pointer relative"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary">
            folder_add
          </span>
          <span className="font-mono text-[9px] text-on-surface-variant group-hover:text-primary font-bold">
            Collect
          </span>
          
          {/* Collections List Popover */}
          {showCollectionsList && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 mb-2 w-56 bg-surface border border-outline rounded-sm p-3 shadow-xl z-50 text-left">
              <div className="flex items-center justify-between mb-2 border-b border-outline/30 pb-1.5">
                <h5 className="font-sans text-[9px] font-bold text-on-surface uppercase tracking-wider">Save to Collection</h5>
                <button onClick={(e) => { e.stopPropagation(); setShowCollectionsList(false); }} className="text-on-surface-variant hover:text-primary cursor-pointer">
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
              
              <div className="max-h-36 overflow-y-auto space-y-1 py-1">
                {myCollections.map((col) => {
                  const isAlreadyIn = col.blogs.includes(blog._id);
                  return (
                    <button
                      key={col._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAlreadyIn) {
                          alert("Manuscript is already in this collection.");
                        } else {
                          handleAddBlogToCollection(col._id);
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 text-[10px] font-sans text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-sm flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="truncate">{col.name}</span>
                      {isAlreadyIn && (
                        <span className="material-symbols-outlined text-[10px] text-green-600">check</span>
                      )}
                    </button>
                  );
                })}
                {myCollections.length === 0 && (
                  <p className="text-[9px] text-on-surface-variant/60 italic p-1.5 text-center">No collections found.</p>
                )}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateAndAddCollection();
                }}
                className="w-full mt-2 pt-2 border-t border-outline/30 text-center font-mono text-[9px] text-primary hover:underline uppercase tracking-wider font-bold block cursor-pointer"
              >
                + New Collection
              </button>
            </div>
          )}
        </button>

        <span className="h-4 w-px bg-outline" />

        {/* Share Button */}
        <button
          onClick={() => {
            setShowShareDrawer(!showShareDrawer);
            setShowCollectionsList(false);
          }}
          className="flex items-center gap-1.5 group cursor-pointer relative"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary">
            share
          </span>
          <span className="font-mono text-[9px] text-on-surface-variant group-hover:text-primary font-bold">
            Share
          </span>

          {/* Share Drawer Popover */}
          {showShareDrawer && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 mb-2 w-56 bg-surface border border-outline rounded-sm p-3 shadow-xl z-50 text-left">
              <div className="flex items-center justify-between mb-2 border-b border-outline/30 pb-1.5">
                <h5 className="font-sans text-[9px] font-bold text-on-surface uppercase tracking-wider">Share Manuscript</h5>
                <button onClick={(e) => { e.stopPropagation(); setShowShareDrawer(false); }} className="text-on-surface-variant hover:text-primary cursor-pointer">
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>

              <div className="space-y-1.5 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                    setShowShareDrawer(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-[10px] font-sans text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-sm flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  <span>Copy Link</span>
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Reading "${blog.title}" on The Manuscripts`)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowShareDrawer(false)}
                  className="w-full text-left px-2 py-1.5 text-[10px] font-sans text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-sm flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">ios_share</span>
                  <span>Share on Twitter / X</span>
                </a>
                <a
                  href={`https://www.reddit.com/submit?title=${encodeURIComponent(`Reading "${blog.title}" on The Manuscripts`)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowShareDrawer(false)}
                  className="w-full text-left px-2 py-1.5 text-[10px] font-sans text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-sm flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">forum</span>
                  <span>Share on Reddit</span>
                </a>
              </div>
            </div>
          )}
        </button>

        <span className="h-4 w-px bg-outline" />

        {/* Reading Settings shortcut */}
        <button
          onClick={() => {
            setShowSettings(!showSettings);
            setShowCollectionsList(false);
            setShowShareDrawer(false);
          }}
          className="flex items-center gap-1.5 group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary">
            settings
          </span>
          <span className="font-mono text-[9px] text-on-surface-variant group-hover:text-primary font-bold">
            Settings
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

      {/* Settings slide-over drawer */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setShowSettings(false)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-outline shadow-2xl z-50 p-6 flex flex-col justify-between animate-slide-in text-left">
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-outline/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">tune</span>
                  <h3 className="font-sans text-sm font-bold text-on-surface uppercase tracking-wider">Reading Settings</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Font Choice */}
              <div className="mb-6">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2.5 font-bold">Font Family</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReaderFont("sans")}
                    className={`py-2 px-3 border text-xs font-sans rounded-sm cursor-pointer transition-all ${
                      readerFont === "sans" ? "border-primary bg-primary/10 text-primary font-bold" : "border-outline text-on-surface-variant hover:border-primary/50"
                    }`}
                  >
                    Sans-Serif
                  </button>
                  <button
                    onClick={() => setReaderFont("serif")}
                    className={`py-2 px-3 border text-xs font-serif rounded-sm cursor-pointer transition-all ${
                      readerFont === "serif" ? "border-primary bg-primary/10 text-primary font-bold" : "border-outline text-on-surface-variant hover:border-primary/50"
                    }`}
                  >
                    Serif
                  </button>
                </div>
              </div>

              {/* Sizing Choice */}
              <div className="mb-6">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2.5 font-bold">Text Scale</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["sm", "md", "lg", "xl"].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setReaderSize(sz)}
                      className={`py-2 border text-[10px] font-mono rounded-sm cursor-pointer uppercase transition-all ${
                        readerSize === sz ? "border-primary bg-primary/10 text-primary font-bold" : "border-outline text-on-surface-variant hover:border-primary/50"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height Choice */}
              <div className="mb-6">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2.5 font-bold">Line Spacing</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["tight", "normal", "relaxed"].map((lh) => (
                    <button
                      key={lh}
                      onClick={() => setReaderHeight(lh)}
                      className={`py-2 border text-[10px] font-mono rounded-sm cursor-pointer uppercase transition-all ${
                        readerHeight === lh ? "border-primary bg-primary/10 text-primary font-bold" : "border-outline text-on-surface-variant hover:border-primary/50"
                      }`}
                    >
                      {lh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paper Theme */}
              <div className="mb-6">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2.5 font-bold">Paper Palette</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setReaderTheme("default")}
                    className={`py-2 border text-[10px] font-sans rounded-sm cursor-pointer transition-all ${
                      readerTheme === "default" ? "border-primary bg-primary/10 text-primary font-bold" : "border-outline text-on-surface-variant hover:border-primary/50"
                    }`}
                  >
                    Warm Cream
                  </button>
                  <button
                    onClick={() => setReaderTheme("sepia")}
                    className={`py-2 border text-[10px] font-sans rounded-sm cursor-pointer transition-all ${
                      readerTheme === "sepia" ? "border-primary bg-primary/10 text-primary font-bold" : "border-outline text-on-surface-variant hover:border-primary/50"
                    }`}
                  >
                    Sepia
                  </button>
                  <button
                    onClick={() => setReaderTheme("high-contrast")}
                    className={`py-2 border text-[10px] font-sans rounded-sm cursor-pointer transition-all ${
                      readerTheme === "high-contrast" ? "border-primary bg-primary/10 text-primary font-bold" : "border-outline text-on-surface-variant hover:border-primary/50"
                    }`}
                  >
                    Contrast
                  </button>
                </div>
              </div>
            </div>
            
            <div className="border-t border-outline/30 pt-4 text-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant/60">
                The Manuscripts Typography System
              </span>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default BlogView;
