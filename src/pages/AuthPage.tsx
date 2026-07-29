import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader as Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleIcon } from '@/components/GoogleIcon';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = isSignup
      ? await signUp({ email, password, fullName, orgName })
      : await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/app');
    }
  };

  const inputCls =
    'w-full rounded-btn border border-edge bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-safe focus:outline-none transition-colors';

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <Zap size={24} className="text-safe" />
        <span className="font-display font-bold text-2xl tracking-tight">Tripwire</span>
      </Link>
      <div className="w-full max-w-sm rounded-card border border-edge bg-surface/50 p-8">
        <h1 className="text-xl font-semibold mb-1">
          {isSignup ? 'Create your account' : 'Sign in'}
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {isSignup
            ? 'Start tracking renewals in under a minute.'
            : 'Welcome back to the control room.'}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignup && (
            <>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Your name
                </label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Company or team name
                </label>
                <input
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Inc."
                  className={inputCls}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Password
            </label>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
              className={inputCls}
            />
          </div>
          {error && (
            <p className="text-sm text-urgent bg-urgent/10 border border-urgent/30 rounded-btn px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-btn bg-safe px-4 py-2.5 text-sm font-semibold text-bg hover:bg-safe/90 disabled:opacity-60 transition-colors"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-edge" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface px-2 text-xs text-text-secondary">or</span>
          </div>
        </div>
        <button
          onClick={signInWithGoogle}
          className="w-full inline-flex items-center justify-center gap-2.5 rounded-btn border border-edge bg-bg px-4 py-2.5 text-sm font-medium text-text-primary hover:border-text-secondary transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <p className="mt-6 text-sm text-text-secondary text-center">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <Link to="/login" className="text-safe hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{' '}
              <Link to="/signup" className="text-safe hover:underline">
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
