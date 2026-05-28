import React from "react";
import { Calendar, Clock, Trash2, RefreshCw } from "lucide-react";

import { useI18n } from "@/i18n";
import { useContract } from "@/hooks/useContract";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useToastStore } from "@/store/toastStore";
import { stroopToXlm } from "@/helpers/format";
import { Subscription } from "@/types/contract";
import Button from "@/components/ui/Button";

interface SubscriptionCardProps {
  subscription: Subscription;
  creatorName?: string;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  creatorName,
}) => {
  const { t } = useI18n();
  const { cancelSubscription, executeDueSubscription, loading } = useContract();
  const { removeSubscription, processingId } = useSubscriptionStore();
  const addToast = useToastStore((s) => s.addToast);

  const xlmAmount = stroopToXlm(subscription.amount);
  const isProcessing = processingId === subscription.creator;
  const now = Math.floor(Date.now() / 1000);
  const isDue = now >= subscription.nextDue;
  const daysUntilDue = Math.max(
    0,
    Math.ceil((subscription.nextDue - now) / 86400),
  );

  const frequencyLabel =
    subscription.intervalDays <= 7
      ? t("subs.weekly")
      : t("subs.monthly");

  const handleCancel = async () => {
    try {
      await cancelSubscription(subscription.creator);
      removeSubscription(subscription.creator);
      addToast({
        message: t("subs.cancelSuccess"),
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : "Failed to cancel subscription",
        type: "error",
      });
    }
  };

  const handleProcessTip = async () => {
    try {
      await executeDueSubscription(subscription.creator);
      addToast({
        message: t("subs.tipProcessed"),
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : "Failed to process recurring tip",
        type: "error",
      });
    }
  };

  return (
    <div
      className={`border-3 bg-white p-4 shadow-brutalist dark:bg-black dark:text-white ${
        isDue
          ? "border-yellow-400 dark:border-yellow-400"
          : "border-black dark:border-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black uppercase">
              {creatorName ||
                `${subscription.creator.slice(0, 6)}...${subscription.creator.slice(-6)}`}
            </h3>
            <span className="rounded-full border border-black bg-yellow-300 px-2 py-0.5 text-[10px] font-black uppercase dark:text-black">
              {frequencyLabel}
            </span>
          </div>

          <p className="text-xl font-black tabular-nums">
            {xlmAmount} XLM
          </p>

          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
            <Clock size={12} />
            {isDue ? (
              <span className="text-yellow-600 dark:text-yellow-300">
                {t("subs.dueNow")}
              </span>
            ) : (
              <span>{t("subs.dueIn", { days: String(daysUntilDue) })}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isDue && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleProcessTip}
              disabled={loading || isProcessing}
              icon={isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Calendar size={14} />}
            >
              {isProcessing ? t("subs.processingTip") : t("subs.processTip")}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={loading || isProcessing}
            icon={<Trash2 size={14} />}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            {t("subs.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCard;
