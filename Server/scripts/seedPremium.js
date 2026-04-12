import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NGO from '../src/models/NGO.js';
import Post from '../src/models/Post.js';
import Cause from '../src/models/Cause.js';
import User from '../src/models/User.js';

dotenv.config();

const NGOS_METADATA = [
    { name: "Green Earth Initiative", category: "Environment", logo: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=400&fit=crop" },
    { name: "EduSpark Foundation", category: "Education", logo: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=400&fit=crop" },
    { name: "HealPulse Integrated Healthcare", category: "Health", logo: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop" },
    { name: "AquaPure Network", category: "Water", logo: "https://images.unsplash.com/photo-1541944743827-e04bb64aa840?w=400&h=400&fit=crop" },
    { name: "PawRescue Hub", category: "Animal Welfare", logo: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop" },
    { name: "Tech4Rural Development", category: "Social Tech", logo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=400&fit=crop" },
    { name: "ArtSoul Cultural Collective", category: "Arts", logo: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=400&h=400&fit=crop" },
    { name: "SeniorSun Elderly Care", category: "Elderly Care", logo: "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=400&h=400&fit=crop" },
    { name: "WomenVoice Empowerment", category: "Women Rights", logo: "https://images.unsplash.com/photo-1484860137475-597b1aff5503?w=400&h=400&fit=crop" },
    { name: "FoodShield Hunger Relief", category: "Hunger", logo: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=400&fit=crop" }
];

const PREMIUM_POSTS = [
    {
        caption: "Fresh water is a human right. Today we celebrated the 50th well completion of the year. Thank you to everyone who supported this milestone! #cleanwater #globalhealth #donerhq",
        tags: ["cleanwater", "globalhealth", "donerhq"],
        media: "https://images.unsplash.com/photo-1541944743827-e04bb64aa840?q=80&w=1200",
        type: "photo"
    },
    {
        caption: "When we started the EduSpark Digital Hub, we only had 5 old laptops. Today, 50 bright students are learning Python and data science. Education is the ultimate equalizer. #digitalindia #educationforall",
        tags: ["educationforall", "digitalindia", "coding"],
        media: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200",
        type: "photo"
    },
    {
        caption: "A quiet moment of resilience. Our mobile clinic team reached the high-altitude villages of Spiti today. Language and terrain are barriers, but healthcare is a universal privilege. Proud of our medical team. #healpulse #remotehealthcare",
        tags: ["healpulse", "medicalcamp", "ruralindia"],
        media: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1200",
        type: "photo"
    },
    {
        caption: "The first rains bring hope, but also challenges. Our wildlife rescue team just moved 15 injured raptors to higher ground. Every wing matters. Support our monsoon rescue fund now. #animalwelfare #rescue #wildlife",
        tags: ["animalwelfare", "rescue", "wildlife"],
        media: "https://images.unsplash.com/photo-1548191265-cc70d3d45bd1?q=80&w=1200",
        type: "photo"
    },
    {
        caption: "Meet Sunita. She just launched her own sustainable textile line thanks to the micro-grant provided by our WomenVoice program. Financial independence is the first step to freedom. #womenentrepreneurs #empowerment",
        tags: ["empowerment", "womenowned", "impact"],
        media: "https://images.unsplash.com/photo-1484860137475-597b1aff5503?q=80&w=1200",
        type: "photo"
    },
    {
        caption: "Our daily hunger relief drive just served its 100,000th meal. No one should go to sleep hungry in a city of surplus. Transparency check: Here's the grain log for this quarter. #foodsecurity #zerohunger",
        tags: ["zerohunger", "foodforall", "impactlog"],
        media: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200",
        type: "photo"
    },
    {
        caption: "Technological disruption in farming is here. These small-scale farmers in Telangana are now using IOT sensors provided by Tech4Rural to save 40% more water. Sustainability meets tradition. #agritech #smartfarming",
        tags: ["agritech", "sustainability", "ruraldev"],
        media: "https://images.unsplash.com/photo-1560343060-c142ba3b1234?q=80&w=1200",
        type: "photo"
    },
    {
        caption: "Culture is a living organism. Our Artisan Collective just finished a 3-month training program for Pattachitra painters. We are now bridging the gap to international collectors. #preservingheritage #folkart",
        tags: ["preservingheritage", "folkart", "indianart"],
        media: "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1200",
        type: "photo"
    },
    {
        caption: "Sunset at our Senior Care sanctuary. Dignity and joy aren't age-limited. These residents just organized their own singing club! Truly inspiring. #elderlycare #activeaging",
        tags: ["elderlycare", "activeaging", "humanity"],
        media: "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?q=80&w=1200",
        type: "photo"
    },
    {
        caption: "A green revolution in the heart of the city. We converted 5 more concrete dumpsters into community lungs. Breathe deep, Bangalore! #urbanforestry #greeninitiative",
        tags: ["urbanforestry", "climateaction", "greenerfuture"],
        media: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200",
        type: "photo"
    }
];

const COMMENTS_POOL = [
    { name: "Sarah_Gives", text: "The joy in their faces is everything. Proud to be part of this mission." },
    { name: "TechProphet", text: "Amazing use of technology for social good! Keep it up." },
    { name: "EcoWarrior", text: "Finally seeing real progress on urban greening. How can I volunteer?" },
    { name: "GlobalDonor", text: "This is why transparency matters. I can see exactly where my money goes." },
    { name: "KindSoul", text: "Heartbreaking and inspiring at the same time. Much love to the team." }
];

const seedPremium = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/donerhq');
        console.log("Connected to MongoDB for Premium Seed...");

        // 1. Clear Data
        await Post.deleteMany({});
        await Cause.deleteMany({});

        const user = await User.findOne({ role: 'donor' }) || await User.create({ name: "Demo User", email: "demo@donor.com", password: "password123", onboardingComplete: true });

        // 2. Fetch or Create NGOs and update their logos
        const ngos = [];
        for (const meta of NGOS_METADATA) {
            let ngo = await NGO.findOne({ name: meta.name });
            if (ngo) {
                ngo.logo = meta.logo;
                ngo.category = meta.category;
                await ngo.save();
            } else {
                // If not found, skip or create (usually they are created by seedNgos)
                console.log(`NGO ${meta.name} not found, skipping log update.`);
                continue;
            }
            ngos.push(ngo);
        }

        if (ngos.length === 0) {
           console.error("NGOs not found. Run seedNgos first.");
           process.exit(1);
        }

        // 3. Create Causes (needed for post linking)
        const causes = [];
        for (const ngo of ngos) {
            const cause = await Cause.create({
                ngoId: ngo._id,
                title: `Premium Support for ${ngo.name}`,
                description: `A flagship initiative by ${ngo.name} focused on long-term systemic impact in ${ngo.category}.`,
                goalAmount: 250000,
                raisedAmount: Math.floor(Math.random() * 50000),
                status: 'active',
                coverImage: ngo.logo
            });
            causes.push(cause);
            ngo.causes = [cause._id];
            await ngo.save();
        }

        // 4. Create premium posts
        console.log("Creating 100 premium storytelling posts (10 per NGO)...");
        for (let i = 0; i < 100; i++) {
            const postMeta = PREMIUM_POSTS[i % PREMIUM_POSTS.length];
            const ngo = ngos[i % ngos.length];
            const cause = causes[i % causes.length];

            // Mix the captions slightly for uniqueness
            const variations = [
                "Field update:", "Direct impact story:", "Moment of Change:", "Transparency Report:", "Today's Win:"
            ];
            const finalCaption = `${variations[i % variations.length]} ${postMeta.caption} (Log #${i + 101})`;

            // Generate 3-5 random comments
            const postComments = [];
            const numComments = Math.floor(Math.random() * 4) + 2;
            for (let c = 0; c < numComments; c++) {
                const comm = COMMENTS_POOL[Math.floor(Math.random() * COMMENTS_POOL.length)];
                postComments.push({
                    userId: user._id, 
                    text: comm.text,
                    createdAt: new Date()
                });
            }

            const post = await Post.create({
                ngoId: ngo._id,
                type: postMeta.type,
                mediaUrl: postMeta.media,
                caption: finalCaption,
                tags: postMeta.tags,
                linkedCauseId: cause._id,
                likes: Math.floor(Math.random() * 900) + 100,
                likedBy: [],
                comments: postComments,
                commentCount: postComments.length,
                shares: Math.floor(Math.random() * 50),
                donateClicks: Math.floor(Math.random() * 200),
                createdAt: new Date(Date.now() - (i * 1000 * 60 * 60)) // Spread them out in time
            });

            await NGO.findByIdAndUpdate(ngo._id, { $push: { posts: post._id } });
        }

        console.log("✅ PREMIUM SEED COMPLETE!");
        process.exit();
    } catch (error) {
        console.error("❌ Premium Seed Failed:", error);
        process.exit(1);
    }
};

seedPremium();
