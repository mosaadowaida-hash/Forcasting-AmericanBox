import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to working dashboard
    setLocation("/working-dashboard");
  }, [setLocation]);

  return null;
}
