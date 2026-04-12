import * as StellarSdk from 'stellar-sdk';
const { Keypair, Asset, Operation, TransactionBuilder, Networks, Horizon } = StellarSdk;

/**
 * STELLAR LEDGER SERVICE
 * This service handles the "Immutable Anchoring" of platform events onto the Stellar Blockchain.
 * It provides an un-deletable audit trail for donors and NGOs.
 */

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

/**
 * Anchors a platform event to the Stellar network
 * @param {string} internalId - The MongoDB ID of the escrow/donation
 * @param {Object} data - Contextual data (status, amount, etc)
 */
export const anchorToStellar = async (internalId, status, amount) => {
    try {
        // Validation: Ensuring we have a funded keypair to sign transactions
        // Note: In production, these should be securely stored in process.env
        const secret = process.env.STELLAR_SECRET_KEY;
        const sourceKeypair = Keypair.fromSecret(secret);
        const account = await server.loadAccount(sourceKeypair.publicKey());

        // We use the Transaction Memo to store our immutable proof (Max 28 characters)
        // Format: DHQ:[ID_SHORT]:[STATUS_CHAR]
        const memoText = `DHQ:${internalId.slice(-8)}:${status[0].toUpperCase()}`;

        const transaction = new TransactionBuilder(account, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: Networks.TESTNET,
        })
        .addOperation(Operation.payment({
            destination: sourceKeypair.publicKey(), // Burning a small amount to ourselves as an anchor
            asset: Asset.native(),
            amount: "0.00001", 
        }))
        .addMemo(TransactionBuilder.Memo.text(memoText))
        .setTimeout(30)
        .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);
        
        console.log(`🛡️ Immutable Anchor Created on Stellar: ${result.hash}`);
        return result.hash;

    } catch (error) {
        console.error('Stellar Archival Error:', error.response?.data?.extras?.result_codes || error.message);
        return null;
    }
};

/**
 * Helper to generate a new keypair for the platform owner
 * (Use this to set up your .env)
 */
export const generatePlatformKeys = () => {
    const pair = Keypair.random();
    return {
        publicKey: pair.publicKey(),
        secret: pair.secret()
    };
};
