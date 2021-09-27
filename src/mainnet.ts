import { mnemonicToSeed } from 'bip39';
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { startListener, sleep } from './utils';


export async function mainnetTest(mnemonic: string) {
    const buffer = await mnemonicToSeed(mnemonic)
    // solution from https://stackoverflow.com/questions/69119382/failing-in-convert-a-mnemonic-to-a-seed-for-a-solana-wallet
    const uint8array = new Uint8Array(buffer.toJSON().data.slice(0, 32))

    // CREATE CONNECTION
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // CREATE WALLET
    const fromWallet = Keypair.fromSeed(uint8array)
    const toWallet = new PublicKey("96QykLn8jtt8S3fNHeMMx2gtAawHwBEXCUhm1hWZgtSk")

    console.log('fromWallet', fromWallet.publicKey.toBase58())
    console.log('toWallet', toWallet.toBase58())

    // START LISTENER
    startListener(connection, fromWallet.publicKey)

    // SEND TRANSACTIONS TO TEST LISTENERw
    for (let i = 0; i < 10000; i++) {
        const transaction = new Transaction().add(
            Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                fromTokenAccount.address,
                toTokenAccount.address,
                fromWallet.publicKey,
                [],
                1,
            ),
        );

        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [fromWallet],
            { commitment: 'confirmed' },
        );

        console.log('signature', signature)

        // sleep for 1 sec for receiving transfer.
        await sleep(1000)
    }
}