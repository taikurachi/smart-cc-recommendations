"use client";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import PlaidConnectionCard from "./components/PlaidConnectionCard";
import CSVUploadCard from "./components/CSVUploadCard";

export default function Home() {
  const router = useRouter();
  const { user, setUser, setConnections, setLoading, loadData } = useApp();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="font-semibold text-3xl text-center mb-2">
        Connect Your Financial Accounts
      </h1>
      <p className="text-center mb-8">
        Connect your bank through Plaid or upload transaction data
      </p>
      <div className="mb-8">
        <div className="grid md:grid-cols-2 gap-6 sm:h-[400px] h-full">
          <PlaidConnectionCard
            user={user}
            setUser={setUser}
            loadData={loadData}
          />

          <CSVUploadCard
            user={user}
            setUser={setUser}
            setLoading={setLoading}
            setConnections={setConnections}
            router={router}
          />
        </div>
      </div>
    </div>
  );
}
