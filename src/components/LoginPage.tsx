'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PageTitle } from './ui/Text';

export function LoginPage() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [otpCode, setOtpCode] = useState('');
 const [showOtp, setShowOtp] = useState(false);
 const [loading, setLoading] = useState(false);
 const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
 const [isMounted, setIsMounted] = useState(false);
 const [isDev, setIsDev] = useState(false);
 const [isRecovery, setIsRecovery] = useState(false);

 useEffect(() => {
  setIsMounted(true);
  
  // Detect recovery mode from URL hash
  if (window.location.hash.includes('type=recovery')) {
   setIsRecovery(true);
  }

  const isLocalhost = window.location.hostname === 'localhost';
  setIsDev(isLocalhost && process.env.NODE_ENV === 'development');
  
  // Auto-fill email if configured
  const devEmail = process.env.NEXT_PUBLIC_AUTH_EMAIL;
  if (isLocalhost && devEmail) {
   setEmail(devEmail);
  }
 }, []);

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage(null);

  const authorizedEmail = process.env.NEXT_PUBLIC_AUTH_EMAIL;
  
  // Strict client-side check for the authorized email
  if (authorizedEmail && email.toLowerCase() !== authorizedEmail.toLowerCase()) {
   setMessage({ type: 'error', text: 'Unauthorized email address. Access denied.' });
   setLoading(false);
   return;
  }

  try {
   if (isRecovery) {
    // Password Recovery Flow
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setMessage({ type: 'success', text: 'Password updated successfully! You can now log in.' });
    setIsRecovery(false);
    setPassword('');
   } else if (isDev && password) {
    // Developer Password Login Bypassing OTP
    const { error } = await supabase.auth.signInWithPassword({
     email,
     password,
    });
    if (error) throw error;
   } else if (showOtp) {
    // Step 2: Verify OTP
    const { error } = await supabase.auth.verifyOtp({
     email,
     token: otpCode,
     type: 'magiclink',
    });
    if (error) throw error;
   } else {
    // Step 1: Send OTP
    const { error } = await supabase.auth.signInWithOtp({
     email,
     options: {
      emailRedirectTo: `${window.location.origin}/my-dashboard/`,
     },
    });
    if (error) throw error;
    setShowOtp(true);
    setMessage({ type: 'success', text: 'Check your email for the 6-digit code!' });
   }
  } catch (error: any) {
   setMessage({ type: 'error', text: error.message || 'An error occurred during sign in.' });
  } finally {
   setLoading(false);
  }
 };

 if (!isMounted) return null;

 return (
 <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] z-[9999]">
 {/* Background Decorative Elements */}
 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
 <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
 <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
 </div>

 <div className="relative w-full max-w-md p-8 mx-4 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
 <div className="flex flex-col items-center mb-8">
 <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
 <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
 </svg>
 </div>
  <PageTitle className="text-white">
   {isRecovery ? 'Set New Password' : (showOtp ? 'Enter Code' : 'Access Locked')}
  </PageTitle>
  <p className="text-gray-400 mt-2 text-center text-sm">
   {isRecovery 
     ? 'Create a secure password for your account.' 
     : showOtp 
       ? 'Enter the 6-digit code sent to your email.' 
       : 'Enter your authorized email to receive a login code.'}
  </p>
 </div>

  <form onSubmit={handleLogin} className="space-y-4">
  {!isRecovery && !showOtp && (
  <div>
  <label htmlFor="email" className="block text-xs font-medium text-gray-400 uppercase mb-1.5 ml-1">
  Email Address
  </label>
  <input
  id="email"
  type="email"
  placeholder="name@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
  />
  </div>
  )}

  {showOtp && !isRecovery && (
  <div className="animate-in fade-in slide-in-from-top-2 duration-500">
  <label htmlFor="otp" className="block text-xs font-medium text-blue-400 uppercase mb-1.5 ml-1">
  Verification Code
  </label>
  <input
  id="otp"
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="00000000"
  maxLength={8}
  value={otpCode}
  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
  required
  autoFocus
  className="w-full px-4 py-3 bg-[#1a1a1a] border border-blue-500/30 rounded-xl text-white text-center text-2xl tracking-[0.3em] placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
  />
  <button 
    type="button" 
    onClick={() => setShowOtp(false)}
    className="mt-2 text-xs text-gray-500 hover:text-white transition-colors ml-1"
  >
    ← Use a different email
  </button>
  </div>
  )}

  {(isDev || isRecovery) && (
  <div className="animate-in fade-in slide-in-from-top-2 duration-500">
  <label htmlFor="password" d-id="dev-password-label" className="flex items-center justify-between text-xs font-medium text-amber-500/80 uppercase mb-1.5 ml-1">
  <span>{isRecovery ? 'New Password' : 'Developer Password'}</span>
  <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
   {isRecovery ? 'Security Update' : 'Local Bypass'}
  </span>
  </label>
  <input
  id="password"
  type="password"
  placeholder={isRecovery ? 'Min 6 characters' : 'Enter local dev password'}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required={isRecovery}
  className="w-full px-4 py-3 bg-[#1a1a1a] border border-amber-500/20 rounded-xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all duration-200"
  />
  </div>
  )}

  <button
  type="submit"
  disabled={loading}
  className={`group relative w-full flex items-center justify-center px-4 py-3.5 font-semibold rounded-xl transition-all duration-200 overflow-hidden ${
  (isDev && password) || isRecovery 
  ? 'bg-amber-500 text-black hover:bg-amber-400' 
  : showOtp
    ? 'bg-blue-600 text-white hover:bg-blue-500'
    : 'bg-white text-black hover:bg-gray-100'
  } disabled:opacity-50 disabled:cursor-not-allowed`}
  >
  {loading ? (
  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
  ) : (
  <span className="flex items-center">
  {isRecovery 
    ? 'Update Password' 
    : (isDev && password 
      ? 'Developer Login' 
      : (showOtp ? 'Verify Code' : 'Send Code'))}
  <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
  </span>
  )}
  </button>
  </form>

 {message && (
 <div className={`mt-6 p-4 rounded-xl text-sm font-medium border ${ message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400' } animate-in fade-in slide-in-from-top-2 duration-300`}>
 {message.text}
 </div>
 )}

 <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
 <p className="text-xs text-gray-500 uppercase">
 &copy; {new Date().getFullYear()} Security System Active
 </p>
 </div>
 </div>
 </div>
 );
}
