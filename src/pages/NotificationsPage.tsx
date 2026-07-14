import { Navigate } from "react-router-dom";
import { SubPageHeader } from "@/components/ui/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/lib/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface NotificationPrefs {
  paymentReminders: boolean;
  goalMilestones: boolean;
  weeklySummary: boolean;
  productUpdates: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  paymentReminders: true,
  goalMilestones: true,
  weeklySummary: false,
  productUpdates: false,
};

const ROWS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  {
    key: "paymentReminders",
    label: "გადახდის შეხსენებები",
    description: "შეგახსენებ, როცა კალენდარში დამატებული გადახდის თარიღი უახლოვდება",
  },
  {
    key: "goalMilestones",
    label: "მიზნების პროგრესი",
    description: "შეტყობინება, როცა მიზნის მიღწევასთან ახლოს ხარ",
  },
  {
    key: "weeklySummary",
    label: "კვირის შეჯამება",
    description: "მოკლე მიმოხილვა შენი ხარჯებისა და დანაზოგის შესახებ",
  },
  {
    key: "productUpdates",
    label: "სიახლეები Fino-ს შესახებ",
    description: "ახალი ფუნქციები და გაუმჯობესებები",
  },
];

export function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <NotificationsContent />;
}

function NotificationsContent() {
  const [prefs, setPrefs] = useLocalStorage<NotificationPrefs>("fino-notification-prefs", DEFAULT_PREFS);

  return (
    <div className="space-y-5">
      <SubPageHeader title="შეტყობინებები" subtitle="აირჩიე, რისი შესახებ გინდა რომ შეგატყობინოთ" />

      <Card className="space-y-5">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-primary">{row.label}</p>
              <p className="mt-0.5 text-xs text-text-muted">{row.description}</p>
            </div>
            <Switch
              checked={prefs[row.key]}
              onChange={(checked) => setPrefs((prev) => ({ ...prev, [row.key]: checked }))}
              label={row.label}
            />
          </div>
        ))}
      </Card>

      <p className="text-center text-xs text-text-muted">
        ეს პარამეტრები ამჟამად ინახება მხოლოდ ამ მოწყობილობაზე — რეალური push შეტყობინებები მალე დაემატება.
      </p>
    </div>
  );
}
