import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const root = process.cwd();

    function list(dir) {
      return fs.readdirSync(dir).map((name) => {
        const full = path.join(dir, name);
        const isDir = fs.statSync(full).isDirectory();
        return isDir ? name + "/" : name;
      });
    }

    return NextResponse.json({
      root: list(root),
      app: list(path.join(root, "app")),
      api: list(path.join(root, "app/api")),
    });
  } catch (err) {
    return NextResponse.json({ error: err.toString() }, { status: 500 });
  }
}
