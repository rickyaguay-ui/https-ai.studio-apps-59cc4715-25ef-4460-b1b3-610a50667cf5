import React, { useState } from "react";
import { ApartmentWalkthrough, ChecklistItem, CheckStatus, TaskPriority, ItemCategory } from "../types";
import {
  Check,
  AlertTriangle,
  FolderOpen,
  Plus,
  Trash2,
  Clock,
  Wrench,
  HelpCircle,
  HelpCircle as QuestionIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ChecklistTrackerProps {
  currentWalkthrough: ApartmentWalkthrough | null;
  onUpdateItem: (roomName: string, itemId: string, updatedFields: Partial<ChecklistItem>) => void;
  onAddCustomItem: (roomName: string, name: string) => void;
  onSelectRoom: (index: number) => void;
}

export const ChecklistTracker: React.FC<ChecklistTrackerProps> = ({
  currentWalkthrough,
  onUpdateItem,
  onAddCustomItem,
  onSelectRoom,
}) => {
  const [newCustomItemName, setNewCustomItemName] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  if (!currentWalkthrough) {
    return (
      <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-8 text-center text-slate-400">
        <FolderOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Unit Walkthrough Active</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Add an apartment number in the Units panel or type "Let's go Apt 6449" in the chat assistant to load Meadowood's official make-ready ledger.
        </p>
      </div>
    );
  }

  const { rooms, currentRoomIndex } = currentWalkthrough;
  const currentRoom = rooms[currentRoomIndex];

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomItemName.trim()) return;
    onAddCustomItem(currentRoom.name, newCustomItemName.trim());
    setNewCustomItemName("");
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-5 text-slate-100 flex flex-col h-full shadow-md">
      {/* Room Tabs */}
      <div className="border-b border-slate-700/60 pb-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight uppercase text-amber-500">
              Company Checklist
            </h2>
            <p className="text-xs text-slate-400">
              Meadowood Village Official Make-Ready Ledger
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-800 text-slate-300 font-semibold px-2 px-2.5 py-1 rounded border border-slate-700">
            Apt {currentWalkthrough.aptNumber}
          </div>
        </div>

        {/* Horizontal Navigation Pins */}
        <div className="flex gap-2 overflow-x-auto pb-1 select-none no-scrollbar">
          {rooms.map((room, idx) => {
            const active = idx === currentRoomIndex;
            const okCount = room.items.filter((i) => i.status === "OK").length;
            const flagCount = room.items.filter((i) => i.status === "Needs Repair").length;
            const unaddressedCount = room.items.filter((i) => i.status === "Unaddressed").length;

            return (
              <button
                key={room.name}
                onClick={() => onSelectRoom(idx)}
                className={`flex flex-col items-start p-2 rounded-lg border text-left shrink-0 min-w-[120px] transition-all outline-none ${
                  active
                    ? "bg-slate-755 bg-slate-700 border-amber-500 text-slate-100 shadow"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                }`}
              >
                <span className="text-xs font-bold leading-tight truncate w-full">
                  {room.name}
                </span>
                <div className="flex items-center gap-1.5 mt-1.5 text-[9px]">
                  <span className="text-emerald-400 font-bold">{okCount} ok</span>
                  {flagCount > 0 && <span className="text-rose-400 font-bold">{flagCount} flag</span>}
                  {unaddressedCount > 0 && (
                    <span className="text-amber-500 font-medium">{unaddressedCount} pend</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Room Checklist Items */}
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 space-y-2.5 custom-scrollbar">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-2 py-1 bg-slate-800/35 rounded border border-slate-700/20 mb-2">
          <span>Item & Status</span>
          <span>Manual Toggles</span>
        </div>

        {currentRoom?.items.map((item) => {
          const isNeedsRepair = item.status === "Needs Repair";
          const isOK = item.status === "OK";
          const isUnaddressed = item.status === "Unaddressed";
          const isEditing = editingItemId === item.id;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition-all ${
                isNeedsRepair
                  ? "bg-rose-500/5 border-rose-500/30"
                  : isOK
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-slate-800/65 border-slate-700/50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info block */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {/* Status icon indicators */}
                    {isOK && <span className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">OK</span>}
                    {isNeedsRepair && <span className="p-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs">FLAG</span>}
                    {isUnaddressed && <span className="p-1 rounded bg-amber-500/5 border border-amber-500/10 text-amber-500/80 font-bold text-[10px] uppercase">PENDING</span>}
                    <span className="font-medium text-sm text-slate-100">{item.name}</span>
                  </div>

                  {/* Repair details if present */}
                  {isNeedsRepair && (
                    <div className="mt-2 pl-1 whitespace-pre-wrap">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.category && (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600/35">
                            Cat: {item.category}
                          </span>
                        )}
                        {item.priority && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              item.priority === "Urgent"
                                ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                : item.priority === "Standard"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {item.priority}
                          </span>
                        )}
                        {item.timeEstimate !== undefined && (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600/35 flex items-center gap-1">
                            <Clock className="w-3 text-slate-400" />
                            {item.timeEstimate} min
                          </span>
                        )}
                        {item.isBigIssue && (
                          <span className="text-[10px] font-bold bg-red-600/90 text-white px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider shadow-sm">
                            ⚠️ Major Issue
                          </span>
                        )}
                        {item.needsOrdering && (
                          <span className="text-[10px] font-bold bg-indigo-600 text-indigo-100 border border-indigo-500 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider shadow-sm">
                            🛒 Order Parts
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-rose-400 mt-1.5 leading-snug">
                        <strong className="text-slate-300">Observation: </strong>
                        {item.details || "Needs attention."}
                      </p>
                      {item.materialsNeeded && item.materialsNeeded.length > 0 && (
                        <div className="mt-2 text-[11px] text-slate-300">
                          <strong className="text-slate-400 text-xs font-mono block mb-1">Parts from Shop:</strong>
                          <div className="flex flex-wrap gap-1">
                            {item.materialsNeeded.map((m, mI) => (
                              <span key={mI} className="bg-slate-800 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5">
                                {m}
                              </span>
                            ))}
                          </div>
                      </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline override status trigger buttons */}
                <div className="flex gap-1 items-center shrink-0">
                  <button
                    onClick={() => onUpdateItem(currentRoom.name, item.id, { status: "OK", details: undefined })}
                    className={`p-1.5 rounded border transition-all ${
                      isOK
                        ? "bg-emerald-500 text-slate-950 border-emerald-500"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                    }`}
                    title="Mark OK"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (isNeedsRepair) {
                        setEditingItemId(isEditing ? null : item.id);
                      } else {
                        onUpdateItem(currentRoom.name, item.id, {
                          status: "Needs Repair",
                          priority: "Standard",
                          category: item.category || "Misc",
                          timeEstimate: 15,
                          details: "Identified check-make issue",
                          materialsNeeded: [],
                        });
                        setEditingItemId(item.id);
                      }
                    }}
                    className={`p-1.5 rounded border transition-all ${
                      isNeedsRepair
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                    }`}
                    title="Flag repair item details"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Advanced inline editing drawer for fine manual adjustments */}
              {isEditing && isNeedsRepair && (
                <div className="bg-slate-800 p-3 rounded border border-slate-700 mt-2 text-xs space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono mb-1">Priority</label>
                      <select
                        value={item.priority || "Standard"}
                        onChange={(e) =>
                          onUpdateItem(currentRoom.name, item.id, {
                            priority: e.target.value as TaskPriority,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-100"
                      >
                        <option value="Urgent">Urgent</option>
                        <option value="Standard">Standard</option>
                        <option value="Cosmetic">Cosmetic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono mb-1">Category</label>
                      <select
                        value={item.category || "Misc"}
                        onChange={(e) =>
                          onUpdateItem(currentRoom.name, item.id, {
                            category: e.target.value as ItemCategory,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-100"
                      >
                        <option value="Lights">Lights</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Paint">Paint</option>
                        <option value="Flooring">Flooring</option>
                        <option value="Appliances">Appliances</option>
                        <option value="Doors/Windows">Doors/Windows</option>
                        <option value="Misc">Misc</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono mb-1">Time (mins)</label>
                      <input
                        type="number"
                        value={item.timeEstimate || 15}
                        onChange={(e) =>
                          onUpdateItem(currentRoom.name, item.id, {
                            timeEstimate: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono mb-1">Materials (comma split)</label>
                      <input
                        type="text"
                        placeholder="Receptacle plate, screws"
                        value={item.materialsNeeded?.join(", ") || ""}
                        onChange={(e) =>
                          onUpdateItem(currentRoom.name, item.id, {
                            materialsNeeded: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 py-1.5 px-2 bg-slate-900/40 rounded border border-slate-700/40">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!item.isBigIssue}
                        onChange={(e) =>
                          onUpdateItem(currentRoom.name, item.id, {
                            isBigIssue: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 rounded border-slate-700 text-red-500 bg-slate-900"
                      />
                      <span className="text-[10.5px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
                        ⚠️ Big Issue
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!item.needsOrdering}
                        onChange={(e) =>
                          onUpdateItem(currentRoom.name, item.id, {
                            needsOrdering: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-500 bg-slate-900"
                      />
                      <span className="text-[10.5px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
                        🛒 Need Order
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono mb-1">Problem Observation</label>
                    <textarea
                      rows={2}
                      value={item.details || ""}
                      onChange={(e) =>
                        onUpdateItem(currentRoom.name, item.id, {
                          details: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-100 placeholder:text-slate-500"
                      placeholder="e.g. drip pans are rusted and need replacement..."
                    />
                  </div>

                  <div className="text-right border-t border-slate-700/60 pt-2">
                    <button
                      onClick={() => setEditingItemId(null)}
                      className="text-[10px] bg-slate-755 bg-slate-700 hover:bg-slate-655 border border-slate-600 px-2 py-1 rounded text-slate-200"
                    >
                      Save Parameters
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Add Custom checklist item */}
      <form onSubmit={handleAddCustom} className="mt-4 pt-3 border-t border-slate-700/60">
        <label className="block text-[10px] text-slate-400 font-medium mb-1.5">
          Did Tristan notice something custom? Add item to {currentRoom.name}:
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="e.g. wall plaster crack near thermostat"
            value={newCustomItemName}
            onChange={(e) => setNewCustomItemName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 rounded flex items-center justify-center transition-all outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
