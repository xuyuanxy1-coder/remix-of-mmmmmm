import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MetaMaskLogo from '@/components/MetaMaskLogo';
import { toast } from 'sonner';
import { User, Plus, Wallet, Send } from 'lucide-react';

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
    // Simulated login
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
    // Simulated registration
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
    
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Randomly succeed or fail for demo
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 lg:px-8 py-4">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <MetaMaskLogo size={32} />
          <span className="font-display font-semibold text-lg">MetaMask Trade</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Form Section */}
          <div className="max-w-md w-full mx-auto lg:mx-0">
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-8">
              Welcome to MetaMask Trade
            </h1>

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Username Field */}
                <div className="relative">
                  <Label className="absolute -top-2.5 left-3 bg-background px-1 text-xs text-muted-foreground">
                    Username:
                  </Label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-14 bg-muted/30 border-muted"
                    placeholder="Enter your username"
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <Label className="absolute -top-2.5 left-3 bg-background px-1 text-xs text-muted-foreground">
                    Password:
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-muted/30 border-muted"
                    placeholder="Enter your password"
                  />
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 rounded-full"
                >
                  Login
                </Button>

                {/* Connect Wallet Button */}
                <Button
                  type="button"
                  onClick={() => setIsWalletModalOpen(true)}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-cyan-900 rounded-full"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet
                </Button>

                {/* Register Link */}
                <div className="text-center pt-4">
                  <p className="text-muted-foreground">I don't have an account</p>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-muted-foreground hover:text-foreground underline mt-1"
                  >
                    Register
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Email Field */}
                <div className="relative">
                  <Label className="absolute -top-2.5 left-3 bg-background px-1 text-xs text-muted-foreground">
                    Email:
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 bg-muted/30 border-muted"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Username Field */}
                <div className="relative">
                  <Label className="absolute -top-2.5 left-3 bg-background px-1 text-xs text-muted-foreground">
                    Username:
                  </Label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-14 bg-muted/30 border-muted"
                    placeholder="Choose a username"
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <Label className="absolute -top-2.5 left-3 bg-background px-1 text-xs text-muted-foreground">
                    Password:
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-muted/30 border-muted"
                    placeholder="Create a password"
                  />
                </div>

                {/* Confirm Password Field */}
                <div className="relative">
                  <Label className="absolute -top-2.5 left-3 bg-background px-1 text-xs text-muted-foreground">
                    Confirm Password:
                  </Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 bg-muted/30 border-muted"
                    placeholder="Confirm your password"
                  />
                </div>

                {/* Verification Code Field */}
                <div className="relative">
                  <Label className="absolute -top-2.5 left-3 bg-background px-1 text-xs text-muted-foreground">
                    Verification Code:
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="h-14 bg-muted/30 border-muted flex-1"
                      placeholder="Enter code"
                    />
                    <Button
                      type="button"
                      onClick={handleSendCode}
                      variant="outline"
                      className="h-14 px-6 rounded-full border-primary text-primary hover:bg-primary/10"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Send
                    </Button>
                  </div>
                </div>

                {/* Sign Up Button */}
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 rounded-full"
                >
                  Sign-up with Email
                </Button>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <p className="text-muted-foreground">Already have an account?</p>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-foreground font-semibold hover:underline mt-1"
                  >
                    Login
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Illustration Section (only for register) */}
          {mode === 'register' && (
            <div className="hidden lg:flex flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                {/* Card Illustration */}
                <div className="w-48 h-48 bg-muted/50 rounded-3xl flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <User className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                    <div className="w-16 h-1 bg-muted-foreground/30 mx-auto" />
                  </div>
                </div>
                {/* Plus Icon */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-background border-2 border-primary rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              <h2 className="font-display text-2xl font-bold mb-4">
                Sign up and embark on<br />your prosperous<br />investment journey!
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Complete your registration and unlock the gateway to a world of exciting investment opportunities, paving the way for financial success and growth!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Connect Wallet Modal */}
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Network</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <button
              onClick={() => handleConnectWallet('Ethereum Network')}
              disabled={isConnecting}
              className="w-full p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xl">⟠</span>
                </div>
                <div>
                  <p className="font-semibold">Ethereum Network</p>
                  <p className="text-sm text-muted-foreground">
                    {isConnecting ? 'Connecting...' : 'Connect Ethereum network wallet'}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleConnectWallet('BSC Network')}
              disabled={isConnecting}
              className="w-full p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xl">🟡</span>
                </div>
                <div>
                  <p className="font-semibold">BSC Network</p>
                  <p className="text-sm text-muted-foreground">
                    {isConnecting ? 'Connecting...' : 'Connect BNB Smart Chain wallet'}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleConnectWallet('Polygon Network')}
              disabled={isConnecting}
              className="w-full p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xl">🟣</span>
                </div>
                <div>
                  <p className="font-semibold">Polygon Network</p>
                  <p className="text-sm text-muted-foreground">
                    {isConnecting ? 'Connecting...' : 'Connect Polygon network wallet'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
