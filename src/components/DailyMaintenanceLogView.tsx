import React, { useState, useEffect } from "react";
import { ApartmentWalkthrough } from "../types";
import { Printer, Copy, Check, Sparkles, X, RefreshCw, Eye } from "lucide-react";

interface DailyMaintenanceLogViewProps {
  walkthroughs: Record<string, ApartmentWalkthrough>;
  isOpen: boolean;
  onClose: () => void;
}

interface InspectionRow {
  location: string;
  deficiency: string;
}

interface TimeSlotRow {
  id: string;
  hourText: string;
  minText: string;
  description: string;
}

export const DailyMaintenanceLogView: React.FC<DailyMaintenanceLogViewProps> = ({
  walkthroughs,
  isOpen,
  onClose,
}) => {
  const [employeeName, setEmployeeName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [inspections, setInspections] = useState<InspectionRow[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotRow[]>([]);
  const [otherNotes, setOtherNotes] = useState("");
  const [copied, setCopied] = useState(false);

  // Initialize and load cached data
  useEffect(() => {
    // Basic date setup
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    setDayOfWeek(days[now.getDay()]);
    setDateValue(now.toLocaleDateString());

    // Load employee name from cache if exists
    const cachedName = localStorage.getItem("meadowood_employee_name") || "";
    setEmployeeName(cachedName);

    // Load saved sheet if available
    const savedSheet = localStorage.getItem("meadowood_daily_maintenance_log_sheet");
    if (savedSheet) {
      try {
        const parsed = JSON.parse(savedSheet);
        if (parsed.employeeName) setEmployeeName(parsed.employeeName);
        if (parsed.dayOfWeek) setDayOfWeek(parsed.dayOfWeek);
        if (parsed.dateValue) setDateValue(parsed.dateValue);
        if (parsed.inspections) setInspections(parsed.inspections);
        if (parsed.timeSlots) setTimeSlots(parsed.timeSlots);
        if (parsed.otherNotes) setOtherNotes(parsed.otherNotes);
      } catch (e) {
        console.error("Failed parsing cached daily log sheet", e);
        initializeBlankSheet();
      }
    } else {
      initializeBlankSheet();
    }
  }, []);

  const initializeBlankSheet = () => {
    // 14 lines of inspections
    const blankInspections: InspectionRow[] = Array.from({ length: 14 }, () => ({
      location: "",
      deficiency: "",
    }));
    setInspections(blankInspections);

    // Timeline slots from 7:00 AM to 6:45 PM
    const hours = [
      "7:00 AM", "8:00", "9:00", "10:00", "11:00", "12:00 PM",
      "1:00", "2:00", "3:00", "4:00", "5:00", "6:00"
    ];
    const mins = [":00", ":15", ":30", ":45"];
    
    const slots: TimeSlotRow[] = [];
    hours.forEach((h) => {
      mins.forEach((m) => {
        slots.push({
          id: `${h}-${m}`,
          hourText: m === ":00" ? h : "", // Only display hour name on the first min slot
          minText: m,
          description: "",
        });
      });
    });
    setTimeSlots(slots);
    setOtherNotes("");
  };

  // Save changes to cache
  const saveSheetToCache = (
    name: string,
    day: string,
    dt: string,
    insp: InspectionRow[],
    slots: TimeSlotRow[],
    notes: string
  ) => {
    const payload = {
      employeeName: name,
      dayOfWeek: day,
      dateValue: dt,
      inspections: insp,
      timeSlots: slots,
      otherNotes: notes,
    };
    localStorage.setItem("meadowood_employee_name", name);
    localStorage.setItem("meadowood_daily_maintenance_log_sheet", JSON.stringify(payload));
  };

  const handleFieldChange = (
    type: "insp" | "time" | "header",
    index: number,
    field: string,
    val: string
  ) => {
    let updatedInsps = [...inspections];
    let updatedSlots = [...timeSlots];
    let updatedName = employeeName;
    let updatedDay = dayOfWeek;
    let updatedDt = dateValue;
    let updatedNotes = otherNotes;

    if (type === "insp") {
      updatedInsps[index] = { ...updatedInsps[index], [field]: val };
      setInspections(updatedInsps);
    } else if (type === "time") {
      updatedSlots[index] = { ...updatedSlots[index], description: val };
      setTimeSlots(updatedSlots);
    } else if (type === "header") {
      if (field === "name") {
        updatedName = val;
        setEmployeeName(val);
      } else if (field === "day") {
        updatedDay = val;
        setDayOfWeek(val);
      } else if (field === "date") {
        updatedDt = val;
        setDateValue(val);
      } else if (field === "notes") {
        updatedNotes = val;
        setOtherNotes(val);
      }
    }

    saveSheetToCache(updatedName, updatedDay, updatedDt, updatedInsps, updatedSlots, updatedNotes);
  };

  // Engine: Auto-fill fields from Walkthrough logs
  const handleAutoFill = () => {
    const walks = Object.values(walkthroughs) as ApartmentWalkthrough[];
    if (walks.length === 0) {
      alert("No active unit walkthrough logs recorded today yet. Walk units and log items first to feed the smart compiler!");
      return;
    }

    // --- Fill General Inspections ---
    const newInsps: InspectionRow[] = Array.from({ length: 14 }, () => ({
      location: "",
      deficiency: "",
    }));

    let inspIdx = 0;
    walks.forEach((walk) => {
      // For each apartment, extract flagged repair needs Grouped slightly or separate
      const roomsWithRepairs = walk.rooms.flatMap((r) => {
        const repairsInRoom = r.items.filter((i) => i.status === "Needs Repair");
        if (repairsInRoom.length > 0) {
          return {
            roomName: r.name,
            issues: repairsInRoom.map((i) => `${i.name}: ${i.details || "Deficiency"}`).join("; "),
          };
        }
        return [];
      });

      if (roomsWithRepairs.length > 0) {
        roomsWithRepairs.forEach((item) => {
          if (inspIdx < 14) {
            newInsps[inspIdx] = {
              location: `Apt ${walk.aptNumber} - ${item.roomName}`,
              deficiency: item.issues,
            };
            inspIdx++;
          }
        });
      } else {
        // If whole apartment is perfect
        if (inspIdx < 14) {
          newInsps[inspIdx] = {
            location: `Apt ${walk.aptNumber} (All Rooms)`,
            deficiency: "OK. No deficiencies detected. Grounded clean.",
          };
          inspIdx++;
        }
      }
    });
    setInspections(newInsps);

    // --- Fill Timeline work hours ---
    const updatedSlots = [...timeSlots];
    // Clear previous slot content
    updatedSlots.forEach((s) => (s.description = ""));

    // We distribute work tasks across slots chronologically. Let's make an automated maintenance schedule:
    // We assume they start work at 8:00 AM.
    // Let's allocate slots for each walked apartment
    let currentSlotPointerIndex = 4; // Index 4 corresponds to 8:00 AM (0: 7:00, 1: 7:15, 2: 7:30, 3: 7:45, 4: 8:00)

    // Log the clock-in safety assembly
    if (updatedSlots[0]) updatedSlots[0].description = "Clocked in. Safe start group meeting, loaded work orders.";
    if (updatedSlots[1]) updatedSlots[1].description = "Loaded utility cart with standard make-ready kits & truck stock.";
    if (updatedSlots[2]) updatedSlots[2].description = "Inspected shop inventories for day prep.";
    if (updatedSlots[3]) updatedSlots[3].description = "Travel to buildings, perimeter check.";

    walks.forEach((walk) => {
      // 1. Walkthrough slot: Each walkthrough has a estimate time
      const estimateMins = walk.timeEstimateTotal || 30;
      const neededSlots = Math.ceil(estimateMins / 15);
      
      // Fill walkthrough slots
      for (let s = 0; s < neededSlots; s++) {
        const slotIdx = currentSlotPointerIndex + s;
        if (slotIdx < updatedSlots.length) {
          if (s === 0) {
            updatedSlots[slotIdx].description = `Started comprehensive make-ready walk on Apt ${walk.aptNumber}.`;
          } else {
            updatedSlots[slotIdx].description = `Apt ${walk.aptNumber}: checked walls, windows, appliances & plumbing fixtures.`;
          }
        }
      }
      currentSlotPointerIndex += neededSlots;

      // 2. Repairs slots: Let's log physical fixes done or dispatched
      const repairs = walk.rooms.flatMap((r) =>
        r.items.filter((i) => i.status === "Needs Repair").map((i) => ({ ...i, roomName: r.name }))
      );

      repairs.forEach((rep) => {
        const repMins = rep.timeEstimate || 15;
        const repSlots = Math.ceil(repMins / 15);

        for (let s = 0; s < repSlots; s++) {
          const slotIdx = currentSlotPointerIndex + s;
          if (slotIdx < updatedSlots.length) {
            if (s === 0) {
              updatedSlots[slotIdx].description = `Apt ${walk.aptNumber} [${rep.roomName}] ➜ Repairing ${rep.name}: ${rep.details || "logged fix"}.`;
            } else {
              updatedSlots[slotIdx].description = `Continuing active repairs in Apt ${walk.aptNumber} - ${rep.roomName}.`;
            }
          }
        }
        currentSlotPointerIndex += repSlots;
      });

      // Buffer gap for travel/restock
      if (currentSlotPointerIndex < updatedSlots.length) {
        updatedSlots[currentSlotPointerIndex].description = `Transitioning check ledger, cleaning work area & disposing materials.`;
        currentSlotPointerIndex++;
      }
    });

    // Read parts consumed from shift logs and brand training to build comprehensive log lines
    const partActionsCached = localStorage.getItem("meadowood_shift_inventory_actions");
    const brandTrainingCached = localStorage.getItem("meadowood_brand_training");
    let partsUsedSummary = "";
    let totalEstLogMins = 0;

    if (partActionsCached) {
      try {
        const parActions = JSON.parse(partActionsCached);
        const consumed = parActions.filter((a: any) => a.type === "consume");
        if (consumed.length > 0) {
          partsUsedSummary = "\n\n=== 🛠️ MEADOWOOD PARTS CONSUMED ===\n";
          consumed.forEach((c: any) => {
            let brandInfo = c.itemName;
            if (brandTrainingCached) {
              const brands = JSON.parse(brandTrainingCached);
              const spec = brands.find((b: any) => b.itemName === c.itemName);
              if (spec) {
                brandInfo = `${spec.brand} [Part: ${spec.partNumber}] (${spec.supplier})`;
              }
            }
            partsUsedSummary += `- [${c.aptNumber}] Checked out & installed: ${c.countAdjusted}x ${brandInfo} (Estimated: ${c.timeEstimate}m)\n`;
            totalEstLogMins += c.timeEstimate;
          });
        }
        
        // Populate timeline with physical parts checkout and replacement actions
        parActions.forEach((act: any, aIdx: number) => {
          const targetSlotIdx = currentSlotPointerIndex + aIdx;
          if (targetSlotIdx < updatedSlots.length - 4) {
            const verb = act.type === "consume" ? "Replaced/Installed" : "Checked-in vendor supply run of";
            updatedSlots[targetSlotIdx].description = `${act.aptNumber}: ${verb} ${act.countAdjusted}x ${act.itemName} (~${act.timeEstimate}m completing task).`;
          }
        });
        currentSlotPointerIndex += parActions.length;
      } catch (e) {
        console.error("Failed extracting inventory actions in layout fill", e);
      }
    }

    // Populate remaining slots with standard post-inspections/make-ready review
    for (let idx = currentSlotPointerIndex; idx < updatedSlots.length; idx++) {
      if (!updatedSlots[idx].description) {
        if (idx === updatedSlots.length - 4) {
          updatedSlots[idx].description = "Returned to maintenance shop, briefed team on critical materials run & inventory statuses.";
        } else if (idx === updatedSlots.length - 3) {
          updatedSlots[idx].description = "Logged finalized apartment checklists into management records.";
        } else if (idx === updatedSlots.length - 2) {
          updatedSlots[idx].description = "Cleaned up shop workspace, stored physical toolbox and checked out keys.";
        } else if (idx === updatedSlots.length - 1) {
          updatedSlots[idx].description = "Final checkout of files, locked up building, clock out shift. Safe travel.";
        } else {
          updatedSlots[idx].description = "Standard property work list: checked fire compliance, light poles & gates.";
        }
      }
    }

    setTimeSlots(updatedSlots);

    // Auto write other notes summarizing the apartments checked
    const aptNums = walks.map((w) => `Apt ${w.aptNumber}`).join(", ");
    const finalNotes = `Completed physical walkthrough audits on ${walks.length} units: ${aptNums}.\nTransmitted urgent electrical & safety items to the leasing desk.\nDispatched material list to Tristan for parts procurement run.${partsUsedSummary}`;
    setOtherNotes(finalNotes);

    saveSheetToCache(employeeName, dayOfWeek, dateValue, newInsps, updatedSlots, finalNotes);
    alert(`✨ Digital Twin Log auto-filled successfully! All walkthrough checklist items and ${actionsCountText(partActionsCached)} shop parts transactions mapped directly with estimated time completions!`);
  };

  const actionsCountText = (cached: string | null) => {
    if (!cached) return "0";
    try {
      const parsed = JSON.parse(cached);
      return parsed.length.toString();
    } catch {
      return "0";
    }
  };

  const handleCopyTextReport = () => {
    let report = `📋 MEADOWOOD VILLAGE - PHYSICAL MAINTENANCE BINDER REPORT\n`;
    report += `Employee Name: ${employeeName || "Unspecified"} | Day: ${dayOfWeek} | Date: ${dateValue}\n`;
    report += `──────────────────────────────────────────\n\n`;
    report += `📈 GENERAL INSPECTIONS:\n`;
    inspections.forEach((insp, i) => {
      if (insp.location || insp.deficiency) {
        report += `[Line ${i + 1}] Location: ${insp.location || "None"} ➜ Def/OK: ${insp.deficiency || "OK"}\n`;
      }
    });

    report += `\n🕒 WORK timeline schedule:\n`;
    timeSlots.forEach((slot) => {
      if (slot.description) {
        // Find hour header context
        const displayHr = slot.hourText ? `${slot.hourText}` : "";
        report += `- ${displayHr}${slot.minText} ➜ ${slot.description}\n`;
      }
    });

    if (otherNotes) {
      report += `\n📝 OTHER NOTES:\n${otherNotes}\n`;
    }

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
      <div className="bg-[#fcfbf9] border border-natural-border max-w-[1100px] w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col my-4 max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header toolbar - Hidden in Print */}
        <div className="bg-[#5A5A40] text-white p-4 flex items-center justify-between border-b border-[#484833] print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-[#EFECE5]" />
            <div>
              <h3 className="text-sm font-bold tracking-wider font-serif uppercase">
                Daily Maintenance Log Twin
              </h3>
              <p className="text-[10px] text-white/80 font-mono tracking-wide">
                Exact Digital Replica of physical M-11 Binder sheets
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFill}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all outline-none shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Auto-Compile Logs
            </button>
            <button
              onClick={handleCopyTextReport}
              className="bg-[#efece5] hover:bg-[#e6e3db] text-[#43423e] border border-natural-border px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all outline-none shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Plaintext"}
            </button>
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all outline-none shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Form Page
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white ml-2 outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Container */}
        <div className="flex-1 overflow-y-auto p-8 font-sans bg-[#FBFBFA] relative custom-scrollbar print:p-0 print:overflow-visible">
          
          {/* Virtual multi-ring Binder visual indicators - Hidden in Print */}
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex flex-col gap-24 pointer-events-none print:hidden opacity-30">
            <div className="w-10 h-6 border-2 border-slate-400 bg-slate-200 rounded-lg"></div>
            <div className="w-10 h-6 border-2 border-slate-400 bg-slate-200 rounded-lg"></div>
            <div className="w-10 h-6 border-2 border-slate-400 bg-slate-200 rounded-lg"></div>
          </div>

          <div className="max-w-[1000px] w-full mx-auto bg-white border border-slate-200 p-8 shadow-sm flex flex-col text-[#33322E] min-h-[900px] print:shadow-none print:border-none print:p-0">
            {/* Title Block */}
            <div className="text-center border-b-2 border-slate-800 pb-3 mb-6 relative">
              <h1 className="text-xl font-medium tracking-wide uppercase font-serif">Daily Maintenance Log</h1>
              
              {/* Header Inputs Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-xs text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wider uppercase font-serif">EMPLOYEE NAME:</span>
                  <input
                    type="text"
                    value={employeeName}
                    placeholder="Enter Technician's Name"
                    onChange={(e) => handleFieldChange("header", 0, "name", e.target.value)}
                    className="flex-1 bg-transparent border-b border-slate-800 focus:outline-none py-0.5 text-xs placeholder:text-slate-350 pr-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wider uppercase font-serif">DAY:</span>
                  <input
                    type="text"
                    value={dayOfWeek}
                    placeholder="e.g. Tuesday"
                    onChange={(e) => handleFieldChange("header", 0, "day", e.target.value)}
                    className="flex-1 bg-transparent border-b border-slate-800 focus:outline-none py-0.5 text-xs placeholder:text-slate-350 pr-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wider uppercase font-serif">DATE:</span>
                  <input
                    type="text"
                    value={dateValue}
                    placeholder="Date"
                    onChange={(e) => handleFieldChange("header", 0, "date", e.target.value)}
                    className="flex-1 bg-transparent border-b border-slate-800 focus:outline-none py-0.5 text-xs placeholder:text-slate-350 pr-1"
                  />
                </div>
              </div>
            </div>

            {/* Grid Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 text-xs">
              
              {/* Left Column: General Inspections & Other Notes (Span 6) */}
              <div className="lg:col-span-6 space-y-6 flex flex-col justify-between h-full">
                {/* General Inspections Section */}
                <div className="border border-slate-800 rounded">
                  {/* Grid Header */}
                  <div className="bg-slate-800 text-white p-2 text-center text-[10px] font-bold tracking-wider uppercase">
                    General Inspections - Assigned Buildings
                  </div>

                  {/* Columns titles */}
                  <div className="grid grid-cols-12 border-b border-slate-800 text-[10px] font-bold text-center bg-slate-100">
                    <div className="col-span-4 border-r border-slate-800 py-1.5 uppercase font-serif">Location</div>
                    <div className="col-span-8 py-1.5 leading-normal text-[9px] px-1 uppercase">
                      List deficiencies or mark "OK". Notify Office for hazards.
                    </div>
                  </div>

                  {/* 14 Lines Rows */}
                  <div className="divide-y divide-slate-800">
                    {inspections.map((insp, idx) => (
                      <div key={idx} className="grid grid-cols-12 font-mono items-center h-7 text-[11px]">
                        {/* Location input */}
                        <div className="col-span-4 border-r border-slate-800 h-full">
                          <input
                            type="text"
                            value={insp.location || ""}
                            onChange={(e) => handleFieldChange("insp", idx, "location", e.target.value)}
                            className="w-full h-full px-2 bg-transparent text-slate-800 focus:outline-none focus:bg-amber-500/5 font-sans truncate"
                          />
                        </div>
                        {/* Deficiencies input */}
                        <div className="col-span-8 h-full">
                          <input
                            type="text"
                            value={insp.deficiency || ""}
                            onChange={(e) => handleFieldChange("insp", idx, "deficiency", e.target.value)}
                            className="w-full h-full px-2 bg-transparent text-slate-800 focus:outline-none focus:bg-amber-500/5 font-sans truncate"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Notes Section */}
                <div className="border border-slate-800 rounded">
                  <div className="bg-slate-100 p-1.5 font-bold font-serif text-center border-b border-slate-800 text-[10px] uppercase">
                    Other Notes
                  </div>
                  <textarea
                    rows={8}
                    value={otherNotes}
                    onChange={(e) => handleFieldChange("header", 0, "notes", e.target.value)}
                    placeholder="Enter any other field observations, building notices, or parts orders dispatched to Tristan here..."
                    className="w-full p-3 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none font-sans leading-relaxed"
                  />
                  <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 text-[9px] text-slate-400 font-mono italic">
                    *Please provide any further information on the back of this log sheet*
                  </div>
                </div>
              </div>

              {/* Right Column: Time Log (Span 6) */}
              <div className="lg:col-span-6">
                <div className="border border-slate-800 rounded overflow-hidden">
                  <div className="bg-slate-800 text-white p-2 text-center text-[10px] font-bold tracking-wider uppercase">
                    List All Work - Applied and Unapplied Time
                  </div>

                  {/* Table headers */}
                  <div className="grid grid-cols-12 border-b border-slate-800 text-[10px] font-bold bg-slate-100 text-center">
                    <div className="col-span-2 border-r border-slate-800 py-1.5 uppercase font-serif">Hour</div>
                    <div className="col-span-1 border-r border-slate-800 py-1.5 uppercase font-serif">Min</div>
                    <div className="col-span-9 py-1.5 uppercase font-serif">Description</div>
                  </div>

                  {/* Hour slots rows */}
                  <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
                    {timeSlots.map((slot, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center text-[11px] h-[26px]">
                        {/* Hour */}
                        <div className="col-span-2 border-r border-slate-800 font-bold text-center h-full text-[9px] flex items-center justify-center bg-slate-50/50">
                          {slot.hourText}
                        </div>
                        {/* Min */}
                        <div className="col-span-1 border-r border-slate-800 font-mono text-center text-[#555] h-full flex items-center justify-center bg-slate-50/30">
                          {slot.minText}
                        </div>
                        {/* Target Description */}
                        <div className="col-span-9 h-full">
                          <input
                            type="text"
                            value={slot.description || ""}
                            onChange={(e) => handleFieldChange("time", idx, "", e.target.value)}
                            className="w-full h-full px-2 bg-transparent text-slate-800 focus:outline-none focus:bg-amber-500/5 font-sans truncate text-[10px]"
                            placeholder="..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Document bottom footer */}
            <div className="border-t border-slate-350 pt-3 mt-6 flex justify-between items-center text-[9px] text-slate-400 font-mono">
              <span>M-11 &nbsp; Rev. 08/10/18</span>
              <span className="font-sans font-medium uppercase text-slate-500 tracking-wide">
                Grounded Make-Ready Console Output
              </span>
            </div>
          </div>
        </div>

        {/* Floating Print Helper Notice in screen view */}
        <div className="bg-[#EFECE5] border-t border-natural-border p-3 flex justify-between gap-3 text-xs text-slate-700 print:hidden shrink-0 font-medium">
          <span>💡 <strong>Tip:</strong> Ready to print? Pressing "Print Form Page" triggers your browser's print engine. Our custom stylesheet automatically hides the helper panels to construct a paper-perfect physical binder match!</span>
          <button
            onClick={onClose}
            className="text-amber-700 font-bold underline shrink-0 whitespace-nowrap"
          >
            Dismiss Preview
          </button>
        </div>
      </div>
    </div>
  );
};
