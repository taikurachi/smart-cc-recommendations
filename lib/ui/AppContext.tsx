"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User, Connection, CardPreferences, BenefitMultipliers } from "../types";
import { loadUserData } from "../userOperations";
import {
  getStoredCardPreferences,
  getStoredBenefitMultipliers,
} from "../clientStorage";
import { getDefaultBenefitMultipliers } from "../recommendation/benefitDefaults";

interface AppContextType {
  user: User | null;
  connections: Connection[];
  loading: boolean;
  cardPreferences: CardPreferences | null;
  benefitMultipliers: BenefitMultipliers;
  updateUser: (user: User | null) => void;
  updatePreferences: (prefs: CardPreferences) => void;
  updateBenefitMultipliers: (multipliers: BenefitMultipliers) => void;
  loadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [cardPreferences, setCardPreferences] =
    useState<CardPreferences | null>(null);
  const [benefitMultipliers, setBenefitMultipliers] =
    useState<BenefitMultipliers>(getDefaultBenefitMultipliers());

  const updateUser = useCallback((u: User | null) => setUser(u), []);

  const updatePreferences = useCallback(
    (prefs: CardPreferences) => setCardPreferences(prefs),
    [],
  );

  const updateBenefitMultipliers = useCallback(
    (multipliers: BenefitMultipliers) => setBenefitMultipliers(multipliers),
    [],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadUserData();
      setUser(data.user);
      setConnections(data.connections || []);

      const savedPreferences = getStoredCardPreferences();
      if (savedPreferences) {
        setCardPreferences(savedPreferences);
      }

      const savedMultipliers = getStoredBenefitMultipliers();
      if (savedMultipliers) {
        setBenefitMultipliers({
          ...getDefaultBenefitMultipliers(),
          ...savedMultipliers,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AppContext.Provider
      value={{
        user,
        connections,
        loading,
        cardPreferences,
        benefitMultipliers,
        updateUser,
        updatePreferences,
        updateBenefitMultipliers,
        loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
