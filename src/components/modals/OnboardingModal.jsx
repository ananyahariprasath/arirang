import { useEffect, useMemo, useRef, useState } from "react";

function StepBadge({ step, current }) {
  const active = step === current;
  return (
    <span
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border ${
        active
          ? "bg-[var(--accent)] text-black border-[var(--accent)]"
          : "bg-[var(--card-bg)]/50 text-[var(--text-secondary)] border-[var(--accent)]/20"
      }`}
    >
      {step}
    </span>
  );
}

const TOUR_STEPS = [
  {
    title: "Main Flow",
    target: "#onboarding-center-section",
    description:
      "Country selection is at the top, and timeline activity is in this center section.Check this for daily goals and streaming targets",
  },
  {
    title: "Translate",
    target: "#onboarding-header-translate",
    description:
      "Click here to translate instructions to your language.",
  },
  {
    title: "Live Battles",
    target: "#onboarding-live-battles",
    description:
      "Check this section for battle status and reset/countdown timing.",
  },
  {
    title: "Recent Battles Drawer",
    target: "#onboarding-recent-drawer",
    description:
      "This drawer shows recent battle records and outcomes.",
  },
  {
    title: "Top 10 Drawer",
    target: "#onboarding-top10-drawer",
    description:
      "This drawer shows top achievers and leaderboard data.",
  },
  {
    title: "Support Drawer",
    target: "#onboarding-support-drawer",
    description:
      "This is the support drawer. Open it whenever you need help.",
  },
];

export default function OnboardingModal({ isOpen, user, onComplete, onRemindLater, onStepChange }) {
  const [step, setStep] = useState(1);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 24, left: 12 });
  const tooltipRef = useRef(null);

  const current = TOUR_STEPS[step - 1] || TOUR_STEPS[0];
  const stepTitle = useMemo(() => current.title, [current.title]);

  useEffect(() => {
    if (!isOpen) return;
    onStepChange?.(step);
  }, [isOpen, onStepChange, step]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const updateTargetRect = () => {
      const target = document.querySelector(current.target);
      if (!target) {
        setTargetRect(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const pad = 8;
      setTargetRect({
        top: Math.max(4, rect.top - pad),
        left: Math.max(4, rect.left - pad),
        width: Math.max(0, rect.width + (pad * 2)),
        height: Math.max(0, rect.height + (pad * 2)),
      });
    };

    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [isOpen, current.target]);

  useEffect(() => {
    if (!isOpen) return;

    const placeTooltip = () => {
      const margin = 12;
      const footerSafeHeight = 120;
      const gap = 12;
      const width = tooltipRef.current?.offsetWidth || 320;
      const height = tooltipRef.current?.offsetHeight || 220;
      const maxLeft = Math.max(margin, window.innerWidth - width - margin);
      const maxTop = Math.max(margin, window.innerHeight - footerSafeHeight - height);

      if (!targetRect) {
        setTooltipStyle({ top: margin, left: margin });
        return;
      }

      const clampLeft = (value) => Math.min(maxLeft, Math.max(margin, value));
      const clampTop = (value) => Math.min(maxTop, Math.max(margin, value));
      const positions = [
        {
          top: targetRect.top + targetRect.height + gap,
          left: targetRect.left,
        },
        {
          top: targetRect.top - height - gap,
          left: targetRect.left,
        },
        {
          top: targetRect.top,
          left: targetRect.left + targetRect.width + gap,
        },
        {
          top: targetRect.top,
          left: targetRect.left - width - gap,
        },
      ];

      const overlapsTarget = (top, left) => {
        const bottom = top + height;
        const right = left + width;
        const targetBottom = targetRect.top + targetRect.height;
        const targetRight = targetRect.left + targetRect.width;
        return !(bottom <= targetRect.top || top >= targetBottom || right <= targetRect.left || left >= targetRight);
      };

      const fit = positions
        .map((pos) => ({ top: clampTop(pos.top), left: clampLeft(pos.left) }))
        .find((pos) => !overlapsTarget(pos.top, pos.left));

      if (fit) {
        setTooltipStyle(fit);
        return;
      }

      setTooltipStyle({
        top: clampTop(targetRect.top + targetRect.height + gap),
        left: clampLeft(targetRect.left),
      });
    };

    placeTooltip();
    window.addEventListener("resize", placeTooltip);
    window.addEventListener("scroll", placeTooltip, true);
    return () => {
      window.removeEventListener("resize", placeTooltip);
      window.removeEventListener("scroll", placeTooltip, true);
    };
  }, [isOpen, targetRect, step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] pointer-events-none">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />

      {targetRect && (
        <div
          className="absolute rounded-2xl border-2 border-[var(--accent)] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none"
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          }}
        />
      )}

      <div
        ref={tooltipRef}
        className="absolute w-[min(88vw,320px)] bg-[var(--bg-primary)] border border-[var(--accent)]/40 rounded-2xl p-3.5 sm:p-4 shadow-2xl pointer-events-auto"
        style={tooltipStyle}
      >
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm sm:text-base font-black text-[var(--accent)] uppercase tracking-tight">{stepTitle}</h2>
          <button
            onClick={onRemindLater}
            className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            Remind Later
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {TOUR_STEPS.map((_, idx) => (
            <StepBadge key={idx + 1} step={idx + 1} current={step} />
          ))}
        </div>

        <div className="space-y-2.5">
          <p className="text-xs sm:text-sm font-semibold">
            Hi{" "}
            <span className="px-1.5 py-0.5 rounded-md bg-[var(--accent)]/20 text-[var(--accent)] font-black">
              {user?.username || "ARMY"}
            </span>
            , let's take a quick tour.
          </p>

          <p className="text-xs sm:text-sm font-semibold opacity-90 leading-relaxed">{current.description}</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1}
            className="px-4 py-2 rounded-xl border border-[var(--accent)]/30 text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all disabled:opacity-40"
          >
            Back
          </button>
          {step < TOUR_STEPS.length ? (
            <button
              onClick={() => setStep((prev) => Math.min(TOUR_STEPS.length, prev + 1))}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Finish Tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
