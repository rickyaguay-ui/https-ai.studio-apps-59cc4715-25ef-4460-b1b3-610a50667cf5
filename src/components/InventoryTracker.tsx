import React, { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Minus, 
  RotateCcw, 
  Settings, 
  CornerDownRight, 
  CheckCircle, 
  AlertTriangle, 
  ListOrdered, 
  GraduationCap, 
  Wrench, 
  Save, 
  Clock, 
  TrendingUp, 
  Trash2,
  Cpu
} from "lucide-react";

export interface InventoryItem {
  id: string;
  name: string;
  count: number;
  minLevel: number;
  unit: string;
  category: string;
}

export interface BrandTraining {
  id: string;
  itemName: string;
  brand: string;
  supplier: string;
  partNumber: string;
  timeEstimateDefault: number; // in minutes
}

export interface InventoryAction {
  id: string;
  timestamp: string;
  itemName: string;
  type: "consume" | "restock";
  countAdjusted: number;
  aptNumber: string; // e.g., "6449" or "Shop"
  timeEstimate: number; // in minutes
}

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "inv-bulb", name: "LED Bulb (9W A19)", count: 20, minLevel: 5, unit: "pcs", category: "Lights" },
  { id: "inv-cover", name: "Receptacle Cover (Single)", count: 32, minLevel: 8, unit: "pcs", category: "Lights" },
  { id: "inv-pan-sm", name: "Drip Pan - Small (6 in)", count: 12, minLevel: 3, unit: "pcs", category: "Appliances" },
  { id: "inv-pan-lg", name: "Drip Pan - Large (8 in)", count: 8, minLevel: 2, unit: "pcs", category: "Appliances" },
  { id: "inv-flapper", name: "Toilet Flapper (2 in)", count: 10, minLevel: 3, unit: "pcs", category: "Plumbing" },
  { id: "inv-filter", name: "HVAC Air Filter (16x25x1)", count: 15, minLevel: 4, unit: "pcs", category: "Misc" },
  { id: "inv-battery", name: "Smoke Detector Battery (9V)", count: 25, minLevel: 6, unit: "pcs", category: "Misc" },
  { id: "inv-shower", name: "Shower Head (1.5 GPM)", count: 6, minLevel: 2, unit: "pcs", category: "Plumbing" },
];

const DEFAULT_TRAINING: BrandTraining[] = [
  {
    id: "inv-bulb",
    itemName: "LED Bulb (9W A19)",
    brand: "EcoSmart Soft White 2700K A19 Non-Dimmable",
    supplier: "The Home Depot Pro",
    partNumber: "204859-MEADOW",
    timeEstimateDefault: 10,
  },
  {
    id: "inv-cover",
    itemName: "Receptacle Cover (Single)",
    brand: "Leviton Decora Single-Gang Thermoplastic (Light Almond)",
    supplier: "HD Supply Solutions",
    partNumber: "915-112-ALM",
    timeEstimateDefault: 10,
  },
  {
    id: "inv-pan-sm",
    itemName: "Drip Pan - Small (6 in)",
    brand: "Smart Choice Universal Chrome Style A (Gas/Electric)",
    supplier: "Lowes Business Pro",
    partNumber: "PAN-SM8-CHR",
    timeEstimateDefault: 15,
  },
  {
    id: "inv-pan-lg",
    itemName: "Drip Pan - Large (8 in)",
    brand: "Smart Choice Universal Chrome Style A (Gas/Electric)",
    supplier: "Lowes Business Pro",
    partNumber: "PAN-LG10-CHR",
    timeEstimateDefault: 15,
  },
  {
    id: "inv-flapper",
    itemName: "Toilet Flapper (2 in)",
    brand: "Korky Ultra High Performance Flexible 2-inch Flapper",
    supplier: "Grainger Maintenance Retail",
    partNumber: "KK-201-UHP",
    timeEstimateDefault: 20,
  },
  {
    id: "inv-filter",
    itemName: "HVAC Air Filter (16x25x1)",
    brand: "Filtrete Dust & Pollen Defense MERV 5 (16x25x1)",
    supplier: "HD Supply Solutions",
    partNumber: "FLT-1625-M5",
    timeEstimateDefault: 15,
  },
  {
    id: "inv-battery",
    itemName: "Smoke Detector Battery (9V)",
    brand: "Energizer Max Long-Life Alkaline 9V Block Battery",
    supplier: "Batteries Plus Contract",
    partNumber: "9V-BATT-ENRG",
    timeEstimateDefault: 10,
  },
  {
    id: "inv-shower",
    itemName: "Shower Head (1.5 GPM)",
    brand: "Niagara Conservation Earth Chrome Low-Flow Showerhead",
    supplier: "Grainger Maintenance Retail",
    partNumber: "NG-EARTH-15",
    timeEstimateDefault: 25,
  },
];

