import Link from "next/link";
import PostCard from "@/components/PostCard";
import { createClient } from "@/lib/supabase/server";

const POSTS_PER_PAGE = 6;

export default async function DashboardPage({ searchParams }) {
  const supabase = await createClient();
  const params = (await searchParams) || {};

  const query = typeof params.query === "string" ? params.query.trim() : "";
  const pageParam = Number.parseInt(params.page || "1", 10);
  const currentPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const from = (currentPage - 1) * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  let postsQuery = supabase
    .from("posts")
    .select(
      "id, title, image_url, summary, created_at, author:users!posts_author_id_fkey(name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query) {
    postsQuery = postsQuery.ilike("title", `%${query}%`);
  }

  const { data: posts, error, count } = await postsQuery;

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        Failed to load posts. Please refresh and try again.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil((count || 0) / POSTS_PER_PAGE));
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const buildPageHref = (pageNumber) => {
    const nextParams = new URLSearchParams();

    if (query) {
      nextParams.set("query", query);
    }

    if (pageNumber > 1) {
      nextParams.set("page", String(pageNumber));
    }

    const queryString = nextParams.toString();
    return queryString ? `/dashboard?${queryString}` : "/dashboard";
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <form method="GET" action="/dashboard" className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search posts by title..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 transition focus:border-slate-400 focus:ring"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Search
          </button>
          {query ? (
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </section>

      {posts?.length ? (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          No posts found.
        </div>
      )}

      <section className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Link
          href={buildPageHref(currentPage - 1)}
          aria-disabled={!hasPrevious}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            hasPrevious
              ? "border border-slate-300 text-slate-700 hover:bg-slate-100"
              : "cursor-not-allowed border border-slate-200 text-slate-400"
          }`}
        >
          Previous
        </Link>

        <p className="text-sm text-slate-600">
          Page {currentPage} of {totalPages}
        </p>

        <Link
          href={buildPageHref(currentPage + 1)}
          aria-disabled={!hasNext}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            hasNext
              ? "border border-slate-300 text-slate-700 hover:bg-slate-100"
              : "cursor-not-allowed border border-slate-200 text-slate-400"
          }`}
        >
          Next
        </Link>
      </section>
    </div>
  );
}
