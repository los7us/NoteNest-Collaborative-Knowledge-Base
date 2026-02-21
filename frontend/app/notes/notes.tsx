"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  createdAt: number;
}

function loadNotesFromStorage(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotesToStorage(notes: Note[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
}

function formatRelativeTime(timestamp?: number) {
  if (!timestamp) return "Created recently";

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (minutes < 1) return "Created just now";
  if (minutes < 60) return `Created ${minutes} minutes ago`;
  return `Created ${hours} hours ago`;
}

export default function NotesPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const { canCreateNote, isViewer } = usePermissions();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az">("newest");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createTitleError, setCreateTitleError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const createButtonRef = useRef<HTMLButtonElement>(null);

  /* ---------- Initial load ---------- */
  useEffect(() => {
    const stored = loadNotesFromStorage();
    setTimeout(() => {
      setNotes(stored);
      setIsLoading(false);
    }, 500);
  }, []);

  /* ---------- Sync search ---------- */
  useEffect(() => {
    setSearchQuery(search);
  }, [search]);

  /* ---------- Persist ---------- */
  useEffect(() => {
    if (!isLoading) saveNotesToStorage(notes);
  }, [notes, isLoading]);

  /* ---------- Filter ---------- */
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(q) ||
      note.content?.toLowerCase().includes(q)
    );
  });

  /* ---------- Sort (FIXED) ---------- */
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const aTime = a.createdAt ?? a.id;
    const bTime = b.createdAt ?? b.id;

    if (sortBy === "newest") {
      if (bTime !== aTime) return bTime - aTime;
      return b.id - a.id;
    }

    if (sortBy === "oldest") {
      if (aTime !== bTime) return aTime - bTime;
      return a.id - b.id;
    }

    return a.title.localeCompare(b.title);
  });

  /* ---------- Create ---------- */
  const handleCreateNote = () => {
    if (!canCreateNote) return;
    setEditingNoteId(null);
    setCreateTitle("");
    setCreateContent("");
    setCreateTitleError("");
    setShowCreateModal(true);
  };

  /* ---------- Edit ---------- */
  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setCreateTitle(note.title);
    setCreateContent(note.content || "");
    setShowCreateModal(true);
  };

  /* ---------- Submit ---------- */
  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const title = createTitle.trim();
    if (!title) {
      setCreateTitleError("Title is required");
      return;
    }

    setIsSubmitting(true);

    setNotes((prev) =>
      editingNoteId
        ? prev.map((n) =>
            n.id === editingNoteId
              ? { ...n, title, content: createContent }
              : n
          )
        : [
            ...prev,
            {
              id: Date.now(),
              title,
              content: createContent || undefined,
              createdAt: Date.now(),
            },
          ]
    );

    setShowCreateModal(false);
    setEditingNoteId(null);
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-[#0b0b0b]">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header
          title="Notes"
          showSearch
          action={
            canCreateNote && (
              <button
                ref={createButtonRef}
                onClick={handleCreateNote}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
              >
                + Create Note
              </button>
            )
          }
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6">
            {/* Sort */}
            <div className="mb-4 flex justify-end items-center gap-2">
              <span className="text-sm text-gray-400">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "newest" | "oldest" | "az")
                }
                className="bg-white text-black border rounded-lg px-3 py-2 text-sm shadow"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">A–Z</option>
              </select>
            </div>

            {isLoading ? (
              <SkeletonList count={4} />
            ) : sortedNotes.length === 0 ? (
              <EmptyState
                title="No results found"
                description="Try adjusting your search."
              />
            ) : (
              <ul className="space-y-4">
                {sortedNotes.map((note) => (
                  <li
                    key={note.id}
                    className="bg-white rounded-xl p-5 shadow flex justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-semibold text-lg">{note.title}</h4>
                      <p className="text-sm text-gray-500">
                        {formatRelativeTime(note.createdAt)}
                      </p>
                      <p className="text-gray-700 mt-2">
                        {note.content || "No content"}
                      </p>
                    </div>

                    {!isViewer && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEditNote(note)}>✏️</button>
                        <button onClick={() => setNoteToDelete(note)}>🗑️</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingNoteId ? "Edit note" : "New note"}
            </h2>

            <form onSubmit={handleSubmitCreate}>
              <input
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="w-full border p-2 mb-2"
                placeholder="Title"
              />

              {createTitleError && (
                <p className="text-red-600 text-sm mb-2">
                  {createTitleError}
                </p>
              )}

              <textarea
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                className="w-full border p-2 mb-4"
                placeholder="Content (optional)"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}