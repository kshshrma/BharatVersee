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

async function findCreators() {
  const { data, error } = await supabase
    .from("cultural_content")
    .select("created_by")
    .limit(10);
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Creators:", [...new Set(data.map(d => d.created_by))]);
  }
}

findCreators();
