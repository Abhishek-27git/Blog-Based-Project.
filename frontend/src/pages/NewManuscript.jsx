import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";
import { NewManuscriptSkeleton } from "../components/Skeleton";
import { marked } from "marked";

const NewManuscript = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Autosave and Focus Mode states
  const [isReady, setIsReady] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("saved"); // saved, saving, typing, error
  const [hasChanges, setHasChanges] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Markdown Editor & Writing Goal States
  const [activeEditorTab, setActiveEditorTab] = useState("edit");
  const [wordGoal, setWordGoal] = useState(500);
  const textareaRef = useRef(null);

  const insertFormatting = (prefix, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;

    setContent(
      text.substring(0, start) +
      replacement +
      text.substring(end)
    );

    // Maintain focus and reset selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

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
              setSummary(blog.excerpt || "");
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
          // Wait a brief moment to allow component state variables to settle
          setTimeout(() => setIsReady(true), 150);
        }
      };
      fetchBlogDetails();
    } else {
      setIsReady(true);
    }
  }, [editId]);

  // Focus Mode HTML/body class effect
  useEffect(() => {
    if (focusMode) {
      document.documentElement.classList.add("focus-mode-active");
    } else {
      document.documentElement.classList.remove("focus-mode-active");
    }
    return () => {
      document.documentElement.classList.remove("focus-mode-active");
    };
  }, [focusMode]);

  // Update word count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    setWordCount(words);
  }, [content]);

  // Trigger changes when fields update
  useEffect(() => {
    if (isReady) {
      setHasChanges(true);
      setAutosaveStatus("typing");
    }
  }, [title, summary, content, category, tags, coverImage]);

  // Debounced Autosave effect
  useEffect(() => {
    if (!hasChanges || fetching || loading) return;

    const delayDebounce = setTimeout(() => {
      performAutosave();
    }, 2000); // Trigger saving 2 seconds after user stops typing

    return () => clearTimeout(delayDebounce);
  }, [title, summary, content, category, tags, coverImage, hasChanges, fetching, loading]);

  const performAutosave = async () => {
    setAutosaveStatus("saving");

    const formData = new FormData();
    formData.append("title", title || "Untitled Draft");
    formData.append("excerpt", summary);
    formData.append("content", content);
    formData.append("category", category);
    formData.append("status", "draft");

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
        // Update draft
        response = await api.put(`/blogs/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Create draft
        response = await api.post("/blogs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response.data && response.data.success) {
        setAutosaveStatus("saved");
        setHasChanges(false);
        if (!editId && response.data.blog?._id) {
          // Replace URL params to transition newly created draft into edit mode
          setSearchParams({ id: response.data.blog._id }, { replace: true });
        }
      } else {
        setAutosaveStatus("error");
      }
    } catch (err) {
      console.error("Autosave failed:", err);
      setAutosaveStatus("error");
    }
  };

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
    setHasChanges(false); // Stop any further background autosave triggers

    const formData = new FormData();
    formData.append("title", title || "Untitled Draft");
    formData.append("excerpt", summary);
    formData.append("content", content);
    formData.append("category", category);
    formData.append("status", submitStatus || status);

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
        response = await api.put(`/blogs/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
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
    return <NewManuscriptSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-8 pb-32 px-margin-mobile md:px-0 animate-fade-in">
      
      {/* Action Header */}
      <nav className={`flex items-center justify-between max-w-reading-column-max w-full h-16 bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b border-outline/30 mb-8 focus-transition ${
        focusMode ? "bg-background/20 border-transparent py-2" : ""
      }`}>
        <div className="flex items-center gap-3 md:gap-4">
          <span className="material-symbols-outlined text-primary">draw</span>
          <span className="font-sans text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold hidden sm:inline">
            {editId ? "Editing Manuscript" : "New Manuscript"}
          </span>

          {/* Autosave Status Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-surface-container border border-outline rounded-full transition-all duration-300">
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              autosaveStatus === "saved" ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" :
              autosaveStatus === "saving" ? "bg-amber-500 animate-pulse" :
              autosaveStatus === "typing" ? "bg-blue-400" :
              "bg-error"
            }`} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant font-bold select-none">
              {autosaveStatus === "saved" ? "Saved" :
               autosaveStatus === "saving" ? "Saving..." :
               autosaveStatus === "typing" ? "Writing" :
               "Offline"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Focus Mode Toggle Button */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-sans text-[10px] uppercase tracking-widest font-bold border transition-all duration-300 rounded-sm cursor-pointer ${
              focusMode
                ? "border-primary bg-primary/10 text-primary"
                : "border-outline hover:border-primary text-on-surface-variant hover:text-on-surface"
            }`}
            title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            <span className="material-symbols-outlined text-[14px]">
              {focusMode ? "fullscreen_exit" : "fullscreen"}
            </span>
            <span className="hidden sm:inline">{focusMode ? "Writing Mode" : "Focus"}</span>
          </button>

          <button
            onClick={() => handleSave("draft")}
            disabled={loading}
            className="font-sans text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest font-bold px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={loading}
            className="bg-primary border border-primary text-on-primary hover:bg-transparent hover:text-primary px-4 md:px-6 py-2 font-sans text-[10px] uppercase tracking-widest transition-all duration-300 disabled:opacity-50 font-bold rounded-sm"
          >
            Publish
          </button>
        </div>
      </nav>

      <div className="w-full max-w-reading-column-max">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container text-xs font-sans border border-error/20 flex items-start gap-2 rounded-sm">
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
            className={`w-full outline-none border-none bg-transparent placeholder:text-on-surface-variant/30 text-on-surface font-black focus-transition ${
              focusMode
                ? "text-center font-serif text-3xl md:text-4xl py-6"
                : "font-sans text-display-lg-mobile md:text-display-lg"
            }`}
            placeholder="Title of your essay..."
            required
          />
          <div className={`flex items-center gap-3 mt-4 text-on-surface-variant focus-transition ${
            focusMode ? "justify-center opacity-60" : "justify-start"
          }`}>
            <span className="font-mono text-[9px] uppercase tracking-widest">
              By {localStorage.getItem("userName") || "You"}
            </span>
            <span className="text-outline">•</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-wider text-primary font-bold">
                {wordCount} words
              </span>
              {!focusMode && (
                <>
                  <span className="text-outline">•</span>
                  <div className="flex items-center gap-1.5 font-mono text-[9px]">
                    <span className="uppercase text-on-surface-variant/70">Goal:</span>
                    <input
                      type="number"
                      value={wordGoal}
                      onChange={(e) => setWordGoal(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-12 bg-surface border border-outline/50 rounded px-1 text-center py-0.5 outline-none focus:border-primary text-[9px] font-bold text-on-surface"
                    />
                  </div>
                  {wordGoal > 0 && (
                    <div className="relative flex items-center justify-center ml-1" title={`${Math.round(Math.min((wordCount / wordGoal) * 100, 100))}% of writing goal`}>
                      <svg className="w-5 h-5 transform -rotate-90">
                        <circle cx="10" cy="10" r="8" className="text-outline/25" strokeWidth="2" stroke="currentColor" fill="transparent" />
                        <circle
                          cx="10"
                          cy="10"
                          r="8"
                          className="text-primary transition-all duration-300"
                          strokeWidth="2"
                          strokeDasharray={2 * Math.PI * 8}
                          strokeDashoffset={2 * Math.PI * 8 - (Math.min((wordCount / wordGoal) * 100, 100) / 100) * 2 * Math.PI * 8}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                        />
                      </svg>
                      {wordCount >= wordGoal && (
                        <span className="material-symbols-outlined text-[10px] text-green-600 absolute font-bold animate-pulse">
                          check
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <hr className={`mt-4 border-t border-outline/30 focus-transition ${
            focusMode ? "opacity-0 border-transparent h-0 my-0" : ""
          }`} />
        </header>

        {/* Metadata Controls */}
        <section className={`grid grid-cols-1 sm:grid-cols-2 gap-6 bg-surface p-6 mb-8 border border-outline rounded-sm focus-transition ${
          focusMode
            ? "opacity-0 h-0 p-0 m-0 border-none overflow-hidden pointer-events-none scale-95"
            : "opacity-100"
        }`}>
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white text-zinc-900 rounded-md px-3 py-2 text-xs font-sans outline-none transition-all border border-outline focus:border-primary"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. mindfulness, art, history"
              className="w-full bg-white text-zinc-900 rounded-md px-3 py-2 text-xs font-sans outline-none transition-all border border-outline focus:border-primary placeholder:text-zinc-400"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">
              Summary (Short teaser or excerpt)
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A brief editorial abstract explaining the focus of this piece..."
              className="w-full bg-white text-zinc-900 rounded-md px-3 py-2 text-xs font-sans outline-none transition-all border border-outline focus:border-primary placeholder:text-zinc-400"
            />
          </div>

          <div className="sm:col-span-2 pb-2">
            <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">
              Cover Artwork
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {imagePreview && (
                <div className="w-32 h-20 overflow-hidden border border-outline bg-background">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover grayscale" />
                </div>
              )}
              <label className="bg-surface border border-outline hover:border-primary text-on-surface px-4 py-2 font-sans text-xs uppercase tracking-widest cursor-pointer font-bold rounded-sm">
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
        <section className={`writing-canvas focus-transition ${focusMode ? "mt-4" : ""}`}>
          <div className={`flex items-center justify-between border-b border-outline/30 pb-2 mb-4 focus-transition ${
            focusMode ? "opacity-0 h-0 overflow-hidden pointer-events-none mb-0 pb-0" : ""
          }`}>
            <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
              Content Body (Markdown Supported)
            </label>
            <div className="flex border border-outline rounded overflow-hidden text-[9px] font-mono">
              <button
                type="button"
                onClick={() => setActiveEditorTab("edit")}
                className={`px-3 py-1 cursor-pointer font-bold uppercase transition-all ${
                  activeEditorTab === "edit" ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-container"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab("preview")}
                className={`px-3 py-1 cursor-pointer font-bold uppercase transition-all ${
                  activeEditorTab === "preview" ? "bg-primary text-on-primary" : "bg-surface hover:bg-surface-container"
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Formatting Toolbar */}
          {!focusMode && activeEditorTab === "edit" && (
            <div className="flex flex-wrap gap-1 mb-3 bg-surface p-1 border border-outline rounded-sm items-center shadow-xs">
              <button
                type="button"
                onClick={() => insertFormatting("**", "**")}
                className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Bold"
              >
                <span className="material-symbols-outlined text-lg leading-none">format_bold</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("*", "*")}
                className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Italic"
              >
                <span className="material-symbols-outlined text-lg leading-none">format_italic</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("### ")}
                className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Header"
              >
                <span className="material-symbols-outlined text-lg leading-none">title</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("> ")}
                className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Blockquote"
              >
                <span className="material-symbols-outlined text-lg leading-none">format_quote</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("```\n", "\n```")}
                className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Code Block"
              >
                <span className="material-symbols-outlined text-lg leading-none">code</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("[", "](url)")}
                className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Link"
              >
                <span className="material-symbols-outlined text-lg leading-none">link</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("- ")}
                className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Bullet List"
              >
                <span className="material-symbols-outlined text-lg leading-none">format_list_bulleted</span>
              </button>
            </div>
          )}

          {activeEditorTab === "edit" ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="The first sentence is the hardest..."
              className={`w-full min-h-[500px] focus-transition outline-none resize-y rounded-sm ${
                focusMode
                  ? "bg-transparent border-none text-on-surface font-serif text-lg md:text-xl leading-loose max-w-2xl mx-auto block placeholder:italic placeholder:text-on-surface-variant/20 shadow-none focus:ring-0"
                  : "bg-background border border-outline focus:border-primary p-6 text-on-surface-variant font-sans text-base leading-relaxed"
              }`}
              required
            />
          ) : (
            <div
              className="w-full min-h-[500px] bg-background border border-outline p-8 text-on-surface-variant font-sans text-base leading-relaxed overflow-y-auto rounded-sm essay-content"
              dangerouslySetInnerHTML={{
                __html: marked.parse(content || "*No content written yet.*"),
              }}
            />
          )}
        </section>

        {/* Break ornament */}
        <div className={`flex justify-center items-center py-12 text-primary focus-transition ${
          focusMode ? "opacity-10 py-6" : "opacity-40"
        }`}>
          <span className="material-symbols-outlined">flare</span>
        </div>

      </div>
    </div>
  );
};

export default NewManuscript;
