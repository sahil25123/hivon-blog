"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ROLE_BADGE_STYLES = {
  viewer: "bg-slate-100 text-slate-700",
  author: "bg-sky-100 text-sky-700",
  admin: "bg-amber-100 text-amber-800",
};

export default function Navbar() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      const user = session?.user || null;
      setSessionUser(user);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      setProfile(data || null);
      setLoading(false);
    };

    loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadCurrentUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const role = profile?.role || "viewer";
  const roleBadgeClass = ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.viewer;
  const canCreatePost = role === "author" || role === "admin";

  const displayName =
    profile?.name ||
    sessionUser?.user_metadata?.name ||
    sessionUser?.email?.split("@")[0] ||
    "User";

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Hivon Blog
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : sessionUser ? (
            <>
              {canCreatePost ? (
                <Link
                  href="/dashboard/posts/create"
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Create Post
                </Link>
              ) : null}

              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm font-medium text-slate-700">
                  {displayName}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleBadgeClass}`}
                >
                  {role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
