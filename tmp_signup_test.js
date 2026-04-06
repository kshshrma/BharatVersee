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

async function testSignupAndLogin() {
  const email = `test_${Date.now()}@example.com`;
  const password = "password123";
  
  console.log("Signing up...");
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "Test User",
        role: "admin",
        selected_role: "admin",
        assigned_state: "Assam"
      }
    }
  });
  
  if (signupError) {
    console.error("Signup error:", signupError);
    return;
  }
  
  console.log("Signup success!");
  console.log("User metadata:", signupData.user?.user_metadata);
  
  const { data: profileQuery } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", signupData.user.id)
    .maybeSingle();
    
  console.log("Profile query result:", profileQuery);
  
  const roleFromProfile = profileQuery?.role;
  const roleFromMeta1 = signupData.user?.user_metadata?.role;
  const roleFromMeta2 = signupData.user?.user_metadata?.selected_role;
  
  console.log("Role logic parts:", {
    roleFromProfile,
    roleFromMeta1,
    roleFromMeta2,
    fallback: "user"
  });
  
  const actualRole = roleFromProfile || roleFromMeta1 || roleFromMeta2 || "user";
  console.log("Actual role evaluated to:", actualRole);
}

testSignupAndLogin();
