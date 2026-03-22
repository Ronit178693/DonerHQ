import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO', required: true },
    causeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cause', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'paid', 'refunded'], 
        default: 'pending' 
    },
    isRecurring: { type: Boolean, default: false },
    frequency: { 
        type: String, 
        enum: ['weekly', 'monthly', 'once'], 
        default: 'once' 
    }
}, { timestamps: true });

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
