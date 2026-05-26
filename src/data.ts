import { RoomState } from "./types";

export const MEADOWOOD_ROOMS_TEMPLATE: RoomState[] = [
  {
    name: "Kitchen",
    items: [
      { id: "k-burner-rings", name: "Burner Rings", status: "Unaddressed", category: "Appliances" },
      { id: "k-burner-pans", name: "Burner Pans", status: "Unaddressed", category: "Appliances" },
      { id: "k-burner-elements", name: "Burner Elements", status: "Unaddressed", category: "Appliances" },
      { id: "k-burner-knobs", name: "Burner Knobs", status: "Unaddressed", category: "Appliances" },
      { id: "k-oven-elements", name: "Oven Elements", status: "Unaddressed", category: "Appliances" },
      { id: "k-oven-light", name: "Oven Light Bulb", status: "Unaddressed", category: "Lights" },
      { id: "k-exhaust", name: "Exhaust Fan & Light", status: "Unaddressed", category: "Appliances" },
      { id: "k-ref-light", name: "Refrig. Light Bulb", status: "Unaddressed", category: "Lights" },
      { id: "k-ref-thermostat", name: "Refrig. Thermostat set on #1", status: "Unaddressed", category: "Appliances" },
      { id: "k-ref-shelves", name: "Refrig. Shelves & Crisper", status: "Unaddressed", category: "Appliances" },
      { id: "k-ref-coils", name: "Refrig. Coils Cleaned", status: "Unaddressed", category: "Appliances" },
      { id: "k-dw", name: "Dishwasher Working Prply.", status: "Unaddressed", category: "Appliances" },
      { id: "k-dw-racks", name: "Dishwasher Racks", status: "Unaddressed", category: "Appliances" },
      { id: "k-dw-latch", name: "Dishwasher Latch", status: "Unaddressed", category: "Appliances" },
      { id: "k-disposal", name: "Garbage Disposal", status: "Unaddressed", category: "Plumbing" },
      { id: "k-faucets", name: "Faucets", status: "Unaddressed", category: "Plumbing" },
      { id: "k-plumbing", name: "Plumbing", status: "Unaddressed", category: "Plumbing" },
      { id: "k-sink", name: "Sink", status: "Unaddressed", category: "Plumbing" },
      { id: "k-sink-stopper", name: "Sink Stopper", status: "Unaddressed", category: "Plumbing" },
      { id: "k-countertops", name: "Countertops", status: "Unaddressed", category: "Misc" },
      { id: "k-cabinets", name: "Cabinets and Drawers", status: "Unaddressed", category: "Misc" },
      { id: "k-lights", name: "Light Fixtures", status: "Unaddressed", category: "Lights" },
      { id: "k-outlets", name: "Electric Outlets & Covers", status: "Unaddressed", category: "Lights" },
      { id: "k-ceilings", name: "Ceilings & Walls", status: "Unaddressed", category: "Paint" },
      { id: "k-floor", name: "Floor Tile", status: "Unaddressed", category: "Flooring" },
      { id: "k-caulking", name: "Caulking", status: "Unaddressed", category: "Misc" }
    ]
  },
  {
    name: "Dinning Room",
    items: [
      { id: "dr-carpet", name: "Carpet", status: "Unaddressed", category: "Flooring" },
      { id: "dr-ceilings", name: "Ceilings & Walls", status: "Unaddressed", category: "Paint" },
      { id: "dr-lights", name: "Lights Fixtures", status: "Unaddressed", category: "Lights" },
      { id: "dr-fan", name: "Ceiling Fan", status: "Unaddressed", category: "Lights" },
      { id: "dr-outlets", name: "Electric Outlets & Covers", status: "Unaddressed", category: "Lights" },
      { id: "dr-window", name: "Window Works & Locks", status: "Unaddressed", category: "Doors/Windows" },
      { id: "dr-blinds", name: "Vertical or Mini-Blinds", status: "Unaddressed", category: "Doors/Windows" },
      { id: "dr-patio", name: "Patio Door Locks & Bar", status: "Unaddressed", category: "Doors/Windows" },
      { id: "dr-screens", name: "Window/Patio Screens", status: "Unaddressed", category: "Doors/Windows" }
    ]
  },
  {
    name: "Hallway",
    items: [
      { id: "h-carpet", name: "Carpet", status: "Unaddressed", category: "Flooring" },
      { id: "h-ceilings", name: "Ceilings & Walls", status: "Unaddressed", category: "Paint" },
      { id: "h-lights", name: "Lights Fixtures", status: "Unaddressed", category: "Lights" },
      { id: "h-outlets", name: "Electric Outlets & Covers", status: "Unaddressed", category: "Lights" },
      { id: "h-doors", name: "Closets Doors", status: "Unaddressed", category: "Doors/Windows" },
      { id: "h-closet-rods", name: "Closets - Rods & Shelves", status: "Unaddressed", category: "Misc" }
    ]
  },
  {
    name: "Bath Rooms",
    items: [
      { id: "b-sink", name: "Sink and Stopper", status: "Unaddressed", category: "Plumbing" },
      { id: "b-faucets", name: "Faucets", status: "Unaddressed", category: "Plumbing" },
      { id: "b-plumbing", name: "Plumbing", status: "Unaddressed", category: "Plumbing" },
      { id: "b-countertop", name: "Countertop", status: "Unaddressed", category: "Misc" },
      { id: "b-cabinets", name: "Cabinets and Drawers", status: "Unaddressed", category: "Misc" },
      { id: "b-mirror", name: "Mirror", status: "Unaddressed", category: "Misc" },
      { id: "b-towel-bars", name: "Towel Bars", status: "Unaddressed", category: "Misc" },
      { id: "b-lights", name: "Light Fixtures", status: "Unaddressed", category: "Lights" },
      { id: "b-soap", name: "Soap Dish", status: "Unaddressed", category: "Misc" },
      { id: "b-tp", name: "Toilet Paper Holder", status: "Unaddressed", category: "Misc" },
      { id: "b-toilet-working", name: "Toilet Working and Secure", status: "Unaddressed", category: "Plumbing" },
      { id: "b-toilet-seat", name: "Toilet Seat", status: "Unaddressed", category: "Plumbing" },
      { id: "b-tub-drains", name: "Bathtub/Shower Drains", status: "Unaddressed", category: "Plumbing" },
      { id: "b-tub-tile", name: "Bathtub/Shower Tile", status: "Unaddressed", category: "Misc" },
      { id: "b-showerhead", name: "Shower Head", status: "Unaddressed", category: "Plumbing" },
      { id: "b-shower-rod", name: "Shower Rod", status: "Unaddressed", category: "Misc" },
      { id: "b-caulking", name: "Caulking", status: "Unaddressed", category: "Misc" },
      { id: "b-exhaust", name: "Exhaust Fan/Heater", status: "Unaddressed", category: "Appliances" },
      { id: "b-floor", name: "Floor Tile", status: "Unaddressed", category: "Flooring" },
      { id: "b-outlets", name: "Electric Outlets & Covers", status: "Unaddressed", category: "Lights" },
      { id: "b-ceilings", name: "Ceilings & Walls", status: "Unaddressed", category: "Paint" },
      { id: "b-closet", name: "Closets - Rods & Shelves", status: "Unaddressed", category: "Misc" },
      { id: "b-windows", name: "Window Works & Locks", status: "Unaddressed", category: "Doors/Windows" },
      { id: "b-screens", name: "Window Screen", status: "Unaddressed", category: "Doors/Windows" }
    ]
  },
  {
    name: "Living Room",
    items: [
      { id: "lr-carpet", name: "Carpet", status: "Unaddressed", category: "Flooring" },
      { id: "lr-ceilings", name: "Ceilings & Walls", status: "Unaddressed", category: "Paint" },
      { id: "lr-lights", name: "Lights Fixtures", status: "Unaddressed", category: "Lights" },
      { id: "lr-fans", name: "Ceiling Fans", status: "Unaddressed", category: "Lights" },
      { id: "lr-outlets", name: "Electric Outlets & Covers", status: "Unaddressed", category: "Lights" },
      { id: "lr-window", name: "Window Works & Locks", status: "Unaddressed", category: "Doors/Windows" },
      { id: "lr-blinds", name: "Vertical or Mini-Blinds", status: "Unaddressed", category: "Doors/Windows" },
      { id: "lr-patio", name: "Patio Door Locks & Bar", status: "Unaddressed", category: "Doors/Windows" },
      { id: "lr-closet-doors", name: "Closets Doors", status: "Unaddressed", category: "Doors/Windows" },
      { id: "lr-closet-rods", name: "Closets - Rods & Shelves", status: "Unaddressed", category: "Misc" },
      { id: "lr-screens", name: "Window/Patio Screens", status: "Unaddressed", category: "Doors/Windows" }
    ]
  },
  {
    name: "Bedrooms",
    items: [
      { id: "br-carpet", name: "Carpet", status: "Unaddressed", category: "Flooring" },
      { id: "br-ceilings", name: "Ceilings & Walls", status: "Unaddressed", category: "Paint" },
      { id: "br-lights", name: "Lights Fixtures", status: "Unaddressed", category: "Lights" },
      { id: "br-fans", name: "Ceiling Fans", status: "Unaddressed", category: "Lights" },
      { id: "br-outlets", name: "Electric Outlets & Covers", status: "Unaddressed", category: "Lights" },
      { id: "br-window", name: "Window Works & Locks", status: "Unaddressed", category: "Doors/Windows" },
      { id: "br-blinds", name: "Vertical or Mini-Blinds", status: "Unaddressed", category: "Doors/Windows" },
      { id: "br-patio", name: "Patio Door Locks & Bar", status: "Unaddressed", category: "Doors/Windows" },
      { id: "br-closet-doors", name: "Closets Doors", status: "Unaddressed", category: "Doors/Windows" },
      { id: "br-closet-rods", name: "Closets - Rods & Shelves", status: "Unaddressed", category: "Misc" },
      { id: "br-screens", name: "Window/Patio Screens", status: "Unaddressed", category: "Doors/Windows" }
    ]
  },
  {
    name: "General Items",
    items: [
      { id: "g-hvac", name: "HVAC System", status: "Unaddressed", category: "Appliances" },
      { id: "g-hvac-filter", name: "HVAC Filter Cleaned/Changed", status: "Unaddressed", category: "Misc" },
      { id: "g-hvac-thermostat", name: "HVAC Thermostat Set Correctly", status: "Unaddressed", category: "Misc" },
      { id: "g-vents", name: "Air Vents Clean & Ck for mold", status: "Unaddressed", category: "Misc" },
      { id: "g-moisture", name: "Mositure Readings Taken", status: "Unaddressed", category: "Misc" },
      { id: "g-alarm", name: "Alarm System", status: "Unaddressed", category: "Misc" },
      { id: "g-smoke-hardwire", name: "Smoke Detectors - Hard Wire", status: "Unaddressed", category: "Misc" },
      { id: "g-smoke-batt", name: "Smoke Detector Battery", status: "Unaddressed", category: "Misc" },
      { id: "g-washer-dryer", name: "Washer & Dryer Working", status: "Unaddressed", category: "Appliances" },
      { id: "g-washer-hoses", name: "Washer & Dryer Hoses", status: "Unaddressed", category: "Plumbing" },
      { id: "g-breaker-box", name: "Breaker Box Checked", status: "Unaddressed", category: "Misc" },
      { id: "g-breaker-set", name: "Breakers Set Correctly - Off/On", status: "Unaddressed", category: "Misc" },
      { id: "g-fireplace", name: "Fireplace - Painted/Checked", status: "Unaddressed", category: "Paint" },
      { id: "g-hot-water", name: "Hot Water Tank-check temp", status: "Unaddressed", category: "Plumbing" },
      { id: "g-peep-hole", name: "Peep Hole Clear- 190 degrees?", status: "Unaddressed", category: "Doors/Windows" },
      { id: "g-weatherstrip", name: "Door Weatherstriping", status: "Unaddressed", category: "Doors/Windows" },
      { id: "g-threshold", name: "Door Threshold", status: "Unaddressed", category: "Doors/Windows" },
      { id: "g-doorstop", name: "Door Stops", status: "Unaddressed", category: "Doors/Windows" },
      { id: "g-paint-exterior", name: "Paint Exterior Side - Front Door", status: "Unaddressed", category: "Paint" },
      { id: "g-paint-entry", name: "Paint/Clean Front Entry Area", status: "Unaddressed", category: "Paint" },
      { id: "g-paint-patio", name: "Paint/Clean Patio or Balcony", status: "Unaddressed", category: "Paint" },
      { id: "g-sweep-storage", name: "Sweep Out Outside Storage", status: "Unaddressed", category: "Misc" },
      { id: "g-storage-lock", name: "Outside Storage Lock/Latch", status: "Unaddressed", category: "Doors/Windows" },
      { id: "g-screws", name: "3\" screws on hinges & backset", status: "Unaddressed", category: "Misc" },
      { id: "g-gfci", name: "Has or installed GFCI", status: "Unaddressed", category: "Misc" },
      { id: "g-entry-keys", name: "Entry lock changed/keys made", status: "Unaddressed", category: "Doors/Windows" },
      { id: "g-num-keys", name: "Number of Keys Made", status: "Unaddressed", category: "Misc" },
      { id: "g-mailbox", name: "Mailbox Keys Made/Checked", status: "Unaddressed", category: "Misc" },
      { id: "g-clean-coils", name: "Clean HVAC interior coils", status: "Unaddressed", category: "Misc" },
      { id: "g-hvac-panel", name: "Has or made new HVAC panel", status: "Unaddressed", category: "Misc" }
    ]
  },
  {
    name: "Notes / Green Program",
    items: [
      { id: "n-aerators", name: "Check for Green program-aerators", status: "Unaddressed", category: "Misc" },
      { id: "n-showerheads", name: "Check for showerheads", status: "Unaddressed", category: "Misc" },
      { id: "n-nest", name: "Check for Nest t-stat", status: "Unaddressed", category: "Misc" },
      { id: "n-led", name: "Check for LED light bulbs", status: "Unaddressed", category: "Lights" },
      { id: "n-extinguisher", name: "Check for fire extinguisher", status: "Unaddressed", category: "Misc" },
      { id: "n-fire-stops", name: "Check for Fire Stops", status: "Unaddressed", category: "Misc" }
    ]
  }
];

export const ALL_ITEM_IDS_MAPPED = new Map(
  MEADOWOOD_ROOMS_TEMPLATE.flatMap(r => r.items.map(item => [item.id, item]))
);
