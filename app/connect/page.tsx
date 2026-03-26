"use client";
import { useApp } from "@/lib/AppContext";
import PlaidConnectionCard from "./components/PlaidConnectionCard";

export default function ConnectPage() {
  const { user, setUser, loadData } = useApp();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="font-semibold text-3xl text-center mb-2">
        Connect Your Financial Accounts
      </h1>
      <p className="text-center mb-8">
        Connect your bank account securely through Plaid
      </p>
      <div className="mb-8 max-w-lg mx-auto">
        <PlaidConnectionCard
          user={user}
          setUser={setUser}
          loadData={loadData}
        />
      </div>
    </div>
  );
}
