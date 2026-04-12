import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { hashPassword } from '../src/models/User.js';
import NGO from '../src/models/NGO.js';

dotenv.config();

const NGOS_DATA = [
    {
        name: "Green Earth Initiative",
        email: "contact@greenearth.org",
        location: "Bangalore, KA",
        category: "Environment",
        bio: "Dedicated to urban reforestation and sustainable waste management systems across metropolitan India.",
        logo: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=200&h=200&fit=crop",
    },
    {
        name: "EduSpark Foundation",
        email: "hello@eduspark.io",
        location: "New Delhi, DL",
        category: "Education",
        bio: "Empowering underprivileged children through digital literacy and modern coding bootcamps.",
        logo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=200&h=200&fit=crop",
    },
    {
        name: "HealPulse Integrated Healthcare",
        email: "info@healpulsengo.org",
        location: "Mumbai, MH",
        category: "Health",
        bio: "Bridging the gap in rural healthcare access via mobile clinics and tele-consultation networks.",
        logo: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=200&h=200&fit=crop",
    },
    {
        name: "AquaPure Network",
        email: "cleanwater@aquapure.org",
        location: "Jaipur, RJ",
        category: "Water",
        bio: "Implementing sustainable rainwater harvesting and water purification systems in drought-prone regions.",
        logo: "https://images.unsplash.com/photo-1527063167133-784013317c91?q=80&w=200&h=200&fit=crop",
    },
    {
        name: "PawRescue Hub",
        email: "help@pawrescue.org",
        location: "Pune, MH",
        category: "Animal Welfare",
        bio: "A network of emergency responders and shelters for stray animals in western India.",
        logo: "https://images.unsplash.com/photo-1548191265-cc70d3d45bd1?q=80&w=200&h=200&fit=crop",
    },
    {
        name: "Tech4Rural Development",
        email: "connect@tech4rural.org",
        location: "Hyderabad, TS",
        category: "Rural Development",
        bio: "Bringing precision farming tools and renewable energy solutions to small-scale farmers.",
        logo: "https://images.unsplash.com/photo-1560343060-c142ba3b1234?q=80&w=200&h=200&fit=crop",
    },
    {
        name: "ArtSoul Cultural Collective",
        email: "admin@artsoul.org",
        location: "Kolkata, WB",
        category: "Art & Culture",
        bio: "Preserving traditional folk art forms by providing training and global marketplaces for artisans.",
        logo: "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=200&h=200&fit=crop",
    },
    {
        name: "SeniorSun Elderly Care",
        email: "support@seniorsun.org",
        location: "Chennai, TN",
        category: "Elderly Care",
        bio: "Providing comprehensive geriatric care and social engagement programs for the silver generation.",
        logo: "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?q=80&w=200&h=200&fit=crop",
    },
    {
        name: "WomenVoice Empowerment",
        email: "lead@womenvoice.org",
        location: "Ahmedabad, GJ",
        category: "Women Empowerment",
        bio: "Focused on financial independence through micro-entrepreneurship and legal advocacy training.",
        logo: "https://images.unsplash.com/photo-1484860137475-597b1aff5503?q=80&w=200&h=200&fit=crop",
    },
    {
        name: "FoodShield Hunger Relief",
        email: "meals@foodshield.org",
        location: "Indore, MP",
        category: "Hunger",
        bio: "Eradicating food wastage by connecting surplus from events to hungry communities in real-time.",
        logo: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=200&h=200&fit=crop",
    }
];

// Document placeholders (using the generated ones or generic high-res placeholders)
const DOC_80G = "https://images.unsplash.com/photo-1568605117036-5fe5e7bbe0b7?q=80&w=800";
const DOC_FCRA = "https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=800";

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/donerhq');
        console.log("Connected to MongoDB for seeding...");

        // Clear existing NGOs or specific dummy data if needed
        // For now, we just add new ones to avoid deleting user data
        
        for (const data of NGOS_DATA) {
            // Check if user already exists
            let user = await User.findOne({ email: data.email });
            
            if (!user) {
                user = await User.create({
                    name: data.name,
                    email: data.email,
                    password: await hashPassword('password123'),
                    role: 'ngo',
                    onboardingComplete: true
                });
            }

            // Create NGO profile
            const ngo = await NGO.create({
                userId: user._id,
                name: data.name,
                bio: data.bio,
                logo: data.logo,
                category: data.category,
                location: data.location,
                status: 'approved', // Auto-approve dummy data
                verified: true,
                transparencyScore: Math.floor(Math.random() * (98 - 85) + 85), // Pro looking scores 85-98
                followerCount: Math.floor(Math.random() * 5000),
                totalRaised: Math.floor(Math.random() * 1000000),
                doc80G: DOC_80G,
                docFCRA: DOC_FCRA
            });

            // Link profile back to user
            user.ngoProfile = ngo._id;
            await user.save();
            
            console.log(`✅ Seeded: ${data.name}`);
        }

        console.log("\n🚀 Seeding Complete! 10 Legit-looking NGOs created.");
        process.exit();
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seed();
