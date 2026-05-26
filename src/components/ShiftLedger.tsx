import React from "react";
import { ApartmentWalkthrough } from "../types";
import { Copy, Check, Clock, Calendar, CheckSquare, AlertTriangle, Hammer, X } from "lucide-react";

interface ShiftLedgerProps {
  walkthroughs: Record<string, ApartmentWalkthrough>;
  isOpen: boolean;
  onClose: () => void;
  onRestartShift: () => void;
}

export const ShiftLedger: React.FC<ShiftLedgerProps> = ({
  walkthroughs,
  isOpen,
  onClose,
  onRestartShift,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const walks = Object.values(walkthroughs) as ApartmentWalkthrough[];
  const totalWalks = walks.length;

  const finishedApts = walks.filter((w) => w.status === "Finished").map((w) => w.aptNumber);
  const activeApts = walks.filter((w) => w.status === "In Progress").map((w) => w.aptNumber);

  // Collect all items flagged as Needs Repair across ALL active/inactive walks
  const allShiftRepairs = walks.flatMap((w) =>
    w.rooms.flatMap((r) =>
      r.items
        .filter((i) => i.status === "Needs Repair")
        .map((i) => ({ ...i, aptNumber: w.aptNumber, roomName: r.name }))
    )
  );

  const urgentRepairs = allShiftRepairs.filter((r) => r.priority === "Urgent");
  const standardRepairs = allShiftRepairs.filter((r) => r.priority === "Standard");

  // Total OK items completed today
  const totalCompletedOkCount = walks.reduce(
    (sum, w) =>
      sum +
      w.rooms.reduce(
        (roomSum, r) => roomSum + r.items.filter((i) => i.status === "OK").length,
        0
      ),
    0
  );

  const shiftTimeTotal = walks.reduce((sum, w) => sum + w.timeEstimateTotal, 0);

  // Collect all materials needed total
  const totalMaterials = Array.from(
    new Set(allShiftRepairs.flatMap((r) => r.materialsNeeded || []))
  ).filter(Boolean);

  const generateReportText = () => {
    let report = `📋 *MEADOWOOD VILLAGE - DAILY SHIFT REPORT*\n`;
    report += `Date: ${new Date().toLocaleDateString()} (Walkthrough Assistant Console)\n`;
    report += `──────────────────────────────────────────\n\n`;

    report += `📈 *WORK SUMMARY:*\n`;
    report += `- Apartments Inspected: ${totalWalks} (${finishedApts.length} Finished, ${activeApts.length} In Progress)\n`;
    report += `- Inspected Apts: ${walks.map((w) => `Apt ${w.aptNumber}`).join(", ") || "None"}\n`;
    report += `- Confirmed OK/Make-Ready Items: ${totalCompletedOkCount}\n`;
    report += `- Total Remaining Repair Workload: ${allShiftRepairs.length} items (~${shiftTimeTotal} mins)\n\n`;

    if (urgentRepairs.length > 0) {
      report += `🚨 *CRITICAL UNRESOLVED TASKS (DO BEFORE LEASING):*\n`;
      urgentRepairs.forEach((u) => {
        report += `- [Apt ${u.aptNumber}] ${u.roomName} ➜ ${u.name}: ${u.details || "Needs immediate attention"}\n`;
      });
      report += `\n`;
    } else {
      report += `🚨 No unresolved critical urgent tasks pending! All safety requirements compliant. ✨\n\n`;
    }

    report += `📦 *CONSOLIDATED SHOP MATERIAL RUN:*\n`;
    if (totalMaterials.length > 0) {
      totalMaterials.forEach((m) => {
        report += `- ${m}\n`;
      });
    } else {
      report += `- None. All systems aligned.`;
    }

    return report;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-slate-700 max-w-2xl w-full rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-tight">
                Daily Shift Summary
              </h3>
              <p className="text-[11px] text-slate-400">
                End of Shift Progress Ledger & Materials Run
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700/60 rounded text-slate-400 hover:text-slate-100 transition-all outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 custom-scrollbar bg-slate-900/10">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/35">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono leading-none mb-1">
                Apts Worked
              </span>
              <span className="text-xl font-bold font-mono text-slate-200">{totalWalks}</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/35">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono leading-none mb-1">
                Completed OK
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400">{totalCompletedOkCount}</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/35">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono leading-none mb-1">
                Repairs Flagged
              </span>
              <span className="text-xl font-bold font-mono text-rose-400">{allShiftRepairs.length}</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/35">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono leading-none mb-1">
                Hours Count
              </span>
              <span className="text-xl font-bold font-mono text-slate-200">{(shiftTimeTotal / 60).toFixed(1)}h</span>
            </div>
          </div>

          {/* Interactive view box */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-left font-mono text-xs text-slate-300 relative space-y-4">
            <div className="absolute right-3 top-3">
              <button
                onClick={handleCopy}
                className="bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-700/60 rounded px-2.5 py-1 flex items-center gap-1.5 outline-none transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className={copied ? "text-emerald-400" : ""}>{copied ? "Copied" : "Copy Report"}</span>
              </button>
            </div>

            <div className="border-b border-slate-800/80 pb-3">
              <h4 className="text-xs font-bold font-sans text-slate-100 uppercase tracking-wider mb-2">
                Shift Activity List
              </h4>
              {walks.length === 0 ? (
                <p className="text-slate-500 italic font-mono text-xs">No active records registered today.</p>
              ) : (
                <div className="space-y-1 bg-slate-950/40 p-2.5 rounded border border-slate-805 border-slate-800">
                  {walks.map((w) => (
                    <div key={w.aptNumber} className="flex justify-between font-mono text-xs py-0.5">
                      <span className="text-slate-200 font-bold">Apt {w.aptNumber}</span>
                      <span className="text-slate-400">{w.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Critical list */}
            <div>
              <h4 className="text-xs font-bold font-sans text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Remaining Critical Urgent Work
              </h4>
              {urgentRepairs.length === 0 ? (
                <p className="text-emerald-400 font-sans text-xs italic">
                  No unresolved safety or critical items today. Good job!
                </p>
              ) : (
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 custom-scrollbar">
                  {urgentRepairs.map((r, i) => (
                    <div key={i} className="flex gap-2 text-[11px] leading-snug p-2 rounded bg-rose-500/5 border border-rose-500/10">
                      <span className="text-rose-400 font-bold shrink-0">Apt {r.aptNumber}</span>
                      <p className="flex-1 text-slate-200">
                        <strong className="text-slate-300">[{r.roomName}]</strong> {r.name} ➜ {r.details}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collected materials */}
            <div>
              <h4 className="text-xs font-bold font-sans text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Hammer className="w-4 h-4 text-amber-500" />
                Collective Shop Material Ledger
              </h4>
              {totalMaterials.length === 0 ? (
                <p className="text-slate-500 italic text-xs">No shop materials pending.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {totalMaterials.map((m, i) => (
                    <span key={i} className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-300">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="bg-slate-800 p-4 border-t border-slate-700/60 flex justify-between gap-3">
          <button
            onClick={onRestartShift}
            className="text-xs text-red-400 hover:text-red-300 font-medium px-4 py-2 border border-red-500/20 hover:border-red-500/40 rounded bg-red-500/5 transition-all outline-none"
          >
            Clear Ledger & Reset
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs text-slate-350 bg-slate-700 hover:bg-slate-600 font-medium px-4 py-2 rounded transition-all outline-none border border-slate-650 border-slate-600"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded transition-all outline-none shadow"
            >
              Copy report to SMS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
