import ClassroomClient from "@/app/ClassroomClient";
import { getStateFromSource } from "@/lib/stateSource";
import fs from "node:fs/promises";
import path from "node:path";

export default async function Home() {
  const response = await getStateFromSource();
  const scriptPath = path.join(process.cwd(), "docs", "apps-script-backend.gs");
  const appsScriptCode = await fs.readFile(scriptPath, "utf8");

  return <ClassroomClient initialState={response.state} appsScriptCode={appsScriptCode} />;
}
