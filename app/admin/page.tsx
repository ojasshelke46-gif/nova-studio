import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("nova_token")?.value;

  if (!token || !verifyToken(token)) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
