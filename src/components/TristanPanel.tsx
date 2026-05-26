import React, { useState, useEffect } from "react";
import { ApartmentWalkthrough, ChecklistItem, Message } from "../types";
import {
  ClipboardList,
  Copy,
  Check,
  Clock,
  Package,
  CheckCircle,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  PenTool,
  Image as ImageIcon,
  ShieldAlert,
  Search,
} from "lucide-react";

interface TristanPanelProps {
  currentWalkthrough: ApartmentWalkthrough | null;
  walkthroughs?: Record<string, ApartmentWalkthrough>;
  onFinishList: () => void;
  onUpdateItem?: (roomName: string, itemId: string, updatedFields: Partial<ChecklistItem>, targetAptId?: string) => void;
  messages?: Message[];
}

export const TristanPanel = ({
  currentWalkthrough,
  walkthroughs = {},
  onFinishList,
  onUpdateItem,
  messages = [],
}: TristanPanelProps) => {
  const [copiedTristan, setCopiedTristan] = useState(false);
  const [copiedMaterials, setCopiedMaterials] = useState(false);

  // Sync Meadowwood Brand specifications to map materials lists dynamically
  const [brandTrainingList, setBrandTrainingList] = useState<any[]>(() => {
    const cached = localStorage.getItem("meadowood_brand_training");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    const handleSync = () => {
      const cached = localStorage.getItem("meadowood_brand_training");
      if (cached) {
        try { setBrandTrainingList(JSON.parse(cached)); } catch (e) {}
      }
    };
    window.addEventListener("storage_meadowood_brands_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("storage_meadowood_brands_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const mapMaterialToTrainedBrand = (matName: string): string => {
    if (!matName) return matName;
    const lower = matName.toLowerCase();

    // 1. Try generic match first
    let matchedSpec = brandTrainingList.find(spec => {
      const key = spec.itemName.toLowerCase();
      const cleanKey = key.replace(/\(.*?\)/g, "").trim();
      return lower.includes(cleanKey) || cleanKey.includes(lower);
    });

    // 2. Fallbacks for standard keyword categories
    if (!matchedSpec) {
      if (lower.includes("bulb") || lower.includes("light") || lower.includes("lamp")) {
        matchedSpec = brandTrainingList.find(s => s.id === "inv-bulb");
      } else if (lower.includes("cover") || lower.includes("plate") || lower.includes("receptacle") || lower.includes("switch")) {
        matchedSpec = brandTrainingList.find(s => s.id === "inv-cover");
      } else if (lower.includes("drip pan") || lower.includes("burner")) {
        if (lower.includes("small") || lower.includes("6")) {
          matchedSpec = brandTrainingList.find(s => s.id === "inv-pan-sm");
        } else {
          matchedSpec = brandTrainingList.find(s => s.id === "inv-pan-lg");
        }
      } else if (lower.includes("flapper") || lower.includes("toilet leak") || lower.includes("flush")) {
        matchedSpec = brandTrainingList.find(s => s.id === "inv-flapper");
      } else if (lower.includes("filter") || lower.includes("hvac") || lower.includes("furnace")) {
        matchedSpec = brandTrainingList.find(s => s.id === "inv-filter");
      } else if (lower.includes("battery") || lower.includes("9v") || lower.includes("smoke")) {
        matchedSpec = brandTrainingList.find(s => s.id === "inv-battery");
      } else if (lower.includes("shower") || lower.includes("showerhead") || lower.includes("gpm")) {
        matchedSpec = brandTrainingList.find(s => s.id === "inv-shower");
      }
    }

    if (matchedSpec) {
      return `${matchedSpec.brand} [SKU: ${matchedSpec.partNumber}] (${matchedSpec.supplier})`;
    }
    return matName;
  };

  // Supervisor Sign-off States cached in LocalStorage
  const [supervisorName, setSupervisorName] = useState(() => {
    return localStorage.getItem("meadowood_supervisor_signature_name") || "";
  });
  const [isSigned, setIsSigned] = useState(() => {
    return localStorage.getItem("meadowood_supervisor_signed") === "true";
  });
  const [signTime, setSignTime] = useState(() => {
    return localStorage.getItem("meadowood_supervisor_sign_time") || "";
  });

  const [decisionFilter, setDecisionFilter] = useState<"all" | "bigIssues" | "needsOrdering">("all");
  const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"unit" | "urgent">("unit");

  if (!currentWalkthrough) return null;

  // Compile cross-unit urgent fixes & safety hazards matching current walkthroughs dictionary
  const crossUnitUrgentRepairs = Object.values(walkthroughs).flatMap((walk) => {
    return walk.rooms.flatMap((r) => {
      return r.items
        .filter((item) => {
          if (item.status !== "Needs Repair") return false;
          const isUrgent = item.priority === "Urgent";
          const isHazard = !!item.isBigIssue;
          const nameLower = (item.name || "").toLowerCase();
          const descLower = (item.details || "").toLowerCase();
          const hazardKeywords = ["hazard", "safety", "fire", "leak", "wire", "plug", "exposed", "smoke", "carbon monoxide", "battery", "trip", "gas", "shock", "electric"];
          const isSafetyKeyword = hazardKeywords.some(kw => nameLower.includes(kw) || descLower.includes(kw));
          return isUrgent || isHazard || isSafetyKeyword;
        })
        .map((item) => {
          // Find matching photos across ALL messages for this apartment & room name!
          const photos = messages
            ? messages
                .filter(
                  (m) =>
                    m.imageUrl &&
                    m.aptNumber === walk.aptNumber &&
                    m.activeRoomName?.toLowerCase() === r.name.toLowerCase()
                )
                .map((m) => m.imageUrl!)
            : [];
          return {
            ...item,
            aptNumber: walk.aptNumber,
            roomName: r.name,
            photos,
            isSafetyHazard: !!item.isBigIssue || ["hazard", "safety", "fire", "leak", "wire", "plug", "exposed", "smoke", "carbon monoxide", "battery", "trip", "gas", "shock", "electric"].some(kw => (item.name || "").toLowerCase().includes(kw) || (item.details || "").toLowerCase().includes(kw)),
          };
        });
    });
  });

  // Extract all flagged repair items across all rooms
  const allRepairs = currentWalkthrough.rooms.flatMap((r) =>
    r.items
      .filter((i) => i.status === "Needs Repair")
      .map((i) => ({ ...i, roomName: r.name }))
  );

  const walkthroughPhotos = messages
    ? messages.filter((m) => m.imageUrl && m.aptNumber === currentWalkthrough.aptNumber)
    : [];

  const filteredRepairsForTristan = allRepairs.filter((r) => {
    if (decisionFilter === "bigIssues") return !!r.isBigIssue;
    if (decisionFilter === "needsOrdering") return !!r.needsOrdering;
    return true;
  });

  const urgentRepairs = allRepairs.filter((r) => r.priority === "Urgent");
  const standardRepairs = allRepairs.filter((r) => r.priority === "Standard");
  const cosmeticRepairs = allRepairs.filter((r) => r.priority === "Cosmetic");

  // Approval counts
  const approvedCount = allRepairs.filter((r) => r.tristanApprovalStatus === "Approved").length;
  const pendingCount = allRepairs.filter(
    (r) => !r.tristanApprovalStatus || r.tristanApprovalStatus === "Pending"
  ).length;
  const declinedCount = allRepairs.filter((r) => r.tristanApprovalStatus === "Declined").length;

  // Sum total time estimates
  const totalMins = allRepairs.reduce((sum, r) => sum + (r.timeEstimate || 0), 0);
  const totalHours = (totalMins / 60).toFixed(1);

  // Collect consolidated materials list
  const consolidatedMaterials = Array.from(
    new Set(allRepairs.flatMap((r) => r.materialsNeeded || []))
  ).filter(Boolean) as string[];

  const handleApproveItem = (roomName: string, id: string, aptId?: string) => {
    if (onUpdateItem) {
      onUpdateItem(roomName, id, { tristanApprovalStatus: "Approved" }, aptId);
    }
  };

  const handleDeclineItem = (roomName: string, id: string, aptId?: string) => {
    if (onUpdateItem) {
      onUpdateItem(roomName, id, { tristanApprovalStatus: "Declined" }, aptId);
    }
  };

  const handleUpdateNote = (roomName: string, id: string, note: string, aptId?: string) => {
    if (onUpdateItem) {
      onUpdateItem(roomName, id, { tristanApprovalNote: note }, aptId);
    }
  };

  const handleBulkApprove = () => {
    if (!onUpdateItem || allRepairs.length === 0) return;
    if (confirm("Bulk approve all pending work orders for this unit?")) {
      allRepairs.forEach((r) => {
        if (!r.tristanApprovalStatus || r.tristanApprovalStatus === "Pending") {
          onUpdateItem(r.roomName, r.id, {
            tristanApprovalStatus: "Approved",
            tristanApprovalNote: r.tristanApprovalNote || "Approved by Tristan",
          });
        }
      });
    }
  };

  const handleSignOff = () => {
    if (!supervisorName.trim()) {
      alert("Please enter supervisor authorization name to digitally sign.");
      return;
    }
    const now = new Date().toLocaleString();
    setIsSigned(true);
    setSignTime(now);
    localStorage.setItem("meadowood_supervisor_signature_name", supervisorName);
    localStorage.setItem("meadowood_supervisor_signed", "true");
    localStorage.setItem("meadowood_supervisor_sign_time", now);
  };

  const handleUndoSignOff = () => {
    setIsSigned(false);
    setSignTime("");
    localStorage.removeItem("meadowood_supervisor_signed");
    localStorage.removeItem("meadowood_supervisor_sign_time");
  };

  // Generate clean Markdown format for Tristan's repair list
  const generateTristanMarkdown = () => {
    let md = `🛠️ *APPROVED DISPATCH FOR TRISTAN* - Apt ${currentWalkthrough.aptNumber}\n`;
    if (isSigned) {
      md += `🔏 AUTHORIZED BY SUPERVISOR: ${supervisorName} at ${signTime}\n`;
    } else {
      md += `⚠️ WAITING FOR SUPERVISOR RELEASE SIGN-OFF\n`;
    }
    md += `Estimated total duration: ${totalMins} minutes (~${totalHours} hours)\n`;
    md += `Approval Progress: ${approvedCount} approved / ${declinedCount} on hold / ${pendingCount} pending\n\n`;

    const formatRepairLine = (r: any) => {
      const approvalTag =
        r.tristanApprovalStatus === "Approved"
          ? "✅ APPROVED"
          : r.tristanApprovalStatus === "Declined"
          ? "❌ ON HOLD"
          : "🕒 PENDING";
      const bigIssueTag = r.isBigIssue ? " [⚠️ MAJOR CORE ISSUE]" : "";
      const orderTag = r.needsOrdering ? " [🛒 PARTS ORDER REQUIRED]" : "";
      const noteStr = r.tristanApprovalNote ? ` (Inst: "${r.tristanApprovalNote}")` : "";
      return `- [ ] [${r.roomName}] ${r.name}: ${r.details || "Deficiency"}${bigIssueTag}${orderTag} [${approvalTag}] (${r.timeEstimate || 0}m)${noteStr}\n`;
    };

    if (urgentRepairs.length > 0) {
      md += `🚨 *URGENTS (MUST DO BEFORE MOVE-IN):*\n`;
      urgentRepairs.forEach((r) => {
        md += formatRepairLine(r);
      });
      md += `\n`;
    }

    if (standardRepairs.length > 0) {
      md += `🔧 *STANDARDS:*\n`;
      standardRepairs.forEach((r) => {
        md += formatRepairLine(r);
      });
      md += `\n`;
    }

    if (cosmeticRepairs.length > 0) {
      md += `🎨 *COSMETICS:*\n`;
      cosmeticRepairs.forEach((r) => {
        md += formatRepairLine(r);
      });
    }

    if (allRepairs.length === 0) {
      md += `No unresolved repairs detected! This unit is in a pristine state! ✨`;
    }

    return md;
  };

  // Generate Clean Markdown for Material List
  const generateMaterialsMarkdown = () => {
    let md = `📦 *SHOP MATERIAL RUN* - Apt ${currentWalkthrough.aptNumber}\n`;
    md += `Pick up everything below in ONE trip from the maintenance shop:\n\n`;
    if (consolidatedMaterials.length > 0) {
      consolidatedMaterials.forEach((m) => {
        const trained = mapMaterialToTrainedBrand(m);
        md += `- [ ] ${trained}\n`;
      });
    } else {
      md += `No materials required. All items are OK or resolved with standard truck stock.`;
    }
    return md;
  };

  const copyToClipboard = (text: string, type: "tristan" | "materials") => {
    navigator.clipboard.writeText(text);
    if (type === "tristan") {
      setCopiedTristan(true);
      setTimeout(() => setCopiedTristan(false), 2000);
    } else {
      setCopiedMaterials(true);
      setTimeout(() => setCopiedMaterials(false), 2000);
    }
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-5 text-slate-100 shadow-md flex flex-col gap-4 font-sans select-none relative">
      
      {/* Lightbox Overlay */}
      {activeLightboxUrl && (
        <div 
          onClick={() => setActiveLightboxUrl(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[80vh]">
            <img 
              src={activeLightboxUrl} 
              alt="Walkthrough Detail View" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg border border-slate-755 shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => setActiveLightboxUrl(null)}
              className="absolute top-2 right-2 bg-slate-900/90 text-white font-bold p-1 px-2.5 rounded hover:bg-slate-800"
            >
              ✕ Close
            </button>
          </div>
          <p className="text-slate-400 text-xs mt-3 font-mono">
            Captured during initial make-ready walkthrough • Click anywhere to dim
          </p>
        </div>
      )}

      {/* Head Panel Bar */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2 text-left">
          <ClipboardList className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-sm font-black tracking-tight uppercase text-zinc-300">
              Tristan's Auth Ledger
            </h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide">
              Lead Supervisor Dispatch & Orders
            </p>
          </div>
        </div>
        
        {currentWalkthrough.status === "In Progress" && (
          <button
            onClick={onFinishList}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-2.5 py-1.5 rounded-lg transition-all outline-none"
          >
            Finalize Walk
          </button>
        )}
      </div>

      {/* Tab Selectors */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-850">
        <button
          type="button"
          onClick={() => setActiveTab("unit")}
          className={`text-[11px] font-bold py-1.5 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "unit"
              ? "bg-amber-500 text-slate-950 shadow-sm font-extrabold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Unit List (Apt {currentWalkthrough.aptNumber})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("urgent")}
          className={`text-[11px] font-bold py-1.5 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
            activeTab === "urgent"
              ? "bg-red-650 bg-red-650 bg-red-600 text-red-50 border border-red-500/40 shadow-sm font-extrabold"
              : "text-slate-400 hover:text-red-400"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Urgent Fix Board ({crossUnitUrgentRepairs.length})
        </button>
      </div>

      {activeTab === "urgent" ? (
        /* URGENT FIX DASHBOARD VIEW */
        <div className="space-y-4">
          <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-lg text-left">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              Safety Hazards & Urgent Issues
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              Summarizing all active safety hazards, major defects, and red-flagged repairs across all units for supervisor review.
            </p>
          </div>

          {crossUnitUrgentRepairs.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-700/60 rounded-lg text-slate-500 text-xs text-slate-400">
              <ShieldCheck className="w-12 h-12 text-emerald-500/30 mx-auto mb-2" />
              <p className="font-semibold text-slate-350">All Units Standardized</p>
              <p className="text-[10px] text-slate-500 mt-1">No outstanding safety hazards or urgent repairs detected across active units.</p>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto text-xs space-y-3 custom-scrollbar pr-1">
              {crossUnitUrgentRepairs.map((r, rIdx) => {
                const isApproved = r.tristanApprovalStatus === "Approved";
                const isDeclined = r.tristanApprovalStatus === "Declined";
                const isPending = !r.tristanApprovalStatus || r.tristanApprovalStatus === "Pending";

                return (
                  <div
                    key={`${r.id}-${r.aptNumber}-${rIdx}`}
                    className={`flex flex-col gap-2 p-3 rounded-lg border transition-all text-left ${
                      isApproved
                        ? "bg-emerald-500/5 border-emerald-550 border-emerald-500/20"
                        : isDeclined
                        ? "bg-rose-500/5 border-rose-555 border-rose-500/20"
                        : "bg-slate-800/20 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[9.5px] px-2 py-0.5 rounded font-mono font-bold block">
                          Unit {r.aptNumber}
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-300">
                          {r.roomName}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-right">
                        {r.isSafetyHazard ? (
                          <span className="bg-red-500 text-slate-950 font-black px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-wide flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" /> Safety Hazard
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/20 font-black px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-wide">
                            Urgent
                          </span>
                        )}
                        <span className="text-[9.5px] text-slate-500 font-mono">({r.timeEstimate || 15}m)</span>
                      </div>
                    </div>

                    <p className="text-[11.5px] leading-snug font-medium text-slate-200">
                      <strong className="text-amber-550 text-amber-500 font-sans">{r.name}:</strong> {r.details || "Observations logged."}
                    </p>

                    {/* Photos - Urgent issue detailed picture evidence */}
                    {r.photos && r.photos.length > 0 ? (
                      <div className="bg-slate-950/40 p-1.5 rounded border border-slate-850 mt-1">
                        <span className="text-[8.5px] text-amber-500 font-mono uppercase tracking-wider font-bold block mb-1">
                          📸 Walkthrough Photo Evidence
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {r.photos.map((url, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setActiveLightboxUrl(url)}
                              className="relative h-28 w-full rounded border border-slate-700/60 overflow-hidden cursor-zoom-in hover:brightness-110 active:scale-[0.98] transition-all bg-slate-950"
                              title="Click to zoom picture evidence fullscreen"
                            >
                              <img
                                src={url}
                                alt="Walkthrough defect"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-1.5 right-1.5 bg-slate-950/80 px-2 py-0.5 rounded text-[7.5px] text-amber-400 uppercase font-mono font-bold tracking-widest pointer-events-none">
                                Zoom Photo
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900/60 py-3 rounded border border-dashed border-slate-800 text-center text-slate-500 text-[10px] mt-1">
                        <ImageIcon className="w-3.5 h-3.5 mx-auto text-slate-700 mb-0.5" />
                        <span>No photo attached by maintenance technician yet.</span>
                      </div>
                    )}

                    {/* Decision row */}
                    <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveItem(r.roomName, r.id, r.aptNumber)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded border transition-all cursor-pointer ${
                            isApproved
                              ? "bg-emerald-500 text-slate-950 border-emerald-500"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                          }`}
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineItem(r.roomName, r.id, r.aptNumber)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded border transition-all cursor-pointer ${
                            isDeclined
                              ? "bg-rose-500 text-slate-950 border-rose-500"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-350 border-slate-700"
                          }`}
                        >
                          <AlertOctagon className="w-3 h-3" /> Hold
                        </button>

                        <div className="text-[9px] ml-auto font-mono">
                          {isApproved && <span className="text-emerald-400">✔ Approved</span>}
                          {isDeclined && <span className="text-rose-400">✖ Hold Status</span>}
                          {isPending && <span className="text-amber-400 animate-pulse">● Pending Decision</span>}
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Type special instructions or material order notes..."
                        value={r.tristanApprovalNote || ""}
                        onChange={(e) => handleUpdateNote(r.roomName, r.id, e.target.value, r.aptNumber)}
                        className="w-full bg-slate-950 border border-slate-850 px-2 py-1 rounded text-[10.5px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : allRepairs.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-700/60 rounded-lg text-slate-500 text-xs">
            <CheckCircle className="w-10 h-10 text-emerald-500/30 mx-auto mb-2" />
            No repairs flagged. The unit checklist is currently in a pristine state.
          </div>
        ) : (
          <div className="space-y-4">
          
          {/* Authorization State Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
            <div className="text-left">
              <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">
                Authorization Status
              </span>
              {isSigned ? (
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  RELEASED FOR DISPATCH
                </span>
              ) : (
                <span className="text-xs font-black text-amber-500 flex items-center gap-1 mt-0.5 animate-pulse">
                  <Clock className="w-4 h-4" />
                  AWAITING DECISION
                </span>
              )}
            </div>

            <button
              onClick={handleBulkApprove}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-500 border border-slate-700 px-2 py-1 rounded flex items-center gap-1 transition-all outline-none"
              title="Instantly approve all pending"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Approve All
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-1 text-center">
            <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/30 flex flex-col justify-center">
              <span className="text-[8px] text-slate-500 font-mono uppercase">Total</span>
              <span className="text-sm font-extrabold text-slate-300">{allRepairs.length}</span>
            </div>
            <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40 flex flex-col justify-center">
              <span className="text-[8px] text-emerald-500 font-mono uppercase">Appr</span>
              <span className="text-sm font-extrabold text-emerald-400">{approvedCount}</span>
            </div>
            <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40 flex flex-col justify-center">
              <span className="text-[8px] text-rose-500 font-mono uppercase">Major</span>
              <span className="text-sm font-extrabold text-rose-400">
                {allRepairs.filter(r => r.isBigIssue).length}
              </span>
            </div>
            <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40 flex flex-col justify-center">
              <span className="text-[8px] text-indigo-400 font-mono uppercase">Order</span>
              <span className="text-sm font-extrabold text-indigo-450 text-indigo-400">
                {allRepairs.filter(r => r.needsOrdering).length}
              </span>
            </div>
          </div>

          {/* Supervisor Decision Tree Workspace */}
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-xs font-bold text-slate-350 flex items-center gap-1.5 uppercase font-serif tracking-wide">
                Decision List (Apt {currentWalkthrough.aptNumber})
              </h4>
              <button
                onClick={() => copyToClipboard(generateTristanMarkdown(), "tristan")}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 outline-none font-bold"
                title="Copy signoff list to device clipboard"
              >
                {copiedTristan ? (
                  <>
                    <Check className="w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5" />
                    <span>Copy Plan</span>
                  </>
                )}
              </button>
            </div>

            {/* Segmented Filter Buttons */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
              <button
                type="button"
                onClick={() => setDecisionFilter("all")}
                className={`text-[10px] font-bold py-1.5 rounded transition-all flex items-center justify-center gap-1 ${
                  decisionFilter === "all"
                    ? "bg-slate-800 text-slate-100 border border-slate-700/40 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                All ({allRepairs.length})
              </button>
              <button
                type="button"
                onClick={() => setDecisionFilter("bigIssues")}
                className={`text-[10px] font-bold py-1.5 rounded transition-all flex items-center justify-center gap-1 ${
                  decisionFilter === "bigIssues"
                    ? "bg-red-500/10 text-rose-400 border border-red-550 border-red-500/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                ⚠️ Major ({allRepairs.filter((r) => r.isBigIssue).length})
              </button>
              <button
                type="button"
                onClick={() => setDecisionFilter("needsOrdering")}
                className={`text-[10px] font-bold py-1.5 rounded transition-all flex items-center justify-center gap-1 ${
                  decisionFilter === "needsOrdering"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-550 border-indigo-500/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                🛒 Order ({allRepairs.filter((r) => r.needsOrdering).length})
              </button>
            </div>

            {/* Scroll Panel containing active checklist details for Tristan */}
            <div className="max-h-[220px] overflow-y-auto text-xs space-y-2.5 custom-scrollbar pr-1">
              {filteredRepairsForTristan.length === 0 ? (
                <div className="py-8 text-center text-slate-550 text-[11px] italic">
                  No repairs found for the chosen filter criteria.
                </div>
              ) : (
                filteredRepairsForTristan.map((r) => {
                  const isApproved = r.tristanApprovalStatus === "Approved";
                  const isDeclined = r.tristanApprovalStatus === "Declined";
                  const isPending = !r.tristanApprovalStatus || r.tristanApprovalStatus === "Pending";
                  const roomPhotos = walkthroughPhotos.filter(
                    (p) => p.activeRoomName?.toLowerCase() === r.roomName.toLowerCase()
                  );

                  return (
                    <div
                      key={r.id}
                      className={`flex flex-col gap-1.5 p-2 rounded border border-slate-800 text-left transition-all ${
                        isApproved
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : isDeclined
                          ? "bg-rose-500/5 border-rose-500/20"
                          : "bg-slate-800/30"
                      }`}
                    >
                      {/* Header: Room / Tag / Priority info */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9.5px] font-bold text-slate-400 truncate max-w-[90px]">
                            {r.roomName}
                          </span>
                          <div className="flex items-center gap-1">
                            {r.priority === "Urgent" && (
                              <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.5 rounded text-[8px] font-bold uppercase">
                                Urgent
                              </span>
                            )}
                            {r.priority === "Standard" && (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded text-[8px] font-bold uppercase">
                                Standard
                              </span>
                            )}
                            {r.priority === "Cosmetic" && (
                              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.5 rounded text-[8px] font-bold uppercase">
                                Cosmetic
                              </span>
                            )}
                            {r.isBigIssue && (
                              <span className="bg-red-650 bg-red-600 border border-red-500 text-red-50 font-black px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide">
                                ⚠️ Major
                              </span>
                            )}
                            {r.needsOrdering && (
                              <span className="bg-indigo-650 bg-indigo-600 border border-indigo-500 text-indigo-50 font-black px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide">
                                📦 Order
                              </span>
                            )}
                            <span className="text-[9px] text-slate-500 font-mono">({r.timeEstimate || 15}m)</span>
                          </div>
                        </div>

                        {/* Approval Pill State Indicators */}
                        <div>
                          {isApproved && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Approved
                            </span>
                          )}
                          {isDeclined && (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 uppercase tracking-wider flex items-center gap-0.5">
                              <AlertOctagon className="w-2.5 h-2.5" /> Hold / No
                            </span>
                          )}
                          {isPending && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 animate-spin" /> Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Defect Description */}
                      <p className="text-[11.5px] leading-snug font-medium text-slate-200">
                        <strong className="text-amber-550 text-amber-500 font-sans">{r.name}:</strong> {r.details || "Observations logged."}
                      </p>

                      {/* Room Photo evidence inline thumbnails */}
                      {roomPhotos.length > 0 && (
                        <div className="mt-1 bg-slate-950/40 p-1.5 rounded border border-slate-800">
                          <span className="text-[8.5px] text-slate-500 uppercase tracking-widest block font-bold mb-1">
                            Ricky's Walkthrough Photo Evidence ({r.roomName}):
                          </span>
                          <div className="flex gap-2 overflow-x-auto select-none no-scrollbar py-0.5">
                            {roomPhotos.map((photo, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => setActiveLightboxUrl(photo.imageUrl || null)}
                                className="relative w-12 h-12 rounded-md border border-slate-700/60 overflow-hidden cursor-zoom-in hover:brightness-110 active:scale-95 transition-all shrink-0 bg-slate-900 group"
                                title="Click to inspect photo evidence fullscreen"
                              >
                                <img
                                  src={photo.imageUrl}
                                  alt="Defect"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                <div className="absolute bottom-0 inset-x-0 bg-slate-950/70 text-[7px] text-slate-400 text-center truncate">
                                  Zoom
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Supervisor Decision Controls Row */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <button
                          onClick={() => handleApproveItem(r.roomName, r.id)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-all outline-none border ${
                            isApproved
                              ? "bg-emerald-500 text-slate-950 border-emerald-500"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeclineItem(r.roomName, r.id)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-all outline-none border ${
                            isDeclined
                              ? "bg-rose-500 text-slate-950 border-rose-500"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-350 border-slate-700"
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          Hold
                        </button>

                        <input
                          type="text"
                          placeholder="Supervisor note/instruction..."
                          value={r.tristanApprovalNote || ""}
                          onChange={(e) => handleUpdateNote(r.roomName, r.id, e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[10.5px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RICKY'S WALKTHROUGH PICTURE BOARD - Complete picture record */}
          {walkthroughPhotos.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg text-left">
              <h4 className="text-xs font-bold text-slate-350 flex items-center gap-1.5 uppercase font-serif tracking-wide mb-2">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                RICKY'S INITIAL WALK PHOTO EVIDENCE ({walkthroughPhotos.length})
              </h4>
              <div className="grid grid-cols-4 gap-1.5">
                {walkthroughPhotos.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveLightboxUrl(p.imageUrl || null)}
                    className="relative aspect-square rounded-md border border-slate-700/60 cursor-zoom-in overflow-hidden hover:brightness-110 active:scale-95 transition-all shadow-sm group bg-slate-950"
                    title={`Captured: ${p.activeRoomName || "Walkthrough"}`}
                  >
                    <img
                      src={p.imageUrl}
                      alt="Walkthrough captured defect"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-1 py-0.5 text-[7.5px] text-slate-300 font-mono text-center truncate">
                      {p.activeRoomName || "Walkthrough"}
                    </div>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials Section */}
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg text-left">
            <div className="flex justify-between items-center mb-1.5">
              <h4 className="text-xs font-bold text-slate-350 flex items-center gap-1.5 uppercase font-serif tracking-wide">
                <Package className="w-3.5 h-3.5 text-zinc-400" />
                SHOP MATERIAL SELECTIONS
              </h4>
              <button
                onClick={() => copyToClipboard(generateMaterialsMarkdown(), "materials")}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 outline-none font-bold"
                title="Copy Material list"
              >
                {copiedMaterials ? (
                  <>
                    <Check className="w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5" />
                    <span>Copy Shop Run</span>
                  </>
                )}
              </button>
            </div>

            <div className="max-h-[140px] overflow-y-auto text-[10.5px] text-slate-300 font-mono space-y-1.5 custom-scrollbar pr-1">
              {consolidatedMaterials.length > 0 ? (
                consolidatedMaterials.map((m, idx) => {
                  const trained = mapMaterialToTrainedBrand(m);
                  return (
                    <div key={idx} className="flex flex-col py-1 border-b border-slate-800/40 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded bg-amber-500/80"></div>
                        <span className="text-slate-200 font-medium">{m}</span>
                      </div>
                      {trained !== m && (
                        <div className="text-[9.5px] text-amber-500/90 pl-3.5 leading-normal italic">
                          ↳ Preference: {trained}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 italic py-1 text-[10px]">No special materials required.</p>
              )}
            </div>
          </div>

          {/* Supervisor Digital Signature Authorization Board */}
          <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-800 text-left flex flex-col gap-2">
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block">
              Digital Authorization Stamp
            </span>

            {isSigned ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded flex items-center justify-between relative overflow-hidden">
                <div className="absolute right-1 top-1/2 -translate-y-1/2 rotate-12 select-none pointer-events-none opacity-10">
                  <ShieldCheck className="w-16 h-16 text-emerald-400" />
                </div>
                <div>
                  <span className="block text-[11px] font-extrabold text-[#fff] tracking-wide">
                    SIGNED: {supervisorName}
                  </span>
                  <span className="block text-[9px] text-emerald-400/80 font-mono">
                    Approved at {signTime}
                  </span>
                </div>
                <button
                  onClick={handleUndoSignOff}
                  className="bg-transparent hover:underline text-[10px] text-slate-400 hover:text-red-400 transition-all font-semibold outline-none border-0"
                >
                  Clear Signature
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <PenTool className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Enter Supervisor's Name"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSignOff}
                  disabled={!supervisorName.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold px-3 py-2 rounded text-xs transition-all outline-none"
                >
                  Authorize Work
                </button>
              </div>
            )}
            
            <p className="text-[9px] text-slate-500 italic leading-snug">
              *Sign-off unlocks physical shop runners and issues a production-stamped memo for Meadowood administration dispatch.*
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
