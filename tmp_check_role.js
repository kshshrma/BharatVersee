import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync("C:/Users/Lenovo/OneDrive/Desktop/Coding/bharat-connect-verse-main/bharat-connect-verse-main/.env", "utf8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    envVars[key.trim()] = values.join("=").trim().replace(/"/g, '');
  }
}

const supabaseUrl = envVars["VITE_SUPABASE_URL"];
const supabaseKey = envVars["VITE_SUPABASE_PUBLISHABLE_KEY"];
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSelectRole() {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .limit(1)
    .maybeSingle();

  console.log("data:", data, "error:", error);
}

testSelectRole();
