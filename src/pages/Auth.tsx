import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MetaMaskLogo from '@/components/MetaMaskLogo';
import { toast } from 'sonner';
import { Sparkles, TrendingUp, Lock, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'login' | 'register';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await login(email.trim(), password.trim());
      
      if (error) {
        toast.error(error);
      } else {
        toast.success('Login successful!');
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await register(email.trim(), password.trim(), username.trim());
      
      if (error) {
        toast.error(error);
      } else {
        toast.success('Registration successful! You are now logged in.');
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm px-4 lg:px-8 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <MetaMaskLogo size={32} />
            <span className="font-display font-semibold text-lg">MetaMask Trade</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto items-center min-h-[calc(100vh-200px)]">
          
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Secure & Trusted</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-display font-bold leading-tight">
                {mode === 'login' 
                  ? 'Welcome Back to MetaMask Trade' 
                  : 'Start Your Investment Journey'}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {mode === 'login'
                  ? 'Access your portfolio and continue trading with the most secure platform.'
                  : 'Complete your registration and unlock the gateway to exciting investment opportunities.'}
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-4">
              <div className="feature-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Bank-Level Security</h3>
                  <p className="text-sm text-muted-foreground">256-bit encryption for all transactions</p>
                </div>
              </div>
              <div className="feature-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Real-Time Trading</h3>
                  <p className="text-sm text-muted-foreground">Trade 350+ cryptocurrencies instantly</p>
                </div>
              </div>
              <div className="feature-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Self-Custody</h3>
                  <p className="text-sm text-muted-foreground">You control your private keys</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl backdrop-blur-sm">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                <MetaMaskLogo size={40} />
                <span className="font-display font-semibold text-xl">MetaMask Trade</span>
              </div>

              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  {mode === 'login' 
                    ? 'Enter your credentials to access your account' 
                    : 'Fill in your details to get started'}
                </p>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold gold-gradient text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-muted-foreground text-sm">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="text-primary font-semibold hover:underline"
                      >
                        Sign up
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Username</label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                      placeholder="Choose a username"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                      placeholder="Create a password (min 6 chars)"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold gold-gradient text-primary-foreground rounded-xl hover:opacity-90 transition-opacity mt-2"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-muted-foreground text-sm">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-primary font-semibold hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
