import mongoose from 'mongoose';

// Record of a successful or pending financial contribution
const donationSchema = new mongoose.Schema({
    // The user who contributed the funds
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // The NGO the money is intended for
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
    
    // The specific mission or fundraiser being supported
    causeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cause', required: true },
    
    // Detailed amount for financial reporting and receipt generation
    amount: { type: Number, required: true },
    
    // The currency of the donation (e.g., "INR" for India)
    currency: { type: String, default: 'INR' },
    
    // The official order identification from the Razorpay API
    razorpayOrderId: { type: String, required: true },
    
    // The unique payment confirmation ID returned after successful payment completion
    razorpayPaymentId: { type: String },
    
    // Payment status tracking for the backend dashboard
    status: { 
        type: String, 
        enum: ['pending', 'paid', 'refunded'], 
        default: 'pending' 
    },
    
    // Option for recurring monthly/weekly contributions
    isRecurring: { type: Boolean, default: false },
    
    // Schedule for automatic payments if isRecurring is true
    frequency: { 
        type: String, 
        enum: ['weekly', 'monthly', 'once'], 
        default: 'once' 
    }
    
}, { 
    // Captures the exact moment the donation was made
    timestamps: true 
});

// Indexes for fast donor history, cause statistics, NGO totals, and payment webhook processing
donationSchema.index({ donorId: 1, status: 1 });
donationSchema.index({ causeId: 1, status: 1 });
donationSchema.index({ ngoId: 1, status: 1 });
donationSchema.index({ razorpayOrderId: 1 });

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
