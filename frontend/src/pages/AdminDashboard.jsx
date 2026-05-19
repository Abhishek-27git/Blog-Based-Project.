import React, { useState, useEffect } from "react";
import api from "../utils/api";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  
  const [activeTab, setActiveTab] = useState("analytics"); // analytics, users, comments
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

  // Delete User and all content (GDPR clean sweep)
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
        <div className="mb-8 pb-6 border-b border-outline-variant">
          <h3 className="font-headline-sm text-lg font-bold text-on-surface">Admin Controls</h3>
          <p className="font-ui-small text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Platform Moderation</p>
        </div>

        <nav className="space-y-4">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center space-x-3 pl-2 py-2 font-ui-label text-ui-label transition-all text-left ${
              activeTab === "analytics"
                ? "text-primary font-bold border-l-2 border-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined">analytics</span>
            <span>Analytics Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center space-x-3 pl-2 py-2 font-ui-label text-ui-label transition-all text-left ${
              activeTab === "users"
                ? "text-primary font-bold border-l-2 border-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined">group</span>
            <span>User Management</span>
          </button>
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 py-10 px-margin-mobile md:px-12">
        {errorMsg && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container text-sm font-ui-label border border-error/20">
            {errorMsg}
          </div>
        )}

        {activeTab === "analytics" && analytics && (
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-8">System Analytics Overview</h3>

            {/* Quick Stats Grid */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="border-b border-outline-variant pb-4">
                <p className="font-ui-small text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Total Users</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="font-display-lg text-headline-md">{analytics.counts.users.total}</h2>
                  <span className="text-[10px] text-on-surface-variant">({analytics.counts.users.banned} Banned)</span>
                </div>
              </div>
              <div className="border-b border-outline-variant pb-4">
                <p className="font-ui-small text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Total Views</p>
                <h2 className="font-display-lg text-headline-md">{analytics.counts.views}</h2>
              </div>
              <div className="border-b border-outline-variant pb-4">
                <p className="font-ui-small text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Total Essays</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="font-display-lg text-headline-md">{analytics.counts.blogs.total}</h2>
                  <span className="text-[10px] text-on-surface-variant">({analytics.counts.blogs.published} Pub)</span>
                </div>
              </div>
              <div className="border-b border-outline-variant pb-4">
                <p className="font-ui-small text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Comments</p>
                <h2 className="font-display-lg text-headline-md">{analytics.counts.comments}</h2>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
              
              {/* Category Breakdown */}
              <div className="border border-outline-variant bg-surface-container-low p-6">
                <h4 className="font-headline-sm text-base mb-6 border-b border-outline-variant pb-2">Category Popularity</h4>
                <div className="space-y-4">
                  {analytics.categoryBreakdown.length === 0 ? (
                    <p className="text-on-surface-variant text-sm italic">No data yet.</p>
                  ) : (
                    analytics.categoryBreakdown.map((item) => (
                      <div key={item._id} className="flex justify-between items-center text-sm">
                        <span className="font-ui-label text-xs uppercase tracking-wider">{item._id || "Uncategorized"}</span>
                        <div className="flex items-center gap-4 flex-1 justify-end">
                          <div className="w-24 bg-surface-container border border-outline-variant h-2 relative">
                            <div
                              className="bg-secondary h-full"
                              style={{
                                width: `${(item.count / analytics.counts.blogs.total) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="font-bold w-6 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Popular Essays */}
              <div className="border border-outline-variant bg-surface-container-low p-6">
                <h4 className="font-headline-sm text-base mb-6 border-b border-outline-variant pb-2">Top 5 Read Manuscripts</h4>
                <div className="space-y-4">
                  {analytics.topBlogs.length === 0 ? (
                    <p className="text-on-surface-variant text-sm italic">No data yet.</p>
                  ) : (
                    analytics.topBlogs.map((blog) => (
                      <div key={blog._id} className="flex justify-between items-center text-sm border-b border-outline-variant/30 pb-2">
                        <div className="truncate pr-4">
                          <p className="font-bold truncate text-on-surface">{blog.title}</p>
                          <p className="font-ui-small text-[10px] text-on-surface-variant uppercase">By {blog.author?.name}</p>
                        </div>
                        <div className="flex items-center gap-1 font-ui-small text-xs text-on-surface-variant whitespace-nowrap">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          {blog.views}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Signups */}
              <div className="border border-outline-variant bg-surface-container-low p-6">
                <h4 className="font-headline-sm text-base mb-6 border-b border-outline-variant pb-2">Recent User Signups</h4>
                <div className="space-y-4">
                  {analytics.recentUsers.map((u) => (
                    <div key={u._id} className="flex justify-between items-center text-sm border-b border-outline-variant/30 pb-2">
                      <div>
                        <p className="font-bold">{u.name}</p>
                        <p className="font-ui-small text-[10px] text-on-surface-variant">{u.email}</p>
                      </div>
                      <span className="font-ui-small text-[10px] uppercase border px-2 py-0.5 border-outline-variant bg-background">
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Comment Moderation */}
              <div className="border border-outline-variant bg-surface-container-low p-6">
                <h4 className="font-headline-sm text-base mb-6 border-b border-outline-variant pb-2">Recent Comment Feeds</h4>
                <div className="space-y-4">
                  {analytics.recentComments.length === 0 ? (
                    <p className="text-on-surface-variant text-sm italic">No comments posted yet.</p>
                  ) : (
                    analytics.recentComments.map((c) => (
                      <div key={c._id} className="text-sm border-b border-outline-variant/30 pb-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold font-ui-label text-xs uppercase tracking-wider text-secondary">
                              {c.author?.name || "Anonymous"}
                            </span>
                            <span className="font-ui-small text-[10px] text-on-surface-variant">
                              on {c.blog?.title || "Deleted Essay"}
                            </span>
                          </div>
                          <p className="my-1 font-body-md text-xs italic text-on-surface line-clamp-2">
                            "{c.content}"
                          </p>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => handleToggleHideComment(c._id)}
                            className={`font-ui-small text-[10px] px-2 py-0.5 border transition-all ${
                              c.isHidden
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-background text-on-surface-variant border-outline-variant hover:border-primary"
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
            <h3 className="font-headline-md text-headline-md text-on-surface mb-8">System User Management</h3>

            {/* Filter and Search Bar */}
            <section className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <form onSubmit={handleUserSearchSubmit} className="w-full sm:w-auto flex border border-outline-variant bg-surface-container-low">
                <input
                  type="text"
                  placeholder="Search user names/emails..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="px-4 py-2 bg-transparent text-on-surface font-body-md border-none focus:outline-none focus:ring-0 outline-none w-full sm:w-64"
                />
                <button type="submit" className="px-4 text-on-surface-variant hover:text-primary transition-colors flex items-center">
                  <span className="material-symbols-outlined">search</span>
                </button>
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="font-ui-small text-[10px] uppercase text-on-surface-variant tracking-wider">Role filter:</span>
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-transparent border border-outline-variant focus:border-secondary focus:ring-0 px-3 py-1 text-xs font-ui-label uppercase outline-none"
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
              <div className="border border-outline-variant bg-surface-container-low overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant font-ui-label text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container">
                      <th className="p-4 font-bold">Writer Profile</th>
                      <th className="p-4 font-bold">Role</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-on-surface-variant font-body-md italic">
                          No users matched your parameters.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id} className="border-b border-outline-variant/30 text-sm hover:bg-surface-container-high transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest border border-outline">
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.name} className="w-full h-full object-cover grayscale" />
                                ) : (
                                  <span className="material-symbols-outlined text-xl text-on-surface-variant flex items-center justify-center h-full">
                                    account_circle
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface">{u.name}</p>
                                <p className="font-ui-small text-[10px] text-on-surface-variant">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-ui-label text-xs uppercase tracking-wider">
                            {u.role}
                          </td>
                          <td className="p-4">
                            <span
                              className={`font-ui-small text-[10px] uppercase border px-2 py-0.5 ${
                                u.isBanned
                                  ? "bg-red-50 border-red-200 text-red-600 font-bold animate-pulse"
                                  : "bg-green-50 border-green-200 text-green-700"
                              }`}
                            >
                              {u.isBanned ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {u.role === "admin" ? (
                              <span className="font-ui-small text-[10px] text-on-surface-variant italic">Locked System admin</span>
                            ) : (
                              <div className="flex justify-end gap-3 text-xs font-ui-label uppercase tracking-wider">
                                <button
                                  onClick={() => handleToggleBan(u._id, u.isBanned)}
                                  className={`hover:underline ${u.isBanned ? "text-green-700" : "text-red-600"}`}
                                >
                                  {u.isBanned ? "Activate" : "Ban"}
                                </button>
                                <span className="text-outline-variant">|</span>
                                <button
                                  onClick={() => handleDeleteUser(u._id, u.name)}
                                  className="text-error hover:underline"
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
                  className="px-3 py-1.5 border border-outline-variant font-ui-label text-xs uppercase tracking-widest disabled:opacity-30 transition-all hover:border-primary"
                >
                  Prev
                </button>
                <span className="font-ui-label text-xs uppercase">
                  Page {userPage} of {userTotalPages}
                </span>
                <button
                  onClick={() => setUserPage((p) => Math.min(p + 1, userTotalPages))}
                  disabled={userPage === userTotalPages}
                  className="px-3 py-1.5 border border-outline-variant font-ui-label text-xs uppercase tracking-widest disabled:opacity-30 transition-all hover:border-primary"
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
