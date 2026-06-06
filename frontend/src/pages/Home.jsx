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
      
      {/* Modern Filter and Search Row - Placed at the very top */}
      <section className="mb-12 flex flex-col lg:flex-row gap-6 items-center justify-between pb-6 border-b border-outline/20">
        {/* Category Pills Navigation Row */}
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-2 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap cursor-pointer border ${
              category === ""
                ? "bg-primary border-primary text-on-primary font-bold shadow-sm scale-102"
                : "border-outline/30 bg-surface/50 text-on-surface-variant hover:border-primary hover:text-on-surface"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap cursor-pointer border ${
                category === cat
                  ? "bg-primary border-primary text-on-primary font-bold shadow-sm scale-102"
                  : "border-outline/30 bg-surface/50 text-on-surface-variant hover:border-primary hover:text-on-surface"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Clean Pill Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-auto flex items-center border border-outline/50 rounded-full bg-surface-container px-4 py-2 shadow-sm focus-within:border-primary/80 transition-all">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">search</span>
          <input
            type="text"
            placeholder="Search essays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="appearance-none bg-transparent text-on-surface font-sans text-xs border-none outline-none focus:outline-none focus:ring-0 w-full lg:w-60 shadow-none placeholder:text-on-surface-variant/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setPage(1); }}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer mr-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </form>
      </section>

      {/* Loading States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-outline/50">
          <div className="border-r border-b border-outline/50 p-8"><BlogCardSkeleton /></div>
          <div className="border-r border-b border-outline/50 p-8"><BlogCardSkeleton /></div>
          <div className="border-r border-b border-outline/50 p-8"><BlogCardSkeleton /></div>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-outline bg-surface-container-low flex flex-col justify-center items-center rounded-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">
            auto_stories
          </span>
          <p className="font-sans text-xs text-on-surface-variant italic">No manuscripts match your query.</p>
        </div>
      ) : (
        /* Unified Stacked List of all blogs - one below the other */
        <div className="space-y-12">
          {blogs.map((blog) => (
            <div key={blog._id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-12 border-b border-outline/30 items-stretch last:border-b-0">
              {/* Left Column: Dynamic Blog Details */}
              <header className="lg:col-span-5 flex flex-col justify-center text-left pr-0 lg:pr-6">
                <span className="font-mono text-[10px] text-primary uppercase tracking-widest block mb-3 font-bold">
                  {blog.category}
                </span>
                <Link to={`/post/${blog.slug}`}>
                  <h2 className="font-sans text-display-lg-mobile md:text-4xl lg:text-5xl font-black mb-4 leading-tight text-on-surface hover:text-primary transition-colors">
                    {blog.title}
                  </h2>
                </Link>
                <p className="font-sans text-xs md:text-sm text-on-surface-variant leading-relaxed max-w-lg mb-6 line-clamp-3">
                  {blog.summary || (blog.content && blog.content.replace(/<[^>]*>/g, "").substring(0, 150) + "...")}
                </p>
                <div className="flex items-center gap-2 text-primary">
                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold">
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                  <span className="text-outline/40">•</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-on-surface-variant">
                    By {blog.author?.name || "Anonymous"}
                  </span>
                </div>
              </header>

              {/* Right Column: Blog details card */}
              <div className="lg:col-span-7 flex">
                <article className="w-full border border-outline bg-surface/25 hover:bg-surface hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 flex flex-col md:flex-row group rounded-sm overflow-hidden">
                  {/* Cover Artwork */}
                  {blog.coverImage ? (
                    <div className="w-full md:w-1/2 aspect-[16/10] md:aspect-auto md:h-full overflow-hidden bg-surface-container relative border-b md:border-b-0 md:border-r border-outline/40">
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-102 transition-all duration-500"
                      />
                    </div>
                  ) : (
                    <div className="w-full md:w-1/2 aspect-[16/10] md:aspect-auto md:h-full bg-gradient-to-br from-surface-container-low to-surface-container-high border-b md:border-b-0 md:border-r border-outline/40 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] bg-[radial-gradient(#c5a85c_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      <span className="font-sans text-5xl font-extrabold text-primary/10 select-none mb-1">
                        {blog.category ? blog.category.charAt(0) : "M"}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-primary/50 font-bold">
                        Manuscript Abstract
                      </span>
                    </div>
                  )}

                  {/* Spotlight Content */}
                  <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between text-left">
                    <div>
                      <div className="flex items-center gap-2 mb-3 font-mono text-[9px] uppercase tracking-widest text-primary font-bold">
                        <span>{blog.category}</span>
                      </div>
                      <Link to={`/post/${blog.slug}`}>
                        <h3 className="font-sans text-base font-bold mb-3 text-on-surface group-hover:text-primary transition-colors leading-snug">
                          {blog.title}
                        </h3>
                      </Link>
                      <p className="font-sans text-xs text-on-surface-variant line-clamp-4 leading-relaxed mb-6">
                        {blog.summary || (blog.content && blog.content.replace(/<[^>]*>/g, "").substring(0, 150) + "...")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-outline/20 mt-auto">
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
                        <span className="font-sans text-[10px] uppercase tracking-wider text-on-surface font-semibold">
                          {blog.author?.name || "Anonymous"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant font-mono text-[9px]">
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">visibility</span>
                          {blog.views || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center gap-4 mt-16 pt-8 border-t border-outline/30">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-5 py-2 border border-outline font-sans text-xs uppercase tracking-widest hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer bg-surface text-on-surface"
          >
            Prev
          </button>
          <span className="font-sans text-xs uppercase tracking-widest text-on-surface-variant">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-5 py-2 border border-outline font-sans text-xs uppercase tracking-widest hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer bg-surface text-on-surface"
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
};

export default Home;
