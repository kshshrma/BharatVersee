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

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDatabase() {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ 
       display_name: null,
       assigned_state: null
    })
    .neq("user_id", "00000000-0000-0000-0000-000000000000");

  if (profileError) {
    console.error("Failed to reset profiles:", profileError);
  } else {
    console.log("✅ Reset all user profiles (Removed fake names and states)");
  }
}

cleanDatabase();
