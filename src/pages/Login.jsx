import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dog } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Field, { inputCls } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { InlineBanner } from '../components/ui/ErrorState';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required.';
    if (!password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setSubmitError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center mb-3">
            <Dog size={26} className="text-white" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-xl font-semibold text-stone-900">Paws Log</h1>
          <p className="text-sm text-stone-500">Sign in to manage dog-sitting jobs</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-5" noValidate>
          <InlineBanner message={submitError} />
          <Field label="Email" required error={errors.email} htmlFor="login-email">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password" required error={errors.password} htmlFor="login-password">
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
