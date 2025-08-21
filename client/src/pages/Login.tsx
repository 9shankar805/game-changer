import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { playSound } from "@/lib/soundEffects";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [, setLocation] = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);

      // Play success sound for successful login
      playSound.success();

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });

      setLocation("/");
    } catch (error) {
      // Play error sound for failed login
      playSound.error();

      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      
      playSound.success();
      toast({
        title: "Login Successful",
        description: "Welcome! You have been successfully logged in with Google.",
      });
      
      setLocation('/');
    } catch (error) {
      console.error('Google login error:', error);
      
      playSound.error();
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : 'Could not sign in with Google',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-muted flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold text-foreground">Siraha Bazaar</span>
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <p className="text-muted-foreground">
              Sign in to your account to continue shopping
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="remember" className="text-sm text-muted-foreground">
                      Remember me
                    </label>
                  </div>
                  <Link href="/forgot-password">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-primary hover:underline p-0 h-auto"
                    >
                      Forgot password?
                    </Button>
                  </Link>
                </div>

                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>



            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <GoogleLoginButton 
                onLogin={handleGoogleLogin}
                disabled={isLoading}
                className="mt-4"
              />
            </div>

            <div className="mt-6">
              <div className="text-center">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Create Account
                </Link>
              </div>
            </div>

            {/* Password Reset Info */}
            <div className="mt-6 border-t pt-6">
              <div className="text-center mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    <strong>Password Reset:</strong>
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Enter your email address and click "Forgot password?" to receive reset instructions.
                    Note: Firebase domain authorization may be required for email delivery.
                  </p>
                </div>

                <button 
                  type="button" 
                  onClick={async () => {
                    console.log('🔔 Testing notifications...');
                    
                    // Check support
                    console.log('Support:', {
                      notifications: 'Notification' in window,
                      serviceWorker: 'serviceWorker' in navigator,
                      permission: Notification.permission
                    });
                    
                    // Request permission and test
                    if (Notification.permission === 'default') {
                      await Notification.requestPermission();
                    }
                    
                    if (Notification.permission === 'granted') {
                      new Notification('Test! 🔔', {
                        body: 'Push notifications working!',
                        icon: '/assets/icon2.png'
                      });
                      console.log('✅ Test notification sent');
                    } else {
                      console.log('❌ Permission denied');
                    }
                    
                    // Test API
                    try {
                      const response = await fetch('/api/debug/test-notification', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                          userEmail: 'muskan@example.com',
                          title: 'API Test',
                          message: 'Testing notification API'
                        })
                      });
                      const result = await response.json();
                      console.log('📡 API Result:', result);
                    } catch (e) {
                      console.log('❌ API failed:', e.message);
                    }
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  🔔 Test Notifications
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}