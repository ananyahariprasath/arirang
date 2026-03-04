import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../context/ToastContext";

const MILESTONES = [
  { id: "joined", label: "Joined Campaign", template: "I just joined the ARIRANG streaming campaign." },
  { id: "country", label: "Country Set", template: "My region is ready for ARIRANG streaming goals." },
  { id: "lastfm", label: "Last.fm Connected", template: "My Last.fm is connected and I am ready to track streams." },
  { id: "battle", label: "Battle Ready", template: "Battle setup done. Team, let us stream hard." },
  { id: "live", label: "Battle Live", template: "Battle is live now. Let us push together." },
];

export default function ShareMilestoneModal({ isOpen, onClose, user, selectedCountry, isExpired }) {
  const [milestoneId, setMilestoneId] = useState("joined");
  const [customNote, setCustomNote] = useState("");
  const [customHashtags, setCustomHashtags] = useState("");
  const [cardImageUrl, setCardImageUrl] = useState("");
  const toast = useToast();

  const selectedMilestone = useMemo(
    () => MILESTONES.find((m) => m.id === milestoneId) || MILESTONES[0],
    [milestoneId]
  );

  const hashtagsLine = useMemo(() => {
    const defaultTags = ["#ARIRANG_SPOTIFY_TAKEOVER", "#BTS", "#ARMY"];
    const extraTags = String(customHashtags || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((tag) => {
        const cleaned = tag.replace(/[^A-Za-z0-9_#]/g, "");
        if (!cleaned) return "";
        return cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
      })
      .filter(Boolean);
    return [...new Set([...defaultTags, ...extraTags])].join(" ");
  }, [customHashtags]);

  const shareText = useMemo(() => {
    const name = user?.username ? `@${user.username}` : "I";
    const countryPart = selectedCountry && selectedCountry !== "Select your Country" ? ` from ${selectedCountry}` : "";
    const statusPart = isExpired ? "Battle is live." : "Getting battle-ready.";
    const note = customNote.trim();

    return [`${name}${countryPart}: ${selectedMilestone.template}`, statusPart, note ? `Note: ${note}` : null, hashtagsLine]
      .filter(Boolean)
      .join("\n");
  }, [user?.username, selectedCountry, selectedMilestone.template, customNote, isExpired, hashtagsLine]);

  useEffect(() => {
    if (!isOpen) return;

    const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = 6) => {
      const words = String(text || "").split(" ");
      let line = "";
      let lineCount = 0;
      const lines = [];

      for (let n = 0; n < words.length; n += 1) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line.trim());
          line = `${words[n]} `;
          lineCount += 1;
          if (lineCount >= maxLines - 1) break;
        } else {
          line = testLine;
        }
      }
      if (line && lines.length < maxLines) lines.push(line.trim());

      lines.forEach((ln, idx) => {
        ctx.fillText(ln, x, y + idx * lineHeight);
      });
      return lines.length;
    };

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, "#130224");
    grad.addColorStop(0.5, "#2B0D45");
    grad.addColorStop(1, "#4B1E70");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.fillStyle = "rgba(233, 208, 255, 0.1)";
    ctx.beginPath();
    ctx.arc(940, 160, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(120, 960, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(17, 4, 31, 0.52)";
    ctx.fillRect(56, 56, 968, 968);
    ctx.strokeStyle = "rgba(243, 224, 255, 0.22)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(56, 56, 968, 968);

    const username = user?.username || "ARMY";
    const country = selectedCountry && selectedCountry !== "Select your Country" ? selectedCountry : "Global";
    const status = isExpired ? "BATTLE LIVE" : "BATTLE READY";
    const note = customNote.trim();

    ctx.fillStyle = "rgba(200, 139, 255, 0.22)";
    ctx.fillRect(92, 148, 420, 48);
    ctx.strokeStyle = "rgba(200, 139, 255, 0.58)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(92, 148, 420, 48);
    ctx.fillStyle = "#F3E0FF";
    ctx.font = "800 23px Arial";
    ctx.fillText(`# ${selectedMilestone.label.toUpperCase()}`, 112, 180);

    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(92, 226, 896, 2);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 56px Arial";
    ctx.fillText(`@${username}`, 92, 314);

    ctx.fillStyle = "#C88BFF";
    ctx.font = "800 30px Arial";
    ctx.fillText(country.toUpperCase(), 92, 360);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(92, 396, 896, 360);
    ctx.strokeStyle = "rgba(243, 224, 255, 0.24)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(92, 396, 896, 360);

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "700 46px Arial";
    const templateLines = drawWrappedText(ctx, selectedMilestone.template, 126, 478, 828, 60, 5);

    if (note) {
      ctx.fillStyle = "rgba(243, 224, 255, 0.95)";
      ctx.font = "700 28px Arial";
      drawWrappedText(ctx, `Note: ${note}`, 126, 478 + templateLines * 60 + 26, 828, 38, 4);
    }

    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(92, 806, 896, 2);

    ctx.fillStyle = "#F3E0FF";
    ctx.font = "900 33px Arial";
    ctx.fillText(status, 92, 872);

    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.font = "700 27px Arial";
    const cardHashtags = hashtagsLine.length > 64 ? `${hashtagsLine.slice(0, 61)}...` : hashtagsLine;
    ctx.fillText(cardHashtags, 92, 922);

    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "600 22px Arial";
    ctx.fillText(new Date().toLocaleString(), 92, 966);

    setCardImageUrl(canvas.toDataURL("image/png"));
  }, [isOpen, user?.username, selectedCountry, selectedMilestone.label, selectedMilestone.template, customNote, isExpired, hashtagsLine]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.show("Link copied.", "success");
    } catch {
      toast.show("Could not copy link right now.", "error");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ARIRANG Milestone",
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled share action
      }
      return;
    }
    await handleCopyLink();
    toast.show("Default share is not available here. Link copied instead.", "info");
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center px-3 py-2 sm:py-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden bg-[var(--bg-primary)] border border-[var(--accent)]/40 rounded-3xl p-4 sm:p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-black text-[var(--accent)] uppercase tracking-tight">Share Milestone</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)]/70 hover:text-[var(--accent)] transition-colors text-lg font-black"
          >
            x
          </button>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Milestone</label>
            <select
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              className="mt-1 w-full bg-[var(--card-bg)]/60 border border-[var(--accent)]/30 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--accent)]"
            >
              {MILESTONES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Custom Note (Optional)</label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={2}
              maxLength={180}
              placeholder="Add your message..."
              className="mt-1 w-full bg-[var(--card-bg)]/60 border border-[var(--accent)]/30 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--accent)] resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Additional Hashtags (Optional)</label>
            <input
              type="text"
              value={customHashtags}
              onChange={(e) => setCustomHashtags(e.target.value)}
              placeholder="#TEAMARIRANG #STREAMGOALS"
              className="mt-1 w-full bg-[var(--card-bg)]/60 border border-[var(--accent)]/30 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--card-bg)]/30 p-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1.5">Card Preview</p>
            {cardImageUrl ? (
              <img
                src={cardImageUrl}
                alt="Milestone share card preview"
                className="w-full max-h-[240px] object-contain rounded-xl border border-[var(--accent)]/20 bg-black/20"
              />
            ) : (
              <p className="text-xs font-bold opacity-70">Generating preview...</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl border border-[var(--accent)]/30 text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)]/10 transition-all"
            >
              Copy Link
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Share Milestone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
