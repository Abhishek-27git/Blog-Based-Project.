import React from "react";

// Individual small skeleton line component with pulsing animation
export const SkeletonLine = ({ className = "h-4 w-full" }) => {
  return <div className={`animate-shimmer rounded bg-surface-container-high ${className}`} />;
};

// 1. Skeleton for Home page 3-column Grid
export const BlogCardSkeleton = () => {
  return (
    <div className="bg-white/40 border border-outline-variant/30 p-8 flex flex-col justify-between h-full space-y-6">
      <div>
        {/* Cover Image Placeholder */}
        <div className="w-full aspect-[16/10] animate-shimmer bg-surface-container-high border border-outline-variant/20 mb-6" />

        {/* Metadata tag */}
        <div className="flex items-center gap-3 mb-4">
          <SkeletonLine className="h-3 w-16" />
          <span className="text-outline-variant">•</span>
          <SkeletonLine className="h-3 w-20" />
        </div>

        {/* Title */}
        <div className="space-y-2 mb-4">
          <SkeletonLine className="h-5 w-11/12" />
          <SkeletonLine className="h-5 w-3/4" />
        </div>

        {/* Excerpt Snippet */}
        <div className="space-y-1.5 mb-6">
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-2/3" />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20 mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full animate-shimmer bg-surface-container-high" />
          <SkeletonLine className="h-3 w-16" />
        </div>
        <div className="flex gap-3">
          <SkeletonLine className="h-3 w-8" />
          <SkeletonLine className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
};

// 2. Skeleton for Blog Single View (Paper Reader layout)
export const BlogDetailSkeleton = () => {
  return (
    <main className="max-w-reading-column-max mx-auto px-6 md:px-0 pt-16 pb-40">
      <article className="bg-white border border-outline-variant/60 shadow-md p-8 md:p-16 text-left">
        {/* Header */}
        <header className="mb-10 pb-8 border-b border-outline-variant/20">
          <div className="flex items-center gap-3 mb-4">
            <SkeletonLine className="h-3 w-20" />
            <span className="text-outline-variant">•</span>
            <SkeletonLine className="h-3 w-16" />
          </div>
          
          <div className="space-y-3 mb-6">
            <SkeletonLine className="h-8 w-full" />
            <SkeletonLine className="h-8 w-4/5" />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="w-10 h-10 rounded-full animate-shimmer bg-surface-container-high" />
            <div className="space-y-1.5 flex-1 max-w-xs">
              <SkeletonLine className="h-3.5 w-24" />
              <SkeletonLine className="h-3 w-16" />
            </div>
          </div>
        </header>

        {/* Cover image */}
        <div className="w-full h-80 animate-shimmer bg-surface-container-high border border-outline-variant/20 mb-10" />

        {/* Article Body */}
        <div className="space-y-6">
          <div className="space-y-2">
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-11/12" />
          </div>
          <div className="space-y-2">
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-10/12" />
          </div>
          <div className="space-y-2">
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-9/12" />
          </div>
        </div>
      </article>
    </main>
  );
};

// 3. Skeleton for User/Admin Dashboard layouts
export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar Skeleton */}
      <aside className="w-full md:w-64 border-r border-outline-variant/60 bg-white flex flex-col py-10 px-6 space-y-8">
        <div className="flex flex-col items-center space-y-3 pb-8 border-b border-outline-variant/30">
          <div className="w-16 h-16 rounded-full animate-shimmer bg-surface-container-high" />
          <div className="space-y-2 flex flex-col items-center">
            <SkeletonLine className="h-3.5 w-24" />
            <SkeletonLine className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-2">
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-10 w-full" />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 py-12 px-6 md:px-12">
        
        {/* Stat Metrics Rows */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-outline-variant/60 pb-6 space-y-3">
              <SkeletonLine className="h-3 w-16" />
              <SkeletonLine className="h-10 w-12" />
            </div>
          ))}
        </section>

        {/* Heading */}
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-outline-variant/20">
          <SkeletonLine className="h-8 w-44" />
          <SkeletonLine className="h-9 w-36" />
        </div>

        {/* Workspace Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 border border-outline-variant/60 bg-white space-y-4">
              <div className="flex justify-between">
                <SkeletonLine className="h-5 w-20" />
                <SkeletonLine className="h-5 w-6" />
              </div>
              <SkeletonLine className="h-5 w-11/12" />
              <SkeletonLine className="h-3 w-2/3" />
              <div className="pt-4 border-t border-outline-variant/20 flex justify-between">
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-5 w-6" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
