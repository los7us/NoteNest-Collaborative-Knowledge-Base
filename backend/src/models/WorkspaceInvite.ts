import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspaceInvite extends Document {
    workspaceId: string;
    email: string;
    role: 'admin' | 'editor' | 'commenter' | 'viewer';
    token: string;
    inviterId: string;
    expiresAt: Date;
    status: 'pending' | 'accepted' | 'revoked';
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceInviteSchema: Schema = new Schema({
    workspaceId: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['admin', 'editor', 'commenter', 'viewer'], required: true },
    token: { type: String, required: true, unique: true },
    inviterId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

WorkspaceInviteSchema.index({ token: 1 });
WorkspaceInviteSchema.index({ workspaceId: 1, email: 1 });
WorkspaceInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IWorkspaceInvite>('WorkspaceInvite', WorkspaceInviteSchema);
