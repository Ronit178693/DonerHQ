import mongoose from 'mongoose';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import NGO from '../models/NGO.js';
import Cause from '../models/Cause.js';
import EscrowTransaction from '../models/EscrowTransaction.js';
import razorpay from '../config/razorpay.js';
import crypto from 'crypto';
import { getIO } from '../socket.js';
import sendEmail from '../utils/sendEmail.js';


/**
 * Donation Controller
 * Handles the end-to-end lifecycle of a donation: Ordering, Verification, and Auditing.
 */

// ═══════════════════════════════════════════════════════════════
//  CREATE ORDER — Step 1: Initialize transaction with Razorpay
// ═══════════════════════════════════════════════════════════════

// Controller to create a new Razorpay order for the frontend checkout
export const createOrder = async (req, res) => {
    // Extracting donor's intent: which mission and how much to donate
    const { causeId, amount } = req.body; // Amount in INR
    // Starting the order creation process
    try {
        // Validating presence of essential mission and financial data
        if (!causeId || !amount) {
            return res.status(400).json({ success: false, message: 'Cause ID and amount are required' });
        }

        // Verifying that the target mission actually exists
        const cause = await Cause.findById(causeId);
        if (!cause) return res.status(404).json({ success: false, message: 'Cause not found' });

        // Defining the Razorpay order options (amount must be in smallest currency unit: paise)
        const options = {
            amount: amount * 100, // INR to Paise conversion
            currency: "INR",
            // Generating a unique receipt reference for this internal order attempt
            receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        };

        // Calling the Razorpay API to generate the professional Order ID
        const order = await razorpay.orders.create(options);

        // Returning the generated order details to the frontend to trigger the checkout modal
        return res.status(201).json({ success: true, order });
    // Catching any gateway connection or configuration errors
    } catch (error) {
        // Returning a 500 status with specific failure details
        return res.status(500).json({ success: false, message: 'Error creating Razorpay order', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  VERIFY PAYMENT — Step 2: Validate signature and commit to DB
// ═══════════════════════════════════════════════════════════════

// Controller to verify the payment authenticity and record the successful donation
export const verifyPayment = async (req, res) => {
    // Destructuring signature components provided by Razorpay after successful payment
    const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        causeId, 
        amount,
        isRecurring,
        frequency
    } = req.body;

    // Starting the cryptographic validation and DB update process
    try {
        // Constructing the expected signature string as per Razorpay security policy
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        // Generating a HMAC hash using our secret key to compare against the provided signature
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        // Checking if the generated hash matches the client-provided signature
        const isAuthentic = expectedSignature === razorpay_signature;

        // Security Guard: Blocking the transaction if signatures don't match
        if (!isAuthentic) {
            return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature' });
        }

        // ─── If authentic, proceed with recorded donation ───

        // Finding the mission details to retrieve the recipient NGO
        const cause = await Cause.findById(causeId);
        if (!cause) return res.status(404).json({ success: false, message: 'Attributed cause no longer exists' });

        // Creating the successful donation record in our database
        const newDonation = await Donation.create({
            donorId: req.user._id,
            ngoId: cause.ngoId,
            causeId,
            amount: Number(amount),
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            status: 'paid', // Verified!
            isRecurring: isRecurring || false,
            frequency: frequency || 'once'
        });

        // 📧 DONATION RECEIPT: Official audit trail for the donor
        const receiptHtml = `
            <div style="font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 16px; border: 1px solid #b9ffe822;">
                <h1 style="color: #b9ffe8; font-size: 20px;">Contribution Receipt — SECURED</h1>
                <p>Hello ${req.user.name},</p>
                <div style="background: rgba(185,255,232,0.05); padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><b>Amount:</b> ₹${amount}</p>
                    <p style="margin: 5px 0;"><b>Mission:</b> ${cause.title}</p>
                    <p style="margin: 5px 0;"><b>Transaction ID:</b> ${razorpay_payment_id}</p>
                    <p style="margin: 5px 0;"><b>Status:</b> Held in Celestial Escrow</p>
                </div>
                <p style="font-size: 14px; color: #aaa;">Your funds are currently locked and will only be released once the NGO provides immutable proof of impact. You can track this in your dashboard.</p>
                <a href="${process.env.CLIENT_URL}donor/dashboard" style="display: inline-block; background: #b9ffe8; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">AUDIT MY LEDGER</a>
            </div>
        `;
        sendEmail(req.user.email, `Precision Impact Receipt: ₹${amount} Secured`, receiptHtml);

        // Updating the User’s contribution history and social leaderboard score
        await User.findByIdAndUpdate(req.user._id, { 
            $push: { donationHistory: newDonation._id },
            $inc: { leaderboardScore: 10 }
        });

        // 1. Updating the Cause's financial state
        const updatedCause = await Cause.findByIdAndUpdate(causeId, { 
            $inc: { raisedAmount: Number(amount), donorCount: 1 } 
        }, { new: true });

        // 2. Updating the NGO's total fundraising reach
        await NGO.findByIdAndUpdate(cause.ngoId, { 
            $inc: { totalRaised: Number(amount) } 
        });

        // 3. 🛡️ UPDATING ESCROW LEDGER — Ensure transparency tracking
        // We initialize or update the escrow holding for this specific cause
        await EscrowTransaction.findOneAndUpdate(
            { causeId: cause._id },
            { 
                $inc: { totalHeld: Number(amount) },
                $set: { 
                    ngoId: cause.ngoId,
                    status: 'holding' // Reset to holding if it was empty/new
                }
            },
            { upsert: true, new: true }
        );

        // Returning the success response including the verified donation record
        res.status(200).json({ 
            success: true, 
            message: 'Donation verified and processed successfully', 
            donation: newDonation,
            updatedCause // Return this so the frontend can update immediately
        });

        // 🚀 Real-time Engagement: Emitting a broadcast event to all connected clients
        // Accessing the global real-time engine to publish a message
        getIO().emit('new_donation', {
            // Identifying the generous donor who just completed the transaction
            donorName: req.user.name,
            // Attaching the exact financial amount contributed (public proof)
            amount: newDonation.amount,
            // Attaching the cause title so others can see which mission was supported
            causeTitle: cause.title,
            // Providing the ID so the frontend can redirect users to that mission
            causeId: cause._id,
            // Timestamping the event for live feed sorting purposes
            timestamp: newDonation.createdAt
        });

    // Catching any verification or database update failures
    } catch (error) {
        // Returning 500 status message for server-side processing errors
        return res.status(500).json({ success: false, message: 'Internal server error during verification', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  DONATION HISTORY — Role-based audit logs for transparency
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the full history of donations filtered by user role
export const getDonationHistory = async (req, res) => {
    // Starting the try block for collection traversal
    try {
        // Initializing the query filter object
        let query = {};
        
        // Logical branching to filter results based on the requester's permissions
        if (req.user.role === 'donor') {
            // Donors can only view their own personal contribution records
            query = { donorId: req.user._id };
        } else if (req.user.role === 'ngo') {
            // Fetching the NGO document to find their organization's unique ID
            const ngo = await NGO.findOne({ userId: req.user._id });
            // Blocking access if no NGO profile is found for this user account
            if (!ngo) return res.status(404).json({ success: false, message: 'NGO profile not found' });
            // NGOs can view all incoming donations directed to their organization
            query = { ngoId: ngo._id };
        } else {
            // Admins bypass all filters and can view the entire global transaction ledger
            query = {};
        }

        // Finding donation records matching the authorized query filter
        let donations = await Donation.find(query)
            .populate('donorId', 'name email')
            .populate('ngoId', 'name logo verified')
            .populate('causeId', 'title goalAmount raisedAmount status coverImage')
            .sort({ createdAt: -1 });

        // Augment each donation with the latest Escrow state for that cause
        const augmentedDonations = await Promise.all(donations.map(async (donation) => {
            const escrow = await EscrowTransaction.findOne({ causeId: donation.causeId?._id }).select('status released totalHeld');
            return {
                ...donation.toObject(),
                escrowStatus: escrow ? escrow.status : 'holding',
                releasedAmount: escrow ? escrow.released : 0
            };
        }));

        // Returning the array of transaction logs and the total count to the client
        return res.status(200).json({ success: true, count: augmentedDonations.length, donations: augmentedDonations });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching donation history', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  DONATION DETAILS — In-depth receipt and status lookup
// ═══════════════════════════════════════════════════════════════

export const getDonationDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const donation = await Donation.findById(id)
            .populate('donorId', 'name email')
            .populate('ngoId', 'name logo location bio')
            .populate('causeId', 'title description coverImage goalAmount raisedAmount');

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation record not found' });
        }

        return res.status(200).json({ success: true, donation });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching donation details', error: error.message });
    }
};
