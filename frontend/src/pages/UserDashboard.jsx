import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { DashboardSkeleton } from "../components/Skeleton";

const UserDashboard = () => {
  const { user, updateUserProfileState } = useAuth();
  const navigate = useNavigate();

  const [myBlogs, setMyBlogs] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit fields
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileBio, setProfileBio] = useState(user?.bio || "");
  const [profileAvatar, setProfileAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState("workspace"); // workspace, bookmarks, settings

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user's own blogs (both published and drafts)
      const blogsRes = await api.get("/blogs/my-blogs");
      if (blogsRes.data && blogsRes.data.success) {
        setMyBlogs(blogsRes.data.blogs);
      }

      // 2. Fetch user's bookmarked blogs
      const bookmarksRes = await api.get("/blogs/bookmarks");
      if (bookmarksRes.data && bookmarksRes.data.success) {
        setBookmarks(bookmarksRes.data.blogs);
      }
    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteBlog = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this manuscript?")) return;
    try {
      const response = await api.delete(`/blogs/${id}`);
      if (response.data && response.data.success) {
        setMyBlogs((prev) => prev.filter((b) => b._id !== id));
      }
    } catch (err) {
      alert("Failed to delete blog post.");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");
    setUpdatingProfile(true);

    const formData = new FormData();
    formData.append("name", profileName);
    formData.append("bio", profileBio);
    if (profileAvatar) {
      formData.append("avatar", profileAvatar);
    }

    try {
      const response = await api.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data && response.data.success) {
        setProfileSuccessMsg("Profile updated successfully!");
        updateUserProfileState(response.data.user);
      }
    } catch (err) {
      setProfileErrorMsg(err.message || "Failed to update profile details.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const publishedBlogs = myBlogs.filter((b) => b.status === "published");
  const draftBlogs = myBlogs.filter((b) => b.status === "draft");

  // Sum of views on published blogs
  const totalViews = publishedBlogs.reduce((sum, b) => sum + (b.views || 0), 0);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 border-r border-outline bg-surface flex flex-col py-10 px-6">
        <div className="flex flex-col items-center space-y-3 mb-10 pb-8 border-b border-outline/30 text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container-highest border border-outline relative">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover grayscale" />
            ) : (
              <span className="material-symbols-outlined text-[64px] text-on-surface-variant flex items-center justify-center">
                account_circle
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-sans text-sm font-bold text-on-surface">{user?.name}</p>
            <p className="font-mono text-[8px] text-primary uppercase tracking-widest font-bold mt-0.5">
              {user?.role} Account
            </p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-sans text-xs uppercase tracking-widest transition-all text-left cursor-pointer border-l-4 ${
              activeTab === "workspace"
                ? "bg-surface-container-high border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-lg">edit_note</span>
            <span>Workspace</span>
          </button>
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-sans text-xs uppercase tracking-widest transition-all text-left cursor-pointer border-l-4 ${
              activeTab === "bookmarks"
                ? "bg-surface-container-high border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-lg">bookmark</span>
            <span>Bookmarks</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-sans text-xs uppercase tracking-widest transition-all text-left cursor-pointer border-l-4 ${
              activeTab === "settings"
                ? "bg-surface-container-high border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            <span>Profile Settings</span>
          </button>
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 py-12 px-6 md:px-12">
        
        {activeTab === "workspace" && (
          <div>
            
            {/* Big Metrics Counters Grid matching Image 5 */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="border border-outline bg-surface rounded-sm p-6 text-left hover:border-primary/45 transition-colors">
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Total views
                </span>
                <h2 className="font-sans text-4xl md:text-5xl font-black text-on-surface">
                  {totalViews}
                </h2>
              </div>
              <div className="border border-outline bg-surface rounded-sm p-6 text-left hover:border-primary/45 transition-colors">
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Bookmarks
                </span>
                <h2 className="font-sans text-4xl md:text-5xl font-black text-on-surface">
                  {bookmarks.length}
                </h2>
              </div>
              <div className="border border-outline bg-surface rounded-sm p-6 text-left hover:border-primary/45 transition-colors">
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Published
                </span>
                <h2 className="font-sans text-4xl md:text-5xl font-black text-on-surface">
                  {publishedBlogs.length}
                </h2>
              </div>
              <div className="border border-outline bg-surface rounded-sm p-6 text-left hover:border-primary/45 transition-colors">
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Drafts
                </span>
                <h2 className="font-sans text-4xl md:text-5xl font-black text-on-surface">
                  {draftBlogs.length}
                </h2>
              </div>
            </section>

            {/* Header Title with clean buttons */}
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-outline/20">
              <h3 className="font-sans text-xl md:text-2xl font-bold text-on-surface">
                Workspace Manuscripts
              </h3>
              <Link
                to="/new-manuscript"
                className="bg-primary border border-primary text-on-primary hover:bg-transparent hover:text-primary px-5 py-2 font-sans text-xs uppercase tracking-widest flex items-center space-x-2 transition-all font-bold rounded-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>New Manuscript</span>
              </Link>
            </div>

            {/* In Progress / Drafts */}
            <section className="mb-16">
              <div className="flex items-center space-x-3 mb-6">
                <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-bold">
                  Drafts in Progress
                </span>
                <div className="flex-grow h-px bg-outline"></div>
              </div>
              {draftBlogs.length === 0 ? (
                <p className="font-sans text-xs text-on-surface-variant italic text-left py-2">
                  No drafts saved. Keep writing your next story.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {draftBlogs.map((blog) => (
                    <div key={blog._id} className="p-6 border border-outline bg-surface flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all duration-300 group rounded-sm">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-mono text-[8px] px-2.5 py-1 border border-outline text-primary uppercase tracking-wider font-bold">
                            {blog.category}
                          </span>
                          <button
                            onClick={() => handleDeleteBlog(blog._id)}
                            className="material-symbols-outlined text-on-surface-variant hover:text-error text-lg cursor-pointer transition-colors"
                          >
                            delete
                          </button>
                        </div>
                        <h4 className="font-sans text-base font-bold mb-2 text-left text-on-surface group-hover:text-primary transition-colors">
                          {blog.title || "[ Untitled Draft ]"}
                        </h4>
                        <p className="font-sans text-xs text-on-surface-variant line-clamp-2 italic mb-4 text-left leading-relaxed">
                          {blog.summary || "No summary abstract provided."}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-outline/20 mt-4">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">
                          Edits: {new Date(blog.updatedAt).toLocaleDateString()}
                        </span>
                        <Link
                          to={`/new-manuscript?id=${blog._id}`}
                          className="material-symbols-outlined text-on-surface-variant hover:text-primary text-lg"
                        >
                          edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Published Essays */}
            <section>
              <div className="flex items-center space-x-3 mb-6">
                <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-bold">
                  Published Manuscripts
                </span>
                <div className="flex-grow h-px bg-outline"></div>
              </div>
              {publishedBlogs.length === 0 ? (
                <p className="font-sans text-xs text-on-surface-variant italic text-left py-2">
                  No essays published yet. Share your thoughts with the colophon.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {publishedBlogs.map((blog) => (
                    <div key={blog._id} className="p-6 border border-outline bg-surface flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all duration-300 group rounded-sm">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-mono text-[8px] px-2.5 py-1 border border-outline text-primary uppercase tracking-wider font-bold">
                            {blog.category}
                          </span>
                          <button
                            onClick={() => handleDeleteBlog(blog._id)}
                            className="material-symbols-outlined text-on-surface-variant hover:text-error text-lg cursor-pointer transition-colors"
                          >
                            delete
                          </button>
                        </div>
                        <Link to={`/post/${blog.slug}`}>
                          <h4 className="font-sans text-base font-bold mb-2 text-left text-on-surface group-hover:text-primary transition-colors">
                            {blog.title}
                          </h4>
                        </Link>
                        <p className="font-sans text-xs text-on-surface-variant line-clamp-2 italic mb-4 text-left leading-relaxed">
                          {blog.summary}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-outline/20 mt-4">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">
                          Published: {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5 mr-2">
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                            {blog.views}
                          </span>
                          <Link
                            to={`/new-manuscript?id=${blog._id}`}
                            className="material-symbols-outlined text-on-surface-variant hover:text-primary text-lg"
                          >
                            edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "bookmarks" && (
          <div>
            <h3 className="font-sans text-xl md:text-2xl font-bold text-on-surface mb-8 pb-3 border-b border-outline/20 text-left">
              Saved Manuscripts
            </h3>
            {bookmarks.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-outline bg-surface flex flex-col justify-center items-center rounded-sm">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">
                  bookmark
                </span>
                <p className="font-sans text-xs text-on-surface-variant italic">No bookmarked essays found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookmarks.map((blog) => (
                  <div key={blog._id} className="p-6 border border-outline bg-surface flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all duration-300 group rounded-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-surface-container-high px-2.5 py-1 font-mono text-[8px] border border-outline uppercase tracking-wider font-bold text-primary">
                          {blog.category}
                        </span>
                      </div>
                      <Link to={`/post/${blog.slug}`}>
                        <h4 className="font-sans text-base font-bold mb-2 text-left text-on-surface group-hover:text-primary transition-colors">
                          {blog.title}
                        </h4>
                      </Link>
                      <p className="font-sans text-xs text-on-surface-variant line-clamp-2 italic mb-4 text-left leading-relaxed">
                        {blog.summary}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-outline/20 mt-4">
                      <span className="font-sans text-[10px] text-on-surface-variant font-semibold">
                        By {blog.author?.name}
                      </span>
                      <Link
                        to={`/post/${blog.slug}`}
                        className="material-symbols-outlined text-on-surface-variant hover:text-primary text-lg"
                      >
                        arrow_forward
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-xl text-left bg-surface border border-outline p-8 shadow-sm rounded-sm">
            <h3 className="font-sans text-lg font-bold text-on-surface mb-8 pb-3 border-b border-outline/20">
              Profile Configuration
            </h3>
            
            {profileSuccessMsg && (
              <div className="mb-6 p-4 bg-green-950/30 text-green-400 text-xs font-sans border border-green-800 rounded-sm">
                {profileSuccessMsg}
              </div>
            )}

            {profileErrorMsg && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container text-xs font-sans border border-error/20 rounded-sm">
                {profileErrorMsg}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              
              <div className="flex items-center gap-6 pb-6 border-b border-outline/20">
                <div className="w-16 h-16 rounded overflow-hidden bg-surface-container-highest border border-outline relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover grayscale" />
                  ) : (
                    <span className="material-symbols-outlined text-[64px] text-on-surface-variant">
                      account_circle
                    </span>
                  )}
                </div>
                <div>
                  <label className="bg-surface border border-outline hover:border-primary text-on-surface px-4 py-1.5 font-sans text-[10px] uppercase tracking-widest cursor-pointer inline-block transition-all font-bold rounded-sm">
                    Upload Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <p className="font-mono text-[9px] text-on-surface-variant mt-2 uppercase tracking-wide">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-white text-zinc-900 rounded-md px-3 py-2 text-xs font-sans outline-none transition-all border border-outline focus:border-primary placeholder:text-zinc-400"
                  required
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">
                  Author Biography
                </label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full bg-white text-zinc-900 rounded-md px-3 py-2 text-xs font-sans outline-none transition-all border border-outline focus:border-primary h-32 resize-none placeholder:text-zinc-400"
                  placeholder="Share a short summary of your background, philosophy, or interests..."
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="bg-primary text-on-primary px-6 py-3 font-sans text-xs uppercase tracking-widest hover:bg-secondary disabled:opacity-50 transition-all cursor-pointer w-full text-center font-bold rounded-sm"
              >
                {updatingProfile ? "Saving..." : "Save Details"}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
};

export default UserDashboard;
