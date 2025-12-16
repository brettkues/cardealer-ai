import { NextResponse } from "next/server";

function getSeason(month) {
  if ([11, 0, 1].includes(month)) return "winter";
  if ([2, 3, 4].includes(month)) return "spring";
  if ([5, 6, 7].includes(month)) return "summer";
  return "fall";
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST() {
  const now = new Date();
  const month = now.getMonth(); // 0–11
  const day = now.getDate();
  const season = getSeason(month);

  let theme = season;
  let holiday = null;

  // --- Holiday overrides (simple + safe) ---
  if (month === 11 && day >= 15) holiday = "christmas";
  if (month === 6 && day <= 7) holiday = "fourthOfJuly";
  if (month === 9 && day >= 25) holiday = "halloween";
  if (month === 3 && day >= 10 && day <= 20) holiday = "easter";

  if (holiday) theme = holiday;

  // --- Theme definitions ---
  const THEMES = {
    winter: {
      background: ["#4A90E2", "#5CA8FF", "#1B4B9B"],
      pattern: ["snowflakes", "frost", "light-speckle"],
      text: ["Winter Ready", "Cold Weather Deal", "Snow Season Savings"],
    },
    spring: {
      background: ["#65C67A", "#A8E6CF"],
      pattern: ["floral", "petals", "soft-dots"],
      text: ["Spring Savings", "Fresh Start Deals", "Spring Is Here"],
    },
    summer: {
      background: ["#FFD166", "#F4A261"],
      pattern: ["sunburst", "waves", "linen"],
      text: ["Summer Drive", "Hot Summer Deals", "Road Trip Ready"],
    },
    fall: {
      background: ["#D46A1E", "#8B4513"],
      pattern: ["leaves", "grain", "plaid"],
      text: ["Fall Savings", "Autumn Drive", "Harvest Deals"],
    },
    christmas: {
      background: ["#0B3D2E", "#B11226"],
      pattern: ["snowflakes", "holiday-lights"],
      text: ["Holiday Savings", "Season of Deals", "Merry Savings"],
    },
    fourthOfJuly: {
      background: ["#B22234", "#3C3B6E"],
      pattern: ["stars", "stripes"],
      text: ["Independence Deals", "Stars & Savings"],
    },
    halloween: {
      background: ["#FF6F00", "#2E2E2E"],
      pattern: ["spiderweb", "grunge"],
      text: ["Spooky Savings", "Frightfully Good Deals"],
    },
    easter: {
      background: ["#F7C6D9", "#C1E1C1"],
      pattern: ["flowers", "soft-check"],
      text: ["Spring Celebration", "Easter Savings"],
    },
  };

  const selected = THEMES[theme];

  const ribbon = {
    theme,
    backgroundColor: randomPick(selected.background),
    pattern: randomPick(selected.pattern),
    text: randomPick(selected.text),
  };

  return NextResponse.json(ribbon);
}
