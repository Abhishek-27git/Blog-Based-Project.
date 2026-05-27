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
      <aside className="w-full md:w-64 border-r border-outline-variant/60 bg-white flex flex-col py-10 px-6">
        <div className="flex flex-col items-center space-y-3 mb-10 pb-8 border-b border-outline-variant/30 text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant/60 relative">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover grayscale" />
            ) : (
              <span className="material-symbols-outlined text-[64px] text-on-surface-variant flex items-center justify-center">
                account_circle
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-ui-label text-sm font-bold text-on-surface">{user?.name}</p>
            <p className="font-ui-small text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mt-0.5">
              {user?.role} Account
            </p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-ui-label text-xs uppercase tracking-widest transition-all text-left cursor-pointer border ${
              activeTab === "workspace"
                ? "bg-primary border-primary text-on-primary font-bold shadow-sm"
                : "border-transparent text-on-surface-variant hover:border-outline-variant"
            }`}
          >
            <span className="material-symbols-outlined text-lg">edit_note</span>
            <span>Workspace</span>
          </button>
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-ui-label text-xs uppercase tracking-widest transition-all text-left cursor-pointer border ${
              activeTab === "bookmarks"
                ? "bg-primary border-primary text-on-primary font-bold shadow-sm"
                : "border-transparent text-on-surface-variant hover:border-outline-variant"
            }`}
          >
            <span className="material-symbols-outlined text-lg">bookmark</span>
            <span>Bookmarks</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-ui-label text-xs uppercase tracking-widest transition-all text-left cursor-pointer border ${
              activeTab === "settings"
                ? "bg-primary border-primary text-on-primary font-bold shadow-sm"
                : "border-transparent text-on-surface-variant hover:border-outline-variant"
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
            
            {/* Big Metrics Counters Grid matching Reference Image 4 */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="border-b border-outline-variant/60 pb-6 text-left">
                <span className="font-ui-label text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Total views
                </span>
                <h2 className="font-display-lg text-4xl md:text-5xl font-bold text-on-surface">
                  {totalViews}
                </h2>
              </div>
              <div className="border-b border-outline-variant/60 pb-6 text-left">
                <span className="font-ui-label text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Bookmarks
                </span>
                <h2 className="font-display-lg text-4xl md:text-5xl font-bold text-on-surface">
                  {bookmarks.length}
                </h2>
              </div>
              <div className="border-b border-outline-variant/60 pb-6 text-left">
                <span className="font-ui-label text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Published
                </span>
                <h2 className="font-display-lg text-4xl md:text-5xl font-bold text-on-surface">
                  {publishedBlogs.length}
                </h2>
              </div>
              <div className="border-b border-outline-variant/60 pb-6 text-left">
                <span className="font-ui-label text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Drafts
                </span>
                <h2 className="font-display-lg text-4xl md:text-5xl font-bold text-on-surface">
                  {draftBlogs.length}
                </h2>
              </div>
            </section>

            {/* Header Title with clean buttons */}
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-outline-variant/20">
              <h3 className="font-headline-md text-xl md:text-2xl font-bold text-on-surface">
                Workspace Manuscripts
              </h3>
              <Link
                to="/new-manuscript"
                className="bg-primary border border-primary text-on-primary hover:bg-transparent hover:text-primary px-5 py-2 font-ui-label text-xs uppercase tracking-widest flex items-center space-x-2 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>New Manuscript</span>
              </Link>
            </div>

            {/* In Progress / Drafts */}
            <section className="mb-16">
              <div className="flex items-center space-x-3 mb-6">
                <span className="font-ui-label text-[10px] text-secondary uppercase tracking-widest font-bold">
                  Drafts in Progress
                </span>
                <div className="flex-grow h-px bg-outline-variant/30"></div>
              </div>
              {draftBlogs.length === 0 ? (
                <p className="font-body-md text-xs text-on-surface-variant italic text-left py-2">
                  No drafts saved. Keep writing your next story.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {draftBlogs.map((blog) => (
                    <div key={blog._id} className="p-6 border border-outline-variant/60 bg-white flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-ui-small text-[9px] px-2.5 py-1 border border-outline-variant/60 text-on-surface-variant uppercase tracking-wider font-bold">
                            {blog.category}
                          </span>
                          <button
                            onClick={() => handleDeleteBlog(blog._id)}
                            className="material-symbols-outlined text-on-surface-variant hover:text-error text-lg cursor-pointer transition-colors"
                          >
                            delete
                          </button>
                        </div>
                        <h4 className="font-display-lg text-base font-bold mb-2 text-left group-hover:text-secondary transition-colors">
                          {blog.title || "[ Untitled Draft ]"}
                        </h4>
                        <p className="font-body-md text-xs text-on-surface-variant line-clamp-2 italic mb-4 text-left leading-relaxed">
                          {blog.summary || "No summary abstract provided."}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20 mt-4">
                        <span className="font-ui-small text-[9px] uppercase tracking-wider text-on-surface-variant">
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
                <span className="font-ui-label text-[10px] text-secondary uppercase tracking-widest font-bold">
                  Published Manuscripts
                </span>
                <div className="flex-grow h-px bg-outline-variant/30"></div>
              </div>
              {publishedBlogs.length === 0 ? (
                <p className="font-body-md text-xs text-on-surface-variant italic text-left py-2">
                  No essays published yet. Share your thoughts with the colophon.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {publishedBlogs.map((blog) => (
                    <div key={blog._id} className="p-6 border border-outline-variant/60 bg-white flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-ui-small text-[9px] px-2.5 py-1 border border-outline-variant/60 text-on-surface-variant uppercase tracking-wider font-bold">
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
                          <h4 className="font-display-lg text-base font-bold mb-2 text-left group-hover:text-secondary transition-colors">
                            {blog.title}
                          </h4>
                        </Link>
                        <p className="font-body-md text-xs text-on-surface-variant line-clamp-2 italic mb-4 text-left leading-relaxed">
                          {blog.summary}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20 mt-4">
                        <span className="font-ui-small text-[9px] uppercase tracking-wider text-on-surface-variant">
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
            <h3 className="font-headline-md text-xl md:text-2xl font-bold text-on-surface mb-8 pb-3 border-b border-outline-variant/20 text-left">
              Saved Manuscripts
            </h3>
            {bookmarks.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-outline-variant/60 bg-white flex flex-col justify-center items-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">
                  bookmark
                </span>
                <p className="font-body-md text-xs text-on-surface-variant italic">No bookmarked essays found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookmarks.map((blog) => (
                  <div key={blog._id} className="p-6 border border-outline-variant/60 bg-white flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-surface-container-high px-2.5 py-1 font-ui-small text-[9px] border border-outline-variant/60 uppercase tracking-wider font-bold text-on-surface-variant">
                          {blog.category}
                        </span>
                      </div>
                      <Link to={`/post/${blog.slug}`}>
                        <h4 className="font-display-lg text-base font-bold mb-2 text-left group-hover:text-secondary transition-colors">
                          {blog.title}
                        </h4>
                      </Link>
                      <p className="font-body-md text-xs text-on-surface-variant line-clamp-2 italic mb-4 text-left leading-relaxed">
                        {blog.summary}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20 mt-4">
                      <span className="font-ui-small text-[9px] uppercase tracking-wider text-on-surface-variant">
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
          <div className="max-w-xl text-left bg-white border border-outline-variant/60 p-8 shadow-sm">
            <h3 className="font-headline-md text-lg font-bold text-on-surface mb-8 pb-3 border-b border-outline-variant/20">
              Profile Configuration
            </h3>
            
            {profileSuccessMsg && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 text-xs font-ui-label border border-green-200">
                {profileSuccessMsg}
              </div>
            )}

            {profileErrorMsg && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container text-xs font-ui-label border border-error/20">
                {profileErrorMsg}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              
              <div className="flex items-center gap-6 pb-6 border-b border-outline-variant/20">
                <div className="w-16 h-16 rounded overflow-hidden bg-surface-container-highest border border-outline-variant/60 relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover grayscale" />
                  ) : (
                    <span className="material-symbols-outlined text-[64px] text-on-surface-variant">
                      account_circle
                    </span>
                  )}
                </div>
                <div>
                  <label className="bg-background border border-outline-variant/60 hover:border-primary text-on-surface px-4 py-1.5 font-ui-label text-[10px] uppercase tracking-widest cursor-pointer inline-block transition-all">
                    Upload Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <p className="font-ui-small text-[9px] text-on-surface-variant mt-2 uppercase tracking-wide">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-ui-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-background border border-outline-variant/60 focus:border-primary px-4 py-2.5 text-on-surface font-body-md text-sm outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block font-ui-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">
                  Author Biography
                </label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full bg-background border border-outline-variant/60 focus:border-primary px-4 py-2.5 text-on-surface font-body-md text-sm h-32 outline-none resize-none transition-all"
                  placeholder="Share a short summary of your background, philosophy, or interests..."
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="bg-primary text-on-primary px-6 py-3 font-ui-label text-xs uppercase tracking-widest hover:bg-on-surface-variant disabled:opacity-50 transition-all cursor-pointer w-full text-center"
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
