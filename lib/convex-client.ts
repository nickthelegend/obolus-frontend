import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
    console.error("Missing environment variable: NEXT_PUBLIC_CONVEX_URL");
}

export const convex = new ConvexHttpClient(convexUrl || "");
export { api };
