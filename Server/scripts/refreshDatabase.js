import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NGO from '../src/models/NGO.js';
import Post from '../src/models/Post.js';
import Cause from '../src/models/Cause.js';
import User from '../src/models/User.js';
import FeedScore from '../src/models/FeedScore.js';

dotenv.config();

const IMAGES = [
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200",
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200",
    "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=1200",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200",
    "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=1200",
    "https://images.unsplash.com/photo-1541944743827-e04bb64aa840?q=80&w=1200",
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1200",
    "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=1200",
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1200"
];

const VIDEOS = [
    "https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4",
    "https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4",
    "https://videos.pexels.com/video-files/7036494/7036494-uhd_2560_1440_25fps.mp4"
];

const CAUSE_TEMPLATES = [
    { title: "Clean Water Pipeline", desc: "Constructing a 5km pipeline to bring fresh water from the reservoir to 3 drought-hit villages." },
    { title: "Digital Literacy Hub", desc: "Setting up a computer lab with 20 workstations for underprivileged children in the district." },
    { title: "Mobile Health Clinic", desc: "Operating a fully equipped van to provide weekly medical checkups in remote hill areas." },
    { title: "Urban Green Rooftops", desc: "Converting concrete rooftops into organic vegetable gardens to combat the urban heat island effect." },
    { title: "Stray Animal Sanctuary", desc: "Repairing and expanding our municipal shelter to accommodate 50 more abandoned dogs and cats." },
    { title: "Oxygen Concentrator Bank", desc: "Procuring 50 high-capacity oxygen concentrators for emergency home use during respiratory outbreaks." },
    { title: "Rural Micro-Grids", desc: "Installing solar micro-grids for 500 households currently living without basic electricity." },
    { title: "Artisan Empowerment", desc: "Direct-to-consumer marketplace setup and training for 100 traditional silk weavers." },
    { title: "Elderly Home Care", desc: "Monthly medical and social outreach program for seniors living alone in the city." },
    { title: "Women's Safety Center", desc: "Establishing a 24/7 safe house and legal aid clinic for survivors of domestic violence." }
];

const CAPTIONS = [
    "Great progress on the field today! Every step brings us closer to our goal. #DonerHQ",
    "This is what impact looks like. Thank you to everyone who believed in this mission.",
    "Quick update from the village center. The community spirit here is incredible!",
    "Transparency is key. Here's exactly how your donations were used this week.",
    "A small win today that means a world of difference for these families.",
    "Behind the scenes: Preparing the materials for our next big project phase.",
    "Hear it from the beneficiaries themselves! Your support is changing lives.",
    "Challenges were many, but our resolve is stronger. Moving forward together.",
    "A moment of joy captured during our distribution drive. #CelestialLedger",
    "Join us in our journey to make the world a slightly better place today."
];

const refreshDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/donerhq');
        console.log("Connected to MongoDB for Full Refresh...");

        // 1. Clear Dependent Data
        console.log("Cleaning up old posts, causes, and scores...");
        await Post.deleteMany({});
        await Cause.deleteMany({});
        await FeedScore.deleteMany({});

        // 2. Clear Extra NGOs
        const ngos = await NGO.find({});
        console.log(`Initial NGOs found: ${ngos.length}`);

        if (ngos.length > 10) {
            const ngosToDelete = ngos.slice(10);
            for (const n of ngosToDelete) {
                await User.deleteOne({ _id: n.userId });
                await NGO.deleteOne({ _id: n._id });
            }
            console.log(`Removed ${ngosToDelete.length} extra NGOs and their associated users.`);
        }

        const finalNgos = await NGO.find({}).limit(10);
        console.log(`Proceeding with ${finalNgos.length} NGOs.`);

        // 3. Repopulate with Detailed Data
        for (const ngo of finalNgos) {
            console.log(`Seeding data for: ${ngo.name}`);
            
            // Clear their arrays just in case
            ngo.causes = [];
            ngo.posts = [];

            // A. Create 5 Causes Each
            const causeIds = [];
            for (let i = 0; i < 5; i++) {
                const template = CAUSE_TEMPLATES[(i + finalNgos.indexOf(ngo)) % CAUSE_TEMPLATES.length];
                const cause = await Cause.create({
                    ngoId: ngo._id,
                    title: `${template.title} - Phase ${i + 1}`,
                    description: template.desc,
                    goalAmount: Math.floor(Math.random() * (500000 - 50000) + 50000),
                    raisedAmount: Math.floor(Math.random() * 45000),
                    status: 'active',
                    coverImage: IMAGES[Math.floor(Math.random() * IMAGES.length)]
                });
                causeIds.push(cause._id);
            }

            // B. Create 10 Posts Each
            const postIds = [];
            for (let j = 0; j < 10; j++) {
                const type = j < 3 ? 'video' : (j < 7 ? 'photo' : 'text');
                const post = await Post.create({
                    ngoId: ngo._id,
                    caption: CAPTIONS[j % CAPTIONS.length],
                    type: type,
                    mediaUrl: type === 'photo' ? IMAGES[Math.floor(Math.random() * IMAGES.length)] : (type === 'video' ? VIDEOS[Math.floor(Math.random() * VIDEOS.length)] : null),
                    linkedCauseId: causeIds[Math.floor(Math.random() * causeIds.length)],
                    likes: Math.floor(Math.random() * 1000),
                    commentCount: Math.floor(Math.random() * 100),
                    tags: [ngo.category, 'Impact', 'CelestialLedger']
                });
                postIds.push(post._id);
            }

            ngo.causes = causeIds;
            ngo.posts = postIds;
            await ngo.save();
        }

        console.log("\n🚀 DATABASE REFRESH COMPLETE!");
        console.log("----------------------------");
        console.log("Final Report:");
        console.log("- NGOs: 10");
        console.log("- Causes: 50 (5 per NGO)");
        console.log("- Posts: 100 (10 per NGO)");
        console.log("----------------------------");
        process.exit();
    } catch (error) {
        console.error("❌ Full Refresh Failed:", error);
        process.exit(1);
    }
};

refreshDatabase();
