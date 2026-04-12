import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NGO from '../src/models/NGO.js';
import Post from '../src/models/Post.js';

dotenv.config();

const IMAGES = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800",
  "https://images.unsplash.com/photo-1524069290683-0457abfe42c3?q=80&w=800",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800",
  "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=800",
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800",
  "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?q=80&w=800"
];

const VIDEOS = [
  "https://assets.mixkit.co/videos/preview/mixkit-group-of-volunteers-planting-new-trees-in-a-forest-41130-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-green-plant-41133-large.mp4"
];

const CAPTIONS = {
  'Education': [
    "Opening doors to a brighter future. Our new library phase is complete!",
    "Success! 50 students from our rural node just cleared their board exams.",
    "Knowledge is the bridge to equality. Help us distribute 200 kits today.",
    "Teachers are the true architects. Training workshop in progress.",
    "Digital literacy for every child. Our new computer lab is live!"
  ],
  'Healthcare': [
    "Providing medical care to the farthest corners. Mobile clinic #04 launched.",
    "Health is a right, not a privilege. Successful surgery for little Arush.",
    "Thank you for the support. New oxygen plant installed successfully.",
    "Preventing the preventable. Routine checkup day at the center.",
    "Emergency relief protocol activated. Medical kits arriving on-ground."
  ],
  'Environment': [
    "Every tree planted is a breath for the future. Join our green drive.",
    "Clean oceans, clean future. 2 tons of plastic waste collected today.",
    "Restoring bit by bit. The reforestation phase 2 is looking green!",
    "The planet doesn't need us, we need the planet. Shift to sustainable nodes.",
    "Climate action now. Our solar-powered community center is fully operational."
  ],
  'Animal Welfare': [
    "Giving a voice to the voiceless. Another rescue mission accomplished.",
    "Compassion has no species. New shelter wing opened today.",
    "Feeding drive in full swing. 500 strays provided for today.",
    "Meet Bruno! He found his forever home thanks to your trust.",
    "Sanctuary update: Our residents are enjoying the new open enclosures."
  ]
};

const DEFAULT_CAPTIONS = [
  "Together we can make a difference. Join our mission today.",
  "Impact is measured in smiles, not just numbers.",
  "Your trust fuels our ground operations. Transparency report out now.",
  "Small acts, big changes. Be the node of change.",
  "Platform protocol update: Our transparency score just hit a new high!"
];

const seedPosts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DonerHQ Ledger...");

    const ngos = await NGO.find();
    console.log(`Found ${ngos.length} NGOs to seed posts for.`);

    let totalCreated = 0;
    
    for (const ngo of ngos) {
      const postsForNgo = [];
      const category = ngo.category || 'General';
      const availableCaptions = CAPTIONS[category] || DEFAULT_CAPTIONS;

      for (let i = 0; i < 5; i++) {
        const type = Math.random() > 0.8 ? 'video' : (Math.random() > 0.4 ? 'photo' : 'text');
        const post = {
          ngoId: ngo._id,
          type: type,
          caption: availableCaptions[i % availableCaptions.length],
          mediaUrl: type === 'video' ? VIDEOS[i % VIDEOS.length] : (type === 'photo' ? IMAGES[Math.floor(Math.random() * IMAGES.length)] : null),
          tags: [category.toLowerCase(), 'impact', 'community'],
          likes: Math.floor(Math.random() * 500) + 50,
          reach: Math.floor(Math.random() * 2000) + 100,
          commentCount: Math.floor(Math.random() * 50) + 5
        };
        postsForNgo.push(post);
      }
      
      await Post.insertMany(postsForNgo);
      totalCreated += 5;
      console.log(`✅ Seeded 5 posts for ${ngo.name} (${category})`);
    }

    console.log(`\n🎉 MASTER SEED COMPLETE: ${totalCreated} high-quality posts generated.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedPosts();
