import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
let envContent = "";
try {
  envContent = fs.readFileSync(envPath, "utf-8");
} catch(e) {}

const envVars = {};
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    envVars[key.trim()] = values.join("=").trim().replace(/"/g, "").replace(/\r/g, "");
  }
});

const supabaseUrl = envVars["VITE_SUPABASE_URL"];
const supabaseKey = envVars["VITE_SUPABASE_PUBLISHABLE_KEY"] || envVars["VITE_SUPABASE_ANON_KEY"];

const supabase = createClient(supabaseUrl, supabaseKey);

async function tryDelete() {
  const { data, error } = await supabase
    .from("cultural_content")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select();
  
  if (error) {
    console.error("Delete Error:", error);
  } else {
    console.log("Deleted count:", data ? data.length : 0);
  }
}

tryDelete();
