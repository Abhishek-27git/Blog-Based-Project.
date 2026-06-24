import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";
import { SkeletonLine, BlogStackedListSkeleton } from "../components/Skeleton";

const WriterProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchWriterProfile = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const response = await api.get(`/users/profile/${id}`);
        if (response.data && response.data.success) {
          setProfile(response.data.profile);
          setBlogs(response.data.blogs || []);
        } else {
          setErrorMsg("Failed to retrieve writer details.");
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
          setErrorMsg(err.response.data.message);
        } else {
          setErrorMsg("Writer profile not found or has been suspended.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWriterProfile();
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-32 animate-fade-in">
        {/* Profile Card Header Skeleton */}
        <section className="mb-12 border border-outline bg-surface p-8 rounded-sm text-center flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full animate-shimmer bg-surface-container" />
          <SkeletonLine className="h-6 w-48" />
          <SkeletonLine className="h-4 w-24" />
          <div className="space-y-2 w-full max-w-lg mt-4">
            <SkeletonLine className="h-3.5 w-full" />
            <SkeletonLine className="h-3.5 w-5/6" />
          </div>
        </section>

        {/* Essays list skeleton */}
        <div className="flex items-center space-x-3 mb-8">
          <SkeletonLine className="h-4 w-44" />
          <div className="flex-grow h-px bg-outline/30"></div>
        </div>
        <BlogStackedListSkeleton />
      </main>
    );
  }

  if (errorMsg || !profile) {
    return (
      <main className="min-h-[70vh] flex flex-col justify-center items-center px-6">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">
          account_circle_off
        </span>
        <h2 className="font-sans text-headline-md font-bold text-on-surface">Profile Unavailable</h2>
        <p className="font-sans text-on-surface-variant mt-2 text-sm text-center max-w-md">
          {errorMsg || "The requested writer profile could not be loaded."}
        </p>
        <Link to="/" className="text-primary font-bold hover:underline mt-6 text-xs tracking-wider uppercase">
          Back to Reading List
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-32 animate-fade-in">
      
      {/* Writer Header card matching the premium Obsidian style */}
      <section className="mb-12 border border-outline bg-surface p-8 md:p-12 rounded-sm text-center relative flex flex-col items-center shadow-sm">
        
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container-highest border border-outline mb-6 relative">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover grayscale" />
          ) : (
            <span className="material-symbols-outlined text-[96px] text-on-surface-variant w-full h-full flex items-center justify-center">
              account_circle
            </span>
          )}
        </div>

        {/* Display name & credentials */}
        <h2 className="font-sans text-2xl md:text-3xl font-black text-on-surface mb-2 leading-tight">
          {profile.name}
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-widest text-primary border border-primary/30 px-3 py-1 bg-primary/5 rounded-full font-bold mb-6">
          {profile.role} Writer
        </span>

        {/* Biography */}
        <p className="font-sans text-sm md:text-base text-on-surface-variant max-w-xl leading-relaxed italic mb-6">
          {profile.bio || `${profile.name} has not shared a biography yet.`}
        </p>

        {/* Footer info (Joined date & total publications) */}
        <div className="flex items-center gap-4 text-on-surface-variant font-mono text-[10px] uppercase tracking-wider pt-6 border-t border-outline/25 w-full max-w-sm justify-center">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
          <span className="text-outline/40">•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">history_edu</span>
            {blogs.length} {blogs.length === 1 ? "Essay" : "Essays"}
          </span>
        </div>
      </section>

      {/* Published essays subheader */}
      <section className="text-left animate-fade-in-up">
        <div className="flex items-center space-x-3 mb-10">
          <span className="font-mono text-[11px] text-primary uppercase tracking-wider font-bold">
            Published Manuscripts
          </span>
          <div className="flex-grow h-px bg-outline/30"></div>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-outline bg-surface/50 flex flex-col justify-center items-center rounded-sm">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">
              edit_document
            </span>
            <p className="font-sans text-xs text-on-surface-variant italic">No essays published yet by this writer.</p>
          </div>
        ) : (
          /* Stacked list of blogs published by this writer */
          <div className="space-y-12">
            {blogs.map((blog) => (
              <div key={blog._id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-12 border-b border-outline/30 items-stretch last:border-b-0">
                {/* Left Column: Details */}
                <header className="lg:col-span-5 flex flex-col justify-center text-left pr-0 lg:pr-6">
                  <span className="font-mono text-[11px] text-primary uppercase tracking-wider block mb-3 font-bold">
                    {blog.category}
                  </span>
                  <Link to={`/post/${blog.slug}`}>
                    <h2 className="font-sans text-display-lg-mobile md:text-3xl lg:text-4xl font-black mb-4 leading-tight text-on-surface hover:text-primary transition-colors">
                      {blog.title}
                    </h2>
                  </Link>
                  <p className="font-sans text-xs md:text-sm text-on-surface-variant leading-relaxed max-w-lg mb-6 line-clamp-3">
                    {blog.excerpt || (blog.content && blog.content.replace(/<[^>]*>/g, "").substring(0, 150) + "...")}
                  </p>
                  <div className="flex items-center gap-2 text-primary">
                    <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
                      {new Date(blog.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                    <span className="text-outline/40">•</span>
                    <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      {blog.readTime || 5} Min Read
                    </span>
                  </div>
                </header>

                {/* Right Column: Card Layout */}
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
                        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#c5a85c_1px,transparent_1px)] [background-size:16px_16px]"></div>
                        <span className="font-sans text-5xl font-extrabold text-primary/10 select-none mb-1">
                          {blog.category ? blog.category.charAt(0) : "M"}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-primary/50 font-bold">
                          Manuscript Abstract
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between text-left">
                      <div>
                        <div className="flex items-center gap-2 mb-3 font-mono text-[11px] uppercase tracking-wider text-primary font-bold">
                          <span>{blog.category}</span>
                        </div>
                        <Link to={`/post/${blog.slug}`}>
                          <h3 className="font-sans text-base font-bold mb-3 text-on-surface group-hover:text-primary transition-colors leading-snug">
                            {blog.title}
                          </h3>
                        </Link>
                        <p className="font-sans text-sm text-on-surface-variant line-clamp-4 leading-relaxed mb-6">
                          {blog.excerpt || (blog.content && blog.content.replace(/<[^>]*>/g, "").substring(0, 150) + "...")}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-outline/20 mt-auto">
                        <span className="font-sans text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                          Views: {blog.views || 0}
                        </span>
                        <Link to={`/post/${blog.slug}`} className="font-mono text-[11px] text-primary hover:underline font-bold uppercase tracking-wider">
                          Read Essay →
                        </Link>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default WriterProfile;
