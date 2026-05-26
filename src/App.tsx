import { useState, useEffect } from "react";
import { ApartmentWalkthrough, ChecklistItem, Message } from "./types";
import { MEADOWOOD_ROOMS_TEMPLATE } from "./data";
import { AptSelector } from "./components/AptSelector";
import { ChatInterface } from "./components/ChatInterface";
import { ChecklistTracker } from "./components/ChecklistTracker";
import { TristanPanel } from "./components/TristanPanel";
import { ShiftLedger } from "./components/ShiftLedger";
import { DailyMaintenanceLogView } from "./components/DailyMaintenanceLogView";
import { PhotoGalleryModal } from "./components/PhotoGalleryModal";
import { InventoryTracker } from "./components/InventoryTracker";
import { Building, ClipboardList, ShieldAlert, Trash2, BookOpen, FileImage } from "lucide-react";

export default function App() {
  // State elements
  const [walkthroughs, setWalkthroughs] = useState<Record<string, ApartmentWalkthrough>>({});
  const [currentAptId, setCurrentAptId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [isDailyLogOpen, setIsDailyLogOpen] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<{
    type: "manual" | "ai";
    targetIndex: number;
    aiResponseData?: any;
    userMessageToAppend?: Message;
  } | null>(null);

  const speakVoiceAlert = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };


  // Load and cache State from localStorage
  useEffect(() => {
    const cachedWalks = localStorage.getItem("meadowood_walkthroughs");
    const cachedActiveApt = localStorage.getItem("meadowood_active_apt");
    const cachedMessages = localStorage.getItem("meadowood_messages");

    if (cachedWalks) {
      try {
        setWalkthroughs(JSON.parse(cachedWalks));
      } catch (e) {
        console.error(e);
      }
    }

    if (cachedActiveApt) {
      setCurrentAptId(cachedActiveApt);
    }

    if (cachedMessages) {
      try {
        const parsed = JSON.parse(cachedMessages);
        if (Array.isArray(parsed)) {
          const seen = new Set();
          const clean: Message[] = [];
          parsed.forEach((m) => {
            if (m && m.id && !seen.has(m.id)) {
              seen.add(m.id);
              clean.push(m);
            }
          });
          setMessages(clean);
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default welcome dialogue thread from assistant
      const welcomeMsg: Message = {
        id: "welcome-1",
        role: "assistant",
        content: `👋 Ready for today's units make-readies? I'm your Meadowood Village Walkthrough Assistant.\n\nTo start a unit walkthrough, just yell:\n👉 *Let's go Apt 6449*\n\nI will instantly fetch the official company provided checklist for each room, log repair priorities, rough time estimates, and generate Tristan's material shopping list! Let's get to work.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([welcomeMsg]);
    }
  }, []);

  // Save changes to localStorage on any updates
  const saveState = (
    updatedWalks: Record<string, ApartmentWalkthrough>,
    activeApt: string | null,
    updatedMsgs: Message[]
  ) => {
    setWalkthroughs(updatedWalks);
    setCurrentAptId(activeApt);
    setMessages(updatedMsgs);

    localStorage.setItem("meadowood_walkthroughs", JSON.stringify(updatedWalks));
    localStorage.setItem("meadowood_messages", JSON.stringify(updatedMsgs));
    if (activeApt) {
      localStorage.setItem("meadowood_active_apt", activeApt);
    } else {
      localStorage.removeItem("meadowood_active_apt");
    }
  };

  // Helper: Bootstraps a fresh checklist template for an apartment
  const initializeApartment = (aptNum: string): ApartmentWalkthrough => {
    const freshRooms = JSON.parse(JSON.stringify(MEADOWOOD_ROOMS_TEMPLATE));
    return {
      id: aptNum,
      aptNumber: aptNum,
      status: "In Progress",
      rooms: freshRooms,
      currentRoomIndex: 0,
      timeEstimateTotal: 0,
      createdAt: new Date().toISOString(),
    };
  };

  // Select or trigger new unit walkthrough
  const handleSelectApt = (aptNum: string) => {
    const cleanNum = aptNum.trim();
    if (!cleanNum) return;

    const updated = { ...walkthroughs };
    if (!updated[cleanNum]) {
      updated[cleanNum] = initializeApartment(cleanNum);
    }

    // Inform conversation thread
    const systemNotice: Message = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: "assistant",
      content: `📁 Started/Switched walkthrough for Apt ${cleanNum}.\nActive room: Living Room/Entry.\nSpeak naturally to log items, or tap checkboxes below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    saveState(updated, cleanNum, [...messages, systemNotice]);
  };

  // Finalize walkthrough command trigger
  const handleFinishApt = (aptNum: string) => {
    const updated = { ...walkthroughs };
    if (updated[aptNum]) {
      updated[aptNum].status = "Finished";
      updated[aptNum].finishedAt = new Date().toISOString();

      const finishNotice: Message = {
        id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role: "assistant",
        content: `✅ Finished Walkthrough for Apt ${aptNum}. Tristan's dispatch lists have been synthesized and copyable! Check the summary on the right.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      saveState(updated, currentAptId, [...messages, finishNotice]);
    }
  };

  // End of shift trigger
  const handleEndShift = () => {
    setIsShiftOpen(true);
  };

  // Reset shift parameters entirely
  const handleRestartShift = () => {
    if (confirm("Are you sure you want to clear todays progress ledger? This will remove all walked units and chat logs.")) {
      localStorage.clear();
      setWalkthroughs({});
      setCurrentAptId(null);
      const resetMsg: Message = {
        id: `welcome-reset`,
        role: "assistant",
        content: `👋 All previous ledgers deleted. Ready for clean walkthrough logs!\nEnter: *Let's go Apt [number]* to start.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([resetMsg]);
      setIsShiftOpen(false);
    }
  };

  // Handle items manual override click changes
  const handleUpdateItem = (roomName: string, itemId: string, updatedFields: Partial<ChecklistItem>, targetAptId?: string) => {
    const aptId = targetAptId || currentAptId;
    if (!aptId || !walkthroughs[aptId]) return;

    const updated = JSON.parse(JSON.stringify(walkthroughs));
    const walk = updated[aptId] as ApartmentWalkthrough;
    const room = walk.rooms.find((r) => r.name.toLowerCase() === roomName.toLowerCase());

    if (room) {
      const item = room.items.find((i) => i.id === itemId);
      if (item) {
        Object.assign(item, updatedFields);

        // Recalculate total estimated times for the current apartment
        walk.timeEstimateTotal = walk.rooms.reduce(
          (sum, r) => sum + r.items.reduce((iSum, i) => iSum + (i.timeEstimate || 0), 0),
          0
        );

        saveState(updated, aptId, messages);
      }
    }
  };

  // Quick add Custom items to active room
  const handleAddCustomItem = (roomName: string, name: string) => {
    if (!currentAptId || !walkthroughs[currentAptId]) return;

    const updated = JSON.parse(JSON.stringify(walkthroughs));
    const walk = updated[currentAptId] as ApartmentWalkthrough;
    const room = walk.rooms.find((r) => r.name.toLowerCase() === roomName.toLowerCase());

    if (room) {
      const newItem: ChecklistItem = {
        id: `custom-${Date.now()}`,
        name: name,
        status: "Unaddressed",
        category: "Misc",
      };
      room.items.push(newItem);
      saveState(updated, currentAptId, messages);
    }
  };

  // Horizontal Room change override
  const handleSelectRoom = (roomIndex: number) => {
    if (!currentAptId || !walkthroughs[currentAptId]) return;
    const walk = walkthroughs[currentAptId];
    const activeRoom = walk.rooms[walk.currentRoomIndex];
    const unaddressed = activeRoom.items.filter((i) => i.status === "Unaddressed");

    const isSkipped = roomIndex > walk.currentRoomIndex + 1;
    const hasUnaddressedInLastRoom = unaddressed.length > 0;

    if ((isSkipped || hasUnaddressedInLastRoom) && roomIndex !== walk.currentRoomIndex) {
      setPendingTransition({
        type: "manual",
        targetIndex: roomIndex,
      });

      if (isSkipped && hasUnaddressedInLastRoom) {
        speakVoiceAlert(`Wait Ricky! You are skipping a room altogether, and you still have ${unaddressed.length} unaddressed items in the ${activeRoom.name}.`);
      } else if (isSkipped) {
        speakVoiceAlert(`Wait Ricky! You are skipping a room altogether. Let's make sure that's correct.`);
      } else {
        speakVoiceAlert(`Wait Ricky! There are still ${unaddressed.length} unaddressed items on your list in the ${activeRoom.name}.`);
      }
      return;
    }

    const updated = { ...walkthroughs };
    updated[currentAptId].currentRoomIndex = roomIndex;
    saveState(updated, currentAptId, messages);
  };

  const handleResolveTransition = (decision: "proceed" | "markOk" | "cancel") => {
    if (!pendingTransition || !currentAptId || !walkthroughs[currentAptId]) {
      setPendingTransition(null);
      return;
    }

    const { type, targetIndex, aiResponseData, userMessageToAppend } = pendingTransition;
    const updated = JSON.parse(JSON.stringify(walkthroughs));
    const walk = updated[currentAptId] as ApartmentWalkthrough;
    const currentRoom = walk.rooms[walk.currentRoomIndex];

    if (decision === "cancel") {
      setPendingTransition(null);
      return;
    }

    if (decision === "markOk") {
      currentRoom.items.forEach((item: ChecklistItem) => {
        if (item.status === "Unaddressed") {
          item.status = "OK";
        }
      });
    }

    walk.currentRoomIndex = targetIndex;
    let nextMessages = [...messages];

    if (type === "ai" && aiResponseData) {
      if (aiResponseData.checklistUpdates && Array.isArray(aiResponseData.checklistUpdates)) {
        const activeRoom = walk.rooms[walk.currentRoomIndex];
        aiResponseData.checklistUpdates.forEach((upItem: any) => {
          let item = activeRoom.items.find((i: ChecklistItem) => i.id === upItem.id);
          if (!item) {
            item = activeRoom.items.find(
              (i: ChecklistItem) => i.name.toLowerCase() === upItem.name.toLowerCase()
            );
          }
          if (item) {
            item.status = upItem.status;
            item.details = upItem.details || undefined;
            item.priority = upItem.priority || undefined;
            if (upItem.category) item.category = upItem.category;
            if (upItem.timeEstimate) item.timeEstimate = upItem.timeEstimate;
            if (upItem.materialsNeeded) item.materialsNeeded = upItem.materialsNeeded;
          } else {
            const newItem: ChecklistItem = {
              id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: upItem.name,
              status: upItem.status,
              details: upItem.details || undefined,
              priority: upItem.priority || undefined,
              category: upItem.category || "Misc",
              timeEstimate: upItem.timeEstimate || undefined,
              materialsNeeded: upItem.materialsNeeded || [],
            };
            activeRoom.items.push(newItem);
          }
        });
      }

      if (aiResponseData.isFinishTriggered) {
        walk.status = "Finished";
        walk.finishedAt = new Date().toISOString();
      }

      if (userMessageToAppend) {
        nextMessages = [...messages, userMessageToAppend];
      }

      const assistantMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-ai`,
        role: "assistant",
        content: aiResponseData.assistantResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        activeRoomName: walk.rooms[walk.currentRoomIndex].name,
        aptNumber: currentAptId,
      };
      nextMessages.push(assistantMsg);
    }

    walk.timeEstimateTotal = walk.rooms.reduce(
      (sum: number, r: any) => sum + r.items.reduce((iSum: number, i: any) => iSum + (i.timeEstimate || 0), 0),
      0
    );

    saveState(updated, currentAptId, nextMessages);
    setPendingTransition(null);
  };

  // Delete photo referenced on a message and clean up placeholder messages
  const handleDeletePhoto = (messageId: string) => {
    const updatedMessages = messages
      .map((msg) => {
        if (msg.id === messageId) {
          const clone = { ...msg };
          delete clone.imageUrl;
          return clone;
        }
        return msg;
      })
      .filter((msg) => {
        if (!msg.imageUrl && (msg.content === "Attached photo for make-ready review." || msg.content === "Attached photo for make-ready inspection.")) {
          return false;
        }
        return true;
      });

    saveState(walkthroughs, currentAptId, updatedMessages);
  };

  // Main input text router + backend analysis trigger
  const handleSendMessage = async (rawText: string, photo?: { data: string; mimeType: string }) => {
    const text = rawText.trim();
    if (!text && !photo) return;

    // Client-side quick intercepts before server dispatch
    // Matches expressions like Let's go Apt 6449
    const matchApt = text.match(/let's go apt\s*#?\s*(\w+)/i);
    let targetAptId = currentAptId;

    const updatedWalks = { ...walkthroughs };

    if (matchApt) {
      const aptNum = matchApt[1];
      if (!updatedWalks[aptNum]) {
        updatedWalks[aptNum] = initializeApartment(aptNum);
      }
      targetAptId = aptNum;
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: "user",
      content: text || "Attached photo for make-ready review.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      imageUrl: photo ? `data:${photo.mimeType};base64,${photo.data}` : undefined,
      aptNumber: targetAptId || undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setErrorMessage(null);

    // Default room variables if none loaded
    const activeWalk = targetAptId ? updatedWalks[targetAptId] : null;
    const currentRoomName = activeWalk ? activeWalk.rooms[activeWalk.currentRoomIndex].name : "Living Room/Entry";

    // Load active Brand Training specifications from localStorage to ground the Gemini AI dynamically
    const brandTrainingCached = localStorage.getItem("meadowood_brand_training");
    let brandTrainingArr = [];
    if (brandTrainingCached) {
      try {
        brandTrainingArr = JSON.parse(brandTrainingCached);
      } catch (e) {
        console.error("Failed parsing brand list", e);
      }
    }

    try {
      const res = await fetch("/api/assistant/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aptNumber: targetAptId,
          currentRoomName: currentRoomName,
          checklist: activeWalk ? activeWalk.rooms : [],
          text: text || "Attached photo for make-ready review.",
          history: newMessages,
          photo: photo,
          brandTraining: brandTrainingArr,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Assistant service failed.");
      }

      const data = await res.json();

      // Apply server updates to local state
      if (targetAptId && updatedWalks[targetAptId]) {
        const walk = updatedWalks[targetAptId];

        // CHECK ROOM TRANSITIONS FOR UNADDRESSED ITEMS FIRST
        let holdsTransition = false;
        let matchedIdx = -1;
        let isSkippedVoice = false;
        let hasUnaddressedInLastRoomVoice = false;

        if (data.detectedRoomSwap) {
          matchedIdx = walk.rooms.findIndex(
            (r) => r.name.toLowerCase() === data.detectedRoomSwap.toLowerCase()
          );
          if (matchedIdx !== -1 && matchedIdx !== walk.currentRoomIndex) {
            const currentRoom = walk.rooms[walk.currentRoomIndex];
            const unaddressed = currentRoom.items.filter((i) => i.status === "Unaddressed");
            
            isSkippedVoice = matchedIdx > walk.currentRoomIndex + 1;
            hasUnaddressedInLastRoomVoice = unaddressed.length > 0;

            if (isSkippedVoice || hasUnaddressedInLastRoomVoice) {
              holdsTransition = true;
            }
          }
        }

        if (holdsTransition) {
          setPendingTransition({
            type: "ai",
            targetIndex: matchedIdx,
            aiResponseData: data,
            userMessageToAppend: userMsg,
          });
          setIsLoading(false);
          const currentRoomName = walk.rooms[walk.currentRoomIndex].name;

          if (isSkippedVoice && hasUnaddressedInLastRoomVoice) {
            speakVoiceAlert(`Wait Ricky! You are skipping a room altogether, and please check your checklist, there are still unaddressed items in the ${currentRoomName}.`);
          } else if (isSkippedVoice) {
            speakVoiceAlert(`Wait Ricky! You are skipping a room altogether. Let's make sure that's correct.`);
          } else {
            speakVoiceAlert(`Wait Ricky! Please check your checklist. There are still unaddressed items in the ${currentRoomName}.`);
          }
          return; // STOP execution loop here! The modal handles the resolve trigger!
        }

        // 1. Process room swaps (e.g. "Kitchen")
        if (data.detectedRoomSwap) {
          const matchedRoomIdx = walk.rooms.findIndex(
            (r) => r.name.toLowerCase() === data.detectedRoomSwap.toLowerCase()
          );
          if (matchedRoomIdx !== -1) {
            walk.currentRoomIndex = matchedRoomIdx;
          }
        }

        // 2. Process check list updates returned from server
        if (data.checklistUpdates && Array.isArray(data.checklistUpdates)) {
          const currentRoom = walk.rooms[walk.currentRoomIndex];

          data.checklistUpdates.forEach((upItem: any) => {
            // Find existing checklist item by name or id
            let item = currentRoom.items.find((i) => i.id === upItem.id);
            if (!item) {
              item = currentRoom.items.find(
                (i) => i.name.toLowerCase() === upItem.name.toLowerCase()
              );
            }

            if (item) {
              // override or update fields
              item.status = upItem.status;
              item.details = upItem.details || undefined;
              item.priority = upItem.priority || undefined;
              if (upItem.category) item.category = upItem.category;
              if (upItem.timeEstimate) item.timeEstimate = upItem.timeEstimate;
              if (upItem.materialsNeeded) item.materialsNeeded = upItem.materialsNeeded;
            } else {
              // Add as a custom mapped item if not found
              const newItem: ChecklistItem = {
                id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                name: upItem.name,
                status: upItem.status,
                details: upItem.details || undefined,
                priority: upItem.priority || undefined,
                category: upItem.category || "Misc",
                timeEstimate: upItem.timeEstimate || undefined,
                materialsNeeded: upItem.materialsNeeded || [],
              };
              currentRoom.items.push(newItem);
            }
          });
        }

        // 3. Process isFinishTriggered
        if (data.isFinishTriggered) {
          walk.status = "Finished";
          walk.finishedAt = new Date().toISOString();
        }

        // Recalculate total estimated duration
        walk.timeEstimateTotal = walk.rooms.reduce(
          (sum, r) => sum + r.items.reduce((iSum, i) => iSum + (i.timeEstimate || 0), 0),
          0
        );
      }

      // Check isShiftEndTriggered
      if (data.isShiftEndTriggered) {
        setIsShiftOpen(true);
      }

      // Record assistant's response bubble
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-ai`,
        role: "assistant",
        content: data.assistantResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        activeRoomName: targetAptId ? updatedWalks[targetAptId].rooms[updatedWalks[targetAptId].currentRoomIndex].name : undefined,
        aptNumber: targetAptId || undefined,
      };

      saveState(updatedWalks, targetAptId, [...newMessages, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Could not reach assistant services.");

      // graceful text fallback if server is starting or key is lacking
      const fallbackAIResponse: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-fallback`,
        role: "assistant",
        content: `⚠️ Assistant under temporary system maintenance (GEMINI_API_KEY could be unconfigured in platform settings). \n\nI've queued your observation. You can still manually update, edit, and check items on the current room checklist!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        aptNumber: targetAptId || undefined,
      };
      saveState(updatedWalks, targetAptId, [...newMessages, fallbackAIResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeWalkthrough = currentAptId ? walkthroughs[currentAptId] : null;

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text flex flex-col font-sans selection:bg-natural-brand/10 selection:text-natural-brand">
      {/* Meadowood Branding Utility Rail */}
      <header className="bg-natural-brand border-b border-natural-brand-hover/40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 text-white p-2.5 rounded-lg font-black tracking-tight text-xl border border-white/15 flex items-center gap-2">
            <Building className="w-6 h-6 text-current" />
            <span className="font-serif">MV</span>
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight font-serif">
              Make-Ready Assistant
            </h1>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-mono">
              Meadowood Village Apartments
            </p>
          </div>
        </div>

        {/* Status indicator bar */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-natural-brand-hover/60 border border-white/10 rounded px-2.5 py-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white/95">SHIFT ACTIVE</span>
          </div>
          <button
            onClick={() => setIsPhotoGalleryOpen(true)}
            className="flex items-center gap-1.5 p-1.5 px-3 bg-white hover:bg-[#efece5] text-[#5A5A40] rounded-lg transition-all font-sans font-bold uppercase tracking-wider text-[11px] outline-none shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileImage className="w-3.5 h-3.5 text-amber-600" />
            Unit Photos
            {messages.filter((m) => m.imageUrl).length > 0 && (
              <span className="ml-1 bg-amber-500 text-slate-950 font-black rounded-full h-4 min-w-[16px] px-1 inline-flex items-center justify-center text-[9px] select-none shadow">
                {messages.filter((m) => m.imageUrl).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsDailyLogOpen(true)}
            className="flex items-center gap-1.5 p-1.5 px-3 bg-white hover:bg-[#efece5] text-[#5A5A40] rounded-lg transition-all font-sans font-bold uppercase tracking-wider text-[11px] outline-none shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Daily Log Book
          </button>
          <button
            onClick={handleRestartShift}
            title="Clean all logs"
            className="p-1.5 hover:bg-white/10 rounded border border-white/10 text-white/80 hover:text-red-300 transition-all outline-none"
          >
            Clear Caches
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="bg-natural-accent/10 border border-natural-accent/20 text-natural-accent text-xs px-4 py-2.5 flex items-center justify-between mx-6 mt-4 rounded-lg font-medium">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-natural-accent shrink-0" />
            {errorMessage}
          </span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[10px] uppercase font-bold text-natural-accent hover:underline"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Main Content Dashboard Frame */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column: Unit list & Dialogue helper */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          <AptSelector
            walkthroughs={walkthroughs}
            currentAptId={currentAptId}
            onSelectApt={handleSelectApt}
            onFinishApt={handleFinishApt}
            onEndShift={handleEndShift}
          />
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            currentRoomName={activeWalkthrough ? activeWalkthrough.rooms[activeWalkthrough.currentRoomIndex].name : "Living Room/Entry"}
            currentAptNumber={currentAptId}
          />
        </section>

        {/* Center column: Active room checklist ledger */}
        <section className="lg:col-span-5 flex flex-col h-full">
          <ChecklistTracker
            currentWalkthrough={activeWalkthrough}
            onUpdateItem={handleUpdateItem}
            onAddCustomItem={handleAddCustomItem}
            onSelectRoom={handleSelectRoom}
          />
        </section>

        {/* Right column: Tristan dispatch sheets & summary list */}
        <section className="lg:col-span-3 flex flex-col gap-5">
          {activeWalkthrough ? (
            <TristanPanel
              currentWalkthrough={activeWalkthrough}
              walkthroughs={walkthroughs}
              onFinishList={() => currentAptId && handleFinishApt(currentAptId)}
              onUpdateItem={handleUpdateItem}
              messages={messages}
            />
          ) : (
            <div className="bg-natural-card border border-natural-border rounded-xl p-6 text-center text-natural-text flex flex-col items-center justify-center min-h-[160px] shadow-sm">
              <ClipboardList className="w-8 h-8 text-natural-standard mb-2 opacity-60" />
              <span className="text-xs font-bold font-serif text-natural-heading uppercase tracking-wider">Tristan's List Staged</span>
              <p className="text-[10px] text-natural-text/80 mt-1 max-w-[200px]">
                Enter or select a unit walkthrough to begin aggregating Tristan's dispatch summary.
              </p>
            </div>
          )}

          {/* Mount the Shop Inventory Board & Brand preference trainer */}
          <InventoryTracker />
        </section>
      </main>

      {/* Shifts ledger summary drawer modal */}
      <ShiftLedger
        walkthroughs={walkthroughs}
        isOpen={isShiftOpen}
        onClose={() => setIsShiftOpen(false)}
        onRestartShift={handleRestartShift}
      />

      {/* Daily Maintenance Form twin log layout */}
      <DailyMaintenanceLogView
        walkthroughs={walkthroughs}
        isOpen={isDailyLogOpen}
        onClose={() => setIsDailyLogOpen(false)}
      />

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={isPhotoGalleryOpen}
        onClose={() => setIsPhotoGalleryOpen(false)}
        messages={messages}
        currentAptId={currentAptId}
        allAptNumbers={Object.keys(walkthroughs)}
        onDeletePhoto={handleDeletePhoto}
      />

      {/* Checklist Reminder Modal when room moving has unaddressed items */}
      {pendingTransition && activeWalkthrough && (() => {
        const isSkipped = pendingTransition.targetIndex > activeWalkthrough.currentRoomIndex + 1;
        const skippedRoomNames = isSkipped
          ? activeWalkthrough.rooms
              .slice(activeWalkthrough.currentRoomIndex + 1, pendingTransition.targetIndex)
              .map((r) => r.name)
          : [];
        const unaddressedItems = activeWalkthrough.rooms[activeWalkthrough.currentRoomIndex].items
          .filter((item) => item.status === "Unaddressed");

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-[2px] transition-all">
            <div className="bg-[#1e293b] border-2 border-amber-500/65 rounded-2xl p-6 max-w-md w-full text-slate-100 shadow-2xl flex flex-col gap-4 animate-fade-in font-sans">
              <div className="flex items-start gap-3">
                <span className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </span>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-50 font-sans tracking-tight">
                    Checklist Warning!
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Ricky, you are moving from <strong className="text-amber-500 font-bold">{activeWalkthrough.rooms[activeWalkthrough.currentRoomIndex].name}</strong> to <strong className="text-emerald-400 font-bold">{activeWalkthrough.rooms[pendingTransition.targetIndex]?.name}</strong>, but we detected missed checkpoint milestones:
                  </p>
                </div>
              </div>

              {skippedRoomNames.length > 0 && (
                <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800 space-y-1.5 text-left">
                  <span className="text-[10px] font-mono text-rose-450 text-rose-400 uppercase tracking-widest block mb-1">
                    ⚠️ Skipped Room(s)
                  </span>
                  {skippedRoomNames.map((name) => (
                    <div key={name} className="flex items-center gap-2 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"></span>
                      <span className="font-semibold text-slate-350 truncate">{name}</span>
                      <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                        Skipped
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {unaddressedItems.length > 0 && (
                <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800 max-h-[140px] overflow-y-auto space-y-1.5 custom-scrollbar text-left">
                  <span className="text-[10px] font-mono text-amber-450 text-amber-400 uppercase tracking-widest block mb-1">
                    🕒 Missed Checklist Items in {activeWalkthrough.rooms[activeWalkthrough.currentRoomIndex].name}
                  </span>
                  {unaddressedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span className="font-medium text-slate-350 truncate">{item.name}</span>
                      <span className="ml-auto text-[9px] font-mono select-none px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-normal text-left">
                Would you like to stay and verify them, auto-mark incomplete items in the left room as OK, or skip the check and move on anyway?
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleResolveTransition("cancel")}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 hover:text-slate-100 border border-slate-700/80 p-2.5 rounded-lg text-xs font-semibold text-slate-300 transition-all outline-none"
                >
                  ✖ Stay & Review
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveTransition("markOk")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 p-2.5 rounded-lg text-xs font-semibold text-slate-950 transition-all outline-none shadow-sm hover:scale-[1.01]"
                >
                  ✓ Mark Room OK
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveTransition("proceed")}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 p-2.5 rounded-lg text-xs font-semibold text-slate-950 transition-all outline-none shadow-sm hover:scale-[1.01]"
                >
                  Move On ➔
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
