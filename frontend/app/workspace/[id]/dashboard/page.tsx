import { Suspense } from "react";
import DashboardPage from "./dashboard";
import Loading from "@/components/Loading";

export default async function WorkspaceDashboardRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading fullPage message="Loading…" />}>
      <DashboardPage workspaceId={id} />
    </Suspense>
  );
}
