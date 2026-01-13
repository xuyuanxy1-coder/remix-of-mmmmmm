import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MetaMaskLogo from '@/components/MetaMaskLogo';
import { toast } from 'sonner';
import { Wallet, Send, Shield, Sparkles, TrendingUp, Lock } from 'lucide-react';

type AuthMode = 'login' | 'register';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Login successful!');
    navigate('/');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!verificationCode.trim()) {
      toast.error('Please enter verification code');
      return;
    }
    toast.success('Registration successful! Please login.');
    setMode('login');
  };

  const handleSendCode = () => {
    if (!email.trim()) {
      toast.error('Please enter your email first');
      return;
    }
    toast.success('Verification code sent to your email');
  };

  const handleConnectWallet = async (network: string) => {
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.3;
    setIsConnecting(false);
    setIsWalletModalOpen(false);
    
    if (success) {
      toast.success(`Successfully connected to ${network}!`);
      navigate('/');
    } else {
      toast.error(`Failed to connect to ${network}. Please try again.`);
    }
  };

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
                    <label className="text-sm font-medium text-foreground">Username</label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                      placeholder="Enter your username"
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
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold gold-gradient text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Login
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setIsWalletModalOpen(true)}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet
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
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20"
                      placeholder="Create a password"
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
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Verification Code</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="h-12 bg-muted/50 border-border/50 rounded-xl focus:border-primary focus:ring-primary/20 flex-1"
                        placeholder="Enter code"
                      />
                      <Button
                        type="button"
                        onClick={handleSendCode}
                        variant="outline"
                        className="h-12 px-4 rounded-xl border-primary text-primary hover:bg-primary/10"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold gold-gradient text-primary-foreground rounded-xl hover:opacity-90 transition-opacity mt-2"
                  >
                    Create Account
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

      {/* Connect Wallet Modal */}
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Select Network</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {[
              { name: 'Ethereum Network', desc: 'Connect Ethereum network wallet', icon: '⟠', color: 'from-blue-500/20 to-purple-500/20' },
              { name: 'BSC Network', desc: 'Connect BNB Smart Chain wallet', icon: '🟡', color: 'from-yellow-500/20 to-orange-500/20' },
              { name: 'Polygon Network', desc: 'Connect Polygon network wallet', icon: '🟣', color: 'from-purple-500/20 to-pink-500/20' },
            ].map((network) => (
              <button
                key={network.name}
                onClick={() => handleConnectWallet(network.name)}
                disabled={isConnecting}
                className={`w-full p-4 bg-gradient-to-r ${network.color} border border-border rounded-xl hover:border-primary/50 transition-all text-left disabled:opacity-50 group`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                    {network.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{network.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {isConnecting ? 'Connecting...' : network.desc}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
