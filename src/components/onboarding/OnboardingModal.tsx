import { useEffect, useState } from "react";
import { Sparkles, Wallet, Landmark, CircleCheck, X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { liabilityTypes, type LiabilityTypeKey } from "@/data/liabilityTypes";
import { useTransactions } from "@/hooks/useTransactions";
import { useLiabilities } from "@/hooks/useLiabilities";
import { useTbcConnection } from "@/hooks/useTbcConnection";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";

type Step = "welcome" | "connect" | "liability" | "done";
const STEPS: Step[] = ["welcome", "connect", "liability", "done"];
const SESSION_KEY = "fino-onboarding-seen";

export function OnboardingModal() {
  const { user } = useAuth();
  const { transactions, loading: txLoading } = useTransactions();
  const { addLiability } = useLiabilities();
  const { connect: connectTbc, sync: syncTbc } = useTbcConnection();
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [submitting, setSubmitting] = useState(false);
  const [connected, setConnected] = useState(false);

  const [liabilityType, setLiabilityType] = useState<LiabilityTypeKey>(liabilityTypes[0].key);
  const [liabilityName, setLiabilityName] = useState("");
  const [liabilityAmount, setLiabilityAmount] = useState(0);

  useEffect(() => {
    if (!user || txLoading) return;
    const hasIncome = transactions.some((tr) => tr.type === "income");
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (!hasIncome && !seen) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [user, txLoading]);

  if (!open) return null;

  function goNext() {
    setStep((prev) => STEPS[Math.min(STEPS.indexOf(prev) + 1, STEPS.length - 1)]);
  }

  function handleClose() {
    setOpen(false);
    window.location.reload();
  }

  async function handleConnectSubmit() {
    setSubmitting(true);
    const error = await connectTbc();
    if (!error) {
      await syncTbc();
      setConnected(true);
    }
    setSubmitting(false);
  }

  async function handleLiabilitySubmit() {
    if (liabilityAmount > 0) {
      setSubmitting(true);
      const typeLabel = liabilityTypes.find((l) => l.key === liabilityType)!.label;
      await addLiability({ name: liabilityName.trim() || typeLabel, type: liabilityType, amount: liabilityAmount });
      setSubmitting(false);
    }
    goNext();
  }

  const showDots = step !== "welcome" && step !== "done";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="safe-top safe-bottom relative w-full max-w-md rounded-3xl border border-border bg-bg-elevated shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)]">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-text-muted hover:bg-surface hover:text-text-primary"
          aria-label={t("skip")}
        >
          <X size={18} />
        </button>

        {showDots && (
          <div className="flex items-center justify-center gap-1.5 pt-6">
            {STEPS.slice(1, -1).map((s) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all ${s === step ? "w-5 bg-accent" : "w-1.5 bg-border"}`}
              />
            ))}
          </div>
        )}

        <div className="p-6">
          {step === "welcome" && (
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent text-white">
                <Sparkles size={26} />
              </span>
              <h2 className="text-xl font-bold text-text-primary">{t("onboardingWelcomeTitle")}</h2>
              <p className="mt-2 text-sm text-text-secondary">{t("onboardingWelcomeBody")}</p>
              <div className="mt-6 flex flex-col gap-2">
                <Button className="w-full" onClick={goNext}>
                  {t("onboardingStart")}
                </Button>
                <Button variant="ghost" className="w-full" onClick={handleClose}>
                  {t("skip")}
                </Button>
              </div>
            </div>
          )}

          {step === "connect" && (
            <div>
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Wallet size={20} />
              </span>
              <h2 className="text-lg font-bold text-text-primary">{t("onboardingConnectTitle")}</h2>
              <p className="mt-1 text-sm text-text-secondary">{t("onboardingConnectBody")}</p>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  {connected ? <CircleCheck size={18} /> : <Link2 size={18} />}
                </span>
                <p className="text-sm font-medium text-text-primary">
                  {connected ? t("onboardingConnected") : submitting ? t("onboardingConnecting") : t("connectTbc")}
                </p>
              </div>

              <div className="mt-6 flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={goNext}>
                  {connected ? t("next") : t("skip")}
                </Button>
                {!connected && (
                  <Button className="flex-1" onClick={handleConnectSubmit} disabled={submitting}>
                    {t("connectTbc")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === "liability" && (
            <div>
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
                <Landmark size={20} />
              </span>
              <h2 className="text-lg font-bold text-text-primary">{t("onboardingLiabilityTitle")}</h2>
              <p className="mt-1 text-sm text-text-secondary">{t("onboardingLiabilityBody")}</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {liabilityTypes.map((lt) => {
                  const active = lt.key === liabilityType;
                  const Icon = lt.icon;
                  return (
                    <button
                      key={lt.key}
                      type="button"
                      onClick={() => setLiabilityType(lt.key)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                        active ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent/30"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          active ? "gradient-accent text-white" : "bg-bg-elevated text-text-secondary"
                        }`}
                      >
                        <Icon size={15} />
                      </span>
                      <span className={`text-xs font-medium ${active ? "text-text-primary" : "text-text-secondary"}`}>
                        {lt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 space-y-3">
                <TextField label={t("liabilityName")} value={liabilityName} onChange={setLiabilityName} placeholder={t("liabilityNamePlaceholder")} />
                <NumberField label={t("amount")} value={liabilityAmount} onChange={setLiabilityAmount} suffix="₾" step={100} />
              </div>

              <div className="mt-6 flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={goNext}>
                  {t("skip")}
                </Button>
                <Button className="flex-1" onClick={handleLiabilitySubmit} disabled={submitting}>
                  {t("finish")}
                </Button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success">
                <CircleCheck size={28} />
              </span>
              <h2 className="text-xl font-bold text-text-primary">{t("onboardingDoneTitle")}</h2>
              <p className="mt-2 text-sm text-text-secondary">{t("onboardingDoneBody")}</p>
              <Button className="mt-6 w-full" onClick={handleClose}>
                {t("onboardingFinish")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
