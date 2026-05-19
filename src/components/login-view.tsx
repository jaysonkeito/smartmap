'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/store/app-store';

export function LoginView() {
  const { login, setFlashMessage, flashMessage } = useAppStore();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Activation flow
  const [needsActivation, setNeedsActivation] = useState(false);
  const [activationUserId, setActivationUserId] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    if (!activationUserId) return;
    setIsActivating(true);
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activationUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setNeedsActivation(false);
        setFlashMessage({ type: 'success', text: 'Account activated! Please sign in again.' });
        setActivationUserId('');
        setPassword('');
      } else {
        setFlashMessage({ type: 'error', text: data.error || 'Activation failed' });
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Activation failed. Please try again.' });
    } finally {
      setIsActivating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: idNumber, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          setFlashMessage({ type: 'error', text: data.error });
        } else {
          setFlashMessage({
            type: 'success',
            text: 'Account created! You can now sign in.',
          });
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: idNumber, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          setFlashMessage({ type: 'error', text: data.error });
        } else if (data.needsActivation) {
          // Show activation dialog
          setActivationUserId(data.user?.userId || idNumber);
          setNeedsActivation(true);
        } else {
          login(data.user);
          setFlashMessage({
            type: 'success',
            text: `Welcome, ${data.user.name}!`,
          });
        }
      }
    } catch {
      setFlashMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
            >
              <GraduationCap className="h-9 w-9 text-emerald-700" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-emerald-800">
              NORSU SmartMap
            </CardTitle>
            <CardDescription className="text-emerald-600 font-medium">
              Bayawan—Santa Catalina Campus
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {flashMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
                  flashMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {flashMessage.text}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id-number" className="text-sm font-medium">
                  ID Number
                </Label>
                <Input
                  id="id-number"
                  type="text"
                  maxLength={20}
                  placeholder="Enter your ID Number"
                  value={idNumber}
                  onChange={(e) =>
                    setIdNumber(e.target.value.trim())
                  }
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                disabled={isLoading || idNumber.length === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setFlashMessage(null);
                }}
                className="text-sm text-emerald-700 hover:text-emerald-800 hover:underline font-medium transition-colors"
              >
                {isSignUp
                  ? 'Already have a password? Sign In'
                  : "Don't have a password? Sign Up"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-emerald-200 mt-4">
          Negros Oriental State University &copy; {new Date().getFullYear()}
        </p>
      </motion.div>

      {/* Activation Dialog */}
      <Dialog open={needsActivation} onOpenChange={(open) => {
        if (!open) {
          setNeedsActivation(false);
          setActivationUserId('');
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Account Re-Activation Required
            </DialogTitle>
            <DialogDescription>
              Your account requires re-activation due to 3 days of inactivity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To continue using your account, please activate it by clicking the button below.
              This will restore your access immediately.
            </p>
            <Button
              onClick={handleActivate}
              disabled={isActivating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isActivating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Activate Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
