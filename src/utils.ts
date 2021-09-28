import { Connection, PublicKey } from '@solana/web3.js';
//@ts-ignore
import * as BufferLayout from "buffer-layout";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const receivedArray: string[] = []

export const ACCOUNT_LAYOUT = BufferLayout.struct([
    BufferLayout.blob(32, 'mint'),
    BufferLayout.blob(32, 'owner'),
    BufferLayout.nu64('amount'),
    BufferLayout.blob(93),
]);

export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseTokenAccountData(data: any) {
    let { amount } = ACCOUNT_LAYOUT.decode(data)

    return amount;
}

export async function startListener(connection: Connection, publicKey: PublicKey) {
    connection.onProgramAccountChange(TOKEN_PROGRAM_ID, (info) => {
        const amount = parseTokenAccountData(info.accountInfo.data)
        receivedArray.push(amount)
        console.log(`received ${amount}`);
    },
        'confirmed',
        [
            {
                memcmp: {
                    offset: ACCOUNT_LAYOUT.offsetOf('owner'),
                    bytes: publicKey.toBase58(),
                },
            },
            {
                dataSize: ACCOUNT_LAYOUT.span,
            },
        ]
    );
}