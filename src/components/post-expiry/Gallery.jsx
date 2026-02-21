import { useState, useEffect, useCallback } from "react";
import useGalleryData from "../../hooks/useGalleryData";

// Kanban column layouts per breakpoint
// Format: [grow, "portrait" | "landscape" | "any"]
// Desktop: 4 cols, ~3-4 slots each; Mobile: 3 cols, 3 slots each
const DESKTOP_COLS = [
  [[3, "square"], [4, "portrait"], [2, "landscape"], [2, "square"]],
  [[4, "portrait"], [3, "square"], [3, "portrait"], [3, "landscape"]],
  [[4, "landscape"], [5, "square"], [4, "portrait"]],
  [[3, "portrait"], [3, "landscape"], [3, "square"], [4, "landscape"]],
];
const MOBILE_COLS = [
  [[4, "portrait"], [3, "square"], [3, "landscape"]],
  [[3, "landscape"], [4, "portrait"], [4, "square"]],
  [[3, "square"], [4, "landscape"], [3, "portrait"]],
];

const TOTAL_CELLS = 15; // Desktop uses 15 slots, mobile uses first 9
const CYCLE_INTERVAL = 5000;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Maps flat array index to its layout slot config
const GET_SLOT_TYPE = (idx, isMobile) => {
  const layout = isMobile ? MOBILE_COLS : DESKTOP_COLS;
  let flat = 0;
  for (const col of layout) {
    for (const [, type] of col) {
      if (flat === idx) return type;
      flat++;
    }
  }
  return "any";
};

/** Pick initial images respecting slot orientation. */
function pickInitial(pool, isMobile) {
  if (!pool || pool.length === 0) return [];
  const s = shuffle(pool);
  const result = [];
  
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const type = GET_SLOT_TYPE(i, isMobile);
    
    // Find first image matching orientation not already picked
    const matchIdx = s.findIndex(img => {
      if (result.includes(img.src)) return false;
      if (type === "any") return true;
      return img.type === type;
    });

    if (matchIdx !== -1) {
      result.push(s[matchIdx].src);
      s.splice(matchIdx, 1);
    } else {
      // Fallback: pick any unused image if we ran out of that specific orientation
      const fb = s.findIndex(img => !result.includes(img.src));
      if (fb !== -1) {
        result.push(s[fb].src);
        s.splice(fb, 1);
      } else {
        result.push(""); // Complete pool exhaustion fallback
      }
    }
  }
  
  return result;
}

// --- Lightbox ---
function Lightbox({ src, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] w-full animate-in zoom-in-90 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt=""
          className="w-full h-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
        />
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-black/60 hover:bg-black/90 text-white rounded-full text-lg font-black transition-all active:scale-90"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// --- Single image tile ---
function GalleryTile({ src, grow, isFading, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-xl cursor-pointer select-none"
      style={{ flex: grow }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={src}
        alt=""
        className={`w-full h-full object-cover transition-all duration-500 ${
          isFading ? "opacity-0 scale-105" : "opacity-100 scale-100"
        } ${hovered ? "scale-105 brightness-110" : ""}`}
        loading="lazy"
      />
      {/* hover overlay */}
      <div className={`absolute inset-0 transition-all duration-300 rounded-xl pointer-events-none
        ${hovered ? "bg-[var(--accent)]/15 ring-2 ring-[var(--accent)]/40" : "bg-[var(--accent)]/5"}`}
      />
      {/* zoom icon on hover */}
      {hovered && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-xl">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Gallery ---
function Gallery() {
  const { galleryImages, loading } = useGalleryData();
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [cells, setCells] = useState([]);
  const [fading, setFading] = useState(new Set());
  const [lightbox, setLightbox] = useState(null); // src string or null

  // Initialize gallery when images load
  useEffect(() => {
    if (!loading && galleryImages.length > 0) {
      setCells(pickInitial(galleryImages, isMobile));
    }
  }, [galleryImages, loading, isMobile]);

  // Detect screen size
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Random image cycling
  useEffect(() => {
    if (loading || galleryImages.length === 0) return;

    const timer = setInterval(() => {
      setCells(prev => {
        if (prev.length === 0) return prev;

        // Pick a random cell to replace
        const cellIdx = Math.floor(Math.random() * TOTAL_CELLS);
        const cellType = GET_SLOT_TYPE(cellIdx, isMobile);

        // Build set of images currently visible (excluding the one being replaced)
        const visible = new Set(prev.filter((_, i) => i !== cellIdx));

        // Candidates: Filter by orientation and uniqueness
        let candidates = galleryImages.filter(img => {
          if (visible.has(img.src)) return false;
          if (cellType === "any") return true;
          return img.type === cellType;
        });

        // Fallback 1: if no orientation matches, use any unused image
        if (candidates.length === 0) {
          candidates = galleryImages.filter(img => !visible.has(img.src));
        }
        // Fallback 2: if all images are shown somehow, use the whole pool
        if (candidates.length === 0) {
          candidates = galleryImages;
        }

        // Fade out
        setFading(f => new Set(f).add(cellIdx));

        setTimeout(() => {
          const newImg = candidates[Math.floor(Math.random() * candidates.length)];
          setCells(c => {
            const next = [...c];
            next[cellIdx] = newImg.src;
            return next;
          });
          setFading(f => {
            const next = new Set(f);
            next.delete(cellIdx);
            return next;
          });
        }, 500);

        return prev; // no immediate change; the real update is inside setTimeout
      });
    }, CYCLE_INTERVAL);

    return () => clearInterval(timer);
  }, [galleryImages, loading, isMobile]);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  if (loading || cells.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-[var(--accent)] opacity-50 text-xs tracking-widest uppercase">Loading Gallery...</div>;
  }

  // Build column structure based on screen size
  const layout = isMobile ? MOBILE_COLS : DESKTOP_COLS;
  let flatIdx = 0;
  const columns = layout.map(slots => {
    const col = slots.map(([grow, type]) => ({ grow, type, idx: flatIdx++ }));
    return col;
  });

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in zoom-in-95 duration-1000">
      <div className="flex gap-1.5 flex-1 min-h-0 overflow-hidden w-full">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1.5 flex-1 h-full min-w-0">
            {col.map(({ grow, idx }) => (
              <GalleryTile
                key={idx}
                src={cells[idx]}
                grow={grow}
                isFading={fading.has(idx)}
                onClick={() => setLightbox(cells[idx])}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Disclaimer */}
      <p className="text-[9px] text-center opacity-40 mt-1.5 font-medium px-4">
        * The images in the website don't belong to us. Rightful credits to charity organizers and the owners of the images above.
      </p>

      {/* Lightbox overlay */}
      {lightbox && <Lightbox src={lightbox} onClose={closeLightbox} />}
    </div>
  );
}

export default Gallery;
