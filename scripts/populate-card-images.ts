import * as fs from "fs";
import * as path from "path";

const NW_CDN = "https://www.nerdwallet.com/cdn-cgi/image/width=300,quality=100";

const IMAGE_MAP: Record<string, { src: string; alt: string }> = {
  chase_sapphire_preferred: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/7dce19da-5d96-4502-9fd2-70ff9655f13a/3f8b79d90932c89dcb16ddad07861bbc7d0c804366870949527ae9b89e1df384.png`,
    alt: "Chase Sapphire Preferred Card Image",
  },
  chase_sapphire_reserve: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/d89e10ed-e781-4d28-ae74-205056a10244/5df1be45283a52f362a78554a755a61fd2e3d460293822e19a196af38a256794.jpg`,
    alt: "Chase Sapphire Reserve Card Image",
  },
  chase_freedom_flex: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/33ee088c-f6bb-11ea-8bc1-3f958c527fba/9dacf16bb533669a8781f403e54dc3a5a68405fc1bfce38fda34f3bd4d5c67ec.jpg`,
    alt: "Chase Freedom Flex Card Image",
  },
  american_express_gold_card: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/2921dc2e-e2b0-4003-82af-f6ca0f575d1c/9939cc4d8238dcd5ad2100cc9696bd6e5999526b1b8b99e9296ca85a800a83e6.jpg`,
    alt: "American Express Gold Card Image",
  },
  american_express_blue_cash_preferred: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/2681330d-450d-4f71-af38-3cb16f592c02/596f22094df609999878f43629debc8d416e18334ea8f5e68f9d92a72dd0b912.jpg`,
    alt: "American Express Blue Cash Preferred Card Image",
  },
  american_express_blue_cash_everyday: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/5ed2eb69-5e8c-4014-b8b7-23c4d600591c/bfccadb4c5dc3dc5a88464e70bf2c7339280bf494e9c8fad0ee4e5230c465dc4.jpg`,
    alt: "American Express Blue Cash Everyday Card Image",
  },
  capital_one_venture_x: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/39cdfd80-3372-11ec-ba1e-0bd72314c41b/212d04e17da168e0519eff57f944fede1f66f4cb08bc9643a04cb8c48f0e5a25.jpg`,
    alt: "Capital One Venture X Rewards Card Image",
  },
  capital_one_savorone_cash_rewards: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/cfeca922-52db-4b18-be5e-8e4fe1448448/889224ee9be7cb993cf4d219c6577f9ddfe617afde0cd37404e6928f1dcfae3f.jpg`,
    alt: "Capital One SavorOne Cash Rewards Card Image",
  },
  capital_one_quicksilver_cash_rewards: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/eb6605ae-a8c6-480d-9a3b-d79da54b2d7e/787ac1703db994bfc2a38e36805cd09f602d50a7a91d70599e5321e883e6988b.jpg`,
    alt: "Capital One Quicksilver Cash Rewards Card Image",
  },
  citi_double_cash: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/2a5d5681-8a3b-4e4c-9509-7476a4d3290d/e336c70dca87c32aab9a7bb224023d69a2e3920fa2ed2acce940f2f4f4a6956e.jpg`,
    alt: "Citi Double Cash Card Image",
  },
  citi_custom_cash_card: {
    src: "https://www.nerdwallet.com/assets/blog/wp-content/uploads/2021/06/Citi-Custom-Cash.png",
    alt: "Citi Custom Cash Card Image",
  },
  discover_it_cash_back: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/a4a36a73-0294-4ca1-b36b-3eef5cee53ca/a1de1f5a52d4ab48b729c2ea25588d40b1b0382c84ddac318b584f1d62aa37bd.jpg`,
    alt: "Discover it Cash Back Card Image",
  },
  wells_fargo_active_cash: {
    src: `${NW_CDN}/cdn/images/marketplace/credit_cards/b954a46c-caec-11eb-abf1-efb90fc6e740/403a0deae03eaff0d1ca2c7ab1175fcc45ebc9a9551d0c8104e758b3d82771d1.jpg`,
    alt: "Wells Fargo Active Cash Card Image",
  },
  us_bank_altitude_go: {
    src: "https://www.usbank.com/content/dam/usbank/en/images/illustrations/card-art/credit-cards/altitude-go-visa-signature-credit-card.png",
    alt: "U.S. Bank Altitude Go Visa Signature Card Image",
  },
  bank_of_america_premium_rewards: {
    src: "https://www.bankofamerica.com/content/images/ContextualSiteGraphics/CreditCardArt/en_US/Approved_PCM/8CAL_prmsigcm_v_250_158.png",
    alt: "Bank of America Premium Rewards Card Image",
  },
};

function main() {
  const ccPath = path.join(process.cwd(), "data", "manualcc.json");
  const raw = fs.readFileSync(ccPath, "utf-8");
  const cards = JSON.parse(raw) as Record<string, any>;

  let updated = 0;
  let skipped = 0;
  let alreadySet = 0;

  for (const [cardId, card] of Object.entries(cards)) {
    const currentSrc = card.image?.src || "";
    const mapping = IMAGE_MAP[cardId];

    if (currentSrc) {
      alreadySet++;
      console.log(`  [skip] ${cardId} — already has image`);
      continue;
    }

    if (!mapping) {
      skipped++;
      console.log(`  [miss] ${cardId} — no mapping found`);
      continue;
    }

    card.image = mapping;
    updated++;
    console.log(`  [set]  ${cardId} — ${mapping.src.slice(0, 80)}...`);
  }

  fs.writeFileSync(ccPath, JSON.stringify(cards, null, 2) + "\n", "utf-8");

  console.log(`\nDone: ${updated} updated, ${alreadySet} already set, ${skipped} unmapped.`);
}

main();
