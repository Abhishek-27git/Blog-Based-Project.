import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

const Home = () => {
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
          limit: 6,
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
    // Reset page to 1 on category/search changes
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
    <main className="max-w-reading-column-max mx-auto px-margin-mobile md:px-0 pt-stack-lg pb-32">
      {/* Editorial Header */}
      <header className="mb-stack-lg border-b border-outline-variant pb-8 text-center md:text-left">
        <span className="font-ui-small text-ui-small text-secondary uppercase tracking-widest block mb-2">
          Platform Manifesto
        </span>
        <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-4 leading-tight">
          The Architecture of Silence
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
          A distraction-free sanctuary for slow contemplation and literary exploration. In an age of relentless digital assault, we provide margins for ideas to breathe.
        </p>
      </header>

      {/* Filter and Search Bar */}
      <section className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex border border-outline-variant bg-surface-container-low">
          <input
            type="text"
            placeholder="Search essays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-transparent text-on-surface font-body-md border-none focus:outline-none focus:ring-0 outline-none w-full md:w-64"
          />
          <button type="submit" className="px-4 text-on-surface-variant hover:text-primary transition-colors flex items-center">
            <span className="material-symbols-outlined">search</span>
          </button>
        </form>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setCategory("")}
            className={`px-3 py-1 font-ui-small text-ui-small uppercase tracking-wider border transition-all whitespace-nowrap ${
              category === ""
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant text-on-surface-variant hover:border-primary"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 font-ui-small text-ui-small uppercase tracking-wider border transition-all whitespace-nowrap ${
                category === cat
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant text-on-surface-variant hover:border-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Loading States */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="material-symbols-outlined text-4xl text-secondary animate-spin">
            progress_activity
          </span>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-outline-variant bg-surface-container-low">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
            auto_stories
          </span>
          <p className="font-body-md text-on-surface-variant">No manuscripts match your query.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {blogs.map((blog) => (
            <article key={blog._id} className="border border-outline-variant bg-surface-container-low p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:border-primary transition-all duration-300">
              
              {blog.coverImage && (
                <div className="w-full md:w-1/3 aspect-[4/3] md:aspect-square overflow-hidden border border-outline-variant">
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-surface-container-high px-2 py-0.5 font-ui-small text-ui-small border border-outline-variant uppercase tracking-tighter">
                      {blog.category}
                    </span>
                    <span className="text-on-surface-variant font-ui-small text-ui-small">
                      {blog.readTime || 5} Min Read
                    </span>
                  </div>

                  <Link to={`/post/${blog.slug}`}>
                    <h3 className="font-headline-sm text-headline-sm mb-3 hover:text-secondary transition-colors leading-tight">
                      {blog.title}
                    </h3>
                  </Link>

                  <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3 mb-4 italic">
                    {blog.summary || (blog.content && blog.content.replace(/<[^>]*>/g, "").substring(0, 160) + "...")}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                  <div className="flex items-center gap-3">
                    {blog.author?.avatar ? (
                      <img
                        src={blog.author.avatar}
                        alt={blog.author.name}
                        className="w-8 h-8 rounded-full border border-outline grayscale"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-xl">
                        account_circle
                      </span>
                    )}
                    <div>
                      <p className="font-ui-label text-ui-label font-bold text-primary text-xs">
                        {blog.author?.name || "Anonymous"}
                      </p>
                      <p className="font-ui-small text-ui-small text-on-surface-variant text-[10px]">
                        {new Date(blog.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-on-surface-variant font-ui-small text-xs">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      {blog.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                        favorite
                      </span>
                      {blog.likes?.length || 0}
                    </span>
                  </div>
                </div>

              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center gap-4 mt-12 pt-6 border-t border-outline-variant/30">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-outline-variant font-ui-label text-ui-label uppercase tracking-widest hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            Prev
          </button>
          <span className="font-ui-label text-ui-label uppercase tracking-wider">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-outline-variant font-ui-label text-ui-label uppercase tracking-widest hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
};

export default Home;
