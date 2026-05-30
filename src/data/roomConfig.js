// ── Room configurations ───────────────────────────────────────────────────────
export const ROOM_CONFIGS = [
  {
    id: "living",
    name: "Living Area",
    icon: "🛋️",
    w: 6.1, d: 4.9, h: 2.8,
    description: "Main living & entertaining space",
    defaultFloor: "wood",
    defaultWall: "#F5F0EB",
    furniture: ["sofa", "coffee_table", "tv_unit", "armchair", "lamp", "bookshelf"],
  },
  {
    id: "bedroom1",
    name: "Bedroom 1",
    icon: "🛏️",
    w: 3.7, d: 4.3, h: 2.8,
    description: "Master bedroom with attached bath",
    defaultFloor: "wood",
    defaultWall: "#EDE8E3",
    furniture: ["bed", "wardrobe", "dresser", "bedside_table", "lamp"],
  },
  {
    id: "bedroom2",
    name: "Bedroom 2",
    icon: "🛏️",
    w: 3.4, d: 3.7, h: 2.8,
    description: "Guest bedroom / kids room",
    defaultFloor: "wood",
    defaultWall: "#EAE5E0",
    furniture: ["bed", "wardrobe", "study_desk", "lamp"],
  },
  {
    id: "kitchen",
    name: "Kitchen",
    icon: "🍳",
    w: 3.0, d: 3.7, h: 2.7,
    description: "Modular kitchen with dining nook",
    defaultFloor: "tile",
    defaultWall: "#F0EDE8",
    furniture: ["kitchen_counter", "dining_table", "bar_stool"],
  },
  {
    id: "balcony1",
    name: "Balcony 1",
    icon: "🌿",
    w: 2.4, d: 1.8, h: 2.8,
    description: "Front-facing balcony",
    defaultFloor: "tile",
    defaultWall: "#E8E3DD",
    furniture: ["outdoor_chair", "plant", "side_table"],
  },
  {
    id: "balcony2",
    name: "Balcony 2",
    icon: "🌿",
    w: 2.4, d: 1.8, h: 2.8,
    description: "Rear balcony / utility",
    defaultFloor: "tile",
    defaultWall: "#E8E3DD",
    furniture: ["outdoor_chair", "plant", "side_table"],
  },
  {
    id: "dining",
    name: "Dining Area",
    icon: "🍽️",
    w: 3.7, d: 3.7, h: 2.8,
    description: "Formal dining space",
    defaultFloor: "marble",
    defaultWall: "#F2EDE8",
    furniture: ["dining_table", "dining_chair", "sideboard", "lamp"],
  },
  {
    id: "penthouse",
    name: "Penthouse Lawn",
    icon: "🌳",
    w: 6.1, d: 6.1, h: 0,
    description: "Open-air rooftop lawn",
    defaultFloor: "grass",
    defaultWall: "#87CEEB",
    furniture: ["outdoor_sofa", "garden_table", "plant", "sun_lounger"],
  },
];

