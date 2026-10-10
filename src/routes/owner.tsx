import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Check, LogOut, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { dayLabel, timeLabel } from "@/lib/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner Dashboard — Leo's Cutz" },
      { name: "description", content: "Private dashboard to review and manage booked appointments at Leo's Cutz." },
      { property: "og:title", content: "Owner Dashboard — Leo's Cutz" },
      { property: "og:description", content: "Review and manage booked appointments." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Owner,
});

type Appointment = {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  service: string;
  created_at: string;
  appointment_date: string | null;
  appointment_time: string | null;
  notes: string | null;
  status: string;
};

function Owner() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="mx-auto max-w-4xl px-6 py-14">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-black uppercase">
            Leo's Cutz
          </Link>
          {session && (
            <Button variant="secondary" size="sm" onClick={() => supabase.auth.signOut()}>
              <LogOut /> Sign out
            </Button>
          )}
        </div>
        {!ready ? null : session ? <Appointments /> : <AuthCard />}
      </div>
    </div>
  );
}

function AuthCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/owner` },
          });
    setBusy(false);
    if (error) toast.error(error.message);
    else if (mode === "up") toast.success("Account created. You can sign in now.");
  };

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-xl border border-border bg-card p-8">
      <h1 className="text-3xl">Owner {mode === "in" ? "login" : "signup"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Private area — only you should have an account here.
      </p>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <div>
          <Label htmlFor="email" className="mb-2 block">
            Email
          </Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password" className="mb-2 block">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "in" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <button
        type="button"
        className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
      >
        {mode === "in" ? "First time? Create your account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

function Appointments() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Appointment[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-10">
      <h1 className="text-4xl">Appointments</h1>
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!isLoading && data.length === 0 && (
        <p className="mt-6 text-muted-foreground">No appointments yet.</p>
      )}
      <div className="mt-6 space-y-3">
        {data.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5"
          >
            <div>
              <p className="font-display text-lg">
                {a.appointment_date && a.appointment_time
                  ? `Wants ${dayLabel(a.appointment_date)} at ${timeLabel(a.appointment_time)}`
                  : "No time picked"}
              </p>
              <p className="text-sm text-muted-foreground">
                Sent {new Date(a.created_at).toLocaleString("en-US")}
              </p>
              <p className="text-sm text-muted-foreground">
                {a.client_name} · {a.client_phone}
                {a.client_email ? ` · ${a.client_email}` : ""} · {a.service}
              </p>
              {a.notes && <p className="mt-1 text-sm text-muted-foreground">“{a.notes}”</p>}
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  a.status === "confirmed"
                    ? "bg-secondary text-secondary-foreground"
                    : a.status === "cancelled"
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground"
                }`}
              >
                {a.status}
              </span>
            </div>
            <div className="flex gap-2">
              {a.status !== "confirmed" && (
                <Button size="sm" onClick={() => update.mutate({ id: a.id, status: "confirmed" })}>
                  <Check /> Confirm
                </Button>
              )}
              {a.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => update.mutate({ id: a.id, status: "cancelled" })}
                >
                  Cancel
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(a.id)}>
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}