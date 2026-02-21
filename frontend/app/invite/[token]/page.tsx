"use client";

import { useEffect, useState, use } from "react";
import { apiService } from "@/lib/api";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check login status
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Fetch invite details
    apiService.getInviteDetails(token!)
      .then((data) => {
        setInvite(data);
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired invite");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");
    try {
      await apiService.acceptInvite(token);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse flex items-center gap-3 text-gray-400 font-medium">
          <div className="w-5 h-5 border-2 border-[#333] border-t-purple-500 rounded-full animate-spin"></div>
          Verifying invitation...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <div className="bg-[#0b0b0b] border border-[#1f1f1f] max-w-md w-full p-8 rounded-2xl shadow-xl text-center" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Invitation Unavailable</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <Link 
            href="/dashboard"
            className="inline-flex bg-[#1f1f1f] border border-[#333] hover:bg-[#222] text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <div className="bg-[#0b0b0b] border border-[#1f1f1f] max-w-md w-full p-8 rounded-2xl shadow-xl text-center" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Invitation Accepted!</h1>
          <p className="text-gray-400 mb-8">You are now a <span className="text-purple-400">{invite?.role}</span> in <span className="text-white font-medium">{invite?.workspaceName}</span>. Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-4">
      <div className="bg-[#0b0b0b] border border-[#1f1f1f] max-w-md w-full p-8 rounded-2xl shadow-xl" style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 tracking-tight text-white">You've been invited!</h1>
          <p className="text-gray-400 text-lg">
            Join <span className="font-bold text-white">{invite?.workspaceName}</span> as a <span className="capitalize font-medium text-purple-400">{invite?.role}</span>
          </p>
        </div>

        {isLoggedIn ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-70 text-white font-medium text-lg px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            {accepting ? "Accepting..." : "Accept Invitation"}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-xl text-sm mb-6 border border-yellow-500/20">
              You need to sign in or create an account to accept this invitation.
            </div>
            <Link
              href={`/login?redirect=/invite/${token}`}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium text-lg px-6 py-3 rounded-xl transition-colors flex items-center justify-between"
            >
              Log In
              <ArrowRight className="w-5 h-5 text-white/50" />
            </Link>
            <Link
              href={`/signup?redirect=/invite/${token}`}
              className="w-full bg-[#1f1f1f] hover:bg-[#222] text-white font-medium text-lg px-6 py-3 rounded-xl border border-[#333] transition-colors flex items-center justify-between"
            >
              Sign Up
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
