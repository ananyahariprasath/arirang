import { useTheme } from "../../context/ThemeContext";

function BattleHistoryModal({ isOpen, onClose, battles }) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-3xl border shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col
          ${theme === "light" 
            ? "bg-white border-gray-200" 
            : "bg-[#1A0B2E] border-[var(--accent)]/30 shadow-[0_0_50px_rgba(106,13,173,0.3)]"
          }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--accent)]/10 flex justify-between items-center bg-[var(--accent)]/5">
          <h2 className="text-2xl font-bold text-[var(--accent)]">Battle History</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--accent)]/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Table/List */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm uppercase tracking-wider opacity-50 border-b border-[var(--accent)]/10">
                <th className="pb-4 font-semibold">Date</th>
                <th className="pb-4 font-semibold">Time (KST)</th>
                <th className="pb-4 font-semibold">Regions</th>
                <th className="pb-4 font-semibold text-right">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--accent)]/5">
              {battles.map((battle) => (
                <tr key={battle.id} className="group hover:bg-[var(--accent)]/5 transition-colors">
                  <td className="py-4 text-sm font-medium">{battle.date}</td>
                  <td className="py-4 text-sm opacity-80">{battle.time}</td>
                  <td className="py-4 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {battle.regions.map(r => (
                        <span key={r} className="px-2 py-0.5 rounded-md bg-[var(--accent)]/10 text-[10px] uppercase font-bold text-[var(--accent)]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 text-sm font-bold text-right text-[var(--accent)]">{battle.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--accent)]/10 bg-[var(--accent)]/5 text-center">
          <p className="text-[10px] opacity-40 uppercase tracking-widest font-bold">
            Total Battles Logged: {battles.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default BattleHistoryModal;
