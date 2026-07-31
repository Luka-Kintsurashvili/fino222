import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CircleCheck, CircleAlert } from "lucide-react";
import { GlowOrbs } from "@/components/ui/GlowOrbs";
import { FinoFace } from "@/components/ui/FinoFace";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";

type Status = "working" | "success" | "error";

export function TbcCallbackPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("working");
  const [error, setError] = useState<string | null>(null);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code || !state) {
      setStatus("error");
      setError(t("tbcCallbackError"));
      return;
    }

    (async () => {
      const { error: fnError } = await supabase.functions.invoke("tbc-consent-callback", { body: { code, state } });
      if (fnError) {
        const context = (fnError as { context?: unknown }).context;
        let detail = fnError.message;
        if (context instanceof Response) {
          const body = await context.clone().json().catch(() => null);
          if (body?.error) detail = body.error;
        }
        setStatus("error");
        setError(detail || t("tbcCallbackError"));
        return;
      }
      setStatus("success");
    })();
  }, [searchParams, t]);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      <GlowOrbs />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <FinoFace size={56} className="mb-4" />
        </div>
        <div className="glass flex flex-col items-center rounded-3xl border border-border-soft p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          {status === "working" && (
            <>
              <Loader2 size={28} className="mb-4 animate-spin text-accent" />
              <p className="text-sm text-text-secondary">{t("tbcCallbackWorking")}</p>
            </>
          )}
          {status === "success" && (
            <>
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success">
                <CircleCheck size={26} />
              </span>
              <p className="text-sm text-text-primary">{t("tbcCallbackSuccess")}</p>
              <Button onClick={() => navigate("/wallet", { replace: true })} className="mt-5 w-full">
                {t("backToWallet")}
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
                <CircleAlert size={26} />
              </span>
              <p className="text-sm text-danger">{error}</p>
              <Button onClick={() => navigate("/wallet", { replace: true })} variant="secondary" className="mt-5 w-full">
                {t("backToWallet")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
