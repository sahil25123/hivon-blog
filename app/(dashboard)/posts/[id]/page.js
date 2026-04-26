import CommentSection from "@/components/CommentSection";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_IMAGE = "https://placehold.co/1600x800?text=No+Image";

export default async function PostDetailsPage({ params }) {
  const resolvedParams = await params;
  const postId = resolvedParams?.id;

  if (!postId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
        Post not found.
      </div>
    );
  }

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select(
      "id, title, body, image_url, summary, created_at, author:users!posts_author_id_fkey(name)",
    )
    .eq("id", postId)
    .maybeSingle();

  if (error || !post) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
        Post not found.
      </div>
    );
  }

  const createdAt = post.created_at
    ? new Date(post.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown date";

  return (
    <div className="space-y-8">
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="w-full bg-slate-100">
          <img
            src={post.image_url || FALLBACK_IMAGE}
            alt={post.title}
            className="h-auto w-full object-cover"
          />
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {post.title}
            </h1>
            <p className="text-sm text-slate-500">
              By {post.author?.name || "Unknown author"} on {createdAt}
            </p>
          </header>

          <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
              AI Summary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-sky-900">
              {post.summary || "No summary available for this post."}
            </p>
          </section>

          <section className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-800">
            {post.body}
          </section>
        </div>
      </article>

      <CommentSection postId={post.id} />
    </div>
  );
}