// ── Furniture library ─────────────────────────────────────────────────────────
export const FURNITURE_CATEGORIES = [
  {
    id: "seating",
    label: "Seating",
    icon: "🛋️",
    items: [
      { id: "sofa_3", label: "3-Seater Sofa", shape: "sofa", w: 2.1, d: 0.85, h: 0.78, color: "#8B7355" },
      { id: "sofa_2", label: "2-Seater Sofa", shape: "sofa", w: 1.6, d: 0.85, h: 0.78, color: "#A08060" },
      { id: "sofa_l", label: "L-Shaped Sofa", shape: "sofa_l", w: 2.4, d: 2.0, h: 0.78, color: "#7A6048" },
      { id: "armchair", label: "Arm Chair", shape: "armchair", w: 0.85, d: 0.85, h: 0.9, color: "#9B7D5C" },
      { id: "dining_chair", label: "Dining Chair", shape: "chair", w: 0.48, d: 0.5, h: 0.9, color: "#6B4C2A" },
      { id: "bar_stool", label: "Bar Stool", shape: "stool", w: 0.38, d: 0.38, h: 0.75, color: "#5C3D1E" },
      { id: "outdoor_chair", label: "Outdoor Chair", shape: "chair", w: 0.6, d: 0.6, h: 0.85, color: "#556B2F" },
      { id: "sun_lounger", label: "Sun Lounger", shape: "lounger", w: 0.7, d: 1.9, h: 0.5, color: "#8FBC8F" },
    ],
  },
  {
    id: "tables",
    label: "Tables",
    icon: "🪑",
    items: [
      { id: "coffee_table", label: "Coffee Table", shape: "table_low", w: 1.1, d: 0.6, h: 0.42, color: "#8B6914" },
      { id: "dining_table_4", label: "Dining Table (4)", shape: "table", w: 1.4, d: 0.85, h: 0.76, color: "#7A5C1E" },
      { id: "dining_table_6", label: "Dining Table (6)", shape: "table", w: 1.8, d: 0.9, h: 0.76, color: "#6B4C10" },
      { id: "side_table", label: "Side Table", shape: "table_low", w: 0.55, d: 0.55, h: 0.55, color: "#9B7D2A" },
      { id: "study_desk", label: "Study Desk", shape: "desk", w: 1.3, d: 0.6, h: 0.76, color: "#8B6E3C" },
      { id: "garden_table", label: "Garden Table", shape: "table_round", w: 0.8, d: 0.8, h: 0.72, color: "#556B2F" },
      { id: "console_table", label: "Console Table", shape: "desk", w: 1.2, d: 0.35, h: 0.8, color: "#7A5C3C" },
    ],
  },
  {
    id: "beds",
    label: "Beds",
    icon: "🛏️",
    items: [
      { id: "bed_king", label: "King Bed", shape: "bed", w: 1.95, d: 2.15, h: 0.55, color: "#8B7355" },
      { id: "bed_queen", label: "Queen Bed", shape: "bed", w: 1.6, d: 2.05, h: 0.52, color: "#9B7D5C" },
      { id: "bed_single", label: "Single Bed", shape: "bed", w: 1.0, d: 2.0, h: 0.5, color: "#A08B6E" },
      { id: "bunk_bed", label: "Bunk Bed", shape: "bunk", w: 1.0, d: 2.0, h: 1.7, color: "#7A6048" },
    ],
  },
  {
    id: "storage",
    label: "Storage",
    icon: "🗄️",
    items: [
      { id: "wardrobe_2", label: "2-Door Wardrobe", shape: "wardrobe", w: 1.2, d: 0.55, h: 2.1, color: "#6B5232" },
      { id: "wardrobe_3", label: "3-Door Wardrobe", shape: "wardrobe", w: 1.8, d: 0.55, h: 2.1, color: "#5C4228" },
      { id: "bookshelf", label: "Bookshelf", shape: "shelf", w: 1.0, d: 0.3, h: 1.8, color: "#8B6E3C" },
      { id: "sideboard", label: "Sideboard", shape: "sideboard", w: 1.4, d: 0.42, h: 0.85, color: "#7A5C2A" },
      { id: "dresser", label: "Dresser", shape: "dresser", w: 1.1, d: 0.46, h: 1.3, color: "#8B7355" },
      { id: "tv_unit", label: "TV Unit", shape: "tv_unit", w: 1.8, d: 0.45, h: 0.5, color: "#3D2B1A" },
      { id: "kitchen_counter", label: "Kitchen Counter", shape: "counter", w: 1.8, d: 0.6, h: 0.9, color: "#E8E0D0" },
    ],
  },
  {
    id: "decor",
    label: "Décor",
    icon: "🏺",
    items: [
      { id: "floor_lamp", label: "Floor Lamp", shape: "lamp", w: 0.35, d: 0.35, h: 1.6, color: "#C9901A" },
      { id: "table_lamp", label: "Table Lamp", shape: "lamp_s", w: 0.25, d: 0.25, h: 0.5, color: "#E8A83A" },
      { id: "plant_tall", label: "Tall Plant", shape: "plant", w: 0.5, d: 0.5, h: 1.4, color: "#2D6A4F" },
      { id: "plant_small", label: "Small Plant", shape: "plant", w: 0.3, d: 0.3, h: 0.6, color: "#40916C" },
      { id: "pottery_vase", label: "Pottery Vase", shape: "vase", w: 0.25, d: 0.25, h: 0.45, color: "#C0392B" },
      { id: "wall_art", label: "Wall Art", shape: "painting", w: 0.8, d: 0.05, h: 0.6, color: "#8B6914" },
      { id: "rug_large", label: "Area Rug (Large)", shape: "rug", w: 2.0, d: 1.4, h: 0.02, color: "#C09040" },
      { id: "rug_small", label: "Area Rug (Small)", shape: "rug", w: 1.2, d: 0.9, h: 0.02, color: "#A0703A" },
      { id: "mirror", label: "Standing Mirror", shape: "mirror", w: 0.55, d: 0.1, h: 1.7, color: "#C8C8C8" },
      { id: "outdoor_sofa",  label: "Outdoor Sofa",  shape: "sofa",        w: 1.8,  d: 0.8,  h: 0.7,  color: "#6B8E57" },
      { id: "stone_clock",   label: "Stone Clock",   shape: "stone_clock", w: 0.42, d: 0.06, h: 0.40, color: "#B09048" },
    ],
  },
];

