import React from "react";

// Individual small skeleton line component with pulsing animation
export const SkeletonLine = ({ className = "h-4 w-full" }) => {
  return <div className={`animate-shimmer rounded bg-surface-container-high ${className}`} />;
};

// 1. Skeleton for Home page 3-column Grid (Optional/Fallback)
export const BlogCardSkeleton = () => {
  return (
    <div className="bg-surface/25 border border-outline p-8 flex flex-col justify-between h-full space-y-6 rounded-sm">
      <div>
        {/* Cover Image Placeholder */}
        <div className="w-full aspect-[16/10] animate-shimmer bg-surface-container-high border border-outline/20 mb-6" />

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
      <div className="flex items-center justify-between pt-4 border-t border-outline/20 mt-auto">
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
    <main className="max-w-reading-column-max mx-auto px-6 md:px-0 pt-16 pb-40 animate-fade-in">
      <article className="bg-surface border border-outline shadow-md p-8 md:p-16 text-left rounded-sm">
        {/* Header */}
        <header className="mb-10 pb-8 border-b border-outline/30">
          <div className="flex items-center gap-3 mb-4">
            <SkeletonLine className="h-3 w-20" />
            <span className="text-outline/40">•</span>
            <SkeletonLine className="h-3 w-16" />
          </div>
          
          <div className="space-y-3 mb-6">
            <SkeletonLine className="h-8 w-full" />
            <SkeletonLine className="h-8 w-4/5" />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="w-10 h-10 rounded-full animate-shimmer bg-surface-container" />
            <div className="space-y-1.5 flex-1 max-w-xs">
              <SkeletonLine className="h-3.5 w-24" />
              <SkeletonLine className="h-3 w-16" />
            </div>
          </div>
        </header>

        {/* Cover image */}
        <div className="w-full h-80 animate-shimmer bg-surface-container border border-outline/40 mb-10" />

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
    <div className="min-h-screen flex flex-col md:flex-row bg-background animate-fade-in">
      {/* Sidebar Skeleton */}
      <aside className="w-full md:w-64 border-r border-outline bg-surface flex flex-col py-10 px-6 space-y-8">
        <div className="flex flex-col items-center space-y-3 pb-8 border-b border-outline/30">
          <div className="w-16 h-16 rounded-full animate-shimmer bg-surface-container" />
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
            <div key={i} className="border border-outline bg-surface p-6 rounded-sm space-y-3">
              <SkeletonLine className="h-3 w-16" />
              <SkeletonLine className="h-10 w-12" />
            </div>
          ))}
        </section>

        {/* Heading */}
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-outline/20">
          <SkeletonLine className="h-8 w-44" />
          <SkeletonLine className="h-9 w-36" />
        </div>

        {/* Workspace Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 border border-outline bg-surface space-y-4 rounded-sm">
              <div className="flex justify-between">
                <SkeletonLine className="h-5 w-20" />
                <SkeletonLine className="h-5 w-6" />
              </div>
              <SkeletonLine className="h-5 w-11/12" />
              <SkeletonLine className="h-3 w-2/3" />
              <div className="pt-4 border-t border-outline/20 flex justify-between">
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

// 4. Skeleton for Home page Stacked List (Matches exact Home list layout to prevent shifts)
export const BlogStackedListSkeleton = () => {
  return (
    <div className="space-y-12 animate-fade-in">
      {[1, 2, 3].map((i) => (
        <div key={i} className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-12 border-b border-outline/30 items-stretch last:border-b-0">
          {/* Left Column: Details */}
          <header className="lg:col-span-5 flex flex-col justify-center text-left pr-0 lg:pr-6 space-y-4">
            {/* Category */}
            <SkeletonLine className="h-3 w-16" />
            {/* Title */}
            <div className="space-y-2">
              <SkeletonLine className="h-8 w-11/12" />
              <SkeletonLine className="h-8 w-4/5" />
            </div>
            {/* Summary */}
            <div className="space-y-1.5 mt-2">
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-3 w-2/3" />
            </div>
            {/* Meta */}
            <div className="flex items-center gap-3 pt-2">
              <SkeletonLine className="h-3 w-20" />
              <span className="text-outline/40">•</span>
              <SkeletonLine className="h-3 w-24" />
            </div>
          </header>

          {/* Right Column: Card Layout */}
          <div className="lg:col-span-7 flex">
            <article className="w-full border border-outline bg-surface/25 flex flex-col md:flex-row rounded-sm overflow-hidden">
              {/* Artwork */}
              <div className="w-full md:w-1/2 aspect-[16/10] md:aspect-auto md:h-full animate-shimmer bg-surface-container border-b md:border-b-0 md:border-r border-outline/40" />
              {/* Content */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between text-left">
                <div>
                  <SkeletonLine className="h-3 w-12 mb-3" />
                  <SkeletonLine className="h-5 w-5/6 mb-3" />
                  <div className="space-y-1.5 mt-2">
                    <SkeletonLine className="h-3 w-full" />
                    <SkeletonLine className="h-3 w-full" />
                    <SkeletonLine className="h-3 w-3/4" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-outline/20 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full animate-shimmer bg-surface-container" />
                    <SkeletonLine className="h-3 w-16" />
                  </div>
                  <SkeletonLine className="h-3 w-10" />
                </div>
              </div>
            </article>
          </div>
        </div>
      ))}
    </div>
  );
};

// 5. Skeleton for New Manuscript Editing page
export const NewManuscriptSkeleton = () => {
  return (
    <div className="w-full max-w-reading-column-max mx-auto pt-8 pb-32 animate-fade-in px-margin-mobile md:px-0">
      {/* Action Header Placeholder */}
      <nav className="flex items-center justify-between w-full h-16 border-b border-outline/30 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-5 h-5 rounded-full animate-shimmer bg-surface-container" />
          <SkeletonLine className="h-3.5 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <SkeletonLine className="h-8 w-20" />
          <SkeletonLine className="h-8 w-24" />
        </div>
      </nav>

      {/* Title Area */}
      <header className="mb-6 space-y-4">
        <SkeletonLine className="h-12 w-3/4" />
        <div className="flex items-center gap-3 mt-4">
          <SkeletonLine className="h-3 w-24" />
          <span className="text-outline">•</span>
          <SkeletonLine className="h-3 w-16" />
        </div>
        <hr className="mt-4 border-t border-outline/30" />
      </header>

      {/* Metadata Controls */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-surface p-6 mb-8 border border-outline rounded-sm">
        <div>
          <SkeletonLine className="h-3 w-16 mb-2" />
          <SkeletonLine className="h-10 w-full" />
        </div>
        <div>
          <SkeletonLine className="h-3 w-28 mb-2" />
          <SkeletonLine className="h-10 w-full" />
        </div>
        <div className="sm:col-span-2">
          <SkeletonLine className="h-3 w-40 mb-2" />
          <SkeletonLine className="h-10 w-full" />
        </div>
        <div className="sm:col-span-2">
          <SkeletonLine className="h-3 w-20 mb-2" />
          <div className="flex items-center gap-6">
            <div className="w-32 h-20 animate-shimmer bg-surface-container border border-outline" />
            <SkeletonLine className="h-9 w-32" />
          </div>
        </div>
      </section>

      {/* Content Editor */}
      <section className="space-y-3">
        <SkeletonLine className="h-3.5 w-36 mb-2" />
        <div className="w-full h-[500px] border border-outline bg-background p-6 space-y-4 rounded-sm">
          <SkeletonLine className="h-4 w-11/12" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-4/5" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-2/3" />
        </div>
      </section>
    </div>
  );
};
