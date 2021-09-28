import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { startListener, sleep, receivedArray } from './utils';
import * as bs58 from 'bs58';
import fs from 'fs';
import { isEqual } from 'lodash';


export async function mainnetTest(mintAddress: string) {
    const receivedListeners = []
    const privateKey = fs.readFileSync('test.txt', 'utf8')
    console.log(privateKey)
    const ragaca = bs58.decode(privateKey)

    // CREATE CONNECTION
    const connection = new Connection('https://solana-api.projectserum.com', 'confirmed');

    // CREATE WALLET
    const fromWallet = Keypair.fromSecretKey(ragaca);
    const toWallet = new PublicKey("HNYLAm2fPQb1ccckz1jXgQ1rmvE2RZGwDzcYk71JeZ8J")

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
    for (let i = 0; i < 10000; i++) {
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

        console.log('sent', i + 1)
        try {
            await sendAndConfirmTransaction(
                connection,
                transaction,
                [fromWallet],
                { commitment: 'confirmed' },
            );

            receivedListeners.push(i + 1)
        } catch (error) {
            console.log(error)
        }
        // sleep for 1 sec for receiving transfer.
        await sleep(1000)
    }

    await sleep(5000) // wait for listeners for god's sake
    const isAnyLeak = isEqual(receivedListeners, receivedArray)
    console.log('receivedListeners', receivedListeners)
    console.log('receivedArray ', receivedArray)
    console.log(isAnyLeak)
}