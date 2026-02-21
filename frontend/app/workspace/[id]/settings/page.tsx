"use client";

import { useEffect, useState, use } from "react";
import { apiService } from "@/lib/api";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Settings, Users, Mail, UserPlus, X, ShieldAlert } from "lucide-react";
import { Workspace } from "@/lib/api";

export default function WorkspaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { workspaces } = useWorkspace();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [error, setError] = useState("");

  const fetchWorkspaceAndInvites = async () => {
    try {
      setLoading(true);
      // Wait for workspace to be available in context since backend doesn't have a GET /:id route
      const ws = workspaces.find(w => w.id === id);
      if (ws) {
        setWorkspace(ws as any);
      }
      
      const invitesData = await apiService.getInvites(id);
      setInvites(invitesData);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceAndInvites();
  }, [id, workspaces]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      await apiService.createInvite(id, inviteEmail, inviteRole);
      setInviteEmail("");
      await fetchWorkspaceAndInvites();
    } catch (err: any) {
      setError(err.message || "Failed to send invite");
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      setError("");
      await apiService.revokeInvite(id, inviteId);
      await fetchWorkspaceAndInvites();
    } catch (err: any) {
      setError(err.message || "Failed to revoke invite");
    }
  };

  const currentUserId = typeof window !== 'undefined' ? 
    (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : null) : null;

  if (loading) return <div className="p-8 text-gray-400">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 text-white min-h-screen">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-purple-500" />
        Workspace Settings
      </h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Invite Section */}
      <div className="bg-[#0b0b0b] border border-[#1f1f1f] rounded-xl shadow-sm mb-8 overflow-hidden" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>
        <div className="bg-[#111] border-b border-[#222] px-6 py-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Invite Members</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full border border-gray-700 bg-[#0f0f0f] text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none placeholder-gray-600 transition"
                required
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full border border-gray-700 bg-[#0f0f0f] text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none transition"
              >
                <option value="viewer">Viewer</option>
                <option value="commenter">Commenter</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 transition-colors font-medium whitespace-nowrap"
            >
              Send Invite
            </button>
          </form>
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="bg-[#0b0b0b] border border-[#1f1f1f] rounded-xl shadow-sm mb-8 overflow-hidden" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>
          <div className="bg-[#111] border-b border-[#222] px-6 py-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Pending Invitations</h2>
          </div>
          <div className="divide-y divide-[#222]">
            {invites.map((invite) => (
              <div key={invite._id} className="flex items-center justify-between p-4 sm:px-6 hover:bg-[#0f0f0f] transition">
                <div>
                  <div className="font-medium text-gray-200">{invite.email}</div>
                  <div className="text-sm text-purple-400 capitalize">Role: {invite.role}</div>
                </div>
                <button
                  onClick={() => handleRevoke(invite._id)}
                  className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Temporary Member Note */}
      <div className="bg-[#0b0b0b] border border-[#1f1f1f] rounded-xl shadow-sm overflow-hidden text-gray-400" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>
        <div className="bg-[#111] border-b border-[#222] px-6 py-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Workspace Members</h2>
        </div>
        <div className="p-6">
          <p>
            You can view workspace members in the main workspace view. Role management and deletion are handled via context menus on member avatars in a full implementation, or directly via the <code className="bg-[#1f1f1f] text-purple-400 px-1.5 py-0.5 rounded text-sm">/api/workspaces/:id/members/:userId</code> APIs.
          </p>
        </div>
      </div>
    </div>
  );
}
