'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { registerUser } from '@/lib/db';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await registerUser(email, password, name);
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4 relative overflow-hidden">
      <div className="orb w-96 h-96 bg-aurora/8 top-[-10%] right-[-5%]" />
      <div className="orb w-72 h-72 bg-nebula/10 bottom-[-5%] left-[5%]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-nebula to-aurora mb-4 shadow-lg shadow-aurora/30 hover:scale-105 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </Link>
          <h1 className="font-display text-4xl font-light text-star tracking-wide">Serenity</h1>
          <p className="text-twilight text-sm mt-1">Request access to the sanctuary</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-aurora/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-aurora" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-star">Request Submitted</h2>
              <p className="text-twilight text-sm leading-relaxed">
                Your account is pending admin approval. You'll be able to login once an admin activates your account.
              </p>
              <Link href="/login" className="btn-primary inline-block mt-2">
                Back to Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-xl font-medium text-star">Create Account</h2>
              <p className="text-sm text-twilight">
                Accounts require admin approval before access is granted.
              </p>

              <div className="space-y-1">
                <label className="text-sm text-twilight">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-twilight">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-twilight">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-twilight">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="input-field"
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : 'Request Access'}
              </motion.button>

              <p className="text-center text-sm text-twilight">
                Already have access?{' '}
                <Link href="/login" className="text-aurora hover:text-aurora-light transition-colors">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
