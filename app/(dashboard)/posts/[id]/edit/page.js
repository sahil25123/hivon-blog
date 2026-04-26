"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const postId = params?.id;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!postId) {
      return;
    }

    let isMounted = true;

    const loadPost = async () => {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      const { data: post, error: postError } = await supabase
        .from("posts")
        .select("id, title, body, author_id")
        .eq("id", postId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (postError || !post) {
        setError("Post not found.");
        setLoading(false);
        return;
      }

      const role = profile?.role || "viewer";
      const isAdmin = role === "admin";
      const isAuthorOwner =
        role === "author" && post.author_id === session.user.id;

      if (!isAdmin && !isAuthorOwner) {
        router.replace("/dashboard");
        return;
      }

      setTitle(post.title || "");
      setBody(post.body || "");
      setLoading(false);
    };

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [postId, router, supabase]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!cleanTitle || !cleanBody) {
      setError("Title and body are required.");
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        title: cleanTitle,
        body: cleanBody,
      })
      .eq("id", postId);

    if (updateError) {
      setError(updateError.message || "Failed to update post.");
      setSubmitting(false);
      return;
    }

    setSuccess("Post updated successfully. Redirecting...");
    setSubmitting(false);

    setTimeout(() => {
      router.push(`/dashboard/posts/${postId}`);
      router.refresh();
    }, 900);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading post...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Edit Post</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 transition focus:border-slate-400 focus:ring"
          />
        </div>

        <div>
          <label
            htmlFor="body"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Body
          </label>
          <textarea
            id="body"
            required
            rows={12}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 transition focus:border-slate-400 focus:ring"
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
