export type DreamscapeStage = {
  id: string;
  label: string;
  image: string;
};

export type DreamscapeMap = {
  id: string;
  name: string;
  coOp: boolean;
  items: string[];
  stages: DreamscapeStage[];
};

export const dreamscapeMemorySource = {
  extractedFrom: "https://wostools.net/games/dreamscape-memory",
  extractedAt: "2026-06-04T19:07:15.113Z",
  mapCount: 23,
  stageCount: 180,
  itemCount: 874,
} as const;

export const dreamscapeMaps: DreamscapeMap[] = [
  {
    "id": "bandstand",
    "name": "Bandstand",
    "coOp": false,
    "items": [
      "Ladder",
      "Gift box",
      "Harp",
      "Basket",
      "Telescope",
      "Sailboat",
      "Pine tree",
      "Mushroom",
      "Bird's nest",
      "Statue",
      "Headwear",
      "Footprints",
      "Drain",
      "Umbrella"
    ],
    "stages": [
      {
        "id": "bandstand-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/bandstand.webp"
      },
      {
        "id": "bandstand-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/bandstand-2.webp"
      },
      {
        "id": "bandstand-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/bandstand-3.webp"
      },
      {
        "id": "bandstand-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/bandstand-4.webp"
      },
      {
        "id": "bandstand-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/bandstand-5.webp"
      }
    ]
  },
  {
    "id": "aquarium",
    "name": "Aquarium",
    "coOp": false,
    "items": [
      "A",
      "Otter",
      "Sea turtle",
      "Spotlight",
      "Bluefish",
      "Glass bottle",
      "Seahorse",
      "Jellyfish",
      "Shark",
      "Dolphin",
      "Pufferfish",
      "Sunken ship",
      "Painting",
      "Sea anemone",
      "Ship wheel",
      "Book",
      "Sea urchin",
      "Seashell",
      "Polar bear",
      "Anchor",
      "Lobster",
      "Magnifier",
      "Fishbone",
      "Map",
      "Compass"
    ],
    "stages": [
      {
        "id": "aquarium-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/aquarium.webp"
      },
      {
        "id": "aquarium-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/aquarium-2.webp"
      },
      {
        "id": "aquarium-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/aquarium-3.webp"
      },
      {
        "id": "aquarium-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/aquarium-4.webp"
      },
      {
        "id": "aquarium-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/aquarium-5.webp"
      },
      {
        "id": "aquarium-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/aquarium-6.webp"
      }
    ]
  },
  {
    "id": "museum",
    "name": "Museum",
    "coOp": false,
    "items": [
      "Broom",
      "Document",
      "Wreath",
      "Fan",
      "Shoulder bag",
      "Lion statue",
      "Magnifier",
      "Curtain",
      "Gloves",
      "Gold coins",
      "Ladder",
      "Broken glass",
      "Labyrinth",
      "Clock",
      "Spider web",
      "Mask",
      "Globe",
      "Spear",
      "Trophy",
      "Wing",
      "Arrow sign",
      "Rug",
      "Plant",
      "Book",
      "Music note",
      "Cello",
      "Piano",
      "Camera",
      "Harp",
      "Chess piece"
    ],
    "stages": [
      {
        "id": "museum-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/museum.webp"
      },
      {
        "id": "museum-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/museum-2.webp"
      },
      {
        "id": "museum-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/museum-3.webp"
      },
      {
        "id": "museum-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/museum-4.webp"
      },
      {
        "id": "museum-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/museum-5.webp"
      },
      {
        "id": "museum-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/museum-6.webp"
      },
      {
        "id": "museum-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/museum-7.webp"
      }
    ]
  },
  {
    "id": "pier",
    "name": "Pier",
    "coOp": true,
    "items": [
      "Vines",
      "Sea urchin",
      "Corn",
      "Canned food",
      "Trident",
      "Basket",
      "Number plate",
      "Chain",
      "Searchlight",
      "Swordfish",
      "7",
      "Shrimp",
      "Lighthouse",
      "Bench",
      "Mailbox",
      "Tent",
      "Oar",
      "Bell",
      "Oxygen tank",
      "Paw mark",
      "Chimney",
      "Starfish",
      "Mermaid",
      "Anchor",
      "Shell",
      "Pulley crane",
      "Exhaust fan",
      "Z",
      "Kite",
      "Paper crane",
      "Sea cucumber",
      "Sea turtle"
    ],
    "stages": [
      {
        "id": "pier-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/pier.webp"
      },
      {
        "id": "pier-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/pier-2.webp"
      }
    ]
  },
  {
    "id": "terminal",
    "name": "Terminal",
    "coOp": false,
    "items": [
      "Dolphin",
      "Plane",
      "Hot air balloon",
      "Flag garland",
      "Bird flock",
      "Shield",
      "Wreath",
      "Pipe",
      "Clock",
      "Lightning",
      "Mailbox",
      "Hook",
      "Lighthouse",
      "Searchlight",
      "Map",
      "Chimney",
      "Glass display case",
      "Fruit stand",
      "Notice board",
      "Cart",
      "Backpack",
      "Ship wheel",
      "Plant",
      "Lifebuoy",
      "Water stain",
      "Fishing net",
      "Crack",
      "Oxygen tank",
      "Ladder",
      "Umbrella",
      "Octopus",
      "Telescope",
      "Drain",
      "Coal pile",
      "Oar",
      "Compass",
      "Wooden boat",
      "Barrel",
      "Pouch",
      "Shovel",
      "Fish",
      "Sea turtle",
      "Anchor",
      "Bench",
      "Hammer",
      "Trident",
      "Waves",
      "Motorcycle"
    ],
    "stages": [
      {
        "id": "terminal-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/terminal.webp"
      },
      {
        "id": "terminal-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/terminal-2.webp"
      },
      {
        "id": "terminal-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/terminal-3.webp"
      },
      {
        "id": "terminal-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/terminal-4.webp"
      },
      {
        "id": "terminal-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/terminal-5.webp"
      },
      {
        "id": "terminal-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/terminal-6.webp"
      },
      {
        "id": "terminal-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/terminal-7.webp"
      },
      {
        "id": "terminal-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/terminal-8.webp"
      },
      {
        "id": "terminal-9",
        "label": "Stage 9",
        "image": "/images/dreamscape/terminal-9.webp"
      },
      {
        "id": "terminal-10",
        "label": "Stage 10",
        "image": "/images/dreamscape/terminal-10.webp"
      },
      {
        "id": "terminal-11",
        "label": "Stage 11",
        "image": "/images/dreamscape/terminal-11.webp"
      }
    ]
  },
  {
    "id": "courtyard",
    "name": "Courtyard",
    "coOp": false,
    "items": [
      "Backpack",
      "Bird's nest",
      "Wood pile",
      "Gloves",
      "Wreath",
      "Tarp",
      "Mailbox",
      "Star",
      "Cabinet",
      "Flag garland",
      "Barrel",
      "Arrow sign",
      "Footprints",
      "Scissors",
      "Pumpkin",
      "Broom",
      "Moon",
      "Notebook",
      "Gift box",
      "Ear of wheat",
      "Clay jug",
      "Goggles",
      "Kettle",
      "Fire tongs",
      "Crack"
    ],
    "stages": [
      {
        "id": "courtyard-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/courtyard.webp"
      },
      {
        "id": "courtyard-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/courtyard-2.webp"
      },
      {
        "id": "courtyard-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/courtyard-3.webp"
      },
      {
        "id": "courtyard-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/courtyard-4.webp"
      },
      {
        "id": "courtyard-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/courtyard-5.webp"
      },
      {
        "id": "courtyard-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/courtyard-6.webp"
      }
    ]
  },
  {
    "id": "garage",
    "name": "Garage",
    "coOp": false,
    "items": [
      "Cat",
      "Blackboard",
      "Lounge chair",
      "Medkit",
      "Teddy bear",
      "Exhaust pipe",
      "Picture frame",
      "Oil puddle",
      "Globe",
      "Scroll",
      "Cheese",
      "Satchel",
      "Gloves",
      "Owl",
      "Scarf",
      "Bell",
      "Alarm clock",
      "Camera",
      "Thermometer",
      "Stone statue",
      "Telescope",
      "Cushion",
      "Goggles",
      "Magnifier",
      "Coat rack",
      "X",
      "Apple",
      "Blueprint",
      "Quill",
      "Hammer",
      "Compass",
      "Cogwheel",
      "Hourglass"
    ],
    "stages": [
      {
        "id": "garage-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/garage.webp"
      },
      {
        "id": "garage-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/garage-2.webp"
      },
      {
        "id": "garage-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/garage-3.webp"
      },
      {
        "id": "garage-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/garage-4.webp"
      },
      {
        "id": "garage-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/garage-5.webp"
      },
      {
        "id": "garage-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/garage-6.webp"
      },
      {
        "id": "garage-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/garage-7.webp"
      }
    ]
  },
  {
    "id": "classroom",
    "name": "Classroom",
    "coOp": false,
    "items": [
      "Footprints",
      "Plant",
      "Patch",
      "Bucket",
      "Briefcase",
      "Wallet",
      "Lamp",
      "Mop",
      "Tie",
      "Drum",
      "Compass",
      "Handgun",
      "Helmet",
      "Broken glass",
      "Stamp",
      "Toy plane",
      "Feather",
      "Shield",
      "Banner",
      "Diary",
      "Crack",
      "Rope",
      "Chess board",
      "Sandwich",
      "Cane",
      "Horn",
      "Vent",
      "Poster",
      "Ruler",
      "Lion statue",
      "Coat",
      "Bald eagle",
      "Crown",
      "Magnifier",
      "Paper ball",
      "Toy car",
      "Trophy",
      "Microphone",
      "Hourglass",
      "Water cup",
      "Spider web",
      "Sword",
      "Calendar",
      "Globe",
      "Blackboard eraser",
      "Clock",
      "Rag",
      "Duster",
      "Chest"
    ],
    "stages": [
      {
        "id": "classroom-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/classroom.webp"
      },
      {
        "id": "classroom-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/classroom-2.webp"
      },
      {
        "id": "classroom-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/classroom-3.webp"
      },
      {
        "id": "classroom-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/classroom-4.webp"
      },
      {
        "id": "classroom-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/classroom-5.webp"
      },
      {
        "id": "classroom-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/classroom-6.webp"
      },
      {
        "id": "classroom-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/classroom-7.webp"
      },
      {
        "id": "classroom-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/classroom-8.webp"
      },
      {
        "id": "classroom-9",
        "label": "Stage 9",
        "image": "/images/dreamscape/classroom-9.webp"
      }
    ]
  },
  {
    "id": "ship-deck",
    "name": "Ship Deck",
    "coOp": false,
    "items": [
      "Barrel",
      "Bomb",
      "Tentacles",
      "Headwear",
      "Diving helmet",
      "Cannon barrel",
      "Hourglass",
      "Banana peel",
      "Lantern",
      "Fishbone",
      "Broom",
      "Patch",
      "Pouch",
      "Fake limb",
      "Toy figure",
      "Chest",
      "Crab",
      "Diving mask",
      "Glass bottle",
      "Gold coins",
      "Envelope",
      "Seagull",
      "Sword",
      "Bucket",
      "Diamond",
      "Starfish",
      "Telescope",
      "Arrow sign",
      "Plant",
      "Notebook",
      "Chain"
    ],
    "stages": [
      {
        "id": "ship-deck-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/ship-deck.webp"
      },
      {
        "id": "ship-deck-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/ship-deck-2.webp"
      },
      {
        "id": "ship-deck-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/ship-deck-3.webp"
      },
      {
        "id": "ship-deck-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/ship-deck-4.webp"
      },
      {
        "id": "ship-deck-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/ship-deck-5.webp"
      },
      {
        "id": "ship-deck-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/ship-deck-6.webp"
      },
      {
        "id": "ship-deck-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/ship-deck-7.webp"
      },
      {
        "id": "ship-deck-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/ship-deck-8.webp"
      }
    ]
  },
  {
    "id": "attic",
    "name": "Attic",
    "coOp": false,
    "items": [
      "Patch",
      "Map",
      "Gloves",
      "Medal",
      "Boots",
      "Broken glass",
      "Triangle",
      "Backpack",
      "Book",
      "Belt",
      "Tea set",
      "Fountain pen",
      "Lock",
      "Key",
      "Bullets",
      "Flower",
      "Compass",
      "Magnifier",
      "Gold coins",
      "Binoculars",
      "Calendar",
      "Spider",
      "Dagger",
      "Pine tree",
      "Pouch",
      "Acorn",
      "Thermometer",
      "X"
    ],
    "stages": [
      {
        "id": "attic-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/attic.webp"
      },
      {
        "id": "attic-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/attic-2.webp"
      },
      {
        "id": "attic-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/attic-3.webp"
      },
      {
        "id": "attic-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/attic-4.webp"
      },
      {
        "id": "attic-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/attic-5.webp"
      },
      {
        "id": "attic-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/attic-6.webp"
      }
    ]
  },
  {
    "id": "greenhouse",
    "name": "Greenhouse",
    "coOp": true,
    "items": [
      "Grapes",
      "Thermometer",
      "Snowman",
      "Dirt pit",
      "Curtain",
      "Bug net",
      "Flower pot",
      "Shovel",
      "Pumpkin",
      "Mouse",
      "Sun",
      "Eggplants",
      "Scarecrow",
      "Spider web",
      "Sunflower",
      "Chest",
      "Birdcage",
      "Broom",
      "Corn",
      "Bucket",
      "Five pointed star",
      "Strawberries",
      "Chilli peppers",
      "Scarf",
      "Tomatoes",
      "Cart",
      "Scythe",
      "Arrow sign",
      "Crescent moon",
      "Blackboard",
      "Watering can",
      "Stool",
      "Ladder"
    ],
    "stages": [
      {
        "id": "greenhouse-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/greenhouse.webp"
      }
    ]
  },
  {
    "id": "mansion",
    "name": "Mansion",
    "coOp": false,
    "items": [
      "Sun",
      "Wood pile",
      "Kite",
      "Gift box",
      "Flag garland",
      "Chimney",
      "Plane",
      "Clock",
      "Dog",
      "Number plate",
      "Mailbox",
      "Dirt pit",
      "Bird's nest",
      "Road cone",
      "Tarp",
      "Shell",
      "Pruning shears",
      "Pipe",
      "Cave",
      "Chandelier",
      "Accordion",
      "Shovel",
      "Wreath",
      "N",
      "Watering can",
      "Boots",
      "Balloons",
      "Blanket",
      "Crack",
      "Leaf pile",
      "Ladder"
    ],
    "stages": [
      {
        "id": "mansion-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/mansion.webp"
      },
      {
        "id": "mansion-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/mansion-2.webp"
      },
      {
        "id": "mansion-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/mansion-3.webp"
      },
      {
        "id": "mansion-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/mansion-4.webp"
      },
      {
        "id": "mansion-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/mansion-5.webp"
      },
      {
        "id": "mansion-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/mansion-6.webp"
      },
      {
        "id": "mansion-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/mansion-7.webp"
      }
    ]
  },
  {
    "id": "barracks",
    "name": "Barracks",
    "coOp": false,
    "items": [
      "Canteen",
      "Paint blob",
      "Seagull",
      "Stool",
      "Medkit",
      "Watchtower",
      "Pulley",
      "Training dummy",
      "Ladder",
      "Hot air balloon",
      "Exhaust fan",
      "Window",
      "Saddle",
      "Kettlebell",
      "Streetlight",
      "Sandbag",
      "Skis"
    ],
    "stages": [
      {
        "id": "barracks-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/barracks.webp"
      },
      {
        "id": "barracks-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/barracks-2.webp"
      },
      {
        "id": "barracks-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/barracks-3.webp"
      },
      {
        "id": "barracks-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/barracks-4.webp"
      }
    ]
  },
  {
    "id": "workshop",
    "name": "Workshop",
    "coOp": false,
    "items": [
      "Ladder",
      "Wrench",
      "Pipe",
      "Oil puddle",
      "Withered branch",
      "Safety helmet",
      "Spider",
      "Screwdriver",
      "Spring",
      "Pliers",
      "Briefcase",
      "Chainmail",
      "Parcel",
      "Scarf",
      "Air pump",
      "Key",
      "Mouse",
      "Oil pot",
      "Exhaust fan",
      "Fish bone",
      "Gear",
      "Triangle",
      "Broom",
      "Fire extinguisher",
      "Spider web",
      "Thermometer",
      "Road cone",
      "Barrel",
      "Goggles",
      "Glass jar",
      "Snowman",
      "Axe",
      "Bird flock",
      "Tower",
      "Rope",
      "Scissors",
      "Magnet",
      "Arrow sign",
      "Fire alarm",
      "Shovel",
      "Hammer",
      "Wooden pallet",
      "Wood pile",
      "Boots",
      "Rag",
      "6",
      "Megaphone",
      "Lantern",
      "Wheelbarrow",
      "Map",
      "Projector"
    ],
    "stages": [
      {
        "id": "workshop-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/workshop.webp"
      },
      {
        "id": "workshop-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/workshop-2.webp"
      },
      {
        "id": "workshop-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/workshop-3.webp"
      },
      {
        "id": "workshop-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/workshop-4.webp"
      },
      {
        "id": "workshop-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/workshop-5.webp"
      },
      {
        "id": "workshop-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/workshop-6.webp"
      },
      {
        "id": "workshop-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/workshop-7.webp"
      },
      {
        "id": "workshop-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/workshop-8.webp"
      }
    ]
  },
  {
    "id": "arena",
    "name": "Arena",
    "coOp": false,
    "items": [
      "Mouse",
      "Hammer",
      "Bow and arrow",
      "Crack",
      "Medal",
      "Telescope",
      "Dagger",
      "Claw mark",
      "Shield",
      "Drain",
      "Basket",
      "Weapon rack",
      "Horn",
      "Brazier",
      "Helmet",
      "Glass bottle",
      "Crossbow",
      "Ear of wheat",
      "Trident",
      "Stone statue",
      "Scoreboard",
      "Sun",
      "Training dummy",
      "Gong",
      "Chest",
      "F",
      "Bench",
      "Animal hide",
      "Spiked mace",
      "Barrel",
      "Wreath",
      "Trophy",
      "Pouch"
    ],
    "stages": [
      {
        "id": "arena-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/arena.webp"
      },
      {
        "id": "arena-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/arena-2.webp"
      },
      {
        "id": "arena-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/arena-3.webp"
      },
      {
        "id": "arena-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/arena-4.webp"
      },
      {
        "id": "arena-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/arena-5.webp"
      },
      {
        "id": "arena-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/arena-6.webp"
      },
      {
        "id": "arena-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/arena-7.webp"
      },
      {
        "id": "arena-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/arena-8.webp"
      }
    ]
  },
  {
    "id": "ballroom",
    "name": "Ballroom",
    "coOp": false,
    "items": [
      "Birdcage",
      "Gramophone",
      "Vase",
      "Telescope",
      "Picture frame",
      "Lantern",
      "Balloons",
      "Trophy",
      "Wreath",
      "Game board",
      "Shield",
      "Sun",
      "Lion statue",
      "Boots",
      "Candle",
      "Belt",
      "Water stain",
      "Trumpet",
      "Mask",
      "Toy airplane",
      "Helmet",
      "Snake",
      "Fountain pen",
      "Camera",
      "Silk scarf",
      "Globe",
      "Chest",
      "Sword",
      "Gecko",
      "Crown",
      "Cane",
      "Broom",
      "Umbrella",
      "Book",
      "Cello",
      "Pocket watch",
      "Backpack",
      "Ladder",
      "Stag head",
      "Envelope",
      "Gloves",
      "Bell",
      "Headwear",
      "Key",
      "Medal",
      "Scroll",
      "Diamond",
      "8",
      "Goggles",
      "Walking stick"
    ],
    "stages": [
      {
        "id": "ballroom-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/ballroom.webp"
      },
      {
        "id": "ballroom-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/ballroom-2.webp"
      },
      {
        "id": "ballroom-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/ballroom-3.webp"
      },
      {
        "id": "ballroom-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/ballroom-4.webp"
      },
      {
        "id": "ballroom-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/ballroom-5.webp"
      },
      {
        "id": "ballroom-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/ballroom-6.webp"
      },
      {
        "id": "ballroom-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/ballroom-7.webp"
      },
      {
        "id": "ballroom-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/ballroom-8.webp"
      },
      {
        "id": "ballroom-9",
        "label": "Stage 9",
        "image": "/images/dreamscape/ballroom-9.webp"
      },
      {
        "id": "ballroom-10",
        "label": "Stage 10",
        "image": "/images/dreamscape/ballroom-10.webp"
      },
      {
        "id": "ballroom-11",
        "label": "Stage 11",
        "image": "/images/dreamscape/ballroom-11.webp"
      }
    ]
  },
  {
    "id": "square",
    "name": "Square",
    "coOp": false,
    "items": [
      "Horn",
      "Hammer",
      "Goggles",
      "Pliers",
      "Shovel",
      "Canteen",
      "Dagger",
      "Towel",
      "Dumbbell",
      "Rag",
      "Whistle",
      "Bucket",
      "Medkit",
      "Cup",
      "Helmet",
      "Wrench",
      "Whip",
      "Beehive",
      "Blackboard",
      "Mop",
      "Chimney",
      "Patch",
      "Training dummy",
      "Anemometer",
      "Ice skates",
      "Air drop",
      "Torch",
      "Airship",
      "Watchtower",
      "Valve",
      "Flag garland",
      "Iron axe",
      "4",
      "Sword",
      "Bell",
      "Sun",
      "Motorcycle",
      "Poster",
      "Parcel",
      "Ladder",
      "Megaphone",
      "Bench",
      "Leaf",
      "Coat",
      "Exhaust fan",
      "Skis",
      "Sign post",
      "Pigeon",
      "Arrow sign"
    ],
    "stages": [
      {
        "id": "square-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/square.webp"
      },
      {
        "id": "square-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/square-2.webp"
      },
      {
        "id": "square-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/square-3.webp"
      },
      {
        "id": "square-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/square-4.webp"
      },
      {
        "id": "square-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/square-5.webp"
      },
      {
        "id": "square-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/square-6.webp"
      },
      {
        "id": "square-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/square-7.webp"
      },
      {
        "id": "square-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/square-8.webp"
      },
      {
        "id": "square-9",
        "label": "Stage 9",
        "image": "/images/dreamscape/square-9.webp"
      },
      {
        "id": "square-10",
        "label": "Stage 10",
        "image": "/images/dreamscape/square-10.webp"
      }
    ]
  },
  {
    "id": "forge",
    "name": "Forge",
    "coOp": false,
    "items": [
      "Pressure gauge",
      "Chain",
      "Pouch",
      "Safety helmet",
      "2",
      "Arrow sign",
      "Stool",
      "Shovel",
      "Wrench",
      "Spring",
      "Doorway",
      "Anchor",
      "Boots",
      "Horseshoe",
      "Road cone",
      "Canned food",
      "Shield",
      "Hand saw",
      "Rag",
      "Statue",
      "Minecart",
      "Valve",
      "Diamond",
      "Lock",
      "Wheel",
      "Watering can",
      "Ladder",
      "Wallet",
      "Megaphone",
      "Drain",
      "Exhaust fan",
      "Blueprint",
      "Drawing compass",
      "Hammer",
      "Glass bottle",
      "Toolbox",
      "Bowknot",
      "Pliers",
      "Typewriter",
      "Donut",
      "Sun",
      "Ruler",
      "F",
      "Star",
      "Handprint",
      "Gear",
      "Bullet hole",
      "Crack",
      "Water stain",
      "Axe"
    ],
    "stages": [
      {
        "id": "forge-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/forge.webp"
      },
      {
        "id": "forge-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/forge-2.webp"
      },
      {
        "id": "forge-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/forge-3.webp"
      },
      {
        "id": "forge-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/forge-4.webp"
      },
      {
        "id": "forge-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/forge-5.webp"
      },
      {
        "id": "forge-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/forge-6.webp"
      },
      {
        "id": "forge-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/forge-7.webp"
      },
      {
        "id": "forge-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/forge-8.webp"
      },
      {
        "id": "forge-9",
        "label": "Stage 9",
        "image": "/images/dreamscape/forge-9.webp"
      },
      {
        "id": "forge-10",
        "label": "Stage 10",
        "image": "/images/dreamscape/forge-10.webp"
      },
      {
        "id": "forge-11",
        "label": "Stage 11",
        "image": "/images/dreamscape/forge-11.webp"
      }
    ]
  },
  {
    "id": "stable",
    "name": "Stable",
    "coOp": false,
    "items": [
      "Wind vane",
      "Bell",
      "Boots",
      "Straw hat",
      "Paper windmill",
      "Ladder",
      "Sign post",
      "Barrel",
      "Pitchfork",
      "Rabbit",
      "Wooden stake",
      "Shovel",
      "Rubber duck",
      "Cat",
      "Water stain",
      "Basket",
      "Fish bone",
      "Saddle",
      "Beast trap",
      "Ladle",
      "Pouch",
      "Brush",
      "Eagle",
      "Gloves",
      "Butterfly",
      "Wooden cart",
      "Bowl",
      "Apron",
      "Giant elk",
      "Footprint",
      "Broom",
      "Parrot",
      "Key",
      "Feather",
      "Lock",
      "Horseshoe",
      "Ostrich egg",
      "Collar",
      "Yak",
      "L",
      "Whip",
      "Clay jug",
      "Chain",
      "Bucket",
      "Chameleon",
      "Carrot",
      "Lantern",
      "Owl"
    ],
    "stages": [
      {
        "id": "stable-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/stable.webp"
      },
      {
        "id": "stable-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/stable-2.webp"
      },
      {
        "id": "stable-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/stable-3.webp"
      },
      {
        "id": "stable-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/stable-4.webp"
      },
      {
        "id": "stable-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/stable-5.webp"
      },
      {
        "id": "stable-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/stable-6.webp"
      },
      {
        "id": "stable-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/stable-7.webp"
      },
      {
        "id": "stable-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/stable-8.webp"
      },
      {
        "id": "stable-9",
        "label": "Stage 9",
        "image": "/images/dreamscape/stable-9.webp"
      },
      {
        "id": "stable-10",
        "label": "Stage 10",
        "image": "/images/dreamscape/stable-10.webp"
      },
      {
        "id": "stable-11",
        "label": "Stage 11",
        "image": "/images/dreamscape/stable-11.webp"
      },
      {
        "id": "stable-12",
        "label": "Stage 12",
        "image": "/images/dreamscape/stable-12.webp"
      }
    ]
  },
  {
    "id": "market",
    "name": "Market",
    "coOp": false,
    "items": [
      "Bird's nest",
      "Backpack",
      "Goggles",
      "Megaphone",
      "Clock",
      "Pliers",
      "Slingshot",
      "Bandage roll",
      "Stretcher",
      "Plane",
      "Thermometer",
      "Boots",
      "Shovel",
      "Searchlight",
      "Rifle",
      "Windmill",
      "Air drop",
      "Canned food",
      "Suspension bridge",
      "Pipe",
      "Airship",
      "Newspaper",
      "Coat",
      "Apple",
      "Screwdriver",
      "Wrench",
      "Medkit",
      "Canteen",
      "Blackboard",
      "Telescope",
      "Footprint",
      "Training dummy",
      "Patch",
      "Bell",
      "Rope",
      "Scissors",
      "Ladder",
      "Anemometer",
      "Ladle",
      "Earmuffs",
      "Sun",
      "Bench",
      "Animal hide",
      "Gloves",
      "Bear head",
      "W",
      "Flowers",
      "Stain",
      "Scarf",
      "Crescent moon"
    ],
    "stages": [
      {
        "id": "market-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/market.webp"
      },
      {
        "id": "market-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/market-2.webp"
      },
      {
        "id": "market-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/market-3.webp"
      },
      {
        "id": "market-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/market-4.webp"
      },
      {
        "id": "market-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/market-5.webp"
      },
      {
        "id": "market-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/market-6.webp"
      },
      {
        "id": "market-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/market-7.webp"
      },
      {
        "id": "market-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/market-8.webp"
      },
      {
        "id": "market-9",
        "label": "Stage 9",
        "image": "/images/dreamscape/market-9.webp"
      },
      {
        "id": "market-10",
        "label": "Stage 10",
        "image": "/images/dreamscape/market-10.webp"
      },
      {
        "id": "market-11",
        "label": "Stage 11",
        "image": "/images/dreamscape/market-11.webp"
      },
      {
        "id": "market-12",
        "label": "Stage 12",
        "image": "/images/dreamscape/market-12.webp"
      }
    ]
  },
  {
    "id": "outpost",
    "name": "Outpost",
    "coOp": false,
    "items": [
      "Kite",
      "Headwear",
      "Cup",
      "Chain",
      "Pinecone",
      "Cave",
      "Horn",
      "Compass",
      "Flag",
      "Earmuffs",
      "Footprint",
      "Aurora",
      "Bird",
      "Snow boots",
      "Moon",
      "Shotgun",
      "Pocket knife",
      "Scarf",
      "Mailbox",
      "Beast trap",
      "Wheel",
      "Frozen waterfall",
      "Kennel",
      "Animal hide",
      "Hammer",
      "Bench",
      "Iron axe",
      "Telescope",
      "Haystack",
      "Candle",
      "Backpack",
      "Wind vane",
      "Iron pot",
      "Rope ladder",
      "Stone statue",
      "Windmill",
      "Snowman",
      "Barrel",
      "Saw",
      "Bag",
      "Lighthouse",
      "Skis",
      "X",
      "Lantern",
      "Balloon",
      "Tent",
      "Wooden boat",
      "Rabbit",
      "Fish",
      "Smile",
      "Shovel"
    ],
    "stages": [
      {
        "id": "outpost-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/outpost.webp"
      },
      {
        "id": "outpost-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/outpost-2.webp"
      },
      {
        "id": "outpost-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/outpost-3.webp"
      },
      {
        "id": "outpost-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/outpost-4.webp"
      },
      {
        "id": "outpost-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/outpost-5.webp"
      },
      {
        "id": "outpost-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/outpost-6.webp"
      },
      {
        "id": "outpost-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/outpost-7.webp"
      },
      {
        "id": "outpost-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/outpost-8.webp"
      },
      {
        "id": "outpost-9",
        "label": "Stage 9",
        "image": "/images/dreamscape/outpost-9.webp"
      },
      {
        "id": "outpost-10",
        "label": "Stage 10",
        "image": "/images/dreamscape/outpost-10.webp"
      },
      {
        "id": "outpost-11",
        "label": "Stage 11",
        "image": "/images/dreamscape/outpost-11.webp"
      },
      {
        "id": "outpost-12",
        "label": "Stage 12",
        "image": "/images/dreamscape/outpost-12.webp"
      },
      {
        "id": "outpost-13",
        "label": "Stage 13",
        "image": "/images/dreamscape/outpost-13.webp"
      }
    ]
  },
  {
    "id": "obelisk-square",
    "name": "Obelisk Square",
    "coOp": true,
    "items": [
      "Wristwatch",
      "Scarf",
      "Bucket",
      "Snowboard",
      "Shovel",
      "Snowman",
      "Blanket",
      "Manhole cover",
      "Feather",
      "Footprint",
      "Dustpan",
      "Wrench",
      "Iron axe",
      "Watering can",
      "Streetlight",
      "Satchel",
      "Toolbox",
      "Wood pile",
      "Sign post",
      "Ruler",
      "Headwear",
      "Wind chime",
      "Bird nest",
      "Lift",
      "Lightning",
      "Seagull",
      "Airplane",
      "Kite",
      "Airship",
      "Ladder",
      "Statue",
      "Diamond",
      "Gloves",
      "Boots",
      "Broom",
      "Basket",
      "Cart",
      "Lighthouse",
      "Tunnel",
      "Goggles",
      "Exclamation mark",
      "Lantern",
      "Pouch",
      "Wreath",
      "Pruning shears"
    ],
    "stages": [
      {
        "id": "obelisk-square-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/obelisk-square.webp"
      },
      {
        "id": "obelisk-square-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/obelisk-square-2.webp"
      },
      {
        "id": "obelisk-square-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/obelisk-square-3.webp"
      }
    ]
  },
  {
    "id": "office",
    "name": "Office",
    "coOp": false,
    "items": [
      "Clock",
      "Magnet",
      "Tweezers",
      "Key",
      "Envelope",
      "Compass",
      "Quill",
      "Plant",
      "Weighing scale",
      "Book",
      "Pestle",
      "Umbrella",
      "Gold coins",
      "Paper ball",
      "Goggles",
      "Stamp",
      "Scroll",
      "Blackboard eraser",
      "Paper plane",
      "Test tubes",
      "Scissors",
      "N",
      "Throwing knife",
      "Chest",
      "Magnifier",
      "Mouse",
      "Syringe",
      "Typewriter",
      "Glass bottle",
      "Globe",
      "Butterfly",
      "Towel",
      "Telescope",
      "Sailboat",
      "Hourglass",
      "Microscope",
      "Lantern",
      "Trophy",
      "Flag",
      "Facemask",
      "Thermometer",
      "Branch",
      "Calendar",
      "Wheat",
      "Ruler",
      "Footprint",
      "Triangle",
      "Candle",
      "H2O",
      "A",
      "Duffle bag"
    ],
    "stages": [
      {
        "id": "office-1",
        "label": "Stage 1",
        "image": "/images/dreamscape/office.webp"
      },
      {
        "id": "office-2",
        "label": "Stage 2",
        "image": "/images/dreamscape/office-2.webp"
      },
      {
        "id": "office-3",
        "label": "Stage 3",
        "image": "/images/dreamscape/office-3.webp"
      },
      {
        "id": "office-4",
        "label": "Stage 4",
        "image": "/images/dreamscape/office-4.webp"
      },
      {
        "id": "office-5",
        "label": "Stage 5",
        "image": "/images/dreamscape/office-5.webp"
      },
      {
        "id": "office-6",
        "label": "Stage 6",
        "image": "/images/dreamscape/office-6.webp"
      },
      {
        "id": "office-7",
        "label": "Stage 7",
        "image": "/images/dreamscape/office-7.webp"
      },
      {
        "id": "office-8",
        "label": "Stage 8",
        "image": "/images/dreamscape/office-8.webp"
      },
      {
        "id": "office-9",
        "label": "Stage 9",
        "image": "/images/dreamscape/office-9.webp"
      },
      {
        "id": "office-10",
        "label": "Stage 10",
        "image": "/images/dreamscape/office-10.webp"
      },
      {
        "id": "office-11",
        "label": "Stage 11",
        "image": "/images/dreamscape/office-11.webp"
      },
      {
        "id": "office-12",
        "label": "Stage 12",
        "image": "/images/dreamscape/office-12.webp"
      },
      {
        "id": "office-13",
        "label": "Stage 13",
        "image": "/images/dreamscape/office-13.webp"
      }
    ]
  }
];
