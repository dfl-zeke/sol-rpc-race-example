import {
    Authorized,
    clusterApiUrl,
    Connection,
    Keypair,
    PublicKey,
    StakeProgram
} from '@solana/web3.js';
import fs from 'fs';

const STAKE_PROGRAM_ID = new PublicKey('Stake11111111111111111111111111111111111111');

const PRIVATE_KEY = Buffer.from(JSON.parse(fs.readFileSync('test.json', 'utf8')));
const KEYPAIR = Keypair.fromSecretKey(PRIVATE_KEY);

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ENDPOINT = clusterApiUrl('devnet');
const connection = new Connection(ENDPOINT, 'confirmed');

async function main() {
    const rentExemptRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

    connection.onProgramAccountChange(STAKE_PROGRAM_ID, (info) => {
        const { accountId, accountInfo } = info
        console.log(`received ${accountInfo.lamports - rentExemptRent} ${accountId.toBase58()}`);
    },
        'confirmed',
        [
            {
                memcmp: {
                    offset: 12,
                    bytes: KEYPAIR.publicKey.toBase58()
                }
            }
        ]
    );
    let index = 1;
    while (index <= 500) {
        const newKeypair = new Keypair();
        const lamports = rentExemptRent + index;

        const transaction = StakeProgram.createAccount({
            fromPubkey: KEYPAIR.publicKey,
            stakePubkey: newKeypair.publicKey,
            authorized: new Authorized(
                KEYPAIR.publicKey,
                KEYPAIR.publicKey
            ),
            lamports
        });
        transaction.feePayer = KEYPAIR.publicKey;
        //let recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        //console.log(recentBlockhash);
        //transaction.recentBlockhash = recentBlockhash;

        await connection.sendTransaction(
            transaction,
            [KEYPAIR, newKeypair],
        );
        console.log(`Sent ${index}`);

        await sleep(2000);
        index++;
    }
}

main();