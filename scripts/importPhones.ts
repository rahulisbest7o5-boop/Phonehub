
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: ".env.local" });

const mobileApiKey = process.env.MOBILE_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

// Check required environment variables
if (!mobileApiKey || !supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Missing environment variables. Check your .env.local file."
  );
}

// Supabase client for this local import script only
const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey
);

// MobileAPI phone structure
interface Phone {
  id: number;
  name: string;
  manufacturer_name?: string | null;
  storage?: string | null;
  camera?: string | null;
  battery_capacity?: string | null;
  screen_resolution?: string | null;
  release_date?: string | null;
  image_url?: string | null;
}

// Import phones by name
async function importPhones(name: string): Promise<boolean> {
  console.log(`\nFetching ${name} phones from MobileAPI.dev...`);

  const url = new URL(
    "https://api.mobileapi.dev/devices/search/"
  );

  url.searchParams.set("name", name);
  url.searchParams.set("limit", "10");

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${mobileApiKey}`,
      },
    });

    // Handle API rate limit
    if (response.status === 429) {
      console.error("HTTP 429: Too many requests.");

      const retryAfter = response.headers.get("retry-after");

      if (retryAfter) {
        console.log(`Retry after: ${retryAfter}`);
      } else {
        console.log(
          "No retry time provided. Check your API limits before retrying."
        );
      }

      return false;
    }

    // Handle other API errors
    if (!response.ok) {
      console.error(
        `MobileAPI error: ${response.status} ${response.statusText}`
      );

      return false;
    }

    const result: unknown = await response.json();

    // Validate API response
    if (
      typeof result !== "object" ||
      result === null ||
      !("devices" in result) ||
      !Array.isArray(result.devices)
    ) {
      console.error("Unexpected MobileAPI response format.");
      return false;
    }

    const devices = result.devices as Phone[];

    if (devices.length === 0) {
      console.log(`No ${name} phones found.`);
      return false;
    }

    // Convert API fields to Supabase columns
    const phones = devices.map((phone) => ({
      mobile_api_id: phone.id,
      name: phone.name,
      manufacturer: phone.manufacturer_name ?? null,
      storage: phone.storage ?? null,
      camera: phone.camera ?? null,
      battery: phone.battery_capacity ?? null,
      screen: phone.screen_resolution ?? null,
      release_date: phone.release_date ?? null,
      image_url: phone.image_url ?? null,
    }));

    // Insert or update existing phones
    const { error } = await supabase
      .from("phones")
      .upsert(phones, {
        onConflict: "mobile_api_id",
      });

    if (error) {
      console.error("Supabase error:", error.message);
      return false;
    }

    console.log(
      `Successfully saved ${phones.length} ${name} phones to Supabase.`
    );

    return true;
  } catch (error) {
    console.error("Import error:", error);
    return false;
  }
}

// Main function
async function main() {
  console.log("Starting PhoneHub phone import...");

  // iPhones are already saved in Supabase.
  // Import Samsung phones only.
  const success = await importPhones("Samsung");

  if (success) {
    console.log("\nSamsung import completed successfully!");
  } else {
    console.log("\nSamsung import was not completed.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});
