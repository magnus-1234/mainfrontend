const fs = require('fs');

const rawData = [
  {
    "facilityType": "construction",
    "label": "Construction",
    "bonus": "Construction Speed",
    "color": "#42a5f5",
    "levels": [
      {
        "level": 1,
        "booster": "+5%",
        "heavilyInjured": "10%",
        "losses": "0%",
        "coordinates": [[1068,138],[537,138],[138,138],[138,666],[138,1038],[666,1068],[1068,567],[1068,1068]]
      },
      {
        "level": 3,
        "booster": "+8%",
        "heavilyInjured": "20%",
        "losses": "0%",
        "coordinates": [[486,327],[768,867],[867,567],[327,666]]
      }
    ]
  },
  {
    "facilityType": "defense",
    "label": "Defense",
    "bonus": "Troop Defense",
    "color": "#26c6da",
    "levels": [
      {
        "level": 2,
        "booster": "+5%",
        "heavilyInjured": "20%",
        "losses": "0%",
        "coordinates": [[666,138],[438,267],[138,537],[237,768],[537,1038],[738,957],[1068,666],[957,438]]
      },
      {
        "level": 4,
        "booster": "+8%",
        "heavilyInjured": "30%",
        "losses": "0%",
        "coordinates": [[816,717],[387,717],[588,327]]
      }
    ]
  },
  {
    "facilityType": "tech",
    "label": "Tech",
    "bonus": "Research Speed",
    "color": "#ffa726",
    "levels": [
      {
        "level": 1,
        "booster": "+5%",
        "heavilyInjured": "10%",
        "losses": "0%",
        "coordinates": [[957,237],[666,267],[237,237],[267,537],[237,957],[537,936],[936,537],[957,957]]
      },
      {
        "level": 3,
        "booster": "+8%",
        "heavilyInjured": "30%",
        "losses": "0%",
        "coordinates": [[867,327],[327,327],[327,867],[867,867]]
      }
    ]
  },
  {
    "facilityType": "weapon",
    "label": "Weapons",
    "bonus": "Troop Attack",
    "color": "#ef5350",
    "levels": [
      {
        "level": 2,
        "booster": "+5%",
        "heavilyInjured": "20%",
        "losses": "0%",
        "coordinates": [[867,138],[366,138],[138,438],[138,867],[438,1068],[1068,327],[1068,867],[867,1068]]
      },
      {
        "level": 4,
        "booster": "+8%",
        "heavilyInjured": "30%",
        "losses": "10%",
        "coordinates": [[816,486],[387,486],[588,867]]
      }
    ]
  },
  {
    "facilityType": "gathering",
    "label": "Gathering",
    "bonus": "Gathering Speed",
    "color": "#ab47bc",
    "levels": [
      {
        "level": 1,
        "booster": "+5%",
        "heavilyInjured": "10%",
        "losses": "0%",
        "coordinates": [[957,138],[537,87],[138,237],[87,666],[267,1068],[636,1137],[1137,567],[1068,936]]
      }
    ]
  },
  {
    "facilityType": "production",
    "label": "Production",
    "bonus": "RSS Gathering Speed",
    "color": "#66bb6a",
    "levels": [
      {
        "level": 1,
        "booster": "+5%",
        "heavilyInjured": "10%",
        "losses": "0%",
        "coordinates": [[1068,237],[768,138],[237,138],[138,327],[138,957],[327,1038],[1068,747],[957,1068]]
      }
    ]
  },
  {
    "facilityType": "training",
    "label": "Training",
    "bonus": "Training Speed",
    "color": "#ffee58",
    "levels": [
      {
        "level": 2,
        "booster": "+5%",
        "heavilyInjured": "20%",
        "losses": "0%",
        "coordinates": [[237,486],[138,747],[486,957],[768,1038],[957,747],[1068,486],[486,138],[768,237]]
      }
    ]
  },
  {
    "facilityType": "expedition",
    "label": "Expedition",
    "bonus": "March Speed",
    "color": "#f48fb1",
    "levels": [
      {
        "level": 3,
        "booster": "+15%",
        "heavilyInjured": "30%",
        "losses": "0%",
        "coordinates": [[768,327],[327,567],[486,867],[867,666]]
      }
    ]
  }
];

let counter = 1;
const lines = [];
rawData.forEach(fac => {
  fac.levels.forEach(lvl => {
    lvl.coordinates.forEach(coord => {
      const id = `facility-${counter++}`;
      const name = `${fac.label} Lv. ${lvl.level}`;
      const bonusStr = `${fac.bonus} ${lvl.booster}`;
      lines.push(`  { id: "${id}", label: "${name}", kind: "facility", planner: { col: ${coord[0]}, row: ${coord[1]}, size: 3 }, bonus: "${bonusStr}", color: "${fac.color}" },`);
    });
  });
});

fs.writeFileSync('facilities.txt', `const WOS_FACILITIES: SunfireLandmark[] = [\n${lines.join('\\n')}\n];\n`);
console.log('Saved to facilities.txt');
