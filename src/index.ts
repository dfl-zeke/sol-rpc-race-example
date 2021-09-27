import { devnetTest } from "./devnet";
import { mainnetTest } from "./mainnet";
import fs from 'fs';

async function main() {
    const mnemonic = fs.readFileSync('test.txt', 'utf8')
    
    await devnetTest()
    // await mainnetTest(mnemonic)
}

main()