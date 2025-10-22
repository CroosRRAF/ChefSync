import React, { useEffect, useState } from "react";

interface GreetingProps {
  chefName: string;
  error?: string | null;
}

export default function Greeting({ chefName, error }: GreetingProps) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good Evening");
      } else {
        setGreeting("Good Night");
      }
    };

    // Update greeting immediately
    updateGreeting();

    // Update greeting every minute to handle time changes
    const interval = setInterval(updateGreeting, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground">
        {greeting}, {chefName}!
      </h1>
      <p className="text-muted-foreground mt-1">
        {error ? `⚠️ ${error}` : "Here's what's happening in your kitchen today"}
      </p>
    </div>
  );
}