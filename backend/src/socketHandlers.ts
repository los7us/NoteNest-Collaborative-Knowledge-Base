import { Server as SocketIOServer, Socket } from "socket.io";
// import jwt from 'jsonwebtoken'; // Unused in this file apparently or handled by socket.io middleware? Kept it safe in original, but line 2 was jwt.
import jwt from 'jsonwebtoken';
import Note from "./models/Note";
import NoteVersion from "./models/NoteVersion";
import Workspace from "./models/Workspace";
import User from "./models/User";
import { AuditService } from "./services/auditService";
import { getYDoc, handleYjsMessage } from "./services/yjsService";
import * as syncProtocol from 'y-protocols/sync';
import * as encoding from 'lib0/encoding';

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

      // Initialize Y.js Doc
      const doc = await getYDoc(noteId);

      // Send initial sync step 1 to client so they can respond with their state
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, syncProtocol.messageYjsSyncStep1);
      syncProtocol.writeSyncStep1(encoder, doc);
      socket.emit("yjs-sync", encoding.toUint8Array(encoder));
    });

    socket.on("yjs-sync", async (data: { noteId: string, message: Uint8Array }) => {
      // Handle Y.js sync protocol
      // We expect `data.message` to be a Uint8Array (Buffer in Socket.io)
      const message = new Uint8Array(data.message);

      await handleYjsMessage(data.noteId, message, (response) => {
        // Send response back to sender
        socket.emit("yjs-sync", response);

        // If it was an update, broadcast to others
        // Note: The response from handleYjsMessage is usually a response to the sender (e.g. SyncStep2)
        // But if we received an update (SyncStep2 or Update), we need to broadcast it to others.
        // Actually, handleYjsMessage mainly handles request/response for sync.
        // For broadcasting updates, we need to inspect what happened or just use the doc 'update' event.
        // Optimization: Let the doc 'update' event handle broadcast?
        // No, standard way is: Server receives update -> Applies to Doc -> Broadcasts update message.
      });
    });

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
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}
