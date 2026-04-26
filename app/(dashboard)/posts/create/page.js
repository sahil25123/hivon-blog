"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";
import { generateSummary } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/client";

function CreatePostForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("You must be logged in to create a post.");
      }

      const cleanTitle = title.trim();
      const cleanBody = body.trim();

      if (!cleanTitle || !cleanBody) {
        throw new Error("Title and body are required.");
      }

      let imageUrl = null;

      if (imageFile) {
        const extension = imageFile.name.split(".").pop() || "jpg";
        const filePath = `${session.user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error(uploadError.message || "Image upload failed.");
        }

        const { data: publicUrlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData?.publicUrl || null;
      }

      const summary = await generateSummary(cleanBody);

      const { error: insertError } = await supabase.from("posts").insert({
        title: cleanTitle,
        body: cleanBody,
        image_url: imageUrl,
        summary,
        author_id: session.user.id,
      });

      if (insertError) {
        throw new Error(insertError.message || "Failed to create post.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message || "Something went wrong while creating the post.");
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Create New Post</h1>
      <p className="mt-2 text-sm text-slate-600">
        Write your content, upload an image, and we will generate an AI summary on creation.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 transition focus:border-slate-400 focus:ring"
            placeholder="Post title"
          />
        </div>

        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-medium text-slate-700">
            Body
          </label>
          <textarea
            id="body"
            required
            rows={12}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 transition focus:border-slate-400 focus:ring"
            placeholder="Write your blog post here..."
          />
        </div>

        <div>
          <label htmlFor="image" className="mb-1 block text-sm font-medium text-slate-700">
            Featured Image
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700"
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Creating post..." : "Create Post"}
        </button>
      </form>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <RoleGuard allowedRoles={["author", "admin"]}>
      <CreatePostForm />
    </RoleGuard>
  );
}
