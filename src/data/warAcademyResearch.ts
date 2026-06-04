export type WarAcademyTroop = "infantry" | "marksman" | "lancer";
export type WarAcademyBranchKey = "capacity" | "lethality" | "health" | "rally" | "defense" | "attack" | "helios" | "firstAid" | "healing" | "training";

export type WarAcademyCost = { meat: number; wood: number; coal: number; iron: number; steel: number; shards: number };
export type WarAcademyLevel = { level: number; cost: WarAcademyCost; seconds: number; power: number; bonus: string };
export type WarAcademyBranch = { troop: WarAcademyTroop; key: WarAcademyBranchKey; name: string; slug: string; maxLevel: number; levels: WarAcademyLevel[] };

export const warAcademySources = {
  wikiResearch: "https://www.whiteoutsurvival.wiki/research/",
  warAcademyBuilding: "https://www.whiteoutsurvival.wiki/buildings/war-academy/",
  scrapedAt: "2026-06-04",
} as const;

export const warAcademyBranches: WarAcademyBranch[] = [
  {
    "troop": "infantry",
    "key": "capacity",
    "name": "Flame Squad",
    "slug": "flame-squad-2",
    "maxLevel": 5,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 300000,
          "wood": 300000,
          "coal": 60000,
          "iron": 15000,
          "steel": 5000,
          "shards": 16
        },
        "seconds": 28800,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 2,
        "cost": {
          "meat": 480000,
          "wood": 480000,
          "coal": 96000,
          "iron": 24000,
          "steel": 8000,
          "shards": 25
        },
        "seconds": 46080,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 3,
        "cost": {
          "meat": 780000,
          "wood": 780000,
          "coal": 150000,
          "iron": 39000,
          "steel": 13000,
          "shards": 41
        },
        "seconds": 74880,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 64000,
          "steel": 21000,
          "shards": 68
        },
        "seconds": 123840,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2000000,
          "wood": 2000000,
          "coal": 400000,
          "iron": 100000,
          "steel": 33000,
          "shards": 108
        },
        "seconds": 194400,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      }
    ]
  },
  {
    "troop": "infantry",
    "key": "lethality",
    "name": "Flame Strike",
    "slug": "flame-strike",
    "maxLevel": 8,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 800000,
          "wood": 800000,
          "coal": 160000,
          "iron": 40000,
          "steel": 10000,
          "shards": 40
        },
        "seconds": 72000,
        "power": 82500,
        "bonus": "Infantry Lethality: 1.50%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1100000,
          "wood": 1100000,
          "coal": 220000,
          "iron": 56000,
          "steel": 14000,
          "shards": 56
        },
        "seconds": 100800,
        "power": 74250,
        "bonus": "Infantry Lethality: 1.50%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1400000,
          "wood": 1400000,
          "coal": 290000,
          "iron": 74000,
          "steel": 18000,
          "shards": 74
        },
        "seconds": 133200,
        "power": 90750,
        "bonus": "Infantry Lethality: 3.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 2000000,
          "wood": 2000000,
          "coal": 400000,
          "iron": 100000,
          "steel": 25000,
          "shards": 102
        },
        "seconds": 183600,
        "power": 99000,
        "bonus": "Infantry Lethality: 3.00%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2700000,
          "wood": 2700000,
          "coal": 540000,
          "iron": 130000,
          "steel": 34000,
          "shards": 136
        },
        "seconds": 244800,
        "power": 95700,
        "bonus": "Infantry Lethality: 3.00%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 3600000,
          "wood": 3600000,
          "coal": 730000,
          "iron": 180000,
          "steel": 46000,
          "shards": 184
        },
        "seconds": 331200,
        "power": 98175,
        "bonus": "Infantry Lethality: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 4900000,
          "wood": 4900000,
          "coal": 990000,
          "iron": 240000,
          "steel": 62000,
          "shards": 248
        },
        "seconds": 446400,
        "power": 122925,
        "bonus": "Infantry Lethality: 5.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 6600000,
          "wood": 6600000,
          "coal": 1300000,
          "iron": 330000,
          "steel": 83000,
          "shards": 334
        },
        "seconds": 601200,
        "power": 120450,
        "bonus": "Infantry Lethality: 5.00%"
      }
    ]
  },
  {
    "troop": "infantry",
    "key": "health",
    "name": "Flame Shield",
    "slug": "flame-shield",
    "maxLevel": 8,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 800000,
          "wood": 800000,
          "coal": 160000,
          "iron": 40000,
          "steel": 10000,
          "shards": 40
        },
        "seconds": 72000,
        "power": 82500,
        "bonus": "Infantry Health: 1.50%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1100000,
          "wood": 1100000,
          "coal": 220000,
          "iron": 56000,
          "steel": 14000,
          "shards": 56
        },
        "seconds": 100800,
        "power": 74250,
        "bonus": "Infantry Health: 1.50%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1400000,
          "wood": 1400000,
          "coal": 290000,
          "iron": 74000,
          "steel": 18000,
          "shards": 74
        },
        "seconds": 133200,
        "power": 90750,
        "bonus": "Infantry Health: 3.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 2000000,
          "wood": 2000000,
          "coal": 400000,
          "iron": 100000,
          "steel": 25000,
          "shards": 102
        },
        "seconds": 183600,
        "power": 99000,
        "bonus": "Infantry Health: 3.00%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2700000,
          "wood": 2700000,
          "coal": 540000,
          "iron": 130000,
          "steel": 34000,
          "shards": 136
        },
        "seconds": 244800,
        "power": 95700,
        "bonus": "Infantry Health: 3.00%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 3600000,
          "wood": 3600000,
          "coal": 730000,
          "iron": 180000,
          "steel": 46000,
          "shards": 184
        },
        "seconds": 331200,
        "power": 98175,
        "bonus": "Infantry Health: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 4900000,
          "wood": 4900000,
          "coal": 990000,
          "iron": 240000,
          "steel": 62000,
          "shards": 248
        },
        "seconds": 446400,
        "power": 122925,
        "bonus": "Infantry Health: 5.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 6600000,
          "wood": 6600000,
          "coal": 1300000,
          "iron": 330000,
          "steel": 83000,
          "shards": 334
        },
        "seconds": 601200,
        "power": 120450,
        "bonus": "Infantry Health: 5.00%"
      }
    ]
  },
  {
    "troop": "infantry",
    "key": "rally",
    "name": "Flame Legion",
    "slug": "flame-legion-2",
    "maxLevel": 12,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 1000000,
          "wood": 1000000,
          "coal": 210000,
          "iron": 54000,
          "steel": 23000,
          "shards": 83
        },
        "seconds": 105617,
        "power": 150000,
        "bonus": "Troops Deployment Capacity: 1500"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1300000,
          "wood": 1300000,
          "coal": 260000,
          "iron": 66000,
          "steel": 28000,
          "shards": 102
        },
        "seconds": 129908,
        "power": 135000,
        "bonus": "Troops Deployment Capacity: 1500"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1600000,
          "wood": 1600000,
          "coal": 320000,
          "iron": 81000,
          "steel": 34000,
          "shards": 125
        },
        "seconds": 158425,
        "power": 175000,
        "bonus": "Troops Deployment Capacity: 2000"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1900000,
          "wood": 1900000,
          "coal": 390000,
          "iron": 97000,
          "steel": 41000,
          "shards": 150
        },
        "seconds": 190110,
        "power": 135000,
        "bonus": "Troops Deployment Capacity: 2000"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 470000,
          "iron": 110000,
          "steel": 51000,
          "shards": 184
        },
        "seconds": 232357,
        "power": 174500,
        "bonus": "Troops Deployment Capacity: 2500"
      },
      {
        "level": 6,
        "cost": {
          "meat": 2900000,
          "wood": 2900000,
          "coal": 580000,
          "iron": 140000,
          "steel": 62000,
          "shards": 225
        },
        "seconds": 285165,
        "power": 142500,
        "bonus": "Troops Deployment Capacity: 2500"
      },
      {
        "level": 7,
        "cost": {
          "meat": 3500000,
          "wood": 3500000,
          "coal": 710000,
          "iron": 170000,
          "steel": 76000,
          "shards": 276
        },
        "seconds": 348536,
        "power": 146500,
        "bonus": "Troops Deployment Capacity: 2500"
      },
      {
        "level": 8,
        "cost": {
          "meat": 4300000,
          "wood": 4300000,
          "coal": 860000,
          "iron": 210000,
          "steel": 93000,
          "shards": 334
        },
        "seconds": 422468,
        "power": 184000,
        "bonus": "Troops Deployment Capacity: 3000"
      },
      {
        "level": 9,
        "cost": {
          "meat": 5400000,
          "wood": 5400000,
          "coal": 1000000,
          "iron": 270000,
          "steel": 110000,
          "shards": 418
        },
        "seconds": 528085,
        "power": 122500,
        "bonus": "Troops Deployment Capacity: 3500"
      },
      {
        "level": 10,
        "cost": {
          "meat": 6500000,
          "wood": 6500000,
          "coal": 1300000,
          "iron": 320000,
          "steel": 130000,
          "shards": 502
        },
        "seconds": 633702,
        "power": 160000,
        "bonus": "Troops Deployment Capacity: 4000"
      },
      {
        "level": 11,
        "cost": {
          "meat": 7800000,
          "wood": 7800000,
          "coal": 1500000,
          "iron": 390000,
          "steel": 160000,
          "shards": 602
        },
        "seconds": 760442,
        "power": 157000,
        "bonus": "Troops Deployment Capacity: 4000"
      },
      {
        "level": 12,
        "cost": {
          "meat": 9600000,
          "wood": 9600000,
          "coal": 1900000,
          "iron": 480000,
          "steel": 200000,
          "shards": 744
        },
        "seconds": 939991,
        "power": 194000,
        "bonus": "Troops Deployment Capacity: 4500"
      }
    ]
  },
  {
    "troop": "infantry",
    "key": "defense",
    "name": "Flame Protection",
    "slug": "flame-protection",
    "maxLevel": 12,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 700000,
          "wood": 700000,
          "coal": 140000,
          "iron": 35000,
          "steel": 15000,
          "shards": 54
        },
        "seconds": 68140,
        "power": 120000,
        "bonus": "Infantry Defense: 2.00%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 860000,
          "wood": 860000,
          "coal": 170000,
          "iron": 43000,
          "steel": 18000,
          "shards": 66
        },
        "seconds": 83812,
        "power": 108000,
        "bonus": "Infantry Defense: 2.00%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1000000,
          "wood": 1000000,
          "coal": 210000,
          "iron": 52000,
          "steel": 22000,
          "shards": 81
        },
        "seconds": 102210,
        "power": 103200,
        "bonus": "Infantry Defense: 2.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 63000,
          "steel": 27000,
          "shards": 97
        },
        "seconds": 122652,
        "power": 103200,
        "bonus": "Infantry Defense: 2.50%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 1500000,
          "wood": 1500000,
          "coal": 300000,
          "iron": 77000,
          "steel": 33000,
          "shards": 118
        },
        "seconds": 149908,
        "power": 101100,
        "bonus": "Infantry Defense: 2.50%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 1800000,
          "wood": 1800000,
          "coal": 370000,
          "iron": 94000,
          "steel": 40000,
          "shards": 145
        },
        "seconds": 183978,
        "power": 103800,
        "bonus": "Infantry Defense: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 460000,
          "iron": 110000,
          "steel": 49000,
          "shards": 178
        },
        "seconds": 224862,
        "power": 106200,
        "bonus": "Infantry Defense: 3.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 2800000,
          "wood": 2800000,
          "coal": 560000,
          "iron": 140000,
          "steel": 60000,
          "shards": 216
        },
        "seconds": 272540,
        "power": 107400,
        "bonus": "Infantry Defense: 3.00%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 3500000,
          "wood": 3500000,
          "coal": 700000,
          "iron": 170000,
          "steel": 75000,
          "shards": 270
        },
        "seconds": 340700,
        "power": 123000,
        "bonus": "Infantry Defense: 5.00%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 4200000,
          "wood": 4200000,
          "coal": 840000,
          "iron": 210000,
          "steel": 90000,
          "shards": 324
        },
        "seconds": 408840,
        "power": 123000,
        "bonus": "Infantry Defense: 5.00%"
      },
      {
        "level": 11,
        "cost": {
          "meat": 5000000,
          "wood": 5000000,
          "coal": 1000000,
          "iron": 250000,
          "steel": 100000,
          "shards": 388
        },
        "seconds": 490608,
        "power": 120000,
        "bonus": "Infantry Defense: 5.00%"
      },
      {
        "level": 12,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 130000,
          "shards": 480
        },
        "seconds": 606446,
        "power": 126000,
        "bonus": "Infantry Defense: 5.00%"
      }
    ]
  },
  {
    "troop": "infantry",
    "key": "attack",
    "name": "Flame Tomahawk",
    "slug": "flame-tomahawk",
    "maxLevel": 12,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 700000,
          "wood": 700000,
          "coal": 140000,
          "iron": 35000,
          "steel": 15000,
          "shards": 54
        },
        "seconds": 68140,
        "power": 120000,
        "bonus": "Infantry Attack: 2.00%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 860000,
          "wood": 860000,
          "coal": 170000,
          "iron": 43000,
          "steel": 18000,
          "shards": 66
        },
        "seconds": 83812,
        "power": 108000,
        "bonus": "Infantry Attack: 2.00%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1000000,
          "wood": 1000000,
          "coal": 210000,
          "iron": 52000,
          "steel": 22000,
          "shards": 81
        },
        "seconds": 102210,
        "power": 103200,
        "bonus": "Infantry Attack: 2.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 63000,
          "steel": 27000,
          "shards": 97
        },
        "seconds": 122652,
        "power": 103200,
        "bonus": "Infantry Attack: 2.50%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 1500000,
          "wood": 1500000,
          "coal": 300000,
          "iron": 77000,
          "steel": 33000,
          "shards": 118
        },
        "seconds": 149908,
        "power": 101100,
        "bonus": "Infantry Attack: 2.50%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 1800000,
          "wood": 1800000,
          "coal": 370000,
          "iron": 94000,
          "steel": 40000,
          "shards": 145
        },
        "seconds": 183978,
        "power": 103800,
        "bonus": "Infantry Attack: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 460000,
          "iron": 110000,
          "steel": 49000,
          "shards": 178
        },
        "seconds": 224862,
        "power": 106200,
        "bonus": "Infantry Attack: 3.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 2800000,
          "wood": 2800000,
          "coal": 560000,
          "iron": 140000,
          "steel": 60000,
          "shards": 216
        },
        "seconds": 272540,
        "power": 107400,
        "bonus": "Infantry Attack: 3.00%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 3500000,
          "wood": 3500000,
          "coal": 700000,
          "iron": 170000,
          "steel": 75000,
          "shards": 270
        },
        "seconds": 340700,
        "power": 123000,
        "bonus": "Infantry Attack: 5.00%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 4200000,
          "wood": 4200000,
          "coal": 840000,
          "iron": 210000,
          "steel": 90000,
          "shards": 324
        },
        "seconds": 408840,
        "power": 123000,
        "bonus": "Infantry Attack: 5.00%"
      },
      {
        "level": 11,
        "cost": {
          "meat": 5000000,
          "wood": 5000000,
          "coal": 1000000,
          "iron": 250000,
          "steel": 100000,
          "shards": 388
        },
        "seconds": 490608,
        "power": 120000,
        "bonus": "Infantry Attack: 5.00%"
      },
      {
        "level": 12,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 130000,
          "shards": 480
        },
        "seconds": 606446,
        "power": 126000,
        "bonus": "Infantry Attack: 5.00%"
      }
    ]
  },
  {
    "troop": "infantry",
    "key": "helios",
    "name": "Helios Infantry",
    "slug": "helios-infantry",
    "maxLevel": 1,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 85000000,
          "wood": 85000000,
          "coal": 17000000,
          "iron": 4200000,
          "steel": 1000000,
          "shards": 2236
        },
        "seconds": 7892100,
        "power": 8000000,
        "bonus": "Other: Unlock XI Helios Infantry"
      }
    ]
  },
  {
    "troop": "infantry",
    "key": "firstAid",
    "name": "Helios Infantry First Aid",
    "slug": "helios-infantry-first-aid",
    "maxLevel": 10,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 62000,
          "steel": 15000,
          "shards": 51
        },
        "seconds": 90000,
        "power": 137250,
        "bonus": "Helios Infantry Healing Time Reduction: 1.50% Infantry Defense: 2%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1600000,
          "wood": 1600000,
          "coal": 330000,
          "iron": 84000,
          "steel": 20000,
          "shards": 68
        },
        "seconds": 121500,
        "power": 137250,
        "bonus": "Helios Infantry Healing Time Reduction: 1.50% Infantry Defense: 2%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 460000,
          "iron": 110000,
          "steel": 27000,
          "shards": 94
        },
        "seconds": 166500,
        "power": 137250,
        "bonus": "Helios Infantry Healing Time Reduction: 1.50% Infantry Defense: 2%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 3100000,
          "wood": 3100000,
          "coal": 620000,
          "iron": 150000,
          "steel": 37000,
          "shards": 127
        },
        "seconds": 225000,
        "power": 137250,
        "bonus": "Helios Infantry Healing Time Reduction: 1.50% Infantry Defense: 2%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 4100000,
          "wood": 4100000,
          "coal": 830000,
          "iron": 200000,
          "steel": 50000,
          "shards": 170
        },
        "seconds": 301500,
        "power": 137250,
        "bonus": "Helios Infantry Healing Time Reduction: 1.50% Infantry Defense: 2%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 5600000,
          "wood": 5600000,
          "coal": 1100000,
          "iron": 280000,
          "steel": 67000,
          "shards": 229
        },
        "seconds": 405000,
        "power": 137250,
        "bonus": "Helios Infantry Healing Time Reduction: 1.50% Infantry Defense: 2%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 7500000,
          "wood": 7500000,
          "coal": 1500000,
          "iron": 370000,
          "steel": 90000,
          "shards": 306
        },
        "seconds": 540000,
        "power": 137250,
        "bonus": "Helios Infantry Healing Time Reduction: 1.50% Infantry Defense: 2%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 10000000,
          "wood": 10000000,
          "coal": 2000000,
          "iron": 510000,
          "steel": 120000,
          "shards": 418
        },
        "seconds": 738000,
        "power": 137250,
        "bonus": "Helios Infantry Healing Time Reduction: 1.50% Infantry Defense: 2%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 13000000,
          "wood": 13000000,
          "coal": 2700000,
          "iron": 680000,
          "steel": 160000,
          "shards": 561
        },
        "seconds": 990000,
        "power": 137250,
        "bonus": "Helios Infantry Healing Time Reduction: 1.50% Infantry Defense: 2%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 18000000,
          "wood": 18000000,
          "coal": 3700000,
          "iron": 930000,
          "steel": 220000,
          "shards": 765
        },
        "seconds": 1350000,
        "power": 137250,
        "bonus": "Helios Infantry Healing Time Reduction: 1.50% Infantry Defense: 2%"
      }
    ]
  },
  {
    "troop": "infantry",
    "key": "healing",
    "name": "Helios Infantry Healing",
    "slug": "helios-infantry-healing",
    "maxLevel": 10,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 2500000,
          "wood": 2500000,
          "coal": 500000,
          "iron": 120000,
          "steel": 30000,
          "shards": 102
        },
        "seconds": 180000,
        "power": 155000,
        "bonus": "Helios Infantry Healing Cost Reduction: 5% Infantry Attack: 2%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 3300000,
          "wood": 3300000,
          "coal": 670000,
          "iron": 160000,
          "steel": 40000,
          "shards": 137
        },
        "seconds": 243000,
        "power": 155000,
        "bonus": "Helios Infantry Healing Cost Reduction: 5% Infantry Attack: 2%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 4600000,
          "wood": 4600000,
          "coal": 920000,
          "iron": 230000,
          "steel": 55000,
          "shards": 188
        },
        "seconds": 333000,
        "power": 155000,
        "bonus": "Helios Infantry Healing Cost Reduction: 5% Infantry Attack: 2%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 75000,
          "shards": 255
        },
        "seconds": 450000,
        "power": 155000,
        "bonus": "Helios Infantry Healing Cost Reduction: 5% Infantry Attack: 2%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 8300000,
          "wood": 8300000,
          "coal": 1600000,
          "iron": 410000,
          "steel": 100000,
          "shards": 341
        },
        "seconds": 603000,
        "power": 155000,
        "bonus": "Helios Infantry Healing Cost Reduction: 5% Infantry Attack: 2%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 11000000,
          "wood": 11000000,
          "coal": 2200000,
          "iron": 560000,
          "steel": 130000,
          "shards": 459
        },
        "seconds": 810000,
        "power": 155000,
        "bonus": "Helios Infantry Healing Cost Reduction: 5% Infantry Attack: 2%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 15000000,
          "wood": 15000000,
          "coal": 3000000,
          "iron": 750000,
          "steel": 180000,
          "shards": 612
        },
        "seconds": 1080000,
        "power": 155000,
        "bonus": "Helios Infantry Healing Cost Reduction: 5% Infantry Attack: 2%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 20000000,
          "wood": 20000000,
          "coal": 4100000,
          "iron": 1000000,
          "steel": 240000,
          "shards": 836
        },
        "seconds": 1476000,
        "power": 155000,
        "bonus": "Helios Infantry Healing Cost Reduction: 5% Infantry Attack: 2%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 27000000,
          "wood": 27000000,
          "coal": 5500000,
          "iron": 1300000,
          "steel": 330000,
          "shards": 1122
        },
        "seconds": 1980000,
        "power": 155000,
        "bonus": "Helios Infantry Healing Cost Reduction: 5% Infantry Attack: 2%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 37000000,
          "wood": 37000000,
          "coal": 7500000,
          "iron": 1800000,
          "steel": 450000,
          "shards": 1500
        },
        "seconds": 2700000,
        "power": 155000,
        "bonus": "Helios Infantry Healing Cost Reduction: 5% Infantry Attack: 2%"
      }
    ]
  },
  {
    "troop": "infantry",
    "key": "training",
    "name": "Helios Infantry Training",
    "slug": "helios-infantry-training",
    "maxLevel": 10,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 2500000,
          "wood": 2500000,
          "coal": 500000,
          "iron": 120000,
          "steel": 30000,
          "shards": 102
        },
        "seconds": 180000,
        "power": 65000,
        "bonus": "Helios Infantry Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 2,
        "cost": {
          "meat": 3300000,
          "wood": 3300000,
          "coal": 670000,
          "iron": 160000,
          "steel": 40000,
          "shards": 137
        },
        "seconds": 243000,
        "power": 65000,
        "bonus": "Helios Infantry Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 3,
        "cost": {
          "meat": 4600000,
          "wood": 4600000,
          "coal": 920000,
          "iron": 230000,
          "steel": 55000,
          "shards": 188
        },
        "seconds": 333000,
        "power": 65000,
        "bonus": "Helios Infantry Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 4,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 75000,
          "shards": 255
        },
        "seconds": 450000,
        "power": 65000,
        "bonus": "Helios Infantry Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 5,
        "cost": {
          "meat": 8300000,
          "wood": 8300000,
          "coal": 1600000,
          "iron": 410000,
          "steel": 100000,
          "shards": 341
        },
        "seconds": 603000,
        "power": 65000,
        "bonus": "Helios Infantry Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 6,
        "cost": {
          "meat": 11000000,
          "wood": 11000000,
          "coal": 2200000,
          "iron": 560000,
          "steel": 130000,
          "shards": 459
        },
        "seconds": 810000,
        "power": 65000,
        "bonus": "Helios Infantry Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 7,
        "cost": {
          "meat": 15000000,
          "wood": 15000000,
          "coal": 3000000,
          "iron": 750000,
          "steel": 180000,
          "shards": 612
        },
        "seconds": 1080000,
        "power": 65000,
        "bonus": "Helios Infantry Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 8,
        "cost": {
          "meat": 20000000,
          "wood": 20000000,
          "coal": 4100000,
          "iron": 1000000,
          "steel": 240000,
          "shards": 836
        },
        "seconds": 1476000,
        "power": 65000,
        "bonus": "Helios Infantry Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 9,
        "cost": {
          "meat": 27000000,
          "wood": 27000000,
          "coal": 5500000,
          "iron": 1300000,
          "steel": 330000,
          "shards": 1122
        },
        "seconds": 1980000,
        "power": 65000,
        "bonus": "Helios Infantry Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 10,
        "cost": {
          "meat": 37000000,
          "wood": 37000000,
          "coal": 7500000,
          "iron": 1800000,
          "steel": 450000,
          "shards": 1500
        },
        "seconds": 2700000,
        "power": 65000,
        "bonus": "Helios Infantry Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      }
    ]
  },
  {
    "troop": "marksman",
    "key": "capacity",
    "name": "Flame Squad",
    "slug": "flame-squad-4",
    "maxLevel": 5,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 300000,
          "wood": 300000,
          "coal": 60000,
          "iron": 15000,
          "steel": 5000,
          "shards": 16
        },
        "seconds": 28800,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 2,
        "cost": {
          "meat": 480000,
          "wood": 480000,
          "coal": 96000,
          "iron": 24000,
          "steel": 8000,
          "shards": 25
        },
        "seconds": 46080,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 3,
        "cost": {
          "meat": 780000,
          "wood": 780000,
          "coal": 150000,
          "iron": 39000,
          "steel": 13000,
          "shards": 41
        },
        "seconds": 74880,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 64000,
          "steel": 21000,
          "shards": 68
        },
        "seconds": 123840,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2000000,
          "wood": 2000000,
          "coal": 400000,
          "iron": 100000,
          "steel": 33000,
          "shards": 108
        },
        "seconds": 194400,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      }
    ]
  },
  {
    "troop": "marksman",
    "key": "lethality",
    "name": "Crystal Vision",
    "slug": "crystal-vision",
    "maxLevel": 8,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 800000,
          "wood": 800000,
          "coal": 160000,
          "iron": 40000,
          "steel": 10000,
          "shards": 40
        },
        "seconds": 72000,
        "power": 82500,
        "bonus": "Marksman Lethality: 1.50%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1100000,
          "wood": 1100000,
          "coal": 220000,
          "iron": 56000,
          "steel": 14000,
          "shards": 56
        },
        "seconds": 100800,
        "power": 74250,
        "bonus": "Marksman Lethality: 1.50%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1400000,
          "wood": 1400000,
          "coal": 290000,
          "iron": 74000,
          "steel": 18000,
          "shards": 74
        },
        "seconds": 133200,
        "power": 90750,
        "bonus": "Marksman Lethality: 3.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 2000000,
          "wood": 2000000,
          "coal": 400000,
          "iron": 100000,
          "steel": 25000,
          "shards": 102
        },
        "seconds": 183600,
        "power": 99000,
        "bonus": "Marksman Lethality: 3.00%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2700000,
          "wood": 2700000,
          "coal": 540000,
          "iron": 130000,
          "steel": 34000,
          "shards": 136
        },
        "seconds": 244800,
        "power": 95700,
        "bonus": "Marksman Lethality: 3.00%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 3600000,
          "wood": 3600000,
          "coal": 730000,
          "iron": 180000,
          "steel": 46000,
          "shards": 184
        },
        "seconds": 331200,
        "power": 98175,
        "bonus": "Marksman Lethality: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 4900000,
          "wood": 4900000,
          "coal": 990000,
          "iron": 240000,
          "steel": 62000,
          "shards": 248
        },
        "seconds": 446400,
        "power": 122925,
        "bonus": "Marksman Lethality: 5.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 6600000,
          "wood": 6600000,
          "coal": 1300000,
          "iron": 330000,
          "steel": 83000,
          "shards": 334
        },
        "seconds": 601200,
        "power": 120450,
        "bonus": "Marksman Lethality: 5.00%"
      }
    ]
  },
  {
    "troop": "marksman",
    "key": "health",
    "name": "Crystal Armor",
    "slug": "crystal-armor",
    "maxLevel": 8,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 800000,
          "wood": 800000,
          "coal": 160000,
          "iron": 40000,
          "steel": 10000,
          "shards": 40
        },
        "seconds": 72000,
        "power": 82500,
        "bonus": "Marksman Health: 1.50%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1100000,
          "wood": 1100000,
          "coal": 220000,
          "iron": 56000,
          "steel": 14000,
          "shards": 56
        },
        "seconds": 100800,
        "power": 74250,
        "bonus": "Marksman Health: 1.50%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1400000,
          "wood": 1400000,
          "coal": 290000,
          "iron": 74000,
          "steel": 18000,
          "shards": 74
        },
        "seconds": 133200,
        "power": 90750,
        "bonus": "Marksman Health: 3.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 2000000,
          "wood": 2000000,
          "coal": 400000,
          "iron": 100000,
          "steel": 25000,
          "shards": 102
        },
        "seconds": 183600,
        "power": 99000,
        "bonus": "Marksman Health: 3.00%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2700000,
          "wood": 2700000,
          "coal": 540000,
          "iron": 130000,
          "steel": 34000,
          "shards": 136
        },
        "seconds": 244800,
        "power": 95700,
        "bonus": "Marksman Health: 3.00%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 3600000,
          "wood": 3600000,
          "coal": 730000,
          "iron": 180000,
          "steel": 46000,
          "shards": 184
        },
        "seconds": 331200,
        "power": 98175,
        "bonus": "Marksman Health: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 4900000,
          "wood": 4900000,
          "coal": 990000,
          "iron": 240000,
          "steel": 62000,
          "shards": 248
        },
        "seconds": 446400,
        "power": 122925,
        "bonus": "Marksman Health: 5.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 6600000,
          "wood": 6600000,
          "coal": 1300000,
          "iron": 330000,
          "steel": 83000,
          "shards": 334
        },
        "seconds": 601200,
        "power": 120450,
        "bonus": "Marksman Health: 5.00%"
      }
    ]
  },
  {
    "troop": "marksman",
    "key": "rally",
    "name": "Flame Legion",
    "slug": "flame-legion",
    "maxLevel": 12,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 1000000,
          "wood": 1000000,
          "coal": 210000,
          "iron": 54000,
          "steel": 23000,
          "shards": 83
        },
        "seconds": 105617,
        "power": 150000,
        "bonus": "Troops Deployment Capacity: 1500"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1300000,
          "wood": 1300000,
          "coal": 260000,
          "iron": 66000,
          "steel": 28000,
          "shards": 102
        },
        "seconds": 129908,
        "power": 135000,
        "bonus": "Troops Deployment Capacity: 1500"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1600000,
          "wood": 1600000,
          "coal": 320000,
          "iron": 81000,
          "steel": 34000,
          "shards": 125
        },
        "seconds": 158425,
        "power": 175000,
        "bonus": "Troops Deployment Capacity: 2000"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1900000,
          "wood": 1900000,
          "coal": 390000,
          "iron": 97000,
          "steel": 41000,
          "shards": 150
        },
        "seconds": 190110,
        "power": 135000,
        "bonus": "Troops Deployment Capacity: 2000"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 470000,
          "iron": 110000,
          "steel": 51000,
          "shards": 184
        },
        "seconds": 232357,
        "power": 174500,
        "bonus": "Troops Deployment Capacity: 2500"
      },
      {
        "level": 6,
        "cost": {
          "meat": 2900000,
          "wood": 2900000,
          "coal": 580000,
          "iron": 140000,
          "steel": 62000,
          "shards": 225
        },
        "seconds": 285165,
        "power": 142500,
        "bonus": "Troops Deployment Capacity: 2500"
      },
      {
        "level": 7,
        "cost": {
          "meat": 3500000,
          "wood": 3500000,
          "coal": 710000,
          "iron": 170000,
          "steel": 76000,
          "shards": 276
        },
        "seconds": 348536,
        "power": 146500,
        "bonus": "Troops Deployment Capacity: 2500"
      },
      {
        "level": 8,
        "cost": {
          "meat": 4300000,
          "wood": 4300000,
          "coal": 860000,
          "iron": 210000,
          "steel": 93000,
          "shards": 334
        },
        "seconds": 422468,
        "power": 184000,
        "bonus": "Troops Deployment Capacity: 3000"
      },
      {
        "level": 9,
        "cost": {
          "meat": 5400000,
          "wood": 5400000,
          "coal": 1000000,
          "iron": 270000,
          "steel": 110000,
          "shards": 418
        },
        "seconds": 528085,
        "power": 122500,
        "bonus": "Troops Deployment Capacity: 3500"
      },
      {
        "level": 10,
        "cost": {
          "meat": 6500000,
          "wood": 6500000,
          "coal": 1300000,
          "iron": 320000,
          "steel": 130000,
          "shards": 502
        },
        "seconds": 633702,
        "power": 160000,
        "bonus": "Troops Deployment Capacity: 4000"
      },
      {
        "level": 11,
        "cost": {
          "meat": 7800000,
          "wood": 7800000,
          "coal": 1500000,
          "iron": 390000,
          "steel": 160000,
          "shards": 602
        },
        "seconds": 760442,
        "power": 157000,
        "bonus": "Troops Deployment Capacity: 4000"
      },
      {
        "level": 12,
        "cost": {
          "meat": 9600000,
          "wood": 9600000,
          "coal": 1900000,
          "iron": 480000,
          "steel": 200000,
          "shards": 744
        },
        "seconds": 939991,
        "power": 194000,
        "bonus": "Troops Deployment Capacity: 4500"
      }
    ]
  },
  {
    "troop": "marksman",
    "key": "defense",
    "name": "Crystal Protection",
    "slug": "crystal-protection",
    "maxLevel": 12,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 700000,
          "wood": 700000,
          "coal": 140000,
          "iron": 35000,
          "steel": 15000,
          "shards": 54
        },
        "seconds": 68140,
        "power": 120000,
        "bonus": "Marksman Defense: 2.00%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 860000,
          "wood": 860000,
          "coal": 170000,
          "iron": 43000,
          "steel": 18000,
          "shards": 66
        },
        "seconds": 83812,
        "power": 108000,
        "bonus": "Marksman Defense: 2.00%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1000000,
          "wood": 1000000,
          "coal": 210000,
          "iron": 52000,
          "steel": 22000,
          "shards": 81
        },
        "seconds": 102210,
        "power": 103200,
        "bonus": "Marksman Defense: 2.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 63000,
          "steel": 27000,
          "shards": 97
        },
        "seconds": 122652,
        "power": 103200,
        "bonus": "Marksman Defense: 2.50%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 1500000,
          "wood": 1500000,
          "coal": 300000,
          "iron": 77000,
          "steel": 33000,
          "shards": 118
        },
        "seconds": 149908,
        "power": 101100,
        "bonus": "Marksman Defense: 2.50%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 1800000,
          "wood": 1800000,
          "coal": 370000,
          "iron": 94000,
          "steel": 40000,
          "shards": 145
        },
        "seconds": 183978,
        "power": 103800,
        "bonus": "Marksman Defense: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 460000,
          "iron": 110000,
          "steel": 49000,
          "shards": 178
        },
        "seconds": 224862,
        "power": 106200,
        "bonus": "Marksman Defense: 3.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 2800000,
          "wood": 2800000,
          "coal": 560000,
          "iron": 140000,
          "steel": 60000,
          "shards": 216
        },
        "seconds": 272540,
        "power": 107400,
        "bonus": "Marksman Defense: 3.00%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 3500000,
          "wood": 3500000,
          "coal": 700000,
          "iron": 170000,
          "steel": 75000,
          "shards": 270
        },
        "seconds": 340700,
        "power": 123000,
        "bonus": "Marksman Defense: 5.00%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 4200000,
          "wood": 4200000,
          "coal": 840000,
          "iron": 210000,
          "steel": 90000,
          "shards": 324
        },
        "seconds": 408840,
        "power": 123000,
        "bonus": "Marksman Defense: 5.00%"
      },
      {
        "level": 11,
        "cost": {
          "meat": 5000000,
          "wood": 5000000,
          "coal": 1000000,
          "iron": 250000,
          "steel": 100000,
          "shards": 388
        },
        "seconds": 490608,
        "power": 120000,
        "bonus": "Marksman Defense: 5.00%"
      },
      {
        "level": 12,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 130000,
          "shards": 480
        },
        "seconds": 606446,
        "power": 126000,
        "bonus": "Marksman Defense: 5.00%"
      }
    ]
  },
  {
    "troop": "marksman",
    "key": "attack",
    "name": "Crystal Arrow",
    "slug": "crystal-arrow",
    "maxLevel": 12,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 700000,
          "wood": 700000,
          "coal": 140000,
          "iron": 35000,
          "steel": 15000,
          "shards": 54
        },
        "seconds": 68140,
        "power": 120000,
        "bonus": "Marksman Attack: 2.00%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 860000,
          "wood": 860000,
          "coal": 170000,
          "iron": 43000,
          "steel": 18000,
          "shards": 66
        },
        "seconds": 83812,
        "power": 108000,
        "bonus": "Marksman Attack: 2.00%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1000000,
          "wood": 1000000,
          "coal": 210000,
          "iron": 52000,
          "steel": 22000,
          "shards": 81
        },
        "seconds": 102210,
        "power": 103200,
        "bonus": "Marksman Attack: 2.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 63000,
          "steel": 27000,
          "shards": 97
        },
        "seconds": 122652,
        "power": 103200,
        "bonus": "Marksman Attack: 2.50%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 1500000,
          "wood": 1500000,
          "coal": 300000,
          "iron": 77000,
          "steel": 33000,
          "shards": 118
        },
        "seconds": 149908,
        "power": 101100,
        "bonus": "Marksman Attack: 2.50%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 1800000,
          "wood": 1800000,
          "coal": 370000,
          "iron": 94000,
          "steel": 40000,
          "shards": 145
        },
        "seconds": 183978,
        "power": 103800,
        "bonus": "Marksman Attack: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 460000,
          "iron": 110000,
          "steel": 49000,
          "shards": 178
        },
        "seconds": 224862,
        "power": 106200,
        "bonus": "Marksman Attack: 3.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 2800000,
          "wood": 2800000,
          "coal": 560000,
          "iron": 140000,
          "steel": 60000,
          "shards": 216
        },
        "seconds": 272540,
        "power": 107400,
        "bonus": "Marksman Attack: 3.00%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 3500000,
          "wood": 3500000,
          "coal": 700000,
          "iron": 170000,
          "steel": 75000,
          "shards": 270
        },
        "seconds": 340700,
        "power": 123000,
        "bonus": "Marksman Attack: 5.00%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 4200000,
          "wood": 4200000,
          "coal": 840000,
          "iron": 210000,
          "steel": 90000,
          "shards": 324
        },
        "seconds": 408840,
        "power": 123000,
        "bonus": "Marksman Attack: 5.00%"
      },
      {
        "level": 11,
        "cost": {
          "meat": 5000000,
          "wood": 5000000,
          "coal": 1000000,
          "iron": 250000,
          "steel": 100000,
          "shards": 388
        },
        "seconds": 490608,
        "power": 120000,
        "bonus": "Marksman Attack: 5.00%"
      },
      {
        "level": 12,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 130000,
          "shards": 480
        },
        "seconds": 606446,
        "power": 126000,
        "bonus": "Marksman Attack: 5.00%"
      }
    ]
  },
  {
    "troop": "marksman",
    "key": "helios",
    "name": "Helios Marksman",
    "slug": "helios-marksman",
    "maxLevel": 1,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 85000000,
          "wood": 85000000,
          "coal": 17000000,
          "iron": 4200000,
          "steel": 1000000,
          "shards": 2236
        },
        "seconds": 7892100,
        "power": 8000000,
        "bonus": "Other: Unlock XI Helios Marksmen"
      }
    ]
  },
  {
    "troop": "marksman",
    "key": "firstAid",
    "name": "Helios Marksman First Aid",
    "slug": "helios-marksman-first-aid",
    "maxLevel": 10,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 62000,
          "steel": 15000,
          "shards": 51
        },
        "seconds": 90000,
        "power": 137250,
        "bonus": "Helios Marksman Healing Time Reduction: 1.50% Marksman Defense: 2%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1600000,
          "wood": 1600000,
          "coal": 330000,
          "iron": 84000,
          "steel": 20000,
          "shards": 68
        },
        "seconds": 121500,
        "power": 137250,
        "bonus": "Helios Marksman Healing Time Reduction: 1.50% Marksman Defense: 2%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 460000,
          "iron": 110000,
          "steel": 270000,
          "shards": 94
        },
        "seconds": 166500,
        "power": 137250,
        "bonus": "Helios Marksman Healing Time Reduction: 1.50% Marksman Defense: 2%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 3100000,
          "wood": 3100000,
          "coal": 620000,
          "iron": 150000,
          "steel": 37000,
          "shards": 127
        },
        "seconds": 225000,
        "power": 137250,
        "bonus": "Helios Marksman Healing Time Reduction: 1.50% Marksman Defense: 2%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 4100000,
          "wood": 4100000,
          "coal": 830000,
          "iron": 200000,
          "steel": 50000,
          "shards": 170
        },
        "seconds": 301500,
        "power": 137250,
        "bonus": "Helios Marksman Healing Cost Reduction: 1.50% Marksman Defense: 2%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 5600000,
          "wood": 5600000,
          "coal": 1100000,
          "iron": 280000,
          "steel": 67000,
          "shards": 229
        },
        "seconds": 405000,
        "power": 137250,
        "bonus": "Helios Marksman Healing Time Reduction: 1.50% Marksman Defense: 2%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 7500000,
          "wood": 7500000,
          "coal": 1500000,
          "iron": 370000,
          "steel": 90000,
          "shards": 306
        },
        "seconds": 540000,
        "power": 137250,
        "bonus": "Helios Marksman Healing Time Reduction: 1.50% Marksman Defense: 2%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 10000000,
          "wood": 10000000,
          "coal": 2000000,
          "iron": 510000,
          "steel": 120000,
          "shards": 418
        },
        "seconds": 738000,
        "power": 137250,
        "bonus": "Helios Marksman Healing Time Reduction: 1.50% Marksman Defense: 2%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 13000000,
          "wood": 13000000,
          "coal": 2700000,
          "iron": 680000,
          "steel": 160000,
          "shards": 561
        },
        "seconds": 990000,
        "power": 137250,
        "bonus": "Helios Marksman Healing Time Reduction: 1.50% Marksman Defense: 2%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 18000000,
          "wood": 18000000,
          "coal": 3700000,
          "iron": 930000,
          "steel": 220000,
          "shards": 765
        },
        "seconds": 1350000,
        "power": 137250,
        "bonus": "Helios Marksman Healing Time Reduction: 1.50% Marksman Defense: 2%"
      }
    ]
  },
  {
    "troop": "marksman",
    "key": "healing",
    "name": "Helios Marksman Healing",
    "slug": "helios-marksman-healing",
    "maxLevel": 10,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 2500000,
          "wood": 2500000,
          "coal": 500000,
          "iron": 120000,
          "steel": 30000,
          "shards": 102
        },
        "seconds": 180000,
        "power": 155000,
        "bonus": "Helios Marksman Healing Cost Reduction: 5% Marksman Attack: 2%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 3300000,
          "wood": 3300000,
          "coal": 670000,
          "iron": 160000,
          "steel": 40000,
          "shards": 137
        },
        "seconds": 243000,
        "power": 155000,
        "bonus": "Helios Marksman Healing Cost Reduction: 5% Marksman Attack: 2%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 4600000,
          "wood": 4600000,
          "coal": 920000,
          "iron": 230000,
          "steel": 55000,
          "shards": 188
        },
        "seconds": 333000,
        "power": 155000,
        "bonus": "Helios Marksman Healing Cost Reduction: 5% Marksman Attack: 2%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 75000,
          "shards": 255
        },
        "seconds": 450000,
        "power": 155000,
        "bonus": "Helios Marksman Healing Cost Reduction: 5% Marksman Attack: 2%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 8300000,
          "wood": 8300000,
          "coal": 1600000,
          "iron": 410000,
          "steel": 100000,
          "shards": 341
        },
        "seconds": 603000,
        "power": 155000,
        "bonus": "Helios Marksman Healing Cost Reduction: 5% Marksman Attack: 2%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 11000000,
          "wood": 11000000,
          "coal": 2200000,
          "iron": 560000,
          "steel": 130000,
          "shards": 459
        },
        "seconds": 810000,
        "power": 155000,
        "bonus": "Helios Marksman Healing Cost Reduction: 5% Marksman Attack: 2%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 15000000,
          "wood": 15000000,
          "coal": 3000000,
          "iron": 750000,
          "steel": 180000,
          "shards": 612
        },
        "seconds": 1080000,
        "power": 155000,
        "bonus": "Helios Marksman Healing Cost Reduction: 5% Marksman Attack: 2%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 20000000,
          "wood": 20000000,
          "coal": 4100000,
          "iron": 1000000,
          "steel": 240000,
          "shards": 836
        },
        "seconds": 1476000,
        "power": 155000,
        "bonus": "Helios Marksman Healing Cost Reduction: 5% Marksman Attack: 2%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 27000000,
          "wood": 27000000,
          "coal": 5500000,
          "iron": 1300000,
          "steel": 330000,
          "shards": 1122
        },
        "seconds": 1980000,
        "power": 155000,
        "bonus": "Helios Marksman Healing Cost Reduction: 5% Marksman Attack: 2%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 37000000,
          "wood": 37000000,
          "coal": 7500000,
          "iron": 1800000,
          "steel": 450000,
          "shards": 1500
        },
        "seconds": 2700000,
        "power": 155000,
        "bonus": "Helios Marksman Healing Cost Reduction: 5% Marksman Attack: 2%"
      }
    ]
  },
  {
    "troop": "marksman",
    "key": "training",
    "name": "Helios Marksman Training",
    "slug": "helios-marksman-training",
    "maxLevel": 10,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 2500000,
          "wood": 2500000,
          "coal": 500000,
          "iron": 120000,
          "steel": 30000,
          "shards": 102
        },
        "seconds": 180000,
        "power": 65000,
        "bonus": "Helios Marksman Training Cost Reduction: 5.00% Troops Deployment Capacity: 100"
      },
      {
        "level": 2,
        "cost": {
          "meat": 3300000,
          "wood": 3300000,
          "coal": 670000,
          "iron": 160000,
          "steel": 40000,
          "shards": 137
        },
        "seconds": 243000,
        "power": 65000,
        "bonus": "Helios Marksman Training Cost Reduction: 5.00% Troops Deployment Capacity: 100"
      },
      {
        "level": 3,
        "cost": {
          "meat": 4600000,
          "wood": 4600000,
          "coal": 920000,
          "iron": 230000,
          "steel": 55000,
          "shards": 188
        },
        "seconds": 333000,
        "power": 65000,
        "bonus": "Helios Marksman Training Cost Reduction: 5.00% Troops Deployment Capacity: 100"
      },
      {
        "level": 4,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 75000,
          "shards": 255
        },
        "seconds": 450000,
        "power": 65000,
        "bonus": "Helios Marksman Training Cost Reduction: 5.00% Troops Deployment Capacity: 100"
      },
      {
        "level": 5,
        "cost": {
          "meat": 8300000,
          "wood": 8300000,
          "coal": 1600000,
          "iron": 410000,
          "steel": 100000,
          "shards": 341
        },
        "seconds": 603000,
        "power": 65000,
        "bonus": "Helios Marksman Training Cost Reduction: 5.00% Troops Deployment Capacity: 100"
      },
      {
        "level": 6,
        "cost": {
          "meat": 11000000,
          "wood": 11000000,
          "coal": 2200000,
          "iron": 560000,
          "steel": 130000,
          "shards": 459
        },
        "seconds": 810000,
        "power": 65000,
        "bonus": "Helios Marksman Training Cost Reduction: 5.00% Troops Deployment Capacity: 100"
      },
      {
        "level": 7,
        "cost": {
          "meat": 15000000,
          "wood": 15000000,
          "coal": 3000000,
          "iron": 750000,
          "steel": 180000,
          "shards": 612
        },
        "seconds": 1080000,
        "power": 65000,
        "bonus": "Helios Marksman Training Cost Reduction: 5.00% Troops Deployment Capacity: 100"
      },
      {
        "level": 8,
        "cost": {
          "meat": 20000000,
          "wood": 20000000,
          "coal": 4100000,
          "iron": 1000000,
          "steel": 240000,
          "shards": 836
        },
        "seconds": 1476000,
        "power": 65000,
        "bonus": "Helios Marksman Training Cost Reduction: 5.00% Troops Deployment Capacity: 100"
      },
      {
        "level": 9,
        "cost": {
          "meat": 27000000,
          "wood": 27000000,
          "coal": 5500000,
          "iron": 1300000,
          "steel": 330000,
          "shards": 1122
        },
        "seconds": 1980000,
        "power": 65000,
        "bonus": "Helios Marksman Training Cost Reduction: 5.00% Troops Deployment Capacity: 100"
      },
      {
        "level": 10,
        "cost": {
          "meat": 37000000,
          "wood": 37000000,
          "coal": 7500000,
          "iron": 1800000,
          "steel": 450000,
          "shards": 1500
        },
        "seconds": 2700000,
        "power": 65000,
        "bonus": "Helios Marksman Training Cost Reduction: 5.00% Troops Deployment Capacity: 100"
      }
    ]
  },
  {
    "troop": "lancer",
    "key": "capacity",
    "name": "Flame Squad",
    "slug": "flame-squad-3",
    "maxLevel": 5,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 300000,
          "wood": 300000,
          "coal": 60000,
          "iron": 15000,
          "steel": 5000,
          "shards": 16
        },
        "seconds": 28800,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 2,
        "cost": {
          "meat": 480000,
          "wood": 480000,
          "coal": 96000,
          "iron": 24000,
          "steel": 8000,
          "shards": 25
        },
        "seconds": 46080,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 3,
        "cost": {
          "meat": 780000,
          "wood": 780000,
          "coal": 150000,
          "iron": 39000,
          "steel": 13000,
          "shards": 41
        },
        "seconds": 74880,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 64000,
          "steel": 21000,
          "shards": 68
        },
        "seconds": 123840,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2000000,
          "wood": 2000000,
          "coal": 400000,
          "iron": 100000,
          "steel": 33000,
          "shards": 108
        },
        "seconds": 194400,
        "power": 60000,
        "bonus": "Troops Deployment Capacity: 200"
      }
    ]
  },
  {
    "troop": "lancer",
    "key": "lethality",
    "name": "Blazing Charge",
    "slug": "blazing-charge",
    "maxLevel": 8,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 800000,
          "wood": 800000,
          "coal": 160000,
          "iron": 40000,
          "steel": 10000,
          "shards": 40
        },
        "seconds": 72000,
        "power": 82500,
        "bonus": "Lancer Lethality: 1.50%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1100000,
          "wood": 1100000,
          "coal": 220000,
          "iron": 56000,
          "steel": 14000,
          "shards": 56
        },
        "seconds": 100800,
        "power": 74250,
        "bonus": "Lancer Lethality: 1.50%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1400000,
          "wood": 1400000,
          "coal": 290000,
          "iron": 74000,
          "steel": 18000,
          "shards": 74
        },
        "seconds": 133200,
        "power": 90750,
        "bonus": "Lancer Lethality: 3.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 2000000,
          "wood": 2000000,
          "coal": 400000,
          "iron": 100000,
          "steel": 25000,
          "shards": 102
        },
        "seconds": 183600,
        "power": 99000,
        "bonus": "Lancer Lethality: 3.00%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2700000,
          "wood": 2700000,
          "coal": 540000,
          "iron": 130000,
          "steel": 34000,
          "shards": 136
        },
        "seconds": 244800,
        "power": 95700,
        "bonus": "Lancer Lethality: 3.00%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 3600000,
          "wood": 3600000,
          "coal": 730000,
          "iron": 180000,
          "steel": 46000,
          "shards": 184
        },
        "seconds": 331200,
        "power": 98175,
        "bonus": "Lancer Lethality: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 4900000,
          "wood": 4900000,
          "coal": 990000,
          "iron": 240000,
          "steel": 62000,
          "shards": 248
        },
        "seconds": 446400,
        "power": 122925,
        "bonus": "Lancer Lethality: 5.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 6600000,
          "wood": 6600000,
          "coal": 1300000,
          "iron": 330000,
          "steel": 83000,
          "shards": 334
        },
        "seconds": 601200,
        "power": 120450,
        "bonus": "Lancer Lethality: 5.00%"
      }
    ]
  },
  {
    "troop": "lancer",
    "key": "health",
    "name": "Blazing Armor",
    "slug": "blazing-armor",
    "maxLevel": 8,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 800000,
          "wood": 800000,
          "coal": 160000,
          "iron": 40000,
          "steel": 10000,
          "shards": 40
        },
        "seconds": 72000,
        "power": 82500,
        "bonus": "Lancer Health: 1.50%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1100000,
          "wood": 1100000,
          "coal": 220000,
          "iron": 56000,
          "steel": 14000,
          "shards": 56
        },
        "seconds": 100800,
        "power": 74250,
        "bonus": "Lancer Health: 1.50%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1400000,
          "wood": 1400000,
          "coal": 290000,
          "iron": 74000,
          "steel": 18000,
          "shards": 74
        },
        "seconds": 133200,
        "power": 90750,
        "bonus": "Lancer Health: 3.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 2000000,
          "wood": 2000000,
          "coal": 400000,
          "iron": 100000,
          "steel": 25000,
          "shards": 102
        },
        "seconds": 183600,
        "power": 99000,
        "bonus": "Lancer Health: 3.00%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 2700000,
          "wood": 2700000,
          "coal": 540000,
          "iron": 130000,
          "steel": 34000,
          "shards": 136
        },
        "seconds": 244800,
        "power": 95700,
        "bonus": "Lancer Health: 3.00%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 3600000,
          "wood": 3600000,
          "coal": 730000,
          "iron": 180000,
          "steel": 46000,
          "shards": 184
        },
        "seconds": 331200,
        "power": 98175,
        "bonus": "Lancer Health: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 4900000,
          "wood": 4900000,
          "coal": 990000,
          "iron": 240000,
          "steel": 62000,
          "shards": 248
        },
        "seconds": 446400,
        "power": 122925,
        "bonus": "Lancer Health: 5.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 6600000,
          "wood": 6600000,
          "coal": 1300000,
          "iron": 330000,
          "steel": 83000,
          "shards": 334
        },
        "seconds": 601200,
        "power": 120450,
        "bonus": "Lancer Health: 5.00%"
      }
    ]
  },
  {
    "troop": "lancer",
    "key": "rally",
    "name": "Flame Legion",
    "slug": "flame-legion-3",
    "maxLevel": 12,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 1000000,
          "wood": 1000000,
          "coal": 210000,
          "iron": 54000,
          "steel": 23000,
          "shards": 83
        },
        "seconds": 105617,
        "power": 150000,
        "bonus": "Troops Deployment Capacity: 1500"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1300000,
          "wood": 1300000,
          "coal": 260000,
          "iron": 66000,
          "steel": 28000,
          "shards": 102
        },
        "seconds": 129908,
        "power": 135000,
        "bonus": "Troops Deployment Capacity: 1500"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1600000,
          "wood": 1600000,
          "coal": 320000,
          "iron": 81000,
          "steel": 34000,
          "shards": 125
        },
        "seconds": 158425,
        "power": 175000,
        "bonus": "Troops Deployment Capacity: 2000"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1900000,
          "wood": 1900000,
          "coal": 390000,
          "iron": 97000,
          "steel": 41000,
          "shards": 150
        },
        "seconds": 190110,
        "power": 135000,
        "bonus": "Troops Deployment Capacity: 2000"
      },
      {
        "level": 5,
        "cost": {
          "meat": 230000,
          "wood": 2300000,
          "coal": 47000,
          "iron": 110000,
          "steel": 51000,
          "shards": 184
        },
        "seconds": 232357,
        "power": 174500,
        "bonus": "Troops Deployment Capacity: 2500"
      },
      {
        "level": 6,
        "cost": {
          "meat": 2900000,
          "wood": 2900000,
          "coal": 580000,
          "iron": 140000,
          "steel": 62000,
          "shards": 225
        },
        "seconds": 285165,
        "power": 142500,
        "bonus": "Troops Deployment Capacity: 2500"
      },
      {
        "level": 7,
        "cost": {
          "meat": 3500000,
          "wood": 3500000,
          "coal": 710000,
          "iron": 170000,
          "steel": 76000,
          "shards": 276
        },
        "seconds": 348536,
        "power": 146500,
        "bonus": "Troops Deployment Capacity: 2500"
      },
      {
        "level": 8,
        "cost": {
          "meat": 4300000,
          "wood": 4300000,
          "coal": 860000,
          "iron": 210000,
          "steel": 93000,
          "shards": 334
        },
        "seconds": 422468,
        "power": 184000,
        "bonus": "Troops Deployment Capacity: 3000"
      },
      {
        "level": 9,
        "cost": {
          "meat": 5400000,
          "wood": 5400000,
          "coal": 1000000,
          "iron": 270000,
          "steel": 110000,
          "shards": 418
        },
        "seconds": 528085,
        "power": 122500,
        "bonus": "Troops Deployment Capacity: 3500"
      },
      {
        "level": 10,
        "cost": {
          "meat": 6500000,
          "wood": 6500000,
          "coal": 1300000,
          "iron": 320000,
          "steel": 130000,
          "shards": 502
        },
        "seconds": 633702,
        "power": 160000,
        "bonus": "Troops Deployment Capacity: 4000"
      },
      {
        "level": 11,
        "cost": {
          "meat": 7800000,
          "wood": 7800000,
          "coal": 1500000,
          "iron": 390000,
          "steel": 160000,
          "shards": 602
        },
        "seconds": 760442,
        "power": 157000,
        "bonus": "Troops Deployment Capacity: 4000"
      },
      {
        "level": 12,
        "cost": {
          "meat": 9600000,
          "wood": 9600000,
          "coal": 1900000,
          "iron": 480000,
          "steel": 200000,
          "shards": 744
        },
        "seconds": 939991,
        "power": 194000,
        "bonus": "Troops Deployment Capacity: 4500"
      }
    ]
  },
  {
    "troop": "lancer",
    "key": "defense",
    "name": "Blazing Guardian",
    "slug": "blazing-guardian",
    "maxLevel": 12,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 700000,
          "wood": 700000,
          "coal": 140000,
          "iron": 35000,
          "steel": 15000,
          "shards": 54
        },
        "seconds": 68140,
        "power": 120000,
        "bonus": "Lancer Defense: 2.00%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 860000,
          "wood": 860000,
          "coal": 170000,
          "iron": 43000,
          "steel": 18000,
          "shards": 66
        },
        "seconds": 83812,
        "power": 108000,
        "bonus": "Lancer Defense: 2.00%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1000000,
          "wood": 1000000,
          "coal": 210000,
          "iron": 52000,
          "steel": 22000,
          "shards": 81
        },
        "seconds": 102210,
        "power": 103200,
        "bonus": "Lancer Defense: 2.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 63000,
          "steel": 27000,
          "shards": 97
        },
        "seconds": 122652,
        "power": 103200,
        "bonus": "Lancer Defense: 2.50%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 1500000,
          "wood": 1500000,
          "coal": 300000,
          "iron": 77000,
          "steel": 33000,
          "shards": 118
        },
        "seconds": 149908,
        "power": 101100,
        "bonus": "Lancer Defense: 2.50%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 1800000,
          "wood": 1800000,
          "coal": 370000,
          "iron": 94000,
          "steel": 40000,
          "shards": 145
        },
        "seconds": 183978,
        "power": 103800,
        "bonus": "Lancer Defense: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 460000,
          "iron": 110000,
          "steel": 49000,
          "shards": 178
        },
        "seconds": 224862,
        "power": 106200,
        "bonus": "Lancer Defense: 3.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 2800000,
          "wood": 2800000,
          "coal": 560000,
          "iron": 140000,
          "steel": 60000,
          "shards": 216
        },
        "seconds": 272540,
        "power": 107400,
        "bonus": "Lancer Defense: 3.00%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 3500000,
          "wood": 3500000,
          "coal": 700000,
          "iron": 170000,
          "steel": 75000,
          "shards": 270
        },
        "seconds": 340700,
        "power": 123000,
        "bonus": "Lancer Defense: 5.00%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 4200000,
          "wood": 4200000,
          "coal": 840000,
          "iron": 210000,
          "steel": 90000,
          "shards": 324
        },
        "seconds": 408840,
        "power": 123000,
        "bonus": "Lancer Defense: 5.00%"
      },
      {
        "level": 11,
        "cost": {
          "meat": 5000000,
          "wood": 5000000,
          "coal": 1000000,
          "iron": 250000,
          "steel": 100000,
          "shards": 388
        },
        "seconds": 490608,
        "power": 120000,
        "bonus": "Lancer Defense: 5.00%"
      },
      {
        "level": 12,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 130000,
          "shards": 480
        },
        "seconds": 606446,
        "power": 126000,
        "bonus": "Lancer Defense: 5.00%"
      }
    ]
  },
  {
    "troop": "lancer",
    "key": "attack",
    "name": "Blazing Lance",
    "slug": "blazing-lance",
    "maxLevel": 12,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 700000,
          "wood": 700000,
          "coal": 140000,
          "iron": 35000,
          "steel": 15000,
          "shards": 54
        },
        "seconds": 68140,
        "power": 120000,
        "bonus": "Lancer Attack: 2.00%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 860000,
          "wood": 860000,
          "coal": 170000,
          "iron": 43000,
          "steel": 18000,
          "shards": 66
        },
        "seconds": 83812,
        "power": 108000,
        "bonus": "Lancer Attack: 2.00%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 1000000,
          "wood": 1000000,
          "coal": 210000,
          "iron": 52000,
          "steel": 22000,
          "shards": 81
        },
        "seconds": 102210,
        "power": 103200,
        "bonus": "Lancer Attack: 2.00%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 63000,
          "steel": 27000,
          "shards": 97
        },
        "seconds": 122652,
        "power": 103200,
        "bonus": "Lancer Attack: 2.50%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 1500000,
          "wood": 1500000,
          "coal": 300000,
          "iron": 77000,
          "steel": 33000,
          "shards": 118
        },
        "seconds": 149908,
        "power": 101100,
        "bonus": "Lancer Attack: 2.50%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 1800000,
          "wood": 1800000,
          "coal": 370000,
          "iron": 94000,
          "steel": 40000,
          "shards": 145
        },
        "seconds": 183978,
        "power": 103800,
        "bonus": "Lancer Attack: 3.00%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 460000,
          "iron": 110000,
          "steel": 49000,
          "shards": 178
        },
        "seconds": 224862,
        "power": 106200,
        "bonus": "Lancer Attack: 3.00%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 2800000,
          "wood": 2800000,
          "coal": 560000,
          "iron": 140000,
          "steel": 60000,
          "shards": 216
        },
        "seconds": 272540,
        "power": 107400,
        "bonus": "Lancer Attack: 3.00%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 3500000,
          "wood": 3500000,
          "coal": 700000,
          "iron": 170000,
          "steel": 75000,
          "shards": 270
        },
        "seconds": 340700,
        "power": 123000,
        "bonus": "Lancer Attack: 5.00%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 4200000,
          "wood": 4200000,
          "coal": 840000,
          "iron": 210000,
          "steel": 90000,
          "shards": 324
        },
        "seconds": 408840,
        "power": 123000,
        "bonus": "Lancer Attack: 5.00%"
      },
      {
        "level": 11,
        "cost": {
          "meat": 5000000,
          "wood": 5000000,
          "coal": 1000000,
          "iron": 250000,
          "steel": 100000,
          "shards": 388
        },
        "seconds": 490608,
        "power": 120000,
        "bonus": "Lancer Attack: 5.00%"
      },
      {
        "level": 12,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 130000,
          "shards": 480
        },
        "seconds": 606446,
        "power": 126000,
        "bonus": "Lancer Attack: 5.00%"
      }
    ]
  },
  {
    "troop": "lancer",
    "key": "helios",
    "name": "Helios Lancer",
    "slug": "helios-lancer",
    "maxLevel": 1,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 85000000,
          "wood": 85000000,
          "coal": 17000000,
          "iron": 4200000,
          "steel": 1000000,
          "shards": 2236
        },
        "seconds": 7892100,
        "power": 8000000,
        "bonus": "Other: Unlock XI Helios Lancer"
      }
    ]
  },
  {
    "troop": "lancer",
    "key": "firstAid",
    "name": "Helios Lancer First Aid",
    "slug": "helios-lancer-first-aid",
    "maxLevel": 10,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 1200000,
          "wood": 1200000,
          "coal": 250000,
          "iron": 62000,
          "steel": 15000,
          "shards": 51
        },
        "seconds": 90000,
        "power": 137250,
        "bonus": "Helios Lancer Healing Time Reduction: 1.5% Lancer Defense: 2%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 1600000,
          "wood": 1600000,
          "coal": 330000,
          "iron": 84000,
          "steel": 20000,
          "shards": 68
        },
        "seconds": 121500,
        "power": 137250,
        "bonus": "Helios Lancer Healing Time Reduction: 1.5% Lancer Defense: 2%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 2300000,
          "wood": 2300000,
          "coal": 460000,
          "iron": 110000,
          "steel": 27000,
          "shards": 94
        },
        "seconds": 166500,
        "power": 137250,
        "bonus": "Helios Lancer Healing Time Reduction: 1.5% Lancer Defense: 2%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 3100000,
          "wood": 3100000,
          "coal": 620000,
          "iron": 150000,
          "steel": 37000,
          "shards": 127
        },
        "seconds": 225000,
        "power": 137250,
        "bonus": "Helios Lancer Healing Time Reduction: 1.5% Lancer Defense: 2%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 4100000,
          "wood": 4100000,
          "coal": 830000,
          "iron": 200000,
          "steel": 50000,
          "shards": 170
        },
        "seconds": 301500,
        "power": 137250,
        "bonus": "Helios Lancer Healing Time Reduction: 1.5% Lancer Defense: 2%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 5600000,
          "wood": 5600000,
          "coal": 1100000,
          "iron": 280000,
          "steel": 67000,
          "shards": 229
        },
        "seconds": 405000,
        "power": 137250,
        "bonus": "Helios Lancer Healing Time Reduction: 1.5% Lancer Defense: 2%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 7500000,
          "wood": 7500000,
          "coal": 1500000,
          "iron": 370000,
          "steel": 90000,
          "shards": 306
        },
        "seconds": 540000,
        "power": 137250,
        "bonus": "Helios Lancer Healing Time Reduction: 1.5% Lancer Defense: 2%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 10000000,
          "wood": 10000000,
          "coal": 2000000,
          "iron": 510000,
          "steel": 120000,
          "shards": 418
        },
        "seconds": 738000,
        "power": 137250,
        "bonus": "Helios Lancer Healing Time Reduction: 1.5% Lancer Defense: 2%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 13000000,
          "wood": 13000000,
          "coal": 2700000,
          "iron": 680000,
          "steel": 160000,
          "shards": 561
        },
        "seconds": 990000,
        "power": 137250,
        "bonus": "Helios Lancer Healing Time Reduction: 1.5% Lancer Defense: 2%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 18000000,
          "wood": 18000000,
          "coal": 3700000,
          "iron": 930000,
          "steel": 220000,
          "shards": 765
        },
        "seconds": 1350000,
        "power": 137250,
        "bonus": "Helios Lancer Healing Time Reduction: 1.5% Lancer Defense: 2%"
      }
    ]
  },
  {
    "troop": "lancer",
    "key": "healing",
    "name": "Helios Lancer Healing",
    "slug": "helios-lancer-healing",
    "maxLevel": 10,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 2500000,
          "wood": 2500000,
          "coal": 500000,
          "iron": 120000,
          "steel": 30000,
          "shards": 102
        },
        "seconds": 180000,
        "power": 155000,
        "bonus": "Helios Lancer Healing Cost Reduction: 5% Lancer Attack: 2%"
      },
      {
        "level": 2,
        "cost": {
          "meat": 3300000,
          "wood": 3300000,
          "coal": 670000,
          "iron": 160000,
          "steel": 40000,
          "shards": 137
        },
        "seconds": 243000,
        "power": 155000,
        "bonus": "Helios Lancer Healing Cost Reduction: 5% Lancer Attack: 2%"
      },
      {
        "level": 3,
        "cost": {
          "meat": 4600000,
          "wood": 4600000,
          "coal": 920000,
          "iron": 230000,
          "steel": 55000,
          "shards": 188
        },
        "seconds": 333000,
        "power": 155000,
        "bonus": "Helios Lancer Healing Cost Reduction: 5% Lancer Attack: 2%"
      },
      {
        "level": 4,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 75000,
          "shards": 255
        },
        "seconds": 450000,
        "power": 155000,
        "bonus": "Helios Lancer Healing Cost Reduction: 5% Lancer Attack: 2%"
      },
      {
        "level": 5,
        "cost": {
          "meat": 8300000,
          "wood": 8300000,
          "coal": 1600000,
          "iron": 410000,
          "steel": 100000,
          "shards": 341
        },
        "seconds": 603000,
        "power": 155000,
        "bonus": "Helios Lancer Healing Cost Reduction: 5% Lancer Attack: 2%"
      },
      {
        "level": 6,
        "cost": {
          "meat": 11000000,
          "wood": 11000000,
          "coal": 2200000,
          "iron": 560000,
          "steel": 130000,
          "shards": 459
        },
        "seconds": 810000,
        "power": 155000,
        "bonus": "Helios Lancer Healing Cost Reduction: 5% Lancer Attack: 2%"
      },
      {
        "level": 7,
        "cost": {
          "meat": 15000000,
          "wood": 15000000,
          "coal": 3000000,
          "iron": 750000,
          "steel": 180000,
          "shards": 612
        },
        "seconds": 1080000,
        "power": 155000,
        "bonus": "Helios Lancer Healing Cost Reduction: 5% Lancer Attack: 2%"
      },
      {
        "level": 8,
        "cost": {
          "meat": 20000000,
          "wood": 20000000,
          "coal": 4100000,
          "iron": 1000000,
          "steel": 240000,
          "shards": 836
        },
        "seconds": 1476000,
        "power": 155000,
        "bonus": "Helios Lancer Healing Cost Reduction: 5% Lancer Attack: 2%"
      },
      {
        "level": 9,
        "cost": {
          "meat": 27000000,
          "wood": 27000000,
          "coal": 5500000,
          "iron": 1300000,
          "steel": 330000,
          "shards": 1122
        },
        "seconds": 1980000,
        "power": 155000,
        "bonus": "Helios Lancer Healing Cost Reduction: 5% Lancer Attack: 2%"
      },
      {
        "level": 10,
        "cost": {
          "meat": 37000000,
          "wood": 37000000,
          "coal": 7500000,
          "iron": 1800000,
          "steel": 450000,
          "shards": 1500
        },
        "seconds": 2700000,
        "power": 155000,
        "bonus": "Helios Lancer Healing Cost Reduction: 5% Lancer Attack: 2%"
      }
    ]
  },
  {
    "troop": "lancer",
    "key": "training",
    "name": "Helios Lancer Training",
    "slug": "helios-lancer-training",
    "maxLevel": 10,
    "levels": [
      {
        "level": 1,
        "cost": {
          "meat": 2500000,
          "wood": 2500000,
          "coal": 500000,
          "iron": 120000,
          "steel": 30000,
          "shards": 102
        },
        "seconds": 180000,
        "power": 65000,
        "bonus": "Helios Lancer Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 2,
        "cost": {
          "meat": 3300000,
          "wood": 3300000,
          "coal": 670000,
          "iron": 160000,
          "steel": 40000,
          "shards": 137
        },
        "seconds": 243000,
        "power": 65000,
        "bonus": "Helios Lancer Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 3,
        "cost": {
          "meat": 4600000,
          "wood": 4600000,
          "coal": 920000,
          "iron": 230000,
          "steel": 55000,
          "shards": 188
        },
        "seconds": 333000,
        "power": 65000,
        "bonus": "Helios Lancer Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 4,
        "cost": {
          "meat": 6200000,
          "wood": 6200000,
          "coal": 1200000,
          "iron": 310000,
          "steel": 75000,
          "shards": 255
        },
        "seconds": 450000,
        "power": 65000,
        "bonus": "Helios Lancer Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 5,
        "cost": {
          "meat": 8300000,
          "wood": 8300000,
          "coal": 1600000,
          "iron": 410000,
          "steel": 100000,
          "shards": 341
        },
        "seconds": 603000,
        "power": 65000,
        "bonus": "Helios Lancer Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 6,
        "cost": {
          "meat": 11000000,
          "wood": 11000000,
          "coal": 2200000,
          "iron": 560000,
          "steel": 130000,
          "shards": 459
        },
        "seconds": 810000,
        "power": 65000,
        "bonus": "Helios Lancer Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 7,
        "cost": {
          "meat": 15000000,
          "wood": 15000000,
          "coal": 3000000,
          "iron": 750000,
          "steel": 180000,
          "shards": 612
        },
        "seconds": 1080000,
        "power": 65000,
        "bonus": "Helios Lancer Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 8,
        "cost": {
          "meat": 20000000,
          "wood": 20000000,
          "coal": 4100000,
          "iron": 1000000,
          "steel": 240000,
          "shards": 836
        },
        "seconds": 1476000,
        "power": 65000,
        "bonus": "Helios Lancer Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 9,
        "cost": {
          "meat": 27000000,
          "wood": 27000000,
          "coal": 5500000,
          "iron": 1300000,
          "steel": 330000,
          "shards": 561
        },
        "seconds": 1980000,
        "power": 65000,
        "bonus": "Helios Lancer Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      },
      {
        "level": 10,
        "cost": {
          "meat": 37000000,
          "wood": 37000000,
          "coal": 7500000,
          "iron": 1800000,
          "steel": 450000,
          "shards": 1500
        },
        "seconds": 2700000,
        "power": 65000,
        "bonus": "Helios Lancer Training Cost Reduction: 5% Troops Deployment Capacity: 100"
      }
    ]
  }
];
