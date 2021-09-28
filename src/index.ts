import { devnetTest } from "./devnet";
import { mainnetTest } from "./mainnet";


async function main() {
    const mintAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC Mint Address for testing
    // await devnetTest()
    await mainnetTest(mintAddress)
}

main()