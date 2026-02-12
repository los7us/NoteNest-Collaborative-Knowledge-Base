import { Server as SocketIOServer, Socket } from "socket.io";
// import jwt from 'jsonwebtoken'; // Unused in this file apparently or handled by socket.io middleware? Kept it safe in original, but line 2 was jwt.
import jwt from 'jsonwebtoken';
import Note from "./models/Note";
import NoteVersion from "./models/NoteVersion";
import Workspace from "./models/Workspace";
import User from "./models/User";
import { AuditService } from "./services/auditService";
import { YjsProvider } from "./yjsProvider";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  workspaceId?: string;
}

const activeUsers: Map<string, Set<string>> = new Map(); // noteId -> Set of userIds



export default function setupSocketHandlers(io: SocketIOServer) {
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      // TODO: Verify JWT token and extract userId
      socket.userId = token;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    socket.on("join-note", async (data: { noteId: string; workspaceId: string }) => {
      const { noteId, workspaceId } = data;

      // Validate access
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace || !workspace.members.some(m => m.userId === socket.userId!)) {
        socket.emit("error", { message: "Access denied" });
        return;
      }

      const note = await Note.findOne({ _id: noteId, workspaceId });
      if (!note) {
        socket.emit("error", { message: "Note not found" });
        return;
      }

      socket.workspaceId = workspaceId;
      socket.join(`note-${noteId}`);
      console.log(`User ${socket.userId} joined note ${noteId}`);

    // Y.js collaboration events
    socket.on("join-note-yjs", (data: { noteId: string; workspaceId: string }) => {
      // Delegate to YjsProvider
      socket.emit("yjs-ready", { noteId: data.noteId });
    });

    socket.on("leave-note", (noteId: string) => {
      socket.leave(`note-${noteId}`);

      // Send initial sync step 1 to client so they can respond with their state
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, syncProtocol.messageYjsSyncStep1);
      syncProtocol.writeSyncStep1(encoder, doc);
      socket.emit("yjs-sync", encoding.toUint8Array(encoder));
    });

    socket.on("update-note", async (data: { noteId: string; title: string; content: string; expectedVersion?: number }) => {
      const { noteId, title, content, expectedVersion } = data;

      // Validate note and permissions with OCC
      const note = await Note.findOne({ _id: noteId, workspaceId: socket.workspaceId }) as any;
      if (!note) {
        socket.emit("error", { message: "Note not found" });
        return;
      }

    // Custom Y.js Update Handler to Broadcast
    // The client sends binary update
    socket.on("yjs-update", async (data: { noteId: string, update: Uint8Array }) => {
      const doc = await getYDoc(data.noteId);
      const update = new Uint8Array(data.update);

      // Apply update to server doc
      // This triggers the 'update' event on the doc, which saves to DB
      // We also need to broadcast this update to all other clients in the room
      try {
        // Apply update using Y.js service logic or directly
        // Using internal api for basic Apply
        // Actually, let's just use the service helper if we can, but simpler here:
        const Y = await import('yjs');
        Y.applyUpdate(doc, update);

        // Broadcast to other clients in the room
        socket.to(`note-${data.noteId}`).emit("yjs-update", update);
      } catch (e) {
        console.error("Error applying update", e);
      }

      // OCC check
      if (expectedVersion !== undefined && note.version !== expectedVersion) {
        socket.emit('note-update-conflict', {
          noteId,
          conflict: {
            error: 'Conflict',
            message: 'Note has been updated by another user. Please refresh and try again.',
            currentVersion: note.version,
            expectedVersion,
            serverData: {
              title: note.title,
              content: note.content,
              updatedAt: note.updatedAt
            },
            guidance: 'Fetch the latest version, merge your changes manually, and retry the update.'
          },
          clientChanges: { title, content }
        });
        return;
      }

      // Update note with incremented version
      note.title = title;
      note.content = content;
      note.version = note.version + 1;
      note.updatedAt = new Date();
      await note.save();

      // Create version using PersistenceManager
      const persistence = require('./persistence').PersistenceManager.getInstance();
      await persistence.createVersion(noteId, socket.userId!, socket.workspaceId!, "Real-time edit");

      // Log audit
      await AuditService.logEvent(
        "note_updated",
        socket.userId!,
        socket.workspaceId!,
        noteId,
        "note",
        { title, version: note.version }
      );

      // Broadcast update to room
      socket.to(`note-${noteId}`).emit("note-updated", { noteId, title, content, updatedBy: socket.userId });

      console.log(`Note ${noteId} updated by ${socket.userId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}
