
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Donation from '../src/models/Donation.js';
import EscrowTransaction from '../src/models/EscrowTransaction.js';
import Cause from '../src/models/Cause.js';

dotenv.config();

/**
 * REPAIR SCRIPT: Escrow Ledger Synchronization
 * This script scans all donations and ensures that an EscrowTransaction record exists 
 * for every cause that has received funding.
 */
const repairEscrowLedger = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Ledger DB...');

        const uniqueCauseIds = await Donation.distinct('causeId');
        console.log(`Analyzing ${uniqueCauseIds.length} mission nodes for financial integrity...`);

        let repairedCount = 0;

        for (const causeId of uniqueCauseIds) {
            const existingEscrow = await EscrowTransaction.findOne({ causeId });
            
            if (!existingEscrow) {
                console.log(`Missing Ledger for Cause ID: ${causeId}. Re-aggregating capital...`);
                
                const cause = await Cause.findById(causeId);
                if (!cause) {
                    console.log(`Warning: Physical cause record missing for node ${causeId}`);
                    continue;
                }

                const totalCapital = await Donation.aggregate([
                    { $match: { causeId: new mongoose.Types.ObjectId(causeId), status: 'paid' } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]);

                const raisedAmount = totalCapital[0]?.total || 0;

                await EscrowTransaction.create({
                    causeId,
                    ngoId: cause.ngoId,
                    totalHeld: raisedAmount,
                    status: (raisedAmount >= cause.goalAmount) ? 'holding' : 'holding', // logic for status can be refined
                    videoDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
                });

                repairedCount++;
            }
        }

        console.log(`Celestial Ledger Sync Complete. Repaired ${repairedCount} nodes.`);
        process.exit(0);
    } catch (error) {
        console.error('Ledger Repair Critical Failure:', error);
        process.exit(1);
    }
};

repairEscrowLedger();
