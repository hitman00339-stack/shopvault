import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export default async function HomePage() {
  const token = cookies().get("shopvault_token")?.value;

  if (token) {
    try {
      const JWT_SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || "fallback-secret-change-in-production"
      );
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (payload.role === "ADMIN") {
        redirect("/admin");
      }
      redirect("/deals");
    } catch {
      redirect("/login");
    }
  }

  redirect("/login");
}