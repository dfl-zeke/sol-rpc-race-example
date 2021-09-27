import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { startListener, sleep } from './utils';
import * as bs58 from 'bs58';
import fs from 'fs';


export async function mainnetTest(mintAddress: string) {
    const privateKey = fs.readFileSync('test.txt', 'utf8')
    console.log(privateKey)
    const ragaca = bs58.decode(privateKey)

    // CREATE CONNECTION
    const connection = new Connection('https://solana-api.projectserum.com', 'confirmed');

    // CREATE WALLET
    const fromWallet = Keypair.fromSecretKey(ragaca);
    const toWallet = new PublicKey("F2793Cd7Cm91q28wLd964oGr94LF63EbzAUxHgLvNbz5")

    console.log('fromWallet', fromWallet.publicKey.toBase58())
    console.log('toWallet', toWallet.toBase58())

    const mintPk = new PublicKey(mintAddress)

    // Find associated token addresses to transfer funds
    const associatedAddress = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintPk, fromWallet.publicKey)
    const associatedAddressDestination = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintPk, toWallet)

    const info = await connection.getAccountInfo(associatedAddressDestination);

    // Create associated token address for receiver if they do not have one
    if (!info) {
        const createTokenAccountIx = Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mintPk,
            associatedAddressDestination,
            toWallet,
            fromWallet.publicKey
        );

        const transaction = new Transaction().add(createTokenAccountIx);

        await sendAndConfirmTransaction(
            connection,
            transaction,
            [fromWallet],
            { commitment: 'confirmed' },
        );
    }

    // START LISTENER
    startListener(connection, toWallet)

    // SEND TRANSACTIONS TO TEST LISTENER
    for (let i = 0; i < 500; i++) {
        const transaction = new Transaction().add(
            Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                associatedAddress,
                associatedAddressDestination,
                fromWallet.publicKey,
                [],
                1,
            )
        );

        await sendAndConfirmTransaction(
            connection,
            transaction,
            [fromWallet],
            { commitment: 'confirmed' },
        );

        console.log('sent', i + 1)

        // sleep for 1 sec for receiving transfer.
        await sleep(1000)
    }
}