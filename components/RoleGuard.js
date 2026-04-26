"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RoleGuard({ allowedRoles = [], children }) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  const allowedRolesKey = allowedRoles.join("|");

  useEffect(() => {
    let isMounted = true;

    const checkRole = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (isMounted) {
          setIsAllowed(false);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      const role = data?.role || "viewer";

      if (isMounted) {
        setIsAllowed(allowedRoles.includes(role));
        setLoading(false);
      }
    };

    checkRole();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, allowedRolesKey, supabase]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Checking access...
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-800">Unauthorized</h2>
        <p className="mt-2 text-sm text-rose-700">
          You do not have permission to view this page.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-800 transition hover:bg-rose-100"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return children;
}
