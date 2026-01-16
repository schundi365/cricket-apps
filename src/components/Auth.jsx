import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('error'); // 'error' or 'success'

  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (showResetPassword) {
        // Password reset
        const { error } = await resetPassword(email);
        if (error) {
          setMessage(error.message || 'Failed to send reset email');
          setMessageType('error');
        } else {
          setMessage('Password reset email sent! Please check your inbox.');
          setMessageType('success');
          setEmail('');
          // Switch back to login after 3 seconds
          setTimeout(() => {
            setShowResetPassword(false);
            setMessage(null);
          }, 3000);
        }
      } else if (isLogin) {
        // Login
        const { error } = await signIn(email, password);
        if (error) {
          setMessage(error.message || 'Failed to sign in');
          setMessageType('error');
        }
      } else {
        // Sign up
        if (password !== confirmPassword) {
          setMessage('Passwords do not match');
          setMessageType('error');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setMessage('Password must be at least 6 characters');
          setMessageType('error');
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password);
        if (error) {
          setMessage(error.message || 'Failed to sign up');
          setMessageType('error');
        } else {
          setMessage('Account created! Please check your email to verify your account.');
          setMessageType('success');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (error) {
      setMessage(error.message || 'An error occurred');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-green-600 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">MK Air Cricket Club</h1>
          <p className="text-gray-600 mt-2">Training Skills Tracker</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {!showResetPassword && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setMessage(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isLogin
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <LogIn className="inline mr-2" size={18} />
                Login
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setMessage(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  !isLogin
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <UserPlus className="inline mr-2" size={18} />
                Sign Up
              </button>
            </div>
          )}

          {showResetPassword && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h2>
              <p className="text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
                messageType === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-green-50 border border-green-200'
              }`}
            >
              {messageType === 'error' ? (
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              ) : (
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              )}
              <p
                className={`text-sm ${
                  messageType === 'error' ? 'text-red-700' : 'text-green-700'
                }`}
              >
                {message}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            {!showResetPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                {!isLogin && (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 6 characters
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password (Sign Up only) */}
            {!isLogin && !showResetPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Please wait...</span>
                </>
              ) : (
                <>
                  {showResetPassword ? (
                    <>
                      <Mail size={20} />
                      <span>Send Reset Link</span>
                    </>
                  ) : isLogin ? (
                    <>
                      <LogIn size={20} />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} />
                      <span>Create Account</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          {isLogin && !showResetPassword && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setShowResetPassword(true);
                  setMessage(null);
                  setPassword('');
                }}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {showResetPassword ? (
              <p>
                Remember your password?{' '}
                <button
                  onClick={() => {
                    setShowResetPassword(false);
                    setIsLogin(true);
                    setMessage(null);
                  }}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Back to login
                </button>
              </p>
            ) : isLogin ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setMessage(null);
                  }}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setMessage(null);
                  }}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2026 MK Air Cricket Club. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