// ── Floor & wall options ───────────────────────────────────────────────────────
export const FLOOR_OPTIONS = [
  { id: "wood",    label: "Oak Wood",    preview: "#C4974A" },
  { id: "marble",  label: "White Marble",preview: "#F0EEE8" },
  { id: "tile",    label: "Ceramic Tile",preview: "#E8E4DC" },
  { id: "granite", label: "Granite",     preview: "#8A8A7A" },
  { id: "grass",   label: "Lawn Grass",  preview: "#4A8A3A" },
];

export const WALL_COLORS = [
  { id: "#F5F0EB", label: "Warm White"   },
  { id: "#EDE0D4", label: "Sandstone"    },
  { id: "#D4E8D0", label: "Sage Green"   },
  { id: "#D0D8E8", label: "Slate Blue"   },
  { id: "#E8D8D0", label: "Dusty Rose"   },
  { id: "#F5E6C8", label: "Warm Cream"   },
  { id: "#2C2C2C", label: "Charcoal"     },
  { id: "#FFFFFF", label: "Pure White"   },
];

export const CEILING_OPTIONS = [
  { id: "plain",    label: "Plain White"  },
  { id: "false",    label: "False Ceiling"},
  { id: "led",      label: "LED Cove"     },
  { id: "wood",     label: "Wood Panel"   },
];

// ── Lighting modes ────────────────────────────────────────────────────────────
export const LIGHT_MODES = [
  { id: "bright",  label: "Bright",   desc: "Full daylight" },
  { id: "day",     label: "Daylight", desc: "Natural indoor" },
  { id: "evening", label: "Evening",  desc: "Warm & moody" },
  { id: "night",   label: "Night",    desc: "Sconces only" },
];

// ── Window & curtain options ───────────────────────────────────────────────────
export const WINDOW_STYLES = [
  { id: "large",  label: "Large Grid" },
  { id: "arched", label: "Arched"     },
  { id: "small",  label: "Small"      },
  { id: "none",   label: "No Window"  },
];

export const CURTAIN_STYLES = [
  { id: "panel",  label: "Drape Panel"  },
  { id: "sheer",  label: "Sheer"        },
  { id: "roman",  label: "Roman Shade"  },
  { id: "none",   label: "None"         },
];

export const CURTAIN_COLORS = [
  { id: "#E8E0D0", label: "Natural"     },
  { id: "#F8F5F0", label: "White"       },
  { id: "#8B1A2F", label: "Maroon"      },
  { id: "#6B8FAF", label: "Steel Blue"  },
  { id: "#4A7A5A", label: "Forest"      },
  { id: "#3A3A3A", label: "Charcoal"    },
  { id: "#C9A040", label: "Gold"        },
  { id: "#C04A28", label: "Terracotta"  },
  { id: "#7A4A8A", label: "Plum"        },
  { id: "#8B6040", label: "Cognac"      },
];
