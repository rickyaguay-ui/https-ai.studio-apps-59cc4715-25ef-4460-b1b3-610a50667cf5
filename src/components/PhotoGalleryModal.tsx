import React, { useState } from "react";
import { X, Trash2, Image as ImageIcon, Filter, Building, ZoomIn, Info, Calendar } from "lucide-react";
import { Message } from "../types";

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  currentAptId: string | null;
  allAptNumbers: string[];
  onDeletePhoto: (messageId: string) => void;
}

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
  isOpen,
  onClose,
  messages,
  currentAptId,
  allAptNumbers,
  onDeletePhoto,
}) => {
  const [selectedAptFilter, setSelectedAptFilter] = useState<string>("ALL");
  const [activeLightboxImage, setActiveLightboxImage] = useState<{
    url: string;
    caption: string;
    apt: string;
    room: string;
    time: string;
  } | null>(null);

  if (!isOpen) return null;

  // Extract all messages with an attached image
  const photoMessages = messages.filter((m) => m.imageUrl);

  // Filter messages based on chosen apartment filter
  const filteredPhotos = photoMessages.filter((m) => {
    if (selectedAptFilter === "ALL") return true;
    return m.aptNumber === selectedAptFilter;
  });

  const handleDelete = (id: string, aptNum?: string) => {
    const aptLabel = aptNum ? `Apt ${aptNum}` : "this item";
    if (confirm(`Are you sure you want to permanently delete the photo attachment back from ${aptLabel}?`)) {
      onDeletePhoto(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-[4px] transition-all">
      <div 
        id="photo-gallery-container"
        className="bg-[#182235] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header bar */}
        <div className="bg-[#1e293b] border-b border-slate-700/65 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-left">
            <span className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black tracking-wider uppercase font-mono text-slate-100">
                Meadowood Inspections Photo Hub
              </h3>
              <p className="text-[10px] text-slate-400">
                Browse, preview, and delete deficiency proof-of-work visual records for ongoing repairs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all outline-none"
            id="close-gallery-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/35 border-b border-slate-800/60 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">Filter by Apartment:</span>
            <div className="flex flex-wrap gap-1.5 ml-2">
              <button
                onClick={() => setSelectedAptFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all outline-none ${
                  selectedAptFilter === "ALL"
                    ? "bg-[#5A5A40] text-white"
                    : "bg-slate-800 hover:bg-slate-750 text-slate-300"
                }`}
              >
                All Units ({photoMessages.length})
              </button>
              {allAptNumbers.map((aptNum) => {
                const count = photoMessages.filter((m) => m.aptNumber === aptNum).length;
                return (
                  <button
                    key={aptNum}
                    onClick={() => setSelectedAptFilter(aptNum)}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all outline-none flex items-center gap-1 ${
                      selectedAptFilter === aptNum
                        ? "bg-[#5A5A40] text-white"
                        : "bg-slate-800 hover:bg-slate-750 text-slate-300"
                    }`}
                  >
                    <Building className="w-3 h-3 text-slate-400" />
                    Apt {aptNum} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <span className="text-[10.5px] font-mono text-slate-500 bg-slate-900/40 px-2 py-1 rounded">
            Showing <strong className="text-slate-300">{filteredPhotos.length}</strong> photo(s)
          </span>
        </div>

        {/* Photos Grid Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-905 bg-slate-900/10">
          {filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <span className="p-4 bg-slate-800/40 border border-slate-700/40 rounded-full text-slate-500">
                <ImageIcon className="w-10 h-10" />
              </span>
              <div className="max-w-xs">
                <h4 className="text-sm font-bold text-slate-300">No photos captured</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {selectedAptFilter === "ALL"
                    ? "Upload high-resolution camera snapshots or screenshots of broken fixtures inside the active walkthrough to store proof."
                    : `No photo attachments found specifically for Apt ${selectedAptFilter}.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPhotos.map((msg, idx) => {
                const cleanContent = msg.content
                  .replace("Attached photo for make-ready review.", "")
                  .replace("Attached photo for make-ready inspection.", "")
                  .trim();

                return (
                  <div
                    key={`${msg.id}-${idx}`}
                    className="bg-[#1e293b]/70 border border-slate-800 hover:border-slate-700/80 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all flex flex-col group"
                  >
                    {/* Image wrap with hover controls */}
                    <div className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer">
                      <img
                        src={msg.imageUrl}
                        alt="Defect observation"
                        className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          onClick={() => {
                            if (msg.imageUrl) {
                              setActiveLightboxImage({
                                url: msg.imageUrl,
                                caption: cleanContent || "Deficiency observation detail image.",
                                apt: msg.aptNumber || "Common area",
                                room: msg.activeRoomName || "Walkthrough Area",
                                time: msg.timestamp,
                              });
                            }
                          }}
                          className="p-2 bg-slate-800 hover:bg-[#5A5A40] hover:text-white rounded-full text-slate-200 transition-all shadow-md"
                          title="Maximize view"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id, msg.aptNumber)}
                          className="p-2 bg-red-950/60 hover:bg-red-700 hover:text-white rounded-full text-red-300 transition-all shadow-md"
                          title="Delete photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Header tags */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 select-none pointer-events-none">
                        <span className="bg-[#5A5A40] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
                          Apt {msg.aptNumber || "General"}
                        </span>
                        {msg.activeRoomName && (
                          <span className="bg-slate-950/85 text-amber-500 text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow">
                            {msg.activeRoomName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-3 text-left flex-1 flex flex-col justify-between gap-2.5">
                      <div className="space-y-1">
                        <p className="text-[11.5px] text-slate-200 leading-relaxed truncate-2-lines italic">
                          {cleanContent ? `"${cleanContent}"` : "Proof snapshot captured during walkthrough."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/40 pt-2 text-[9.5px] font-mono text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-600" />
                          {msg.timestamp}
                        </span>
                        <button
                          onClick={() => handleDelete(msg.id, msg.aptNumber)}
                          className="text-red-400/80 hover:text-red-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-[#1e293b] border-t border-slate-700/65 px-5 py-3 flex text-[10.5px] text-slate-400 items-center justify-between">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            Active photo counts are synchronized in real-time with your digital twin logs.
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold px-4 py-1.5 rounded-lg text-[11px] uppercase tracking-wider transition-all shadow-sm outline-none"
          >
            Done
          </button>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {activeLightboxImage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 p-4 animate-fade-in">
          {/* Close Lightbox */}
          <button
            onClick={() => setActiveLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-slate-900/65 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all outline-none"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Central image Container */}
          <div className="max-w-3xl max-h-[75vh] relative flex items-center justify-center">
            <img
              src={activeLightboxImage.url}
              alt="Expanded high-resolution detail"
              className="max-w-full max-h-[75vh] object-contain rounded-lg border border-slate-805 border-slate-800/85 shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Image caption card below */}
          <div className="mt-4 bg-[#182235]/90 border border-slate-805 border-slate-800/85 p-4 rounded-xl max-w-lg w-full text-left flex flex-col gap-1.5 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="bg-[#5A5A40] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                Apt {activeLightboxImage.apt}
              </span>
              <span className="bg-slate-900 text-amber-500 text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">
                {activeLightboxImage.room}
              </span>
              <span className="text-[10px] font-mono text-slate-500 ml-auto bg-slate-900/40 px-2 py-0.5 rounded">
                Captured at {activeLightboxImage.time}
              </span>
            </div>
            <p className="text-xs text-slate-200 font-sans italic my-1 leading-normal">
              "{activeLightboxImage.caption}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
