export const PRODUCTS = [
  {
    id: 1, name: "Cheriyal Hand-Painted Pot", category: "Pots",
    price: 1299, originalPrice: 1800,
    description: "Traditional Telangana hand-painted clay pot with intricate geometric designs. Each pot is individually crafted by master artisans from Karimnagar district, using natural lacquer pigments passed down through generations.",
    rating: 4.8, reviews: 124, stock: 15, isNew: false,
    sizes: ["6 inch", "8 inch", "10 inch", "12 inch"],
    colors: [{name:"Classic Red", hex:"#C0392B"},{name:"Royal Blue", hex:"#2471A3"},{name:"Earthy Brown", hex:"#7B4F2E"}],
    specs: [{key:"Material",val:"Clay & Natural Lacquer"},{key:"Finish",val:"Hand-painted lacquer"},{key:"Origin",val:"Karimnagar, Telangana"},{key:"Care",val:"Wipe with dry cloth"}],
    features: ["100% handmade by skilled artisans","Natural lacquer pigments","Each piece unique","Suitable for gifting"],
    sg: [
      {sz:"6 inch", dim:"6\" H × 4\" W", wt:"250g", best:"Table décor / gifting"},
      {sz:"8 inch", dim:"8\" H × 5\" W", wt:"400g", best:"Bookshelf / mantle"},
      {sz:"10 inch", dim:"10\" H × 6\" W", wt:"600g", best:"Living room display"},
      {sz:"12 inch", dim:"12\" H × 7.5\" W", wt:"850g", best:"Floor / statement piece"},
    ]
  },
  {
    id: 2, name: "Floral Lacquer Wall Clock", category: "Clocks",
    price: 2499, originalPrice: 3200,
    description: "Wooden wall clock with Cheriyal floral lacquer art in vibrant colours. Silent quartz movement ensures peaceful interiors. Hand-painted face with traditional Telangana motifs — lotus, marigold, and peacock feather borders.",
    rating: 4.9, reviews: 89, stock: 8, isNew: false,
    sizes: ["10 inch dia", "14 inch dia", "18 inch dia"],
    colors: [{name:"Saffron & Gold", hex:"#E8620A"},{name:"Indigo & Red", hex:"#2C3E8C"},{name:"Forest Green", hex:"#1E6B3C"}],
    specs: [{key:"Material",val:"Mango Wood"},{key:"Movement",val:"Silent Quartz"},{key:"Battery",val:"AA × 1 (not included)"},{key:"Finish",val:"Lacquer painted"},{key:"Origin",val:"Karimnagar, Telangana"}],
    features: ["Silent sweep movement","Mango wood base","Handcrafted traditional art","Ready to hang – hook included"],
    sg: [
      {sz:"10 inch dia", dim:"25 cm diameter", wt:"350g", best:"Study / bedroom"},
      {sz:"14 inch dia", dim:"36 cm diameter", wt:"600g", best:"Living room / kitchen"},
      {sz:"18 inch dia", dim:"46 cm diameter", wt:"900g", best:"Hall / statement wall"},
    ]
  },
  {
    id: 3, name: "Cheriyal Curtain Pair", category: "Curtains",
    price: 3999, originalPrice: 5500,
    description: "Set of 2 cotton curtains with authentic Cheriyal bird and floral motifs. Block-printed using wooden blocks carved by local artisans. Rod pocket stitching for easy hanging. Gives any room a rich, traditional Telangana character.",
    rating: 4.7, reviews: 67, stock: 20, isNew: false,
    sizes: ["4.5 ft × 7 ft", "4.5 ft × 8 ft", "5 ft × 8 ft", "5 ft × 9 ft"],
    colors: [{name:"Saffron & Ivory", hex:"#E8620A"},{name:"Deep Red & Gold", hex:"#8B1A1A"},{name:"Teal & Cream", hex:"#008080"}],
    specs: [{key:"Material",val:"100% Cotton"},{key:"Print",val:"Block Print – Hand-stamped"},{key:"Set Contains",val:"2 panels"},{key:"Pocket",val:"Rod pocket – 3\" wide"},{key:"Wash",val:"Cold machine wash, gentle cycle"}],
    features: ["Set of 2 panels","3-inch rod pocket","Pre-washed – minimal shrinkage","Authentic block-print art"],
    sg: [
      {sz:"4.5 ft × 7 ft", dim:"137 cm W × 213 cm L", wt:"600g/pair", best:"Small windows / bedroom"},
      {sz:"4.5 ft × 8 ft", dim:"137 cm W × 244 cm L", wt:"700g/pair", best:"Standard windows"},
      {sz:"5 ft × 8 ft", dim:"152 cm W × 244 cm L", wt:"750g/pair", best:"Wide windows"},
      {sz:"5 ft × 9 ft", dim:"152 cm W × 274 cm L", wt:"850g/pair", best:"Floor-to-ceiling / hall"},
    ]
  },
  {
    id: 4, name: "King Size Cheriyal Bedsheet", category: "Bed Sheets",
    price: 2799, originalPrice: 3800,
    description: "Pure cotton bedsheet with traditional Cheriyal border prints in saffron, gold, and deep red. Includes 2 matching pillow covers. Soft 180 TC weave for comfortable sleep. Machine washable and colourfast.",
    rating: 4.6, reviews: 203, stock: 30, isNew: false,
    sizes: ["Single", "Double", "Queen", "King"],
    colors: [{name:"Saffron Border", hex:"#E8620A"},{name:"Deep Red Border", hex:"#8B1A1A"},{name:"Indigo Border", hex:"#2C3E8C"}],
    specs: [{key:"Material",val:"100% Cotton – 180 TC"},{key:"Includes",val:"Bedsheet + 2 pillow covers"},{key:"Print",val:"Reactive print – colourfast"},{key:"Wash",val:"Machine wash cold"},{key:"Origin",val:"Karimnagar, Telangana"}],
    features: ["Includes 2 pillow covers","Colourfast reactive print","Authentic Cheriyal art border","Soft 180 TC cotton"],
    sg: [
      {sz:"Single",  dim:"60\" × 90\"  (152×229 cm)", wt:"900g", best:"Single / narrow beds"},
      {sz:"Double",  dim:"90\" × 100\" (229×254 cm)", wt:"1.2 kg", best:"Standard double beds"},
      {sz:"Queen",   dim:"96\" × 108\" (244×274 cm)", wt:"1.5 kg", best:"Queen beds"},
      {sz:"King",    dim:"108\"× 108\" (274×274 cm)", wt:"1.8 kg", best:"King / large beds"},
    ]
  },
  {
    id: 5, name: "Lacquer Art Decorative Pot Set", category: "Pots",
    price: 1899, originalPrice: 2600,
    description: "Set of 3 mini decorative pots with classic Cheriyal lacquer finish. Perfect as a centrepiece on dining tables, shelves, or desks. Each pot features a different traditional motif — lotus, peacock, and geometric pattern.",
    rating: 4.8, reviews: 56, stock: 12, isNew: false,
    sizes: ["Set of 3 (Small)", "Set of 3 (Medium)"],
    colors: [{name:"Traditional Mix", hex:"#C0392B"},{name:"Gold & Black", hex:"#C9901A"}],
    specs: [{key:"Material",val:"Clay & Natural Lacquer"},{key:"Set Contains",val:"3 pots – different motifs"},{key:"Heights",val:"4\", 5\", 6\" approx."},{key:"Care",val:"Wipe dry, avoid moisture"}],
    features: ["3 unique motifs per set","Gifting-ready packaging","All-natural lacquer paint","Authentic handcrafted art"],
    sg: [
      {sz:"Set of 3 (Small)", dim:"4\", 5\", 6\" heights", wt:"600g total", best:"Desk / bookshelf / gifting"},
      {sz:"Set of 3 (Medium)", dim:"6\", 7\", 8\" heights", wt:"1 kg total", best:"Dining table / mantle"},
    ]
  },
  {
    id: 6, name: "Peacock Lacquer Wall Clock", category: "Clocks",
    price: 3299, originalPrice: 4500,
    description: "Exquisite peacock-motif wooden clock — a masterpiece of Telangana craft. The full peacock spread is hand-painted in deep blues, greens, and gold. Silent quartz movement. Each piece is signed by the artisan.",
    rating: 5.0, reviews: 41, stock: 5, isNew: true,
    sizes: ["12 inch dia", "16 inch dia", "20 inch dia"],
    colors: [{name:"Royal Blue Peacock", hex:"#1A5276"},{name:"Emerald Peacock", hex:"#1E6B3C"},{name:"Sunset Peacock", hex:"#E8620A"}],
    specs: [{key:"Material",val:"Sheesham Wood"},{key:"Movement",val:"Silent Quartz"},{key:"Battery",val:"AA × 1 (not included)"},{key:"Finish",val:"Hand-painted lacquer"},{key:"Signed",val:"Yes – artisan signature"}],
    features: ["Artisan-signed piece","Sheesham (rosewood) base","Peacock full-spread motif","Premium gifting box"],
    sg: [
      {sz:"12 inch dia", dim:"30 cm diameter", wt:"450g", best:"Study / bedroom wall"},
      {sz:"16 inch dia", dim:"41 cm diameter", wt:"750g", best:"Living room focal wall"},
      {sz:"20 inch dia", dim:"51 cm diameter", wt:"1.1 kg", best:"Hall / large statement wall"},
    ]
  },
  {
    id: 7, name: "Embroidered Door Curtain", category: "Curtains",
    price: 1599, originalPrice: 2200,
    description: "Single panel embroidered door curtain with Cheriyal tribal art. Dense embroidery on cotton base using colourfast threads. Features traditional bird-and-branch motif. Rod pocket with stitched hem.",
    rating: 4.5, reviews: 78, stock: 25, isNew: false,
    sizes: ["3 ft × 7 ft", "3.5 ft × 7 ft", "4 ft × 7 ft"],
    colors: [{name:"Saffron Embroidery", hex:"#E8620A"},{name:"Red Embroidery", hex:"#8B1A1A"},{name:"Green Embroidery", hex:"#1E6B3C"}],
    specs: [{key:"Material",val:"Cotton base + embroidery thread"},{key:"Panels",val:"1 panel"},{key:"Type",val:"Door curtain"},{key:"Pocket",val:"Rod pocket"},{key:"Wash",val:"Hand wash recommended"}],
    features: ["Dense hand-embroidery","Single panel – door width","Traditional tribal motifs","Rod pocket stitched"],
    sg: [
      {sz:"3 ft × 7 ft",   dim:"91 × 213 cm", wt:"350g", best:"Narrow doorways"},
      {sz:"3.5 ft × 7 ft", dim:"107 × 213 cm", wt:"400g", best:"Standard doors"},
      {sz:"4 ft × 7 ft",   dim:"122 × 213 cm", wt:"460g", best:"Wide doors / arched entries"},
    ]
  },
  {
    id: 8, name: "Double Bed Printed Sheet", category: "Bed Sheets",
    price: 1999, originalPrice: 2700,
    description: "Double bed cotton sheet with vibrant Cheriyal print in red and gold. Full-body print featuring peacock and lotus motifs from the Cheriyal weaving tradition. Includes 2 pillow covers. Machine washable.",
    rating: 4.7, reviews: 145, stock: 18, isNew: false,
    sizes: ["Double", "Queen", "King"],
    colors: [{name:"Red & Gold", hex:"#8B1A1A"},{name:"Saffron & Cream", hex:"#E8620A"},{name:"Indigo & Gold", hex:"#2C3E8C"}],
    specs: [{key:"Material",val:"100% Cotton – 180 TC"},{key:"Includes",val:"Bedsheet + 2 pillow covers"},{key:"Print",val:"All-over reactive print"},{key:"Wash",val:"Machine wash cold"},{key:"Origin",val:"Karimnagar, Telangana"}],
    features: ["Full-body Cheriyal print","Includes 2 pillow covers","Colourfast – 30+ washes","Soft 180 TC weave"],
    sg: [
      {sz:"Double", dim:"90\" × 100\" (229×254 cm)", wt:"1.2 kg", best:"Standard double beds"},
      {sz:"Queen",  dim:"96\" × 108\" (244×274 cm)", wt:"1.5 kg", best:"Queen beds"},
      {sz:"King",   dim:"108\"× 108\" (274×274 cm)", wt:"1.8 kg", best:"King / large beds"},
    ]
  },
  {
    id: 9, name: "Cheriyal Wall Hanging", category: "Home Decor",
    price: 899, originalPrice: 1400,
    description: "Beautiful wall hanging with hand-painted Cheriyal motifs on jute backing. Dowel rod included for easy hanging. Features the classic Cheriyal bird, lotus, and paisley design in natural earth tones.",
    rating: 4.6, reviews: 94, stock: 22, isNew: false,
    sizes: ["12\" × 18\"", "18\" × 24\"", "24\" × 36\""],
    colors: [{name:"Earth Tones", hex:"#7B4F2E"},{name:"Saffron Tones", hex:"#E8620A"},{name:"Indigo Tones", hex:"#2C3E8C"}],
    specs: [{key:"Material",val:"Jute + hand-painted lacquer"},{key:"Includes",val:"Wall hanging + dowel rod"},{key:"Hanging",val:"Jute rope loop"},{key:"Origin",val:"Karimnagar, Telangana"},{key:"Care",val:"Keep away from moisture"}],
    features: ["Jute + dowel rod included","Hand-painted by artisans","Traditional Cheriyal motifs","Lightweight – easy to hang"],
    sg: [
      {sz:"12\" × 18\"", dim:"30 × 46 cm", wt:"150g", best:"Bedroom / study nook"},
      {sz:"18\" × 24\"", dim:"46 × 61 cm", wt:"280g", best:"Living room accent"},
      {sz:"24\" × 36\"", dim:"61 × 91 cm", wt:"500g", best:"Feature wall / hallway"},
    ]
  },
  {
    id: 10, name: "Lacquer Decorative Lamp", category: "Home Decor",
    price: 4599, originalPrice: 6000,
    description: "Traditional clay lamp stand with Cheriyal lacquer art — perfect as a centre-table statement piece. Handcrafted with a wide base lamp bowl and decorative stem. Includes electric fitting for a bulb (E14 fitting, bulb not included).",
    rating: 4.9, reviews: 33, stock: 7, isNew: true,
    sizes: ["Single Lamp", "Pair of Lamps", "Trio Set"],
    colors: [{name:"Classic Red & Gold", hex:"#C0392B"},{name:"Peacock Blue & Gold", hex:"#1A5276"},{name:"Forest Green & Gold", hex:"#1E6B3C"}],
    specs: [{key:"Material",val:"Clay + Natural Lacquer"},{key:"Fitting",val:"E14 bulb fitting included"},{key:"Height",val:"Approx. 30 cm (single)"},{key:"Care",val:"Wipe dry, avoid water"}],
    features: ["Electric fitting included","E14 bulb socket","Handcrafted traditional art","Gifting box available"],
    sg: [
      {sz:"Single Lamp", dim:"30 cm H × 15 cm base", wt:"700g", best:"Study / bedside table"},
      {sz:"Pair of Lamps", dim:"30 cm H each", wt:"1.4 kg", best:"Dining table / mantle pair"},
      {sz:"Trio Set", dim:"30+25+20 cm H set", wt:"1.8 kg", best:"Centrepiece / display shelf"},
    ]
  },
  {
    id: 11, name: "Tribal Art Cushion Covers", category: "Home Decor",
    price: 799, originalPrice: 1200,
    description: "Set of 5 cushion covers with Cheriyal tribal art prints. Block-printed on cotton. Each cover has a unique motif — peacock, lotus, elephant, geometric, and bird-of-paradise. Zip closure. Fits 16×16\" and 18×18\" inserts.",
    rating: 4.5, reviews: 167, stock: 40, isNew: false,
    sizes: ["16\" × 16\" (Set of 5)", "18\" × 18\" (Set of 5)"],
    colors: [{name:"Multi-colour Traditional", hex:"#E8620A"},{name:"Indigo & Saffron", hex:"#2C3E8C"},{name:"Red & Gold", hex:"#8B1A1A"}],
    specs: [{key:"Material",val:"100% Cotton"},{key:"Set Contains",val:"5 cushion covers"},{key:"Closure",val:"Hidden zip"},{key:"Print",val:"Block print"},{key:"Wash",val:"Machine wash cold"}],
    features: ["Set of 5 – 5 unique motifs","Zip closure","Fits 16\" & 18\" inserts","Block-print art"],
    sg: [
      {sz:"16\" × 16\" (Set of 5)", dim:"40 × 40 cm each", wt:"450g set", best:"Throw cushions / sofa"},
      {sz:"18\" × 18\" (Set of 5)", dim:"46 × 46 cm each", wt:"600g set", best:"Large sofa / floor cushions"},
    ]
  },
  {
    id: 12, name: "Cheriyal Art Table Runner", category: "Home Decor",
    price: 699, originalPrice: 1000,
    description: "Handwoven cotton table runner with Cheriyal border design. Hemmed edges, natural cotton fringe at ends. Traditional geometric and floral border in saffron and gold. Adds an instant ethnic touch to dining tables.",
    rating: 4.4, reviews: 52, stock: 35, isNew: false,
    sizes: ["13\" × 36\"", "13\" × 48\"", "13\" × 72\""],
    colors: [{name:"Saffron & Natural", hex:"#E8620A"},{name:"Red & Natural", hex:"#8B1A1A"},{name:"Indigo & Natural", hex:"#2C3E8C"}],
    specs: [{key:"Material",val:"Handwoven Cotton"},{key:"Fringe",val:"Natural cotton fringe – 2\" each end"},{key:"Finish",val:"Hemmed edges"},{key:"Wash",val:"Machine wash cold"},{key:"Origin",val:"Karimnagar, Telangana"}],
    features: ["Handwoven on traditional loom","Natural cotton fringe","Hemmed edges","Karimnagar craft heritage"],
    sg: [
      {sz:"13\" × 36\"", dim:"33 × 91 cm", wt:"120g", best:"Coffee table / 2-seater dining"},
      {sz:"13\" × 48\"", dim:"33 × 122 cm", wt:"160g", best:"4-seater dining table"},
      {sz:"13\" × 72\"", dim:"33 × 183 cm", wt:"240g", best:"6-seater dining table"},
    ]
  },
];

export const CATS = ["All","Pots","Clocks","Curtains","Bed Sheets","Home Decor"];
