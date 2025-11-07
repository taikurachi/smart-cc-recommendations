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
import { User, Connection } from "./types";
import { loadUserData } from "./userOperations";

interface AppContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  connections: Connection[];
  setConnections: Dispatch<SetStateAction<Connection[]>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  loadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const data = await loadUserData();
    setUser(data.user);
    setConnections(data.connections || []);
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
