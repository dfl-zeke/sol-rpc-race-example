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


export async function devnetTest() {
    // CREATE CONNECTION
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // CREATE WALLET
    const fromWallet = Keypair.generate()
    const toWallet = new PublicKey("96QykLn8jtt8S3fNHeMMx2gtAawHwBEXCUhm1hWZgtSk")

    console.log('fromWallet', fromWallet.publicKey.toBase58())
    console.log('toWallet', toWallet.toBase58())

    // REQUEST AIRDROP ON DEVNET
    var fromAirdropSignature = await connection.requestAirdrop(
        fromWallet.publicKey,
        LAMPORTS_PER_SOL,
    );

    await connection.confirmTransaction(fromAirdropSignature);

    // CREATE TOKEN
    const mint = await Token.createMint(
        connection,
        fromWallet,
        fromWallet.publicKey,
        null,
        9,
        TOKEN_PROGRAM_ID,
    );

    const fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
        fromWallet.publicKey,
    );

    const toTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
        toWallet,
    );

    // MINT TOKEN
    await mint.mintTo(
        fromTokenAccount.address,
        fromWallet.publicKey,
        [],
        1000000000,
    );

    // START LISTENER
    startListener(connection, fromWallet.publicKey)

    // SEND TRANSACTIONS TO TEST LISTENERw
    for (let i = 0; i < 500; i++) {
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