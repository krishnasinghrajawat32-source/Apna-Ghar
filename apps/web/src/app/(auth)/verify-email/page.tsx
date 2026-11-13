'use client';

import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to login after a brief moment
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-white py-10 px-6 shadow-sm border border-[#ECE8DD] rounded-xl sm:px-10 text-center">
      <div className="w-14 h-14 bg-[#F0F5F2] rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-[#173327]" />
      </div>
      <h3 className="text-lg font-bold text-[#173327] mb-2">
        Email Verification Not Required
      </h3>
      <p className="text-sm text-[#716D64] mb-6 max-w-sm mx-auto">
        Your account is active. Direct login and signup are enabled. Redirecting you to sign in...
      </p>
      <Link
        href="/login"
        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[#173327] text-[#FCFBF7] font-semibold text-sm hover:bg-[#1E4333] transition-colors"
      >
        <span>Proceed to Sign In</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#FCFBF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#173327] flex items-center justify-center text-[#FCFBF7] font-bold text-xl shadow-sm">
            AG
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-[#173327] tracking-tight">
          Apna Ghar
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#716D64]">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
