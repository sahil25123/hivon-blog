import Link from "next/link";

const FALLBACK_IMAGE = "https://placehold.co/1200x630?text=No+Image";

export default function PostCard({ post }) {
  const createdAt = post?.created_at
    ? new Date(post.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown date";

  const authorName = post?.author?.name || "Unknown author";

  return (
    <Link
      href={`/dashboard/posts/${post.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={post.image_url || FALLBACK_IMAGE}
          alt={post.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="space-y-3 p-5">
        <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">
          {post.title}
        </h2>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{authorName}</span>
          <span>{createdAt}</span>
        </div>

        <p className="line-clamp-2 text-sm text-slate-600">
          {post.summary || "No summary available for this post yet."}
        </p>
      </div>
    </Link>
  );
}
