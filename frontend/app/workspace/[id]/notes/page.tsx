import { Suspense } from "react";
import NotesPage from "./notes.tsx";
import Loading from "@/components/Loading";

export default async function WorkspaceNotesRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading fullPage message="Loading…" />}>
      <NotesPage workspaceId={id} />
    </Suspense>
  );
}
