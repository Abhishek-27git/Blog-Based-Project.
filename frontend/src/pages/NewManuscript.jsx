import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";

const NewManuscript = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Philosophy");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("draft");
  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [wordCount, setWordCount] = useState(0);

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

  // Fetch blog data if in edit mode
  useEffect(() => {
    if (editId) {
      const fetchBlogDetails = async () => {
        setFetching(true);
        try {
          const response = await api.get(`/blogs/my-blogs`);
          if (response.data && response.data.success) {
            const blog = response.data.blogs.find((b) => b._id === editId);
            if (blog) {
              setTitle(blog.title || "");
              setSummary(blog.summary || "");
              setContent(blog.content || "");
              setCategory(blog.category || "Philosophy");
              setTags(blog.tags ? blog.tags.join(", ") : "");
              setStatus(blog.status || "draft");
              setImagePreview(blog.coverImage || "");
            } else {
              setErrorMsg("Blog not found or unauthorized to edit.");
            }
          }
        } catch (err) {
          setErrorMsg("Failed to retrieve manuscript details.");
        } finally {
          setFetching(false);
        }
      };
      fetchBlogDetails();
    }
  }, [editId]);

  // Update word count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    setWordCount(words);
  }, [content]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (submitStatus) => {
    setErrorMsg("");
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title || "Untitled Draft");
    formData.append("summary", summary);
    formData.append("content", content);
    formData.append("category", category);
    formData.append("status", submitStatus || status);

    // Convert comma separated tags to array
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    tagsArray.forEach((tag, idx) => {
      formData.append(`tags[${idx}]`, tag);
    });

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    try {
      let response;
      if (editId) {
        // Edit existing post
        response = await api.put(`/blogs/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Create new post
        response = await api.post("/blogs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response.data && response.data.success) {
        navigate("/dashboard");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to save manuscript. Check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-secondary animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-8 pb-32 px-margin-mobile md:px-0">
      
      {/* Action Header */}
      <nav className="flex items-center justify-between max-w-reading-column-max w-full h-16 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b border-outline-variant/30 mb-8">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary">draw</span>
          <span className="font-ui-label text-ui-label uppercase tracking-widest text-on-surface-variant">
            {editId ? "Editing Manuscript" : "New Manuscript"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSave("draft")}
            disabled={loading}
            className="font-ui-label text-ui-label text-on-surface-variant hover:text-secondary uppercase tracking-widest font-bold px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={loading}
            className="bg-primary text-on-primary px-6 py-2 border border-primary font-ui-label text-ui-label uppercase tracking-widest hover:bg-transparent hover:text-primary transition-all duration-300 disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </nav>

      <div className="w-full max-w-reading-column-max">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container text-sm font-ui-label border border-error/20 flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">
              error
            </span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Title area */}
        <header className="mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-display-lg text-display-lg-mobile md:text-display-lg outline-none border-none bg-transparent placeholder:text-outline-variant w-full"
            placeholder="Title of your essay..."
            required
          />
          <div className="flex items-center gap-3 mt-4 text-on-surface-variant">
            <span className="font-ui-small text-ui-small uppercase tracking-widest">
              By {localStorage.getItem("userName") || "You"}
            </span>
            <span className="text-outline-variant">•</span>
            <span className="font-ui-small text-ui-small uppercase tracking-widest">
              {wordCount} words
            </span>
          </div>
          <hr className="mt-4 border-t border-outline-variant/30" />
        </header>

        {/* Metadata Controls */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-surface-container-low p-6 mb-8 border border-outline-variant">
          <div>
            <label className="block font-ui-label text-ui-label uppercase tracking-widest text-xs text-on-surface-variant mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-background border border-outline-variant focus:border-secondary focus:ring-0 px-3 py-2 text-on-surface font-body-md outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-ui-label text-ui-label uppercase tracking-widest text-xs text-on-surface-variant mb-2">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. mindfulness, art, history"
              className="w-full bg-background border border-outline-variant focus:border-secondary focus:ring-0 px-3 py-2 text-on-surface font-body-md outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-ui-label text-ui-label uppercase tracking-widest text-xs text-on-surface-variant mb-2">
              Summary (Short teaser or excerpt)
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A brief editorial abstract explaining the focus of this piece..."
              className="w-full bg-background border border-outline-variant focus:border-secondary focus:ring-0 px-3 py-2 text-on-surface font-body-md outline-none"
            />
          </div>

          <div className="sm:col-span-2 pb-2">
            <label className="block font-ui-label text-ui-label uppercase tracking-widest text-xs text-on-surface-variant mb-2">
              Cover Artwork
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {imagePreview && (
                <div className="w-32 h-20 overflow-hidden border border-outline-variant bg-background">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover grayscale" />
                </div>
              )}
              <label className="bg-background border border-outline-variant hover:border-primary text-on-surface px-4 py-2 font-ui-label text-xs uppercase tracking-widest cursor-pointer">
                Choose Artwork
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </section>

        {/* Content Editor */}
        <section className="writing-canvas">
          <label className="block font-ui-label text-ui-label uppercase tracking-widest text-xs text-on-surface-variant mb-2">
            Content Body (Supports plain text or HTML syntax)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="The first sentence is the hardest..."
            className="w-full min-h-[500px] bg-background border border-outline-variant focus:border-secondary focus:ring-0 p-6 text-on-surface font-body-lg text-lg leading-relaxed outline-none resize-y"
            required
          />
        </section>

        {/* Break ornament */}
        <div className="flex justify-center items-center py-12 text-secondary opacity-40">
          <span className="material-symbols-outlined">flare</span>
        </div>

      </div>
    </div>
  );
};

export default NewManuscript;
