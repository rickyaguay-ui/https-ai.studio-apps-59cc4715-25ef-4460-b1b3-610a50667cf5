export type CheckStatus = "OK" | "Needs Repair" | "Unaddressed";

export type ItemCategory =
  | "Lights"
  | "Plumbing"
  | "Paint"
  | "Flooring"
  | "Appliances"
  | "Doors/Windows"
  | "Misc";

export type TaskPriority = "Urgent" | "Standard" | "Cosmetic";

export interface ChecklistItem {
  id: string; // unique ID for elements
  name: string; // e.g. "burners & drip pans"
  status: CheckStatus;
  details?: string;
  priority?: TaskPriority;
  category?: ItemCategory;
  timeEstimate?: number; // duration in minutes
  materialsNeeded?: string[];
  tristanApprovalStatus?: "Pending" | "Approved" | "Declined";
  tristanApprovalNote?: string;
  isBigIssue?: boolean;
  needsOrdering?: boolean;
}

export interface RoomState {
  name: string; // e.g., "Kitchen", "Living Room/Entry"
  items: ChecklistItem[];
}

export interface ApartmentWalkthrough {
  id: string; // e.g. "6449"
  aptNumber: string;
  status: "In Progress" | "Finished";
  rooms: RoomState[];
  currentRoomIndex: number;
  timeEstimateTotal: number; // total estimated minutes
  tristanList?: string; // Cache or generated Markdown for Tristan's repair list
  materialList?: string[]; // list of materials required
  finishedAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  activeRoomName?: string;
  checklistUpdated?: boolean; // if this message caused a checklist state change
  imageUrl?: string;
  aptNumber?: string;
}

export interface ShiftStats {
  apartmentsWalked: string[]; // apt numbers
  completedCriticalCount: number;
  unresolvedUrgentTasks: string[];
  totalTimeEstimate: number;
  materialsNeededTotal: string[];
}
