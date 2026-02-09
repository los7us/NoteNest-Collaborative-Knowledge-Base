import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "NoteNest backend running",
  });
});

app.get("/notes", (_req: Request, res: Response) => {
  res.json([
    {
      id: "1",
      title: "Getting Started with NoteNest",
      content: "Welcome to NoteNest! This is a sample note to demonstrate the notes API.",
      createdAt: "2026-01-15T10:30:00.000Z",
    },
    {
      id: "2",
      title: "Team Collaboration Tips",
      content: "Use tags and folders to organize your team's knowledge base effectively.",
      createdAt: "2026-01-20T14:45:00.000Z",
    },
    {
      id: "3",
      title: "Markdown Support",
      content: "NoteNest supports Markdown formatting for rich text documentation.",
      createdAt: "2026-01-25T09:15:00.000Z",
    },
  ]);
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`📘 NoteNest backend running on http://localhost:${PORT}`);
});
