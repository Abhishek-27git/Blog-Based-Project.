import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

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
        setBookmarks(bookmarksRes.data.bookmarks);
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
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-secondary animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 border-r border-outline-variant bg-surface-container-low flex flex-col py-8 px-6">
        <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-outline-variant">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-highest border border-outline">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover grayscale" />
            ) : (
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
                account_circle
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-ui-label text-sm font-bold text-on-surface truncate">{user?.name}</p>
            <p className="font-ui-small text-[10px] text-on-surface-variant uppercase tracking-widest">{user?.role} Writer</p>
          </div>
        </div>

        <nav className="space-y-4">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`w-full flex items-center space-x-3 pl-2 py-2 font-ui-label text-ui-label transition-all text-left ${
              activeTab === "workspace"
                ? "text-primary font-bold border-l-2 border-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined">edit_note</span>
            <span>Workspace</span>
          </button>
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`w-full flex items-center space-x-3 pl-2 py-2 font-ui-label text-ui-label transition-all text-left ${
              activeTab === "bookmarks"
                ? "text-primary font-bold border-l-2 border-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined">bookmark</span>
            <span>Bookmarks</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center space-x-3 pl-2 py-2 font-ui-label text-ui-label transition-all text-left ${
              activeTab === "settings"
                ? "text-primary font-bold border-l-2 border-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Profile Settings</span>
          </button>
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 py-10 px-margin-mobile md:px-12">
        
        {activeTab === "workspace" && (
          <div>
            {/* Stats Row */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="border-b border-outline-variant pb-4">
                <p className="font-ui-small text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Total Reads</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="font-display-lg text-headline-md">{totalViews}</h2>
                  {totalViews > 0 && (
                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      trending_up
                    </span>
                  )}
                </div>
              </div>
              <div className="border-b border-outline-variant pb-4">
                <p className="font-ui-small text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Bookmarks</p>
                <h2 className="font-display-lg text-headline-md">{bookmarks.length}</h2>
              </div>
              <div className="border-b border-outline-variant pb-4">
                <p className="font-ui-small text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Published</p>
                <h2 className="font-display-lg text-headline-md">{publishedBlogs.length}</h2>
              </div>
              <div className="border-b border-outline-variant pb-4">
                <p className="font-ui-small text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Drafts</p>
                <h2 className="font-display-lg text-headline-md">{draftBlogs.length}</h2>
              </div>
            </section>

            {/* Header Title */}
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline-md text-headline-md text-on-surface">Current Workspace</h3>
              <Link
                to="/new-manuscript"
                className="bg-primary text-on-primary px-6 py-2 font-ui-label text-xs uppercase tracking-widest flex items-center space-x-2 hover:bg-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>New Manuscript</span>
              </Link>
            </div>

            {/* In Progress / Drafts */}
            <section className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <span className="font-ui-label text-xs text-secondary uppercase tracking-widest font-bold">In Progress</span>
                <div className="flex-grow h-px bg-outline-variant opacity-30"></div>
              </div>
              {draftBlogs.length === 0 ? (
                <p className="font-body-md text-sm text-on-surface-variant italic">No drafts saved.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {draftBlogs.map((blog) => (
                    <div key={blog._id} className="p-6 border border-outline-variant bg-surface-container-low flex flex-col justify-between hover:border-primary transition-all duration-300">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-ui-small text-[10px] px-2 py-0.5 border border-outline-variant text-on-surface-variant uppercase">
                            {blog.category}
                          </span>
                          <button
                            onClick={() => handleDeleteBlog(blog._id)}
                            className="material-symbols-outlined text-on-surface-variant hover:text-error text-xl"
                          >
                            delete
                          </button>
                        </div>
                        <h4 className="font-headline-sm text-lg font-bold mb-2">{blog.title || "[ Untitled Draft ]"}</h4>
                        <p className="font-body-md text-sm text-on-surface-variant line-clamp-2 italic mb-4">
                          {blog.summary || "No summary provided."}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30 mt-4">
                        <span className="font-ui-small text-[10px] text-on-surface-variant">
                          Last edit: {new Date(blog.updatedAt).toLocaleDateString()}
                        </span>
                        <Link
                          to={`/new-manuscript?id=${blog._id}`}
                          className="material-symbols-outlined text-on-surface-variant hover:text-primary text-xl"
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
                <span className="font-ui-label text-xs text-secondary uppercase tracking-widest font-bold">Published Manuscripts</span>
                <div className="flex-grow h-px bg-outline-variant opacity-30"></div>
              </div>
              {publishedBlogs.length === 0 ? (
                <p className="font-body-md text-sm text-on-surface-variant italic">No essays published yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {publishedBlogs.map((blog) => (
                    <div key={blog._id} className="p-6 border border-outline-variant bg-surface-container-low flex flex-col justify-between hover:border-primary transition-all duration-300">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="font-ui-small text-[10px] px-2 py-0.5 border border-outline-variant text-on-surface-variant uppercase">
                            {blog.category}
                          </span>
                          <button
                            onClick={() => handleDeleteBlog(blog._id)}
                            className="material-symbols-outlined text-on-surface-variant hover:text-error text-xl"
                          >
                            delete
                          </button>
                        </div>
                        <Link to={`/post/${blog.slug}`}>
                          <h4 className="font-headline-sm text-lg font-bold mb-2 hover:text-secondary transition-colors">{blog.title}</h4>
                        </Link>
                        <p className="font-body-md text-sm text-on-surface-variant line-clamp-2 italic mb-4">
                          {blog.summary}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30 mt-4">
                        <span className="font-ui-small text-[10px] text-on-surface-variant">
                          Published: {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-on-surface-variant flex items-center gap-0.5 mr-2">
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            {blog.views}
                          </span>
                          <Link
                            to={`/new-manuscript?id=${blog._id}`}
                            className="material-symbols-outlined text-on-surface-variant hover:text-primary text-xl"
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
            <h3 className="font-headline-md text-headline-md text-on-surface mb-8">Saved Manuscripts</h3>
            {bookmarks.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-outline-variant bg-surface-container-low">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
                  bookmark
                </span>
                <p className="font-body-md text-on-surface-variant">No bookmarked essays found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookmarks.map((blog) => (
                  <div key={blog._id} className="p-6 border border-outline-variant bg-surface-container-low flex flex-col justify-between hover:border-primary transition-all duration-300">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-surface-container-high px-2 py-0.5 font-ui-small text-[10px] border border-outline-variant uppercase">
                          {blog.category}
                        </span>
                      </div>
                      <Link to={`/post/${blog.slug}`}>
                        <h4 className="font-headline-sm text-lg font-bold mb-2 hover:text-secondary transition-colors">{blog.title}</h4>
                      </Link>
                      <p className="font-body-md text-sm text-on-surface-variant line-clamp-2 italic mb-4">
                        {blog.summary}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30 mt-4">
                      <span className="font-ui-small text-[10px] text-on-surface-variant">
                        By {blog.author?.name}
                      </span>
                      <Link
                        to={`/post/${blog.slug}`}
                        className="material-symbols-outlined text-on-surface-variant hover:text-primary text-xl"
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
          <div className="max-w-xl">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-8">Profile Details</h3>
            
            {profileSuccessMsg && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm font-ui-label border border-green-200">
                {profileSuccessMsg}
              </div>
            )}

            {profileErrorMsg && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container text-sm font-ui-label border border-error/20">
                {profileErrorMsg}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              
              <div className="flex items-center gap-6 pb-6 border-b border-outline-variant/30">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container-highest border border-outline relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover grayscale" />
                  ) : (
                    <span className="material-symbols-outlined text-[80px] text-on-surface-variant">
                      account_circle
                    </span>
                  )}
                </div>
                <div>
                  <label className="bg-background border border-outline-variant hover:border-primary text-on-surface px-4 py-2 font-ui-label text-xs uppercase tracking-widest cursor-pointer inline-block">
                    Upload Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <p className="font-ui-small text-[10px] text-on-surface-variant mt-2">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-ui-label text-ui-label uppercase tracking-widest text-xs text-on-surface-variant mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-transparent border border-outline-variant focus:border-secondary focus:ring-0 px-4 py-2 text-on-surface font-body-md outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-ui-label text-ui-label uppercase tracking-widest text-xs text-on-surface-variant mb-2">
                  Author Bio
                </label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full bg-transparent border border-outline-variant focus:border-secondary focus:ring-0 px-4 py-2 text-on-surface font-body-md h-32 outline-none"
                  placeholder="Share a short summary of your background, philosophy, or interests..."
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="bg-primary text-on-primary px-6 py-3 font-ui-label text-xs uppercase tracking-widest hover:bg-on-surface-variant disabled:opacity-50 transition-all"
              >
                {updatingProfile ? "Saving..." : "Save Profile Details"}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
};

export default UserDashboard;
