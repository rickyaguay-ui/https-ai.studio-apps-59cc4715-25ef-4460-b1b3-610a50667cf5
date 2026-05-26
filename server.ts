import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini client
function getGeminiClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not defined. Please add it in the Secrets panel."
    );
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route: Process walkthrough natural language text/transcript
  app.post("/api/assistant/process", async (req: Request, res: Response) => {
    try {
      const { aptNumber, currentRoomName, checklist, text, history, photo, brandTraining } = req.body;

      if (!text && !photo) {
        res.status(400).json({ error: "Either text or photo is required" });
        return;
      }

      const ai = getGeminiClient();

      // Find the current room in the pre-passed checklist
      const currentRoomData = checklist.find(
        (r: any) => r.name.toLowerCase() === currentRoomName.toLowerCase()
      );

      const checklistItemsStr = currentRoomData
        ? currentRoomData.items
            .map(
              (item: any) =>
                `- ID: "${item.id}", Name: "${item.name}", Status: "${item.status}"${
                  item.details ? ` (Details: ${item.details})` : ""
                }`
            )
            .join("\n")
        : "None";

      // Include previous conversation contexts for checklist flow
      const chatHistoryStr = history && history.length > 0
        ? history
            .slice(-10) // last 10 turns to avoid token inflation
            .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join("\n")
        : "No previous messages in this walkthrough.";

      // Custom-defined Meadowwood Material Brand Specs Section
      let brandSpecSection = "";
      if (brandTraining && Array.isArray(brandTraining) && brandTraining.length > 0) {
        brandSpecSection = "\n=== MEADOWOOD VILLAGE SPECIFIC BRAND STANDARDS ===\n" +
          brandTraining
            .map(
              (b: any) =>
                `- Special item type "${b.itemName}": Suggest brand "${b.brand}" (Distributor: "${b.supplier}", Part #: "${b.partNumber}") if recommending this kind of part.`
            )
            .join("\n") + "\n";
      }

      // Detailed engineering instructions to Gemini
      const systemInstruction = `You are an expert Maintenance Walkthrough Assistant for apartment make-readies at Meadowood Village Apartments.
The Maintenance Technician is walking through an apartment unit and describing issues, status, or stating "Room complete" or "Done" out loud. They might also attach a photo of a specific maintenance issue (deficiency).
Your goal is to parse their speech, analyze any attached visual environment photo carefully to identify the actual defect / breakdown (e.g. cracked wall plate, leaking under sink tailpiece, burnt out bulb, broken window latch, dirty stove burner pan, damaged vinyl flooring, dirty filter, missing hardware), cross-reference it against the official company provided checklist for the current room, and report updates, estimates, priorities, and physical materials needed from the maintenance shop.
${brandSpecSection}
=== APARTMENT DETAILS ===
- Current Apartment: Apt ${aptNumber || "Unknown"}
- Current Room: ${currentRoomName}

=== ROOM MAKE-READY CHECKLIST (Current room state) ===
${checklistItemsStr}

=== RULES & LOGIC ===
1. If the user mentions any item from the room's company checklist, OR if they upload a photo showing a defect mapping to a checklist item, identify it and update its status.
   - If they state, imply, or show it works fine / is clean / has no issues, status must be exactly "OK".
   - If they describe, depict, or show an issue/problem/breakage/deficiency in the speech or photo, status must be exactly "Needs Repair".
2. If status is "Needs Repair", you MUST categorize the issue. The category MUST be one of: "Lights", "Plumbing", "Paint", "Flooring", "Appliances", "Doors/Windows", "Misc".
3. Prioritize repair items based on the visual and speech evidence:
   - "Urgent" (safety issue, major leak, electrical hazard, external doors not locking, or absolute must-fix before keys can be handed to a new renter)
   - "Standard" (routine fix, something that should be done)
   - "Cosmetic" (nice to have, paint spots, cosmetic wear & tear)
4. Select a rough, realistic time estimate to repair (number of minutes, e.g. 15 for changing a bulb or plate cover, 30 for clear lock issues or basic fixtures, 60+ for complex repairs) and add specific materials needed from the maintenance shop (e.g., ['Receptacle Cover', 'Replacement LED Bulb', 'Deadbolt Cylinder kit']) based on visual evidence.
5. CRITICAL CHECKLIST ENFORCEMENT RULE:
   - Look at the Checklist items for the current room. If any item is currently "Unaddressed" AND the technician did NOT address/status/depict it in this turn or in the recent chat history, you MUST append a friendly notification inside your assistantResponse.
   - Format requirement: It MUST explicitly say "Hey, we're missing the status of [item name] from this room's company provided checklist." 
   - If there are multiple unmentioned items, list them clearly, e.g., "Hey, we're missing the status of Peephole & Doorbell, and Outlet covers from this room's company provided checklist."
6. If ALL checklist items in this room are now addressed or planned, say clearly at the very end of your assistantResponse:
   "Room complete. Next room?"
7. If the user explicitly switches rooms (e.g., "Let's move to the Kitchen" or "Going to Master Bathroom"), parse that and populate 'detectedRoomSwap' with the exact matching room name (e.g. "Kitchen", "Dining Area", "Hallway/Laundry", "Master Bedroom", "Master Bathroom").
8. If the technician says "Done" or "Finish list", set 'isFinishTriggered' to true. Synthesize a clean consolidated summary in the assistantResponse. Include a categorized prioritized outline of all unresolved repairs, followed directly by "List for Tristan" (a Markdown bulleted block of all remaining maintenance tasks by priority for Tristan) and a collective "Material List" of parts Tristan must collect from the maintenance shop in one single trip.
9. If they say "End of shift", set 'isShiftEndTriggered' to true and say goodbye, summarizing today's shift.

Keep your tone clear, helpful, composed, and professional. Describe any physical findings you diagnosed from the photograph to reassure the technician that you accurately mapped and analyzed the visual evidence.`;

      // Construct multimodal parts payload
      const parts: any[] = [];
      if (photo && photo.data && photo.mimeType) {
        parts.push({
          inlineData: {
            mimeType: photo.mimeType,
            data: photo.data,
          },
        });
      }
      
      parts.push({
        text: `Technician's Speech / Comment: "${text || "Attached photo for make-ready inspection."}"

Chat History for context:
${chatHistoryStr}

Process this speech/image according to the system instruction and provide the structured JSON response.`,
      });

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          assistantResponse: {
            type: Type.STRING,
            description:
              "The natural language response to speak/display back. Follows checking rules, announces missing statuses using 'Hey, we're missing the status of [item]...', or prompts 'Room complete. Next room?' when the checklist is fully completed. Summarizes Tristan's list when finished.",
          },
          checklistUpdates: {
            type: Type.ARRAY,
            description: "A list of checklist items that were resolved/updated in this turn's input.",
            items: {
              type: Type.OBJECT,
              properties: {
                id: {
                  type: Type.STRING,
                  description: "The specific item ID from the checklist if mapped (e.g. 'lr-door').",
                },
                name: {
                  type: Type.STRING,
                  description: "The official name of the checklist item being updated.",
                },
                status: {
                  type: Type.STRING,
                  description: "Must be exactly 'OK' or 'Needs Repair'.",
                },
                details: {
                  type: Type.STRING,
                  description: "Detailed notes of what is wrong, or null if status is OK.",
                },
                priority: {
                  type: Type.STRING,
                  description: "Urgent, Standard, or Cosmic/Cosmetic if Needs Repair; null if OK.",
                },
                category: {
                  type: Type.STRING,
                  description: "One of: Lights, Plumbing, Paint, Flooring, Appliances, Doors/Windows, Misc.",
                },
                timeEstimate: {
                  type: Type.INTEGER,
                  description: "Number of minutes estimated to complete the fix.",
                },
                materialsNeeded: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Parts or materials that need to be picked up from the shop.",
                },
              },
              required: ["name", "status", "category"],
            },
          },
          detectedRoomSwap: {
            type: Type.STRING,
            description:
              "The name of the room if user explicitly asks to switch rooms. Otherwise empty string.",
          },
          isFinishTriggered: {
            type: Type.BOOLEAN,
            description: "Set to true if user is finalising the property walkthrough.",
          },
          isShiftEndTriggered: {
            type: Type.BOOLEAN,
            description: "Set to true if user says 'End of shift'.",
          },
        },
        required: [
          "assistantResponse",
          "checklistUpdates",
          "detectedRoomSwap",
          "isFinishTriggered",
          "isShiftEndTriggered",
        ],
      };

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      const responseText = geminiResponse.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      const parsedJSON = JSON.parse(responseText.trim());
      res.json(parsedJSON);
    } catch (error: any) {
      console.error("Walkthrough processing error:", error);
      res.status(500).json({
        error: error.message || "An unexpected error occurred during processing.",
      });
    }
  });

  // Serve static files / Vite client integrations
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
