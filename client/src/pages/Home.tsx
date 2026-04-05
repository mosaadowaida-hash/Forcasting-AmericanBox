import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to supabase dashboard
    setLocation("/supabase-dashboard");
  }, [setLocation]);

  return null;
}
