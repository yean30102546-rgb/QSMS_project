"use client";

import { GuideApp } from "@/src/modules/guide/GuideApp";
import { getCurrentUser } from "@/src/services/auth";
import { useRouter } from "next/navigation";

export default function GuidePage() {
  const user = getCurrentUser();
  const router = useRouter();

  return (
    <GuideApp 
      user={user} 
      onBackToPortal={() => router.push("/")} 
    />
  );
}
