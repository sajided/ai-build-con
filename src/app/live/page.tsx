import { redirect } from "next/navigation";

// /live was a duplicate of /scanner; keep old links working
export default function LiveScannerPage() {
  redirect("/scanner");
}
