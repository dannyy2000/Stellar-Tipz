import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, X, Trophy, Sparkles } from 'lucide-react';
import { useDashboardContext } from './DashboardContext';
import type { Profile } from '@/types/contract';

const DISMISSED_KEY = 'tipz_profile_completion_dismissed';

interface ChecklistDef {
  key: string;
  label: string;
  complete: (profile: Profile) => boolean;
}

const ITEMS: ChecklistDef[] = [
  {
    key: 'displayName',
    label: 'Add display name',
    complete: (p) => !!p.displayName?.trim(),
  },
  {
    key: 'bio',
    label: 'Write your bio',
    complete: (p) => !!p.bio?.trim(),
  },
  {
    key: 'avatar',
    label: 'Upload avatar',
    complete: (p) => {
      if (p.imageUrl?.trim()) return true;
      const avatar = (p as Record<string, unknown>).avatar;
      return typeof avatar === 'string' && avatar.trim().length > 0;
    },
  },
  {
    key: 'xHandle',
    label: 'Connect X handle',
    complete: (p) => !!p.xHandle?.trim(),
  },
  {
    key: 'username',
    label: 'Set username',
    complete: (p) => !!p.username?.trim(),
  },
];

function calcPercent(profile: Profile): number {
  const done = ITEMS.filter((item) => item.complete(profile)).length;
  return Math.round((done / ITEMS.length) * 100);
}

const ProfileCompletion: React.FC = () => {
  const { profile } = useDashboardContext();
  const [dismissed, setDismissed] = useState(
    () => window.localStorage.getItem(DISMISSED_KEY) === 'true',
  );

  if (!profile || dismissed) return null;

  const percent = calcPercent(profile);
  const isComplete = percent >= 100;
  const completed = ITEMS.filter((item) => item.complete(profile));
  const missing = ITEMS.filter((item) => !item.complete(profile));

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="relative border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 p-1 hover:opacity-60"
        aria-label="Dismiss profile completion"
      >
        <X size={18} />
      </button>

      {isComplete ? (
        <div className="space-y-4 text-center">
          <div className="flex justify-center gap-1 text-3xl" role="img" aria-label="celebration">
            <Sparkles size={28} className="text-yellow-400" />
            <Trophy size={28} className="text-yellow-500" />
            <Sparkles size={28} className="text-yellow-400" />
          </div>
          <p className="text-lg font-black uppercase tracking-wide text-green-600">
            Profile Complete!
          </p>
          <p className="text-sm font-bold text-gray-600">
            Your profile is fully set up and ready to receive tips.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                Profile Completion
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete your profile to get discovered
              </p>
            </div>
            <span className="text-2xl font-black">{percent}%</span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Profile ${percent}% complete`}
            className="h-3 w-full border-2 border-black bg-gray-100"
          >
            <div
              className="h-full bg-blue-400 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="text-xs font-bold text-gray-600">
            {completed.length} of {ITEMS.length} items complete
          </p>

          <ul className="space-y-1">
            {ITEMS.map((item) => {
              const done = item.complete(profile);
              return (
                <li key={item.key}>
                  {done ? (
                    <span className="flex items-center gap-2 text-sm text-gray-400 line-through">
                      <Check size={14} className="text-green-500" />
                      {item.label.replace(/^Add |^Write |^Upload |^Connect /, '')}
                    </span>
                  ) : (
                    <Link
                      to="/profile/edit"
                      className="flex items-center gap-2 text-sm font-bold text-blue-600 underline decoration-2 underline-offset-2 hover:text-blue-800"
                    >
                      <ChevronRight size={14} className="shrink-0" />
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {missing.length > 0 && (
            <p className="text-xs text-gray-400 italic">
              Completing all items helps you get discovered by potential supporters.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileCompletion;
