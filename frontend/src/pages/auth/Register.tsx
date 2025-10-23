import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SimpleRegisterForm from '@/components/auth/SimpleRegisterForm';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun, ChefHat, Utensils, Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import AuthPattern from '@/assets/auth-pattern.svg';
import logo from '@/assets/logo.svg';
import navbarLogo from '@/assets/images/hero/navbarlogo.png';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Floating food icons component for the background
const FloatingIcons = () => {
  const icons = [
    { icon: <Utensils className="w-5 h-5" />, position: 'top-10 left-1/4' },
    { icon: <ChefHat className="w-6 h-6" />, position: 'top-1/3 right-10' },
    { icon: <Heart className="w-5 h-5 text-rose-400" />, position: 'bottom-1/4 left-10' },
    { icon: <Sparkles className="w-6 h-6 text-yellow-400" />, position: 'bottom-10 right-1/4' },
  ];

  return (
    <>
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className={`absolute ${item.position} text-primary/30`}
          initial={{ y: 0, opacity: 0.5 }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 2,
          }}
        >
          {item.icon}
        </motion.div>
      ))}
    </>
  );
};

const Register: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4 md:p-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url(${AuthPattern})`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto'
          }}
        />
        <FloatingIcons />
      </div>
      
      {/* Theme Toggle Button */}
      <motion.div 
        className="fixed top-4 right-4 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className={cn(
            "h-10 w-10 rounded-full border-2 transition-all duration-200",
            "hover:border-primary hover:shadow-md hover:scale-105",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          )}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </motion.div>

      <div className="w-full max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-2xl border border-border/50 bg-card/80 backdrop-blur-lg overflow-hidden">
            {/* Decorative gradient header */}
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
            
            <CardHeader className="text-center pb-2 pt-8 px-8">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-4 shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <img 
                  src={navbarLogo} 
                  alt="ChefSync" 
                  className="h-12 w-auto object-contain"
                />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Join Us
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Create your account to start your culinary journey with us
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pt-4 pb-6">
              {/* Main Registration Form */}
              <SimpleRegisterForm />
            </CardContent>

            <CardFooter className="pt-4 pb-8 px-8 border-t border-border/30">
              <div className="w-full">
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/30" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 py-1 rounded-full text-muted-foreground text-xs font-medium border border-border/30 shadow-sm">
                      Or continue with
                    </span>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <GoogleAuthButton mode="register" />
                </motion.div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link 
                      to="/auth/login" 
                      className="font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
                    >
                      Sign in here
                    </Link>
                  </p>
                  
                  <p className="mt-4 text-xs text-muted-foreground/70">
                    By registering, you agree to our{' '}
                    <a href="#" className="hover:underline hover:text-foreground transition-colors">Terms</a>{' '}
                    and{' '}
                    <a href="#" className="hover:underline hover:text-foreground transition-colors">Privacy Policy</a>.
                  </p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
