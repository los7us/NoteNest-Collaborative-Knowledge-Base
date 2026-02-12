"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { SkeletonList } from "@/components/Skeleton";
import { usePermissions } from "@/hooks/usePermissions";

const STORAGE_KEY = "notenest-notes";
const TITLE_MAX_LENGTH = 200;

interface Note {
  id: number;
  title: string;
  content?: string;
}

const loadNotesFromStorage = (): Note[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveNotesToStorage = (notes: Note[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
};

export default function NotesPage() {
  const searchParams = useSearchParams();
  const { canCreateNote, canDeleteNote, isViewer } = usePermissions();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  const createBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setNotes(loadNotesFromStorage());
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (!isLoading) saveNotesToStorage(notes);
  }, [notes, isLoading]);

  useEffect(() => {
    if (searchParams.get("new") === "1" && canCreateNote) {
      setShowCreateModal(true);
    }
  }, [searchParams, canCreateNote]);

  const handleCreate = useCallback(() => {
    if (!createTitle.trim()) return;
    setNotes((prev) => [
      ...prev,
      { id: Date.now(), title: createTitle.trim(), content: createContent.trim() },
    ]);
    setShowCreateModal(false);
    setCreateTitle("");
    setCreateContent("");
    createBtnRef.current?.focus();
  }, [createTitle, createContent]);

  const handleDelete = (id: number) => {
    setNotes(notes.filter((n) => n.id !== id));
    if (viewingNote?.id === id) setViewingNote(null);
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header
          title="Notes"
          showSearch
          action={
            canCreateNote && notes.length > 0 && (
              <button ref={createBtnRef} className="btn-primary" onClick={() => setShowCreateModal(true)}>
                Create Note
              </button>
            )
          }
        />

        <main
          className="flex-1 relative overflow-auto"
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.03), rgba(139,92,246,0.03))",
          }}
        >
          <div className="max-w-3xl mx-auto p-6">
            {isLoading ? (
              <SkeletonList count={4} />
            ) : notes.length === 0 ? (
              <EmptyState
                title="No notes yet"
                description={
                  isViewer
                    ? "You can only view notes."
                    : "Start by creating your first note."
                }
                action={
                  canCreateNote && (
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                      Create your first note
                    </button>
                  )
                }
              />
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1">Your Notes</h3>
                <p className="text-sm text-muted mb-6">{notes.length} note(s)</p>

                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition"
                    >
                      <button
                        className="flex-1 text-left"
                        onClick={() => setViewingNote(note)}
                      >
                        <h4 className="font-semibold text-gray-900 truncate">
                          {note.title}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {note.content || "No content"}
                        </p>
                      </button>

                      {canDeleteNote && (
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="text-red-500 hover:bg-red-50 rounded-lg p-2"
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && canCreateNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">New Note</h2>

            <input
              className="w-full border rounded-lg px-3 py-2 mb-3"
              placeholder="Title"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              maxLength={TITLE_MAX_LENGTH}
            />

            <textarea
              className="w-full border rounded-lg px-3 py-2 mb-4"
              placeholder="Content (optional)"
              rows={4}
              value={createContent}
              onChange={(e) => setCreateContent(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">{viewingNote.title}</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {viewingNote.content || "No content"}
            </p>
            <div className="flex justify-end mt-6">
              <button className="btn-secondary" onClick={() => setViewingNote(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