export const InventoryTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"stock" | "training" | "actions">("stock");
  
  // State elements loaded from localStorage
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const cached = localStorage.getItem("meadowood_shop_inventory");
    return cached ? JSON.parse(cached) : DEFAULT_INVENTORY;
  });

  const [training, setTraining] = useState<BrandTraining[]>(() => {
    const cached = localStorage.getItem("meadowood_brand_training");
    return cached ? JSON.parse(cached) : DEFAULT_TRAINING;
  });

  const [actions, setActions] = useState<InventoryAction[]>(() => {
    const cached = localStorage.getItem("meadowood_shift_inventory_actions");
    return cached ? JSON.parse(cached) : [];
  });

  // Action input states
  const [actionAptNumber, setActionAptNumber] = useState("");
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [editBrand, setEditBrand] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [editPartNum, setEditPartNum] = useState("");
  const [editEstTime, setEditEstTime] = useState(15);

  // New inventory custom item state
  const [newItemName, setNewItemName] = useState("");
  const [newItemMin, setNewItemMin] = useState(3);
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemCategory, setNewItemCategory] = useState("Misc");
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Save states back to localStorage
  useEffect(() => {
    localStorage.setItem("meadowood_shop_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("meadowood_brand_training", JSON.stringify(training));
    // Trigger window storage event to notify other components (such as Tristan Panel / prompts)
    window.dispatchEvent(new Event("storage_meadowood_brands_updated"));
  }, [training]);

  useEffect(() => {
    localStorage.setItem("meadowood_shift_inventory_actions", JSON.stringify(actions));
  }, [actions]);

  // Adjust Count handler
  const adjustCount = (id: string, amount: number) => {
    const target = inventory.find(i => i.id === id);
    if (!target) return;

    const currentCount = target.count;
    const newCount = Math.max(0, currentCount + amount);
    
    // Safety check: don't log actions if nothing changed
    if (newCount === currentCount) return;

    // Save Updated Listing
    setInventory(inventory.map(i => i.id === id ? { ...i, count: newCount } : i));

    // Register active audit transaction log
    const spec = training.find(t => t.id === id);
    const estTime = spec ? spec.timeEstimateDefault : 15;
    const isConsume = amount < 0;
    const absoluteCount = Math.abs(amount);

    const loggedApt = actionAptNumber.trim() ? `Apt ${actionAptNumber.trim()}` : "Shop Desk";

    const newAction: InventoryAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      itemName: target.name,
      type: isConsume ? "consume" : "restock",
      countAdjusted: absoluteCount,
      aptNumber: loggedApt,
      timeEstimate: isConsume ? estTime * absoluteCount : 15, // Restock trip estimate
    };

    setActions([newAction, ...actions]);
  };

  // Restock bulk all back to twice the minimum levels
  const handleBulkRestockToPar = () => {
    if (confirm("Replenish all low stock items in current inventory back to safety levels?")) {
      const updated = inventory.map(item => {
        if (item.count < item.minLevel) {
          const restockAmount = (item.minLevel * 2) - item.count;
          
          // Log adjustment
          const newAction: InventoryAction = {
            id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            itemName: item.name,
            type: "restock",
            countAdjusted: restockAmount,
            aptNumber: "Shop Depot",
            timeEstimate: 30, // standard logistics run
          };
          
          setActions(prev => [newAction, ...prev]);

          return { ...item, count: item.minLevel * 2 };
        }
        return item;
      });
      setInventory(updated);
    }
  };

  // Add Custom Inventory item
  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;
    
    const randomId = `item-${Date.now()}`;
    const newInv: InventoryItem = {
      id: randomId,
      name: newItemName.trim(),
      count: newItemMin * 2, // start with par
      minLevel: Number(newItemMin),
      unit: newItemUnit,
      category: newItemCategory,
    };

    const newTrain: BrandTraining = {
      id: randomId,
      itemName: newItemName.trim(),
      brand: `${newItemName.trim()} Standard Stock`,
      supplier: "Local hardware merchant",
      partNumber: "GEN-STOCK",
      timeEstimateDefault: 15,
    };

    setInventory([...inventory, newInv]);
    setTraining([...training, newTrain]);

    // reset forms
    setNewItemName("");
    setNewItemMin(3);
    setIsAddingNew(false);
  };

  // Save trained brands specifications
  const handleStartEditingTraining = (brandSpec: BrandTraining) => {
    setEditingTrainingId(brandSpec.id);
    setEditBrand(brandSpec.brand);
    setEditSupplier(brandSpec.supplier);
    setEditPartNum(brandSpec.partNumber);
    setEditEstTime(brandSpec.timeEstimateDefault);
  };

  const handleSaveTraining = (id: string) => {
    setTraining(training.map(t => t.id === id ? {
      ...t,
      brand: editBrand,
      supplier: editSupplier,
      partNumber: editPartNum,
      timeEstimateDefault: Number(editEstTime)
    } : t));
    setEditingTrainingId(null);
  };

  // Remove Action list
  const handleClearActions = () => {
    if (confirm("Wipe all parts check-out transactions for the current shift?")) {
      setActions([]);
    }
  };

  // Remove Custom Inventory Item
  const handleDeleteCustomItem = (id: string, name: string) => {
    if (confirm(`Remove "${name}" permanently from inventory list and specification trainer?`)) {
      setInventory(inventory.filter(i => i.id !== id));
      setTraining(training.filter(t => t.id !== id));
      setActions(actions.filter(a => a.itemName !== name));
      if (editingTrainingId === id) setEditingTrainingId(null);
    }
  };

  return (
    <div className="bg-[#EFECE5] border border-[#DCD9D0] rounded-xl text-[#43423E] shadow-sm flex flex-col gap-3 font-sans overflow-hidden select-none">
      
      {/* Header bar */}
      <div className="bg-[#5A5A40] text-white p-3.5 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <Package className="w-4.5 h-4.5 text-amber-300" />
            <h3 className="text-xs font-black tracking-widest uppercase font-mono">
              Parts Stock & AI Brand Trainer
            </h3>
          </div>
          <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider text-white/90">
            Meadowwood Hub
          </span>
        </div>
        <p className="text-[10px] text-white/80 leading-snug text-left">
          Log parts checked-out for apartments to automatically update the shop bin levels and sync daily logs. Edit brand preferences to train Tristan’s orders!
        </p>
      </div>

      {/* Mini Tabs */}
      <div className="flex border-b border-[#DCD9D0] px-3 bg-[#E6E3DB]">
        <button
          onClick={() => setActiveTab("stock")}
          className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 outline-none flex items-center gap-1 ${
            activeTab === "stock"
              ? "border-[#5A5A40] text-[#33322E] font-extrabold"
              : "border-transparent text-[#7A7A5C] hover:text-[#5A5A40]"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Parts Bins
        </button>
        <button
          onClick={() => setActiveTab("training")}
          className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 outline-none flex items-center gap-1 ${
            activeTab === "training"
              ? "border-[#5A5A40] text-[#33322E] font-extrabold"
              : "border-transparent text-[#7A7A5C] hover:text-[#5A5A40]"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Brand Spec Training
        </button>
        <button
          onClick={() => setActiveTab("actions")}
          className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 outline-none flex items-center gap-1 ${
            activeTab === "actions"
              ? "border-[#5A5A40] text-[#33322E] font-extrabold"
              : "border-transparent text-[#7A7A5C] hover:text-[#5A5A40]"
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          Usage Logs
          {actions.length > 0 && (
            <span className="bg-amber-600 text-white rounded-full text-[9px] px-1 font-sans">
              {actions.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Workspaces */}
      <div className="p-3 pt-0">
        
        {/* Tab 1: PARTS STOCK */}
        {activeTab === "stock" && (
          <div className="space-y-3">
            {/* Quick checkout bar */}
            <div className="bg-[#E6E3DB] border border-[#DCD9D0] p-2.5 rounded-lg flex items-center justify-between gap-1.5 ">
              <div className="text-left flex-1 min-w-0">
                <span className="block text-[8px] uppercase font-bold text-[#7A7A5C]">
                  Active Target Unit Reference
                </span>
                <input
                  type="text"
                  placeholder="e.g. Apt 7412 or Staff"
                  value={actionAptNumber}
                  onChange={(e) => setActionAptNumber(e.target.value)}
                  className="bg-white border border-[#DCD9D0] text-xs px-2 py-1 rounded w-full mt-1 text-[#33322E] focus:outline-none focus:border-[#5A5A40] placeholder:text-[#9A9A8C]"
                />
              </div>

              <button
                onClick={handleBulkRestockToPar}
                className="bg-[#5A5A40] hover:bg-[#484833] text-white text-[9px] font-bold px-2 py-1.5 rounded transition-all outline-none flex items-center gap-1 shrink-0 h-fit self-end mt-1"
                title="Restock all warning items"
              >
                <RotateCcw className="w-3 h-3" />
                Auto-Restock Par
              </button>
            </div>

            {/* Scrollable grid listing */}
            <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
              {inventory.map((item) => {
                const isLow = item.count < item.minLevel;
                const spec = training.find(t => t.id === item.id);
                const brandedTag = spec?.brand ? `${spec.brand}` : "";

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      isLow
                        ? "bg-red-50/70 border-red-200"
                        : "bg-white border-[#DCD9D0]/70 hover:border-[#DCD9D0]"
                    }`}
                  >
                    <div className="text-left max-w-[60%]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-[#33322E] truncate">
                          {item.name}
                        </span>
                        {isLow && (
                          <span className="bg-red-500 text-white text-[8px] font-black uppercase px-1 py-0.5 rounded flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Low
                          </span>
                        )}
                      </div>
                      <span className="block text-[9px] text-[#7A7A5C] truncate font-mono" title={brandedTag}>
                        {brandedTag || "Standard grade part"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Decrement Button */}
                      <button
                        onClick={() => adjustCount(item.id, -1)}
                        className={`p-1 rounded text-[#43423E] transition-all outline-none ${
                          isLow ? "bg-red-100 hover:bg-red-200" : "bg-[#EFECE5] hover:bg-[#E6E3DB]"
                        }`}
                        title="Checkout 1 part"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <div className="w-10 text-center flex flex-col justify-center">
                        <span className={`text-xs font-bold font-mono ${isLow ? "text-red-600 font-extrabold" : "text-[#33322E]"}`}>
                          {item.count}
                        </span>
                        <span className="text-[8px] text-[#7A7A5C] font-mono leading-none">
                          (min {item.minLevel})
                        </span>
                      </div>

                      {/* Increment Button */}
                      <button
                        onClick={() => adjustCount(item.id, 1)}
                        className="p-1 rounded bg-[#EFECE5] hover:bg-[#E6E3DB] text-[#43423E] transition-all outline-none"
                        title="Add/Restock 1 part"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom bin item form */}
            {!isAddingNew ? (
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-1.5 border border-dashed border-[#7A7A5C]/40 text-[#7A7A5C] hover:text-[#5A5A40] hover:border-[#5A5A40]/60 hover:bg-white/40 text-xs rounded-lg font-bold transition-all outline-none"
              >
                + Register New Common Shop Part Bin
              </button>
            ) : (
              <div className="bg-white border border-[#DCD9D0] p-3 rounded-lg text-left flex flex-col gap-2">
                <h4 className="text-[11px] font-black text-[#5A5A40] uppercase">Register Stock Bin</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="text-[9px] text-[#7A7A5C] font-bold block">Part Name</label>
                    <input
                      type="text"
                      placeholder="e.g., GFCI Outlets (15A)"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full bg-[#F7F6F2] border border-[#DCD9D0] text-xs px-2 py-1 rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#7A7A5C] font-bold block">Min Reorder Level</label>
                    <input
                      type="number"
                      value={newItemMin}
                      onChange={(e) => setNewItemMin(Number(e.target.value))}
                      className="w-full bg-[#F7F6F2] border border-[#DCD9D0] text-xs px-2 py-1 rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#7A7A5C] font-bold block">Category</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="w-full bg-[#F7F6F2] border border-[#DCD9D0] text-[11px] px-1 py-1 rounded focus:outline-none"
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

                <div className="flex gap-2 justify-end mt-1">
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="text-[10px] text-[#7A7A5C] hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNewItem}
                    disabled={!newItemName.trim()}
                    className="bg-[#5A5A40] text-white disabled:bg-slate-300 px-3 py-1 rounded text-[10px] font-bold transition-all"
                  >
                    Install Bin
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: BRAND TRAINING MODEL */}
        {activeTab === "training" && (
          <div className="space-y-3">
            <div className="bg-[#5A5A40]/10 border border-[#484833]/20 p-2.5 rounded-lg text-left text-xs text-[#5A5A40]">
              <div className="flex items-center gap-1 font-bold">
                <Cpu className="w-3.5 h-3.5" />
                <span>Grounded AI Meadowwood Specifications</span>
              </div>
              <p className="text-[9px] text-[#43423E] mt-0.5 leading-relaxed">
                Configure brand matching. These are pushed to the backend to help the Gemini analyzer recommend the *actual* contract model codes, prices, and suppliers when you voice out problems or check rooms!
              </p>
            </div>

            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
              {training.map((brandSpec) => {
                const isEditing = editingTrainingId === brandSpec.id;

                return (
                  <div
                    key={brandSpec.id}
                    className="bg-white border border-[#DCD9D0] rounded-lg p-2.5 text-left transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-[#F7F6F2] pb-1.5 mb-2">
                      <span className="text-xs font-black text-[#5A5A40] uppercase">
                        {brandSpec.itemName}
                      </span>
                      {brandSpec.id.startsWith("item-") && (
                        <button
                          onClick={() => handleDeleteCustomItem(brandSpec.id, brandSpec.itemName)}
                          className="text-[#A84A32] hover:text-red-700 p-0.5"
                          title="Delete Custom Material"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[8px] text-[#7A7A5C] font-bold uppercase">Meadowwood Preferred Brand Spec</label>
                          <input
                            type="text"
                            value={editBrand}
                            onChange={(e) => setEditBrand(e.target.value)}
                            className="bg-[#F7F6F2] border border-[#DCD9D0] w-full p-1 rounded text-xs text-[#33322E] focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] text-[#7A7A5C] font-bold uppercase">Contract Supplier</label>
                            <input
                              type="text"
                              value={editSupplier}
                              onChange={(e) => setEditSupplier(e.target.value)}
                              className="bg-[#F7F6F2] border border-[#DCD9D0] w-full p-1 rounded text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] text-[#7A7A5C] font-bold uppercase">Supplier SKU / Part No.</label>
                            <input
                              type="text"
                              value={editPartNum}
                              onChange={(e) => setEditPartNum(e.target.value)}
                              className="bg-[#F7F6F2] border border-[#DCD9D0] w-full p-1 rounded text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1 mt-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#7A7A5C]" />
                            <span className="text-[9px] text-[#7A7A5C]">Default Fix Time:</span>
                            <input
                              type="number"
                              value={editEstTime}
                              onChange={(e) => setEditEstTime(Number(e.target.value))}
                              className="bg-[#F7F6F2] border border-[#DCD9D0] w-12 p-0.5 rounded text-center text-xs focus:outline-none"
                            />
                            <span className="text-[9px] text-[#7A7A5C]">mins</span>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setEditingTrainingId(null)}
                              className="text-[10px] text-[#7A7A5C] hover:underline px-1.5"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveTraining(brandSpec.id)}
                              className="bg-[#5A5A40] hover:bg-[#484833] text-white text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              Save Spec
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10.5px] space-y-1">
                        <div className="flex items-start gap-1">
                          <CornerDownRight className="w-3.5 h-3.5 stroke-[2] text-[#7A7A5C] shrink-0 mt-0.5" />
                          <p className="font-semibold text-[#33322E] leading-snug">
                            {brandSpec.brand || "Not configured (will use generic)"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[9px] text-[#7A7A5C] font-mono pl-4">
                          <span>Distributor: <strong className="text-[#33322E]">{brandSpec.supplier}</strong></span>
                          <span>Part #: <strong className="text-[#33322E]">{brandSpec.partNumber}</strong></span>
                        </div>
                        <div className="flex items-center justify-between border-t border-[#F7F6F2] pt-1.5 mt-2 text-[9px]">
                          <span className="text-[#7A7A5C] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Time completion default: <strong>{brandSpec.timeEstimateDefault || 15} mins</strong>
                          </span>
                          <button
                            onClick={() => handleStartEditingTraining(brandSpec)}
                            className="text-[#5A5A40] hover:text-[#484833] hover:underline font-bold"
                          >
                            Edit Spec
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: ACTIONS LOGS / PARTS CONSUMED */}
        {activeTab === "actions" && (
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center bg-[#E6E3DB] border border-[#DCD9D0] p-2 rounded-lg text-xs">
              <span className="font-bold text-[#5A5A40]">Used Parts Register</span>
              {actions.length > 0 && (
                <button
                  onClick={handleClearActions}
                  className="text-[10px] text-[#A84A32] hover:text-red-700 flex items-center gap-1 font-bold outline-none"
                >
                  Clear Logs
                </button>
              )}
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
              {actions.length === 0 ? (
                <p className="text-[#7A7A5C] italic text-center py-8 text-xs">
                  No parts utilized or restocked yet during this shift. Decrement count from the "Parts Bins" tab to check out parts for tasks!
                </p>
              ) : (
                actions.map((act) => (
                  <div
                    key={act.id}
                    className="bg-white border border-[#DCD9D0]/70 p-2 rounded-lg text-xs text-left"
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-[#7A7A5C]">
                      <span>{act.timestamp}</span>
                      <span className="bg-[#EFECE5] drop-shadow-sm px-1.5 rounded uppercase text-[#5A5A40] font-bold">
                        {act.aptNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-800">
                        {act.type === "consume" ? (
                          <>
                            🚪 Consumed <strong className="text-[#A84A32]">{act.countAdjusted}</strong> of{" "}
                            <strong className="text-[#33322E]">{act.itemName}</strong>
                          </>
                        ) : (
                          <>
                            📦 Restocked <strong className="text-emerald-700">+{act.countAdjusted}</strong> of{" "}
                            <strong className="text-[#33322E]">{act.itemName}</strong>
                          </>
                        )}
                      </span>
                      <span className="text-[9.5px] font-mono text-slate-500 font-bold shrink-0">
                        ~{act.timeEstimate}m
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Display Est. Total time completing these manual maintenance logistics */}
            {actions.length > 0 && (
              <div className="bg-[#E6E3DB]/50 border border-[#DCD9D0] p-2.5 rounded-lg flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#5A5A40]" />
                  <span>Est. Time Logged:</span>
                </div>
                <strong>
                  {actions.reduce((sum, act) => sum + act.timeEstimate, 0)} minutes
                </strong>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
