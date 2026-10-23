import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, CircleAlert, CircleCheck, MailCheck } from "lucide-react";
import { GlowOrbs } from "@/components/ui/GlowOrbs";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { FinoFace } from "@/components/ui/FinoFace";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

type Mode = "signin" | "signup" | "reset" | "confirm";

export function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  if (!authLoading && user) return <Navigate to="/" replace />;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured) {
      setError("Supabase ჯერ არ არის კონფიგურირებული. დაამატე VITE_SUPABASE_URL და VITE_SUPABASE_ANON_KEY.");
      return;
    }

    if (mode === "reset") {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      setLoading(false);
      if (error) setError(error.message);
      else setNotice("პაროლის აღდგენის ბმული გამოგზავნილია შენს ელფოსტაზე.");
      return;
    }

    if (mode === "signup") {
      if (!fullName.trim()) {
        setError("შეიყვანე სახელი");
        return;
      }
      if (password !== confirmPassword) {
        setError("პაროლები არ ემთხვევა");
        return;
      }
    }

    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) setError(error.message);
      else setMode("confirm");
    }
    setLoading(false);
  }

  async function handleResend() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    if (error) setError(error.message);
    else setNotice("წერილი თავიდან გამოგზავნილია.");
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      <GlowOrbs />
      <div className="safe-top absolute right-4 top-4 z-20 flex gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <FinoFace size={56} className="mb-4" />
          <h1 className="text-2xl font-bold text-text-primary">{t("appName")}</h1>
          <p className="mt-1 text-sm text-text-secondary">{t("tagline")}</p>
        </div>

        <div className="glass rounded-3xl border border-border-soft p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          {mode === "confirm" ? (
            <div className="flex flex-col items-center py-2 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <MailCheck size={26} />
              </span>
              <h2 className="text-lg font-bold text-text-primary">შეამოწმე შენი ელფოსტა</h2>
              <p className="mt-2 text-sm text-text-secondary">
                დასადასტურებელი ბმული გამოგზავნილია მისამართზე
                <br />
                <span className="font-medium text-text-primary">{email}</span>
              </p>
              <p className="mt-2 text-xs text-text-muted">
                ბმულზე დაჭერის შემდეგ შეძლებ შესვლას. თუ წერილი არ ჩანს, შეამოწმე spam საქაღალდე.
              </p>

              {error && (
                <div className="mt-4 flex w-full items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-left">
                  <CircleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
                  <p className="text-xs text-danger">{error}</p>
                </div>
              )}
              {notice && (
                <div className="mt-4 flex w-full items-start gap-2 rounded-xl border border-success/30 bg-success-soft px-3.5 py-2.5 text-left">
                  <CircleCheck size={15} className="mt-0.5 shrink-0 text-success" />
                  <p className="text-xs text-success">{notice}</p>
                </div>
              )}

              <Button onClick={handleResend} disabled={loading} variant="secondary" className="mt-5 w-full">
                {loading && <Loader2 size={16} className="animate-spin" />}
                წერილის თავიდან გაგზავნა
              </Button>
              <button
                onClick={() => switchMode("signin")}
                className="mt-3 text-xs text-text-muted hover:text-accent"
              >
                უკან შესვლაზე დაბრუნება
              </button>
            </div>
          ) : (
            <>
          {mode !== "reset" && (
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-bg-elevated p-1">
              <button
                onClick={() => switchMode("signin")}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  mode === "signin" ? "gradient-accent text-white" : "text-text-secondary"
                }`}
              >
                {t("signIn")}
              </button>
              <button
                onClick={() => switchMode("signup")}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  mode === "signup" ? "gradient-accent text-white" : "text-text-secondary"
                }`}
              >
                {t("signUp")}
              </button>
            </div>
          )}

          {mode === "reset" && (
            <div className="mb-5">
              <h2 className="text-lg font-bold text-text-primary">პაროლის აღდგენა</h2>
              <p className="mt-1 text-xs text-text-secondary">შეიყვანე ელფოსტა და გამოგიგზავნით აღდგენის ბმულს</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3.5 py-3 focus-within:border-accent">
                <User size={16} className="shrink-0 text-text-muted" />
                <input
                  type="text"
                  required
                  placeholder={t("fullName")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
              </div>
            )}

            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3.5 py-3 focus-within:border-accent">
              <Mail size={16} className="shrink-0 text-text-muted" />
              <input
                type="email"
                required
                placeholder={t("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>

            {mode !== "reset" && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3.5 py-3 focus-within:border-accent">
                <Lock size={16} className="shrink-0 text-text-muted" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder={t("password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3.5 py-3 focus-within:border-accent">
                <Lock size={16} className="shrink-0 text-text-muted" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder={t("confirmPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
              </div>
            )}

            {mode === "signin" && (
              <button
                type="button"
                onClick={() => switchMode("reset")}
                className="block text-right text-xs text-text-muted hover:text-accent"
              >
                {t("forgotPassword")}
              </button>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5">
                <CircleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}
            {notice && (
              <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success-soft px-3.5 py-2.5">
                <CircleCheck size={15} className="mt-0.5 shrink-0 text-success" />
                <p className="text-xs text-success">{notice}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "signin" && t("signIn")}
              {mode === "signup" && t("signUp")}
              {mode === "reset" && "ბმულის გაგზავნა"}
            </Button>

            {mode === "reset" && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="block w-full text-center text-xs text-text-muted hover:text-accent"
              >
                უკან შესვლაზე დაბრუნება
              </button>
            )}
          </form>

            </>
          )}
        </div>

        {!isSupabaseConfigured && (
          <p className="mt-5 text-center text-xs text-text-muted">
            შენიშვნა: Supabase ჯერ არ არის კონფიგურირებული. დაამატე გარემოს ცვლადები .env.local ფაილში.
          </p>
        )}
      </div>
    </div>
  );
}
