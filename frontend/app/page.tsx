import { redirect } from "next/navigation";

export default function Home() {
  // Simple entrypoint: go to login (dashboard is guarded client-side)
  redirect("/login");
}
