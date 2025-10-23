import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Smart Credit Card
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}
              Recommendations
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect your bank account or upload transaction data to get
            personalized credit card recommendations based on your actual
            spending patterns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/connect"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
            >
              🚀 Get Started
            </Link>
            <Link
              href="/analysis"
              className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors border border-gray-300 shadow-lg"
            >
              📊 View Analysis
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏦</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">
              Secure Bank Connection
            </h3>
            <p className="text-gray-600">
              Connect your bank account securely using Plaid's industry-standard
              API. Your credentials are never stored.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">CSV Upload</h3>
            <p className="text-gray-600">
              Prefer manual control? Upload your transaction data via CSV file
              for complete privacy and control.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">
              Smart Recommendations
            </h3>
            <p className="text-gray-600">
              Get personalized credit card recommendations based on your actual
              spending patterns and maximize your rewards.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Connect Data</h4>
              <p className="text-sm text-gray-600">
                Link your bank account or upload CSV transactions
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Analyze Spending</h4>
              <p className="text-sm text-gray-600">
                AI analyzes your spending patterns and categories
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Match Cards</h4>
              <p className="text-sm text-gray-600">
                Compare against our database of credit cards
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">Get Recommendations</h4>
              <p className="text-sm text-gray-600">
                Receive personalized card recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">14+</div>
            <div className="text-gray-600">Credit Cards Analyzed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              Bank-Level
            </div>
            <div className="text-gray-600">Security Standards</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              AI-Powered
            </div>
            <div className="text-gray-600">Recommendation Engine</div>
          </div>
        </div>
      </div>
    </div>
  );
}
