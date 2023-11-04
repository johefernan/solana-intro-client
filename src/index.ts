import * as web3 from '@solana/web3.js';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const PROGRAM_ID = new web3.PublicKey("ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa")
const PROGRAM_DATA_PUBLIC_KEY = new web3.PublicKey("Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod")

async function main() {
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'));
    const signer = await initializeKeypair(connection);
    const recipient = new web3.PublicKey("DMnUDSy9Eu64yTLhQ9HVPUX3hh3oRi893KsdYg8iSAiB");
    
    //await airdropSolIfNeeded(connection, signer);
    //await pingProgram(connection, signer);
    await transferSol(connection, signer, recipient);

    //console.log("Public Key: ", signer.publicKey.toBase58());
}

async function initializeKeypair(connection: web3.Connection): Promise<web3.Keypair> {
    if (!process.env.PRIVATE_KEY) {
        console.log("Generating new keypair 🗝️");
        const signer = web3.Keypair.generate();

        console.log("Creating .env file");
        fs.writeFileSync('.env', `PRIVATE_KEY=[${signer.secretKey.toString()}]`);

        return signer;
    }
    
    const secret = JSON.parse(process.env.PRIVATE_KEY ?? '') as number[];
    const secretKey = Uint8Array.from(secret);
    const keypairFromSecret =web3.Keypair.fromSecretKey(secretKey);
    
    return keypairFromSecret;
}

async function airdropSolIfNeeded(connection: web3.Connection, signer: web3.Keypair) {
    const balance = await connection.getBalance(signer.publicKey);
    const lamport = web3.LAMPORTS_PER_SOL;
    console.log("Current balance is ", balance / lamport, "SOL");

    if (balance / lamport < 1) {    
        console.log("Airdropping 1 SOL");
        const airdropSignature = await connection.requestAirdrop(
            signer.publicKey,
            lamport
        );

        const latestBlockhash = await connection.getLatestBlockhash();
        
        await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: airdropSignature
        });
        
        const newBalance = await connection.getBalance(signer.publicKey);
        console.log("New balance is ", newBalance / lamport, "SOL");
    }
}

async function pingProgram(connection: web3.Connection, payer: web3.Keypair) {
    const transaction = new web3.Transaction;
    const instruction = new web3.TransactionInstruction({
        keys: [
            {
                pubkey: PROGRAM_DATA_PUBLIC_KEY,
                isSigner: false,
                isWritable: true
            }
        ],
        programId: PROGRAM_ID
    });
    
    transaction.add(instruction);
    const transactionSignature = await web3.sendAndConfirmTransaction(connection, transaction, [payer]);

    console.log(`Transaction https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`);
}

async function transferSol(connection: web3.Connection, signer: web3.Keypair, recipient: any) {
    try {
        const lamports = web3.LAMPORTS_PER_SOL * 0.5;
        const transaction = new web3.Transaction;
        const transferInstruction = web3.SystemProgram.transfer({
            fromPubkey: signer.publicKey,
            toPubkey: recipient,
            lamports: lamports
        })
        transaction.add(transferInstruction);
        const transferSignature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [signer]
        );
        console.log(`TX: https://explorer.solana.com/tx/${transferSignature}?cluster=devnet`);
    } catch(error) {
        alert(error)
    }
}

main().then(() => {
    console.log("Finished successfully");
    process.exit(0);
}).catch((error) => {
    console.log(error);
    process.exit(1);
})
