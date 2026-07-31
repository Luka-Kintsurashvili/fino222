import { useEffect, useState } from "react";
import { Plus, CircleDollarSign } from "lucide-react";
import { SubPageHeader } from "@/components/ui/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { AuthGate } from "@/components/ui/AuthGate";
import { Button } from "@/components/ui/Button";
import { FundCard } from "@/components/funds/FundCard";
import { AddFundSheet } from "@/components/funds/AddFundSheet";
import { useFunds } from "@/hooks/useFunds";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { useQuickSheet } from "@/lib/QuickSheetContext";

export function FundsPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="space-y-5">
        <SubPageHeader title={t("navFunds")} subtitle={t("fundsSubtitle")} />
        <AuthGate message={t("accountsAuthGate")} />
      </div>
    );
  }

  return <FundsContent />;
}

function FundsContent() {
  const { t } = useLanguage();
  const { funds, loading, addFund, addContribution, removeFund } = useFunds();
  const [addOpen, setAddOpen] = useState(false);
  const { target, consume } = useQuickSheet();

  // Fino may have already created the fund via chat — it shows up in the list below on its own,
  // so arriving here from a chat chip just needs to clear the pending target, not reopen "add fund".
  useEffect(() => {
    if (target === "funds") consume();
  }, [target, consume]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <SubPageHeader title={t("navFunds")} subtitle={t("fundsSubtitle")} />
        <Button onClick={() => setAddOpen(true)} className="!px-3 !py-2.5">
          <Plus size={16} />
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">{t("loadingText")}</p>
      ) : funds.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <CircleDollarSign className="text-text-muted" size={26} />
          <p className="text-sm text-text-secondary">{t("noFunds")}</p>
          <p className="text-xs text-text-muted">{t("noFundsHint")}</p>
          <Button variant="secondary" className="mt-2" onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            {t("addFund")}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {funds.map((fund) => (
            <FundCard key={fund.id} fund={fund} onAddMoney={addContribution} onDelete={removeFund} />
          ))}
        </div>
      )}

      <AddFundSheet open={addOpen} onClose={() => setAddOpen(false)} onAdd={addFund} />
    </div>
  );
}
