#!/usr/bin/env tsx

import { runBasicScraper } from "./app/scrapers/nerdwallet/index";

console.log("🚀 Starting NerdWallet scraper test...");
runBasicScraper().catch(console.error);
