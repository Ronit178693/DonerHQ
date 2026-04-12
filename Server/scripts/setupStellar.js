
import { Keypair } from 'stellar-sdk';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * SETUP SCRIPT: Stellar Horizon Initialization
 * Generates a platform keypair and funds it using the testnet Friendbot.
 */
const setupStellar = async () => {
    console.log('🌌 Initializing Stellar Horizon Node...');
    const pair = Keypair.random();
    const publicKey = pair.publicKey();
    const secret = pair.secret();

    console.log(`Keypair Generated: \nPublic: ${publicKey}\nSecret: ${secret}`);

    try {
        console.log('🚀 Requesting initial fuel from Friendbot...');
        const response = await axios.get(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
        console.log('✅ Account Funded. Environment variables ready for deployment.');
        
        console.log('\n--- ADD THESE TO YOUR Server/.env ---');
        console.log(`STELLAR_PUBLIC_KEY=${publicKey}`);
        console.log(`STELLAR_SECRET_KEY=${secret}`);
        console.log('-------------------------------------\n');

    } catch (e) {
        console.error('Connection to Horizon failed. Check internet connectivity.', e.message);
    }
};

setupStellar();
