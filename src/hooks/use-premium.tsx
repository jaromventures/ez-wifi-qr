import { createContext, useContext, useState, useEffect } from "react";

type PremiumContextType = {
  isPro: boolean;
  activatePro: () => void;
};

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPro, setIsPro] = useState(() => {
    const stored = localStorage.getItem("ez-wifi-pro");
    return stored === "true";
  });

  const activatePro = () => {
    setIsPro(true);
    localStorage.setItem("ez-wifi-pro", "true");
  };

  useEffect(() => {
    // Check URL params for success callback
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment_success") === "true") {
      activatePro();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <PremiumContext.Provider value={{ isPro, activatePro }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) throw new Error("usePremium must be used within PremiumProvider");
  return context;
};
