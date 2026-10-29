"use client";

import { GuideApp } from "@/src/modules/guide/GuideApp";
import { getCurrentUser } from "@/src/services/auth";
import { useRouter } from "next/navigation";
import { NotificationProvider } from "@/src/contexts/NotificationContext";
import { ToastContainer } from "@/src/components/shared/Toast";
import { AlertModal } from "@/src/components/shared/AlertModal";

export default function GuidePage() {
  const user = getCurrentUser();
  const router = useRouter();

  return (
    <NotificationProvider>
      <GuideApp 
        onBackToPortal={() => router.push("/")} 
      />
      <ToastContainer />
      <AlertModal />
    </NotificationProvider>
  );
}
