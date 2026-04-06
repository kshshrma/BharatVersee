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
  console.log("Cleaning database...");

  // Delete all cultural content
  const { error: contentError } = await supabase
    .from("cultural_content")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Match all rows

  if (contentError) {
    console.error("Failed to delete cultural content:", contentError);
  } else {
    console.log("✅ Cleared all cultural content");
  }

  // Delete all subscriptions
  const { error: subsError } = await supabase
    .from("subscriptions")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); 

  if (subsError) {
    console.log("Subscriptions table cleared or no id column: ", subsError.message);
  } else {
    console.log("✅ Cleared all subscriptions");
  }

  // Delete cart items
  const { error: cartError } = await supabase
    .from("cart_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (cartError) {
    console.log("Cart items cleared or no id column");
  } else {
    console.log("✅ Cleared all cart items");
  }
  
  // Note: We won't delete users from Auth since they are actual accounts,
  // but if the user wants "admin name" cleared, maybe we should update profiles?
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ 
       display_name: null,
       role: "user",
       assigned_state: null
    })
    .neq("user_id", "00000000-0000-0000-0000-000000000000"); // Resets all profiles

  if (profileError) {
    console.error("Failed to reset profiles:", profileError);
  } else {
    console.log("✅ Reset all user profiles (Removed admin roles, fake names, and states)");
  }

  console.log("Database cleanup complete!");
}

cleanDatabase();
