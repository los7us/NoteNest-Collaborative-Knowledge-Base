"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import SocialProof from "@/components/landing/SocialProof";
import BestPractices from "@/components/landing/BestPractices";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
// Imports commented out to fix build warnings as they are currently unused in the new design
// import { useUserRole } from "@/contexts/UserRoleContext";
// import Link from "next/link";

export default function Home() {
  // Hook commented out as it was part of the legacy implementation
  // const { isAuthenticated } = useUserRole();

  return (
    // Note: A large block of duplicated legacy JSX code was removed here to fix a syntax error.
    // The previous implementation had inadvertently pasted the entire file content again.
    <main className="min-h-screen bg-[#F3F0E6] selection:bg-[#FF6B6B]/20">
      <Navbar />
      <Hero />
      <Features />
      <SocialProof />
      <BestPractices />
      <FAQ />
      <Footer />

      {/* 
        Legacy sections commented out to focus on the new Design Request.
        These will need to be redesigned to match the new Beige/Black aesthetic.
      */}

      {/* <section id="features" className="py-20 bg-gray-50">...</section> */}
      {/* <section className="py-20 bg-blue-600 text-gray-200"">...</section> */}
      {/* <footer className="bg-gray-900 text-gray-200" py-12">...</footer> */}
    </main>
  );
}
