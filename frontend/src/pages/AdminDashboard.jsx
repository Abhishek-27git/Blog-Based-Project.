import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { DashboardSkeleton } from "../components/Skeleton";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  
  const [activeTab, setActiveTab] = useState("analytics"); // analytics, users
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/admin/analytics");
      if (response.data && response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (err) {
      setErrorMsg("Failed to retrieve system analytics.");
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get("/admin/users", {
        params: {
          search: userSearch,
          role: userRoleFilter,
          page: userPage,
          limit: 8,
        },
      });
      if (response.data && response.data.success) {
        setUsers(response.data.users);
        setUserTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to load users list", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchAnalytics(), fetchUsers()]);
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [userPage, userRoleFilter]);

  const handleUserSearchSubmit = (e) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsers();
  };

  // Toggle user ban status
  const handleToggleBan = async (id, currentStatus) => {
    const confirmationMsg = currentStatus
      ? "Are you sure you want to unban this user account?"
      : "Are you sure you want to ban this user account? They will be immediately disconnected.";
    if (!window.confirm(confirmationMsg)) return;

    try {
      const response = await api.put(`/admin/users/${id}/ban`);
      if (response.data && response.data.success) {
        // Update user state locally
        setUsers((prev) =>
          prev.map((u) => (u._id === id ? { ...u, isBanned: !u.isBanned } : u))
        );
        // Refresh analytics numbers
        fetchAnalytics();
      }
    } catch (err) {
      alert(err.message || "Failed to update ban status.");
    }
  };

  // Delete User and all content (Purge)
  const handleDeleteUser = async (id, name) => {
    const warning = `WARNING: This will permanently delete ${name}'s account and ALL their published essays, comments, bookmarks, and Cloudinary uploads.\n\nThis action CANNOT be undone. Type 'DELETE' to confirm:`;
    const responseText = prompt(warning);
    
    if (responseText !== "DELETE") {
      alert("Account deletion canceled.");
      return;
    }

    try {
      const response = await api.delete(`/admin/users/${id}`);
      if (response.data && response.data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
        alert("User and all associated content have been purged.");
        fetchAnalytics();
      }
    } catch (err) {
      alert(err.message || "Failed to delete user account.");
    }
  };

  // Hide or moderate comment visibility
  const handleToggleHideComment = async (commentId) => {
    try {
      const response = await api.put(`/admin/comments/${commentId}/hide`);
      if (response.data && response.data.success) {
        // Refresh analytics which contains recent comments
        fetchAnalytics();
        alert("Comment visibility toggled successfully.");
      }
    } catch (err) {
      alert("Failed to toggle comment visibility.");
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 border-r border-outline-variant/60 bg-white flex flex-col py-10 px-6">
        <div className="mb-10 pb-6 border-b border-outline-variant/30 text-left">
          <h3 className="font-headline-sm text-lg font-bold text-on-surface">Admin Controls</h3>
          <p className="font-ui-small text-[9px] text-on-surface-variant uppercase tracking-widest mt-1 font-semibold">
            Platform Moderation
          </p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-ui-label text-xs uppercase tracking-widest transition-all text-left cursor-pointer border ${
              activeTab === "analytics"
                ? "bg-primary border-primary text-on-primary font-bold shadow-sm"
                : "border-transparent text-on-surface-variant hover:border-outline-variant"
            }`}
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center space-x-3 px-4 py-3 font-ui-label text-xs uppercase tracking-widest transition-all text-left cursor-pointer border ${
              activeTab === "users"
                ? "bg-primary border-primary text-on-primary font-bold shadow-sm"
                : "border-transparent text-on-surface-variant hover:border-outline-variant"
            }`}
          >
            <span className="material-symbols-outlined text-lg">group</span>
            <span>User Purge & Ban</span>
          </button>
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 py-12 px-6 md:px-12 text-left">
        {errorMsg && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container text-xs font-ui-label border border-error/20">
            {errorMsg}
          </div>
        )}

        {activeTab === "analytics" && analytics && (
          <div>
            
            {/* Big Metrics Stats Grid matching Reference Image 4 */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="border-b border-outline-variant/60 pb-6">
                <span className="font-ui-label text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Total System Users
                </span>
                <div className="flex items-baseline gap-2">
                  <h2 className="font-display-lg text-4xl md:text-5xl font-bold text-on-surface">
                    {analytics.counts.users.total}
                  </h2>
                  <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
                    ({analytics.counts.users.banned} Banned)
                  </span>
                </div>
              </div>
              <div className="border-b border-outline-variant/60 pb-6">
                <span className="font-ui-label text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Total Views Count
                </span>
                <h2 className="font-display-lg text-4xl md:text-5xl font-bold text-on-surface">
                  {analytics.counts.views}
                </h2>
              </div>
              <div className="border-b border-outline-variant/60 pb-6">
                <span className="font-ui-label text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Total Essays Published
                </span>
                <div className="flex items-baseline gap-2">
                  <h2 className="font-display-lg text-4xl md:text-5xl font-bold text-on-surface">
                    {analytics.counts.blogs.published}
                  </h2>
                  <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
                    ({analytics.counts.blogs.drafts} Drafts)
                  </span>
                </div>
              </div>
              <div className="border-b border-outline-variant/60 pb-6">
                <span className="font-ui-label text-[9px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">
                  Total Comments
                </span>
                <h2 className="font-display-lg text-4xl md:text-5xl font-bold text-on-surface">
                  {analytics.counts.comments}
                </h2>
              </div>
            </section>

            <div className="flex justify-between items-center mb-8 pb-3 border-b border-outline-variant/20">
              <h3 className="font-headline-md text-xl md:text-2xl font-bold text-on-surface">
                System Analytics Overview
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              
              {/* Category Breakdown */}
              <div className="border border-outline-variant/60 bg-white p-6 shadow-sm">
                <h4 className="font-ui-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-6 border-b border-outline-variant/20 pb-2">
                  Category Popularity
                </h4>
                <div className="space-y-4">
                  {analytics.categoryBreakdown.length === 0 ? (
                    <p className="text-on-surface-variant text-xs italic">No data yet.</p>
                  ) : (
                    analytics.categoryBreakdown.map((item) => (
                      <div key={item._id} className="flex justify-between items-center text-xs">
                        <span className="font-ui-label text-[10px] uppercase tracking-wider font-semibold w-24 truncate">{item._id || "Uncategorized"}</span>
                        <div className="flex items-center gap-4 flex-1 justify-end">
                          <div className="w-full max-w-44 bg-surface-container border border-outline-variant/40 h-2 relative">
                            <div
                              className="bg-secondary h-full"
                              style={{
                                width: `${(item.count / (analytics.counts.blogs.total || 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="font-bold w-6 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Popular Essays */}
              <div className="border border-outline-variant/60 bg-white p-6 shadow-sm">
                <h4 className="font-ui-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-6 border-b border-outline-variant/20 pb-2">
                  Top 5 Read Manuscripts
                </h4>
                <div className="space-y-4">
                  {analytics.topBlogs.length === 0 ? (
                    <p className="text-on-surface-variant text-xs italic">No data yet.</p>
                  ) : (
                    analytics.topBlogs.map((blog) => (
                      <div key={blog._id} className="flex justify-between items-center text-xs border-b border-outline-variant/20 pb-2">
                        <div className="truncate pr-4 flex-1">
                          <p className="font-bold truncate text-on-surface text-xs">{blog.title}</p>
                          <p className="font-ui-small text-[9px] text-on-surface-variant uppercase tracking-wider">By {blog.author?.name}</p>
                        </div>
                        <div className="flex items-center gap-1 font-ui-small text-[10px] text-on-surface-variant whitespace-nowrap">
                          <span className="material-symbols-outlined text-[13px]">visibility</span>
                          {blog.views}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Signups */}
              <div className="border border-outline-variant/60 bg-white p-6 shadow-sm">
                <h4 className="font-ui-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-6 border-b border-outline-variant/20 pb-2">
                  Recent User Signups
                </h4>
                <div className="space-y-4">
                  {analytics.recentUsers.map((u) => (
                    <div key={u._id} className="flex justify-between items-center text-xs border-b border-outline-variant/20 pb-2">
                      <div>
                        <p className="font-bold text-xs">{u.name}</p>
                        <p className="font-ui-small text-[9px] text-on-surface-variant mt-0.5">{u.email}</p>
                      </div>
                      <span className="font-ui-small text-[9px] uppercase tracking-wider border px-2 py-0.5 border-outline-variant/60 bg-background font-semibold">
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Comment Moderation */}
              <div className="border border-outline-variant/60 bg-white p-6 shadow-sm">
                <h4 className="font-ui-label text-[10px] uppercase tracking-widest text-secondary font-bold mb-6 border-b border-outline-variant/20 pb-2">
                  Recent Comment Feeds
                </h4>
                <div className="space-y-4">
                  {analytics.recentComments.length === 0 ? (
                    <p className="text-on-surface-variant text-xs italic">No comments posted yet.</p>
                  ) : (
                    analytics.recentComments.map((c) => (
                      <div key={c._id} className="text-xs border-b border-outline-variant/20 pb-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold font-ui-label text-[10px] uppercase tracking-wider text-secondary">
                              {c.author?.name || "Anonymous"}
                            </span>
                            <span className="font-ui-small text-[9px] text-on-surface-variant truncate max-w-44">
                              on: {c.blog?.title || "Deleted Essay"}
                            </span>
                          </div>
                          <p className="my-1 font-body-md text-xs italic text-on-surface line-clamp-2">
                            "{c.content}"
                          </p>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => handleToggleHideComment(c._id)}
                            className={`font-ui-small text-[9px] uppercase tracking-wider px-2 py-0.5 border cursor-pointer transition-all ${
                              c.isHidden
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-background text-on-surface-variant border-outline-variant/60 hover:border-primary"
                            }`}
                          >
                            {c.isHidden ? "Hidden (Unhide)" : "Moderate (Hide)"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h3 className="font-headline-md text-xl md:text-2xl font-bold text-on-surface mb-8 pb-3 border-b border-outline-variant/20">
              System User Directory
            </h3>

            {/* Filter and Search Bar */}
            <section className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <form onSubmit={handleUserSearchSubmit} className="w-full sm:w-auto flex border border-outline-variant/60 rounded-full bg-white px-4 py-1.5 shadow-sm">
                <input
                  type="text"
                  placeholder="Search user names/emails..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent text-on-surface font-body-md text-sm border-none focus:outline-none focus:ring-0 outline-none w-full sm:w-60"
                />
                <button type="submit" className="text-on-surface-variant hover:text-primary transition-colors flex items-center cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </button>
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="font-ui-small text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Role:</span>
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-transparent border border-outline-variant/60 focus:border-primary px-3 py-1 text-xs font-ui-label uppercase outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </section>

            {/* Users Table */}
            {loadingUsers ? (
              <div className="flex justify-center items-center py-20">
                <span className="material-symbols-outlined text-4xl text-secondary animate-spin">
                  progress_activity
                </span>
              </div>
            ) : (
              <div className="border border-outline-variant/60 bg-white overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/60 font-ui-label text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container/30">
                      <th className="p-5 font-bold">Writer Profile</th>
                      <th className="p-5 font-bold">Role</th>
                      <th className="p-5 font-bold">Status</th>
                      <th className="p-5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-on-surface-variant font-body-md italic text-xs">
                          No users matched your parameters.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id} className="border-b border-outline-variant/20 text-xs hover:bg-surface-container-low transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded overflow-hidden bg-surface-container-highest border border-outline-variant/60">
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.name} className="w-full h-full object-cover grayscale" />
                                ) : (
                                  <span className="material-symbols-outlined text-lg text-on-surface-variant flex items-center justify-center h-full">
                                    account_circle
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface text-xs">{u.name}</p>
                                <p className="font-ui-small text-[9px] text-on-surface-variant">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 font-ui-label text-[10px] uppercase tracking-wider font-semibold">
                            {u.role}
                          </td>
                          <td className="p-5">
                            <span
                              className={`font-ui-small text-[9px] uppercase border px-2 py-0.5 font-bold ${
                                u.isBanned
                                  ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                                  : "bg-green-50 border-green-200 text-green-700"
                              }`}
                            >
                              {u.isBanned ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            {u.role === "admin" ? (
                              <span className="font-ui-small text-[10px] text-on-surface-variant italic uppercase tracking-wider">Locked System Admin</span>
                            ) : (
                              <div className="flex justify-end gap-3 text-[10px] font-ui-label uppercase tracking-wider font-bold">
                                <button
                                  onClick={() => handleToggleBan(u._id, u.isBanned)}
                                  className={`hover:underline cursor-pointer ${u.isBanned ? "text-green-700" : "text-red-600"}`}
                                >
                                  {u.isBanned ? "Activate" : "Ban"}
                                </button>
                                <span className="text-outline-variant/50">|</span>
                                <button
                                  onClick={() => handleDeleteUser(u._id, u.name)}
                                  className="text-error hover:underline cursor-pointer"
                                >
                                  Purge
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* User Pagination */}
            {userTotalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setUserPage((p) => Math.max(p - 1, 1))}
                  disabled={userPage === 1}
                  className="px-4 py-1.5 border border-outline-variant/60 font-ui-label text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all hover:border-primary cursor-pointer bg-white"
                >
                  Prev
                </button>
                <span className="font-ui-label text-[10px] uppercase tracking-widest">
                  Page {userPage} of {userTotalPages}
                </span>
                <button
                  onClick={() => setUserPage((p) => Math.min(p + 1, userTotalPages))}
                  disabled={userPage === userTotalPages}
                  className="px-4 py-1.5 border border-outline-variant/60 font-ui-label text-[10px] uppercase tracking-widest disabled:opacity-30 transition-all hover:border-primary cursor-pointer bg-white"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
