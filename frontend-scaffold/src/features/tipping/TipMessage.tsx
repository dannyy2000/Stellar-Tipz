import React from "react";
import { Lock } from "lucide-react";
import { sanitizePlainText } from "@/helpers/sanitize";

interface TipMessageProps {
  message: string;
  className?: string;
  isEncrypted?: boolean;
}

const TipMessage: React.FC<TipMessageProps> = ({ message, className, isEncrypted }) => {
  if (isEncrypted && message) {
    return (
      <p className={className ?? "flex items-center gap-1 text-sm text-gray-500 italic"}>
        <Lock size={14} className="text-amber-600" />
        Message encrypted
      </p>
    );
  }
  const safe = sanitizePlainText(message);
  if (!safe) return null;
  return (
    <p className={className ?? "text-sm text-gray-700 break-words"}>{safe}</p>
  );
};

export default TipMessage;
