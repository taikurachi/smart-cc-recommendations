"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { User, Connection, CardPreferences, ConnectionMethod } from "./types";
import { loadUserData } from "./userOperations";

interface AppContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  connections: Connection[];
  setConnections: Dispatch<SetStateAction<Connection[]>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  cardPreferences: CardPreferences | null;
  setCardPreferences: Dispatch<SetStateAction<CardPreferences | null>>;
  connectionMethod: ConnectionMethod;
  setConnectionMethod: Dispatch<SetStateAction<ConnectionMethod>>;
  loadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [cardPreferences, setCardPreferences] =
    useState<CardPreferences | null>(null);
  const [connectionMethod, setConnectionMethod] =
    useState<ConnectionMethod>(null);

  const loadData = async () => {
    const data = await loadUserData();
    setUser(data.user);
    setConnections(data.connections || []);

    // Load card preferences from localStorage
    const savedPreferences = localStorage.getItem("cardPreferences");
    if (savedPreferences) {
      setCardPreferences(JSON.parse(savedPreferences));
    }

    // Load connection method from localStorage
    if (data.connections.length === 0) {
      setConnectionMethod(null);
      return;
    }
    const savedMethod = localStorage.getItem(
      "connectionMethod"
    ) as ConnectionMethod;

    if (savedMethod) {
      setConnectionMethod(savedMethod);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        connections,
        setConnections,
        loading,
        setLoading,
        cardPreferences,
        setCardPreferences,
        connectionMethod,
        setConnectionMethod,
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
