import React, { useState, useEffect, useRef } from "react";
import { Message } from "../types";
import { Mic, MicOff, Send, HelpCircle, RefreshCw, Volume2, Image as ImageIcon, X, Camera } from "lucide-react";

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, photo?: { data: string; mimeType: string }) => void;
  currentRoomName: string;
  currentAptNumber: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  currentRoomName,
  currentAptNumber,
}) => {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [walkieTalkie, setWalkieTalkie] = useState(false); // Auto-send on pause
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isMuteAssistantVoice, setIsMuteAssistantVoice] = useState(true); // default mute assistant to avoid speech loops
  const [lastSpokenObservation, setLastSpokenObservation] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // base64 dataURL
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isContinuousModeRef = useRef(false);
  useEffect(() => {
    isContinuousModeRef.current = isContinuousMode;
  }, [isContinuousMode]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = isContinuousMode;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        if (isContinuousModeRef.current) {
          const currentResultIndex = event.resultIndex;
          const transcript = event.results[currentResultIndex][0].transcript;
          const isFinal = event.results[currentResultIndex].isFinal;

          if (transcript && isFinal) {
            const clean = transcript.trim();
            if (clean) {
              onSendMessage(clean);
              setLastSpokenObservation(clean);
              // auto clear after 8 seconds
              setTimeout(() => {
                setLastSpokenObservation((prev) => (prev === clean ? "" : prev));
              }, 8000);
            }
          }
        } else {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            if (walkieTalkie) {
              onSendMessage(transcript);
            } else {
              setInputText((prev) => (prev ? prev + " " + transcript : transcript));
            }
          }
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
      };

      rec.onend = () => {
        if (isContinuousModeRef.current) {
          try {
            rec.start();
          } catch (err) {
            console.error("Auto-restart failed:", err);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = rec;
    }
  }, [isContinuousMode, walkieTalkie, onSendMessage]);

  // Auto-scroll chat on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    const text = inputText.trim();
    if ((!text && !selectedImage) || isLoading) return;

    let photoData: { data: string; mimeType: string } | undefined;

    if (selectedImage) {
      // Decode data URL format "data:image/png;base64,iVBORw..."
      const match = selectedImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        photoData = {
          mimeType: match[1],
          data: match[2],
        };
      }
    }

    const finalMsgText = text || `Photo analysis of deficiency in ${currentRoomName}`;
    onSendMessage(finalMsgText, photoData);
    
    setInputText("");
    removeSelectedImage();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.onerror = (err) => {
      console.error("FileReader Error:", err);
      alert("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Web Speech dictation is not fully supported in this browser context (or standard frame permissions block it). Feel free to type!");
      return;
    }

    if (isListening) {
      setIsContinuousMode(false);
      isContinuousModeRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (err) {}
      setIsListening(false);
    } else {
      try {
        setIsContinuousMode(true);
        isContinuousModeRef.current = true;
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Speaks out user assistant bubble for full hands-free action
  const playTTS = (text: string, force = false) => {
    if (isMuteAssistantVoice && !force) {
      return; // quiet/continuous talk mutes automatic readings
    }
    if ("speechSynthesis" in window) {
      // cancel previous speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700/60 rounded-xl flex flex-col h-[520px] overflow-hidden shadow-md">
      {/* Header Info */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="text-left">
            <h3 className="text-xs font-semibold text-slate-200">
              {currentAptNumber ? `Active: Apt ${currentAptNumber}` : "Walkthrough Assistant"}
            </h3>
            <p className="text-[10px] text-slate-400">
              Voice: <span className="text-amber-500 font-medium">{currentRoomName}</span>
            </p>
          </div>
        </div>

        {speechSupported && (
          <div className="flex items-center gap-3 select-none">
            <label className="flex items-center gap-1 cursor-pointer" title="Keep mic open continuously for hands-free walkthrough">
              <input
                type="checkbox"
                checked={isContinuousMode}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsContinuousMode(checked);
                  if (checked) {
                    setIsListening(true);
                    try {
                      recognitionRef.current?.start();
                    } catch (err) {}
                  } else {
                    try {
                      recognitionRef.current?.stop();
                    } catch (err) {}
                    setIsListening(false);
                  }
                }}
                className="w-3.5 h-3.5 rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-800"
              />
              <span className="text-[10px] text-slate-300 font-bold whitespace-nowrap uppercase tracking-wider">
                🎙️ Natural Talk
              </span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer" title="Quiet Mode: Voice reading helper mutes automatically during dictation">
              <input
                type="checkbox"
                checked={isMuteAssistantVoice}
                onChange={(e) => setIsMuteAssistantVoice(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-800"
              />
              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                🔇 Mute Playbacks
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Micro-Notification Heard Banner */}
      {lastSpokenObservation && isContinuousMode && (
        <div className="bg-emerald-950/85 border-b border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-xs flex items-center gap-2.5 animate-pulse font-sans">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold uppercase tracking-wider text-[8px] bg-emerald-700 text-white px-2 py-0.5 rounded font-mono shrink-0 shadow-sm">Captured</span>
          <p className="truncate italic">"{lastSpokenObservation}"</p>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-900/40">
        {messages.map((msg, idx) => (
          <div
            key={`${msg.id}-${idx}`}
            className={`flex flex-col max-w-[85%] ${
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] text-slate-500 font-mono">
                {msg.role === "user" ? "Technician" : "Meadowood Assistant"}
              </span>
              <span className="text-[9px] text-slate-600 font-mono">{msg.timestamp}</span>
              {msg.role === "assistant" && (
                <button
                  onClick={() => playTTS(msg.content, true)}
                  title="Speak Response"
                  className="p-1 hover:bg-slate-800 rounded transition-all text-slate-400 hover:text-amber-400"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Display message image attachments if any */}
            {msg.imageUrl && (
              <div className="mb-1.5 max-w-full rounded-lg overflow-hidden border border-slate-700/80 shadow-sm bg-slate-950/20">
                <img
                  src={msg.imageUrl}
                  alt="Walkthrough observation detail"
                  referrerPolicy="no-referrer"
                  className="max-h-48 object-contain rounded-lg w-full"
                />
              </div>
            )}

            <div
              className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-line shadow ${
                msg.role === "user"
                  ? "bg-slate-700 text-slate-100 rounded-tr-none"
                  : "bg-slate-800 border border-slate-700/50 text-slate-200 rounded-tl-none font-sans"
              }`}
            >
              {msg.content}
            </div>

            {msg.activeRoomName && (
              <span className="text-[9px] text-amber-500/85 font-semibold bg-amber-500/5 border border-amber-500/10 px-1.5 mt-1 rounded">
                Room of focus: {msg.activeRoomName}
              </span>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start max-w-[85%] mr-auto">
            <span className="text-[10px] text-slate-500 font-mono mb-1">Meadowood Assistant</span>
            <div className="bg-slate-800 border border-slate-700/50 p-4 rounded-xl rounded-tl-none flex items-center gap-2 text-slate-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>Analyzing walkthrough transcript and photos...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input Action Controls */}
      <div className="p-3 bg-slate-800 border-t border-slate-700/60 flex flex-col gap-2">
        {/* Selected Image Thumbnail Preview Area */}
        {selectedImage && (
          <div className="relative inline-flex items-center gap-2.5 p-1.5 bg-slate-900 border border-slate-700 rounded-lg max-w-max animate-fade-in self-start">
            <img
              src={selectedImage}
              alt="Source capture preview"
              referrerPolicy="no-referrer"
              className="w-12 h-12 object-cover rounded border border-slate-800"
            />
            <div className="text-left font-sans pr-8">
              <span className="text-[10.5px] text-emerald-400 font-bold uppercase tracking-wider block">Photo Selected</span>
              <span className="text-[9px] text-slate-400 block max-w-[150px] truncate">Ready for visual analysis</span>
            </div>
            <button
              onClick={removeSelectedImage}
              className="absolute top-1 right-1 p-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-full border border-slate-750 transition-all outline-none"
              title="Cancel Upload"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="flex gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setInputText("Let's go Apt 6449")}
            className="text-[10px] shrink-0 bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600/30 font-mono font-medium transition-all"
          >
            Let's go Apt 6449
          </button>
          <button
            type="button"
            onClick={() => setInputText("Everything looks good in this entryway except the ceiling light bulb is blown.")}
            className="text-[10px] shrink-0 bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600/30 font-medium transition-all"
          >
            "Blown ceiling fan bulb..."
          </button>
          <button
            type="button"
            onClick={() => setInputText("Let's move to the Kitchen.")}
            className="text-[10px] shrink-0 bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600/30 font-medium transition-all"
          >
            "Move to Kitchen"
          </button>
          <button
            type="button"
            onClick={() => setInputText("Finish list")}
            className="text-[10px] shrink-0 bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600/30 font-mono font-semibold text-amber-500 border-amber-500/20 transition-all"
          >
            Finish list
          </button>
        </div>

        <div className="flex gap-2 items-center">
          {/* File Camera trigger button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-lg flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600/80 shrink-0 transition-all outline-none"
            title="Attach problem photo from device or camera"
          >
            <Camera className="w-5 h-5 text-amber-500" />
          </button>
          
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-lg flex items-center justify-center transition-all outline-none border shrink-0 ${
                isListening
                  ? "bg-red-500 text-white border-red-500 animate-pulse"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600"
              }`}
              title={isListening ? "Stop dictation" : "Dictate speech context"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <div className="relative flex-1">
            <input
              type="text"
              placeholder={
                isListening
                  ? "🎙️ Continuous Talk is active. Speak clearly, I'll update silently!"
                  : "Type walkthrough logs or click the mic to talk naturally..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              disabled={isLoading}
              className="w-full bg-slate-900 text-slate-100 border border-slate-700/80 rounded-lg py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || (!inputText.trim() && !selectedImage)}
              className="absolute right-2.5 top-2 hover:text-amber-500 text-slate-400 disabled:text-slate-600 transition-all outline-none"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-0.5">
          <span>Upload an issue picture directly. The model will analyze its defect severity autonomously!</span>
          <span className="flex items-center gap-1 font-mono">
            <HelpCircle className="w-3" />
            Gemini Visual Grounding
          </span>
        </div>
      </div>
    </div>
  );
};
