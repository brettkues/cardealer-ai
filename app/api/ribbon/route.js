import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSeason(month) {
  if ([11, 0, 1].includes(month)) return "winter";
  if ([2, 3, 4].includes(month)) return "spring";
  if ([5, 6, 7].includes(month)) return "summer";
  return "fall";
}

export async function POST() {
  const now = new Date();
  const season = getSeason(now.getMonth());

  const THEMES = {
    winter: {
      bg: ["#5CA8FF", "#1B4B9B"],
      pattern: "snow"
    },
    spring: {
      bg: ["#65C67A", "#A8E6CF"],
      pattern: "flowers"
    },
    summer: {
      bg: ["#FFD166", "#F4A261"],
      pattern: "dots"
    },
    fall: {
      bg: ["#D46A1E", "#8B4513"],
      pattern: "plaid"
    }
  };

  const theme = THEMES[season];
  const bg = pick(theme.bg);

  // BASE RIBBON
  let ribbon = sharp({
    create: {
      width: 850,
      height: 212,
      channels: 4,
      background: bg
    }
  });

  // SIMPLE GEOMETRY PATTERNS (NO FONTS EVER)
  if (theme.pattern === "snow") {
    ribbon = ribbon.composite([
      {
        input: Buffer.from(`
          <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#ffffff55" stroke-width="2">
              <line x1="60" y1="40" x2="60" y2="80"/>
              <line x1="40" y1="60" x2="80" y2="60"/>
              <line x1="45" y1="45" x2="75" y2="75"/>
              <line x1="75" y1="45" x2="45" y2="75"/>
            </g>
          </svg>
        `),
        tile: true
      }
    ]);
  }

  if (theme.pattern === "flowers") {
    ribbon = ribbon.composite([
      {
        input: Buffer.from(`
          <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="6" fill="#ffffff55"/>
            <circle cx="70" cy="50" r="8" fill="#ffffff55"/>
            <circle cx="50" cy="80" r="5" fill="#ffffff55"/>
          </svg>
        `),
        tile: true
      }
    ]);
  }

  if (theme.pattern === "dots") {
    ribbon = ribbon.composite([
      {
        input: Buffer.from(`
          <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="3" fill="#ffffff55"/>
          </svg>
        `),
        tile: true
      }
    ]);
  }

  if (theme.pattern === "plaid") {
    ribbon = ribbon.composite([
      {
        input: Buffer.from(`
          <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="20" x2="80" y2="20" stroke="#ffffff44" stroke-width="6"/>
            <line x1="0" y1="50" x2="80" y2="50" stroke="#ffffff44" stroke-width="6"/>
            <line x1="20" y1="0" x2="20" y2="80" stroke="#ffffff44" stroke-width="6"/>
            <line x1="50" y1="0" x2="50" y2="80" stroke="#ffffff44" stroke-width="6"/>
          </svg>
        `),
        tile: true
      }
    ]);
  }

  const buffer = await ribbon.png().toBuffer();

  return NextResponse.json({
    ribbonImage: `data:image/png;base64,${buffer.toString("base64")}`,
    season
  });
}
