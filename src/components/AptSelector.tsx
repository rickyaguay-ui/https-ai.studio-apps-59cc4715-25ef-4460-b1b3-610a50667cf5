import React, { useState } from "react";
import { ApartmentWalkthrough } from "../types";
import { Building, Plus, ClipboardList, CheckCircle, Clock, Search } from "lucide-react";

interface AptSelectorProps {
  walkthroughs: Record<string, ApartmentWalkthrough>;
  currentAptId: string | null;
  onSelectApt: (aptNumber: string) => void;
  onFinishApt: (aptNumber: string) => void;
  onEndShift: () => void;
}

export const AptSelector: React.FC<AptSelectorProps> = ({
  walkthroughs,
  currentAptId,
  onSelectApt,
  onFinishApt,
  onEndShift,
}) => {
  const [newApt, setNewApt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newApt.trim();
    if (!cleanNum) return;
    onSelectApt(cleanNum);
    setNewApt("");
  };

  const list = Object.values(walkthroughs) as ApartmentWalkthrough[];
  const currentW = currentAptId ? walkthroughs[currentAptId] : null;

  const filteredList = list.filter((walk) =>
    walk.aptNumber.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-5 text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Building className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Units Directory</h2>
            <p className="text-xs text-slate-400">Meadowood Village Apartments</p>
          </div>
        </div>
        <button
          onClick={onEndShift}
          className="text-xs bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 font-medium px-3 py-1.5 rounded-lg transition-all"
        >
          End of Shift
        </button>
      </div>

      {/* Start New Unit Form */}
      <form onSubmit={handleSubmit} className="mb-5">
        <label className="block text-xs text-slate-400 font-medium mb-1.5">
          Start or Enter Unit Walkthrough
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-500 uppercase">
              Apt #
            </span>
            <input
              type="text"
              placeholder="6449"
              value={newApt}
              onChange={(e) => setNewApt(e.target.value)}
              className="w-full pl-14 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all outline-none"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Walk</span>
          </button>
        </div>
      </form>

      {/* Active and Historic Units list */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Today's Walkthroughs {searchQuery ? `(${filteredList.length} of ${list.length})` : `(${list.length})`}
        </h3>

        {list.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-700/55 rounded-lg text-slate-500 text-xs">
            No active walks listed. Enter "Let's go Apt 6449" or type an apartment number above.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Search Input Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search unit number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-1.5 bg-slate-805 bg-slate-800 border border-slate-700/70 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 font-mono transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] text-slate-400 hover:text-slate-200 uppercase font-mono tracking-wider font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {filteredList.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-700/55 bg-slate-900/15 rounded-lg text-slate-500 text-xs italic">
                No units match "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {filteredList.map((walk) => {
                  const active = currentAptId === walk.aptNumber;
                  const completedCount = walk.rooms.reduce(
                    (sum, r) => sum + r.items.filter((i) => i.status === "OK").length,
                    0
                  );
                  const needsRepairCount = walk.rooms.reduce(
                    (sum, r) => sum + r.items.filter((i) => i.status === "Needs Repair").length,
                    0
                  );
                  const unaddressedCount = walk.rooms.reduce(
                    (sum, r) => sum + r.items.filter((i) => i.status === "Unaddressed").length,
                    0
                  );
                  const totalItems = walk.rooms.reduce((sum, r) => sum + r.items.length, 0);

                  return (
                    <div
                      key={walk.aptNumber}
                      onClick={() => onSelectApt(walk.aptNumber)}
                      className={`group relative p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        active
                          ? "bg-slate-700/60 border-amber-500"
                          : "bg-slate-800 border-slate-700/50 hover:bg-slate-700/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-100">
                              Apt {walk.aptNumber}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-medium ${
                                walk.status === "Finished"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-500 border border-amber-500/25"
                              }`}
                            >
                              {walk.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3" />
                              {completedCount} ok
                            </span>
                            <span className="text-rose-400 font-medium">
                              {needsRepairCount} repairs
                            </span>
                            <span className="text-slate-500">
                              {unaddressedCount} pending
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          {walk.timeEstimateTotal > 0 && (
                            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono justify-end">
                              <Clock className="w-3" />
                              <span>{walk.timeEstimateTotal}m</span>
                            </div>
                          )}
                          {walk.status === "In Progress" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onFinishApt(walk.aptNumber);
                              }}
                              className="mt-2 text-[10px] bg-slate-700 group-hover:bg-slate-600 hover:!bg-amber-500 hover:!text-slate-950 text-slate-200 px-2 py-0.5 rounded transition-all font-medium border border-slate-600"
                            >
                              Finish
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
