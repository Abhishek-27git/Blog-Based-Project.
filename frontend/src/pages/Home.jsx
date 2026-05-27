import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { BlogCardSkeleton } from "../components/Skeleton";

const Home = () => {
  if (new URLSearchParams(window.location.search).get("trigger_error") === "true") {
    throw new Error("Simulated rendering crash for verification of React Error Boundary.");
  }

  const [blogs, setBlogs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Categories list matching backend Schema options
  const categories = [
    "Philosophy",
    "Literature",
    "Technology",
    "Art & Design",
    "Culture",
    "Science",
    "Memoir",
    "Political Theory",
  ];

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/blogs", {
        params: {
          search,
          category,
          page,
          limit: 9, // Fit 3x3 grid perfectly if pages fill up
        },
      });
      if (response.data && response.data.success) {
        setBlogs(response.data.blogs);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Error loading essays:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset page to 1 on category changes
    setPage(1);
  }, [category]);

  useEffect(() => {
    fetchBlogs();
  }, [page, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBlogs();
  };

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-32">
      {/* Premium Editorial Header */}
      <header className="mb-16 border-b border-outline-variant/30 pb-10 text-left">
        <span className="font-ui-small text-[10px] text-secondary uppercase tracking-widest block mb-3 font-bold">
          Platform Manifesto
        </span>
        <h2 className="font-display-lg text-display-lg-mobile md:text-5xl font-bold mb-4 leading-tight text-on-surface">
          The Architecture of Silence
        </h2>
        <p className="font-body-md text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
          A distraction-free sanctuary for slow contemplation, literary design, and academic essays. In an age of relentless digital assault, we provide margins for ideas to breathe.
        </p>
      </header>

      {/* Modern Filter and Search Row */}
      <section className="mb-12 flex flex-col lg:flex-row gap-6 items-center justify-between pb-6 border-b border-outline-variant/20">
        
        {/* Category Pills Navigation Row */}
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-1.5 rounded-full font-ui-label text-xs tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
              category === ""
                ? "bg-primary border-primary text-on-primary font-bold shadow-sm"
                : "border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary bg-background"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full font-ui-label text-xs tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                category === cat
                  ? "bg-primary border-primary text-on-primary font-bold shadow-sm"
                  : "border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary bg-background"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Clean Pill Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-auto flex border border-outline-variant/60 rounded-full bg-white px-4 py-1.5 shadow-sm">
          <input
            type="text"
            placeholder="Search essays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-on-surface font-body-md text-sm border-none focus:outline-none focus:ring-0 outline-none w-full lg:w-60"
          />
          <button type="submit" className="text-on-surface-variant hover:text-primary transition-colors flex items-center cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        </form>
      </section>

      {/* Loading States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-outline-variant/50">
          <div className="border-r border-b border-outline-variant/50 p-8"><BlogCardSkeleton /></div>
          <div className="border-r border-b border-outline-variant/50 p-8"><BlogCardSkeleton /></div>
          <div className="border-r border-b border-outline-variant/50 p-8"><BlogCardSkeleton /></div>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-outline-variant bg-surface-container-low flex flex-col justify-center items-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">
            auto_stories
          </span>
          <p className="font-body-md text-on-surface-variant italic">No manuscripts match your query.</p>
        </div>
      ) : (
        /* Three-Column Modernist Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-outline-variant/50">
          {blogs.map((blog) => (
            <article
              key={blog._id}
              className="border-r border-b border-outline-variant/50 bg-white/40 hover:bg-white/80 p-8 flex flex-col justify-between hover:shadow-md transition-all duration-300 group"
            >
              <div>
                {/* Cover Image with grayscale-to-color transition */}
                {blog.coverImage ? (
                  <div className="w-full aspect-[16/10] overflow-hidden border border-outline-variant/40 mb-6 bg-surface-container relative">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-102 transition-all duration-500"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[16/10] bg-surface-container-low border border-outline-variant/40 mb-6 flex items-center justify-center text-outline-variant">
                    <span className="material-symbols-outlined text-4xl">article</span>
                  </div>
                )}

                {/* Date & Category tag */}
                <div className="flex items-center gap-2 mb-3 font-ui-small text-[10px] uppercase tracking-widest text-secondary font-bold">
                  <span>
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>{blog.category}</span>
                </div>

                {/* Blog Title */}
                <Link to={`/post/${blog.slug}`}>
                  <h3 className="font-display-lg text-lg font-bold mb-3 text-on-surface group-hover:text-secondary transition-colors leading-snug">
                    {blog.title}
                  </h3>
                </Link>

                {/* Excerpt */}
                <p className="font-body-md text-xs text-on-surface-variant line-clamp-3 mb-6 leading-relaxed">
                  {blog.summary ||
                    (blog.content &&
                      blog.content.replace(/<[^>]*>/g, "").substring(0, 120) + "...")}
                </p>
              </div>

              {/* Author & Stats footer */}
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20 mt-auto">
                <div className="flex items-center gap-2">
                  {blog.author?.avatar ? (
                    <img
                      src={blog.author.avatar}
                      alt={blog.author.name}
                      className="w-6 h-6 rounded-full border border-outline object-cover grayscale"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">
                      account_circle
                    </span>
                  )}
                  <span className="font-ui-label text-[10px] uppercase tracking-wider text-on-surface font-semibold">
                    {blog.author?.name || "Anonymous"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant font-ui-small text-[10px]">
                  <span className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    {blog.views || 0}
                  </span>
                  <span className="flex items-center gap-0.5 text-error">
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                    {blog.likes?.length || 0}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center gap-4 mt-16 pt-8 border-t border-outline-variant/30">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-5 py-2 border border-outline-variant font-ui-label text-xs uppercase tracking-widest hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer bg-white"
          >
            Prev
          </button>
          <span className="font-ui-label text-xs uppercase tracking-widest">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-5 py-2 border border-outline-variant font-ui-label text-xs uppercase tracking-widest hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer bg-white"
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
};

export default Home;
