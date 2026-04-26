"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CommentSection({ postId }) {
  const supabase = useMemo(() => createClient(), []);

  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadComments = async () => {
    setLoadingComments(true);

    const { data, error: commentsError } = await supabase
      .from("comments")
      .select(
        "id, comment_text, created_at, user:users!comments_user_id_fkey(name)",
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (commentsError) {
      setError(commentsError.message || "Failed to load comments.");
      setComments([]);
      setLoadingComments(false);
      return;
    }

    setComments(data || []);
    setLoadingComments(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadSessionAndComments = async () => {
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setCurrentUser(session?.user || null);
      }

      await loadComments();
    };

    loadSessionAndComments();

    return () => {
      isMounted = false;
    };
  }, [postId, supabase]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    const cleanComment = commentText.trim();
    if (!cleanComment) {
      setError("Comment cannot be empty.");
      return;
    }

    setSubmitting(true);
    setError("");

    const { error: insertError } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: currentUser.id,
      comment_text: cleanComment,
    });

    if (insertError) {
      setError(insertError.message || "Failed to add comment.");
      setSubmitting(false);
      return;
    }

    setCommentText("");
    await loadComments();
    setSubmitting(false);
  };

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Comments</h2>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {loadingComments ? (
        <p className="text-sm text-slate-500">Loading comments...</p>
      ) : comments.length ? (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const createdAt = comment.created_at
              ? new Date(comment.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Unknown date";

            return (
              <li
                key={comment.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">
                    {comment.user?.name || "Anonymous"}
                  </p>
                  <p className="text-xs text-slate-500">{createdAt}</p>
                </div>
                <p className="text-sm text-slate-700">{comment.comment_text}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">
          No comments yet. Start the conversation.
        </p>
      )}

      {currentUser ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 transition focus:border-slate-400 focus:ring"
            placeholder="Write your comment..."
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? "Posting..." : "Add Comment"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-600">
          <Link
            href="/login"
            className="font-medium text-slate-900 hover:underline"
          >
            Login to comment
          </Link>
        </p>
      )}
    </section>
  );
}
