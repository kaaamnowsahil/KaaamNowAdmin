import { useState, type FormEvent } from 'react';

import { loginAdmin } from '@/api/auth';
import { ApiError, getApiBaseUrl } from '@/api/client';

type UseAdminSignInOptions = {
  onSignedIn: (token: string) => void;
};

export function useAdminSignIn({ onSignedIn }: UseAdminSignInOptions) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSignedIn(await loginAdmin(email.trim(), password));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    email,
    error,
    getApiBaseUrl,
    handleSubmit,
    password,
    setEmail,
    setPassword,
    setShowPassword,
    showPassword,
  };
}
