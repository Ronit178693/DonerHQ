import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import NGO from '../src/models/NGO.js';
import Cause from '../src/models/Cause.js';
import Post from '../src/models/Post.js';
import Donation from '../src/models/Donation.js';
import EscrowTransaction from '../src/models/EscrowTransaction.js';
import FeedScore from '../src/models/FeedScore.js';
import ImpactVideo from '../src/models/ImpactVideo.js';

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/DonerHQ';

// Disable auto-index so Mongoose does not recreate stale compound indexes
mongoose.set('autoIndex', false);

// Helper to hash password
const hashPassword = async (pwd) => {
    return await bcrypt.hash(pwd, 10);
};

// Realistic Images from Unsplash
const images = {
    logos: [
        'https://images.unsplash.com/photo-1557683316-973673baf926?w=150', // gradient red
        'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=150', // gradient blue
        'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=150', // gradient purple
        'https://images.unsplash.com/photo-1560015534-eca37253526c?w=150', // colorful abstract
    ],
    education: [
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
        'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800',
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
        'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800',
    ],
    environment: [
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
        'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=800',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800',
    ],
    health: [
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800',
        'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800',
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
        'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800',
        'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800',
    ],
    animals: [
        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
        'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800',
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800',
        'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=800',
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
    ],
    water: [
        'https://images.unsplash.com/photo-1541256996761-85df2eff3139?w=800',
        'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800',
        'https://images.unsplash.com/photo-1527156279123-ec46627bc33a?w=800',
        'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=800',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    ],
    hunger: [
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
        'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800',
        'https://images.unsplash.com/photo-1469571486117-4fd5b9b58fc2?w=800',
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800',
    ]
};

const ngoDataTemplates = [
    {
        name: 'Aarohan Foundation',
        bio: 'Dedicated to providing high-quality primary education and digital literacy skills to children in rural and urban slums.',
        category: 'education',
        tags: ['education', 'digital-literacy', 'underprivileged-children', 'slum-schools'],
        location: 'Delhi, India',
        causes: [
            { title: 'Digital Labs for Slum Children', desc: 'Setting up computer hubs equipped with free internet and software tools to teach coding and basic computer operations to slum children.', goal: 450000, type: 'education' },
            { title: 'Mobile Libraries in Rural Villages', desc: 'Deploying custom learning vans stocked with textbooks, storybooks, and interactive learning screens to villages without schools.', goal: 350000, type: 'education' },
            { title: 'Educate the Girl Child Initiative', desc: 'Providing academic scholarships, textbooks, and mentoring kits to girls from low-income families to prevent high school dropouts.', goal: 500000, type: 'education' },
            { title: 'Upgrade School Desks and Infrastructure', desc: 'Renovating old school structures, replacing broken desks, and building clean sanitation facilities for community public schools.', goal: 600000, type: 'education' },
            { title: 'Free Coding Bootcamps for Youth', desc: 'A 3-month basic coding and web development training course for high school graduates to prepare them for entry-level tech support jobs.', goal: 300000, type: 'education' }
        ]
    },
    {
        name: 'GreenEarth Alliance',
        bio: 'Empowering local communities to plant native forests, install solar microgrids, and reduce single-use plastic waste.',
        category: 'environment',
        tags: ['reforestation', 'solar-energy', 'plastic-free', 'climate-action'],
        location: 'Bengaluru, India',
        causes: [
            { title: 'Plant 10,000 Native Trees', desc: 'Restoring forest cover in degraded water catchment areas around Western Ghats by planting native fruit and timber saplings.', goal: 200000, type: 'environment' },
            { title: 'Solar Powered Village Microgrids', desc: 'Installing solar panels and storage batteries in off-grid rural communities to replace kerosene lamps with clean LED lighting.', goal: 850000, type: 'environment' },
            { title: 'Clean Rivers and Plastic Recycling', desc: 'Setting up trash barriers along local river inlets and hiring community members to collect, separate, and recycle discarded plastic waste.', goal: 400000, type: 'environment' },
            { title: 'Organic Seedballing for Forests', desc: 'Creating and aerial-dispersing native forest seedballs over drought-affected barren hills to restore natural plant ecosystems.', goal: 150000, type: 'environment' },
            { title: 'Urban Miyawaki Mini-Forests', desc: 'Creating dense mini-forests in empty urban spaces to reduce local heat island effects and filter vehicle emissions.', goal: 500000, type: 'environment' }
        ]
    },
    {
        name: 'Swasthya Seva Trust',
        bio: 'Delivering comprehensive primary healthcare, diagnostic setups, maternal medical aid, and free life-saving medicines to remote locations.',
        category: 'health',
        tags: ['healthcare', 'rural-clinics', 'maternal-health', 'free-medicine'],
        location: 'Pune, India',
        causes: [
            { title: 'Rural Primary Clinic Support', desc: 'Sponsoring doctors, nurses, and free prescription medicine supplies for an primary health clinic serving 20 remote tribal villages.', goal: 650000, type: 'health' },
            { title: 'Mobile Medical Diagnosis Vans', desc: 'Equipping a van with X-Ray, ECG, and blood testing machinery to travel and run free diagnostics camps in remote locations.', goal: 950000, type: 'health' },
            { title: 'Safe Motherhood Delivery Kits', desc: 'Distributing clean, sterile maternal care kits and hiring midwives to support safe deliveries in remote tribal areas.', goal: 250000, type: 'health' },
            { title: 'Diabetes and Blood Pressure Camp', desc: 'Screening elderly village residents for high blood pressure and diabetes, and supplying them with 6 months of free medication.', goal: 300000, type: 'health' },
            { title: 'Emergency Ambulances for Rural Areas', desc: 'Purchasing and retrofitting an emergency transport ambulance to connect remote forest villages to the nearest city hospital.', goal: 800000, type: 'health' }
        ]
    },
    {
        name: 'Paws & Tails Rescue',
        bio: 'We rescue stray, injured and abandoned street animals, run neutering clinics, and operate emergency shelter homes.',
        category: 'animal-welfare',
        tags: ['animal-welfare', 'dog-rescue', 'stray-neutering', 'shelter-support'],
        location: 'Mumbai, India',
        causes: [
            { title: 'Stray Dog Shelter Construction', desc: 'Building secure quarantine pens, feeding stations, and exercise yards for our expanding street dog rescue shelter.', goal: 550000, type: 'animals' },
            { title: 'Stray Cat Neutering Campaigns', desc: 'Catching, neutering, vaccinating, and returning street cats to safely control local stray populations and prevent disease.', goal: 200000, type: 'animals' },
            { title: 'Animal Rescue Response Ambulance', desc: 'Purchasing surgical tools and running a 24/7 emergency response vehicle to rescue street animals hit by traffic.', goal: 500000, type: 'animals' },
            { title: 'Stray Feeding and Winter Blankets', desc: 'Distributing thousands of winter jackets and delivering daily nutritious hot meals to street animals during cold months.', goal: 150000, type: 'animals' },
            { title: 'Avian Trauma Center Renovation', desc: 'Expanding medical equipment, diagnostic tools, and recovery rooms for rescuing injured wild birds in high-rise urban areas.', goal: 300000, type: 'animals' }
        ]
    },
    {
        name: 'Jal Jeevan Project',
        bio: 'Installing community water filtration systems, digging borewells, and promoting sanitation habits in drought-prone rural sectors.',
        category: 'clean-water',
        tags: ['clean-water', 'borewells', 'sanitation', 'filtration'],
        location: 'Jaipur, India',
        causes: [
            { title: 'Digging Deep Water Borewells', desc: 'Drilling sustainable borewells in desert villages where residents walk over 5km daily to fetch brackish water.', goal: 400000, type: 'water' },
            { title: 'RO Community Filtration Units', desc: 'Installing solar-powered reverse osmosis water filtration machines in villages suffering from high groundwater fluoride.', goal: 600000, type: 'water' },
            { title: 'Rainwater Harvesting Systems', desc: 'Constructing community rainwater capture and underground storage reservoirs at village schools to store monsoon runoff.', goal: 300000, type: 'water' },
            { title: 'Clean Water Pipes to Homes', desc: 'Laying pipeline networks to connect clean reservoir water directly into public sanitation taps across drought-prone sectors.', goal: 700000, type: 'water' },
            { title: 'Rural School Toilet Refurbishing', desc: 'Constructing separate clean toilets with running water to ensure hygiene and keep young girls enrolled in schools.', goal: 350000, type: 'water' }
        ]
    },
    {
        name: 'Annapurna Rasoi',
        bio: 'Eradicating hunger and malnutrition through community kitchens, distributing dry rations, and offering free mid-day meals to child laborers.',
        category: 'hunger',
        tags: ['food-security', 'mid-day-meals', 'hunger-relief', 'malnutrition'],
        location: 'Kolkata, India',
        causes: [
            { title: 'Hot Mid-Day Meals for Children', desc: 'Providing fresh, daily cooked nutritious lunch meals to underprivileged child laborers to encourage them to attend evening classes.', goal: 350000, type: 'hunger' },
            { title: 'Dry Ration Kits for Migrants', desc: 'Distributing dry food kits (rice, wheat flour, lentils, cooking oil, spices) to migrant worker families facing sudden job losses.', goal: 450000, type: 'hunger' },
            { title: 'Slum Malnutrition Recovery Centers', desc: 'Supplying special high-protein peanut pastes and vitamin supplements to young infants diagnosed with severe acute malnutrition.', goal: 250000, type: 'hunger' },
            { title: 'Community Kitchen Infrastructure', desc: 'Purchasing industrial cooking pots, gas ranges, and stainless steel washing stations for our centralized free community kitchen.', goal: 500000, type: 'hunger' },
            { title: 'Feeding Abandoned Elderly Citizens', desc: 'Delivering daily hot dinner packets directly to homeless elderly citizens abandoned on street corners.', goal: 300000, type: 'hunger' }
        ]
    },
    {
        name: 'Nari Shakti Kendra',
        bio: 'Supporting gender equality and women’s independence through vocational training, financial literacy, and entrepreneurship support.',
        category: 'women-empowerment',
        tags: ['vocational-training', 'gender-equality', 'women-rights', 'microfinance'],
        location: 'Hyderabad, India',
        causes: [
            { title: 'Tailoring and Sewing Machines', desc: 'Providing professional tailoring classes and gifting sewing machines to rural widows to help them start home businesses.', goal: 280000, type: 'hunger' },
            { title: 'Digital Literacy for Women', desc: 'Setting up a community computer center to teach local women basic digital skills, online banking, and remote work tools.', goal: 400000, type: 'education' },
            { title: 'Microfinance Loans for Artisans', desc: 'Providing small, interest-free starter loans to women handcraft makers to buy raw fabrics, clay, and thread in bulk.', goal: 350000, type: 'hunger' },
            { title: 'Women Safety Awareness Workshops', desc: 'Running legal rights workshops, self-defense classes, and emergency contact channels for women workers in factories.', goal: 150000, type: 'education' },
            { title: 'Nursing Assistant Skill Training', desc: 'A 6-month certification course to train rural women as professional nursing aides, linking them to private clinics and hospitals.', goal: 480000, type: 'health' }
        ]
    },
    {
        name: 'Bright Future Academy',
        bio: 'Providing higher education scholarships, college guidance, career mentorship, and tech bootcamps to marginalized youth.',
        category: 'education',
        tags: ['scholarships', 'higher-education', 'career-guidance', 'mentorship'],
        location: 'Chennai, India',
        causes: [
            { title: 'College Scholarships for Poor Youth', desc: 'Paying full tuition fees for high-performing students from low-income agricultural families to study engineering and science.', goal: 600000, type: 'education' },
            { title: 'Youth Skill Training Incubators', desc: 'Buying equipment like lathes, welding gears, and electric training kits for our free community job-skills center.', goal: 500000, type: 'education' },
            { title: 'Career Guidance Centers in Schools', desc: 'Setting up counseling booths and supplying university entrance guidebooks to public high schools in rural areas.', goal: 200000, type: 'education' },
            { title: 'STEM Kits for Rural Classrooms', desc: 'Supplying science experiment models, robotics kits, and logic boards to schools to foster interest in technical careers.', goal: 300000, type: 'education' },
            { title: 'Mentorship and Internship Program', desc: 'Connecting young college students from marginalized communities with industry professionals and funding travel stipends.', goal: 180000, type: 'education' }
        ]
    },
    {
        name: 'EcoHimalaya Foundation',
        bio: 'Protecting fragile mountain ecosystems, managing tourist waste, safeguarding glaciers, and supporting sustainable local farming.',
        category: 'environment',
        tags: ['himalayan-ecology', 'waste-management', 'glacier-protection', 'eco-tourism'],
        location: 'Dehradun, India',
        causes: [
            { title: 'High-Altitude Trash Cleanup', desc: 'Funding garbage cleanup expeditions to remove plastic bottles, cans, and broken camping gears from trekking pathways.', goal: 300000, type: 'environment' },
            { title: 'Glacier Stream Siltation Barriers', desc: 'Building soil-retaining rock barriers along melting mountain rivers to protect downstream village farms from silt landslides.', goal: 500000, type: 'environment' },
            { title: 'Highland Greenhouse Farming Kits', desc: 'Distributing greenhouses and cold-hardy vegetable seeds to mountain farmers to secure local food production.', goal: 250000, type: 'environment' },
            { title: 'Eco-Tourism Guide Training', desc: 'Training local youth as certified nature guides, mountaineers, and safety responders to build sustainable local jobs.', goal: 350000, type: 'environment' },
            { title: 'Save the Snow Leopard Awareness', desc: 'Installing predator-proof wire mesh roofs for livestock pens in high villages to prevent retaliatory snow leopard hunts.', goal: 220000, type: 'environment' }
        ]
    },
    {
        name: 'Asha Cancer Care',
        bio: 'We subsidize expensive chemotherapy costs, operate hospice care homes, and provide free breast cancer screening drives.',
        category: 'health',
        tags: ['cancer-treatment', 'free-chemotherapy', 'patient-support', 'early-detection'],
        location: 'Mumbai, India',
        causes: [
            { title: 'Subsidized Chemotherapy Cycles', desc: 'Paying for life-saving chemotherapy drugs and oncologist fees for underprivileged pediatric cancer patients.', goal: 900000, type: 'health' },
            { title: 'Cancer Screening Diagnostic Bus', desc: 'Running a mobile screening bus with mammography and ultrasound equipment to detect cancer early in rural areas.', goal: 980000, type: 'health' },
            { title: 'Hospice Care Patient Support', desc: 'Providing palliative medicines, medical beds, oxygen cylinders, and nursing support to terminal cancer patients.', goal: 500000, type: 'health' },
            { title: 'Nutritional Care for Recovering Patients', desc: 'Distributing monthly high-protein nutrition bags (whey protein, nuts, vitamins) to patients recovering from major surgeries.', goal: 300000, type: 'health' },
            { title: 'Out-of-Town Patient Lodges', desc: 'Maintaining temporary free lodging hostels for rural patients and their families during long hospital treatments.', goal: 600000, type: 'health' }
        ]
    },
    {
        name: 'Karuna Street Clinic',
        bio: 'Operating mobile healthcare buses, treating street dwellers, distributing first-aid supplies, and offering free vaccines.',
        category: 'health',
        tags: ['mobile-clinic', 'street-medicine', 'first-aid', 'slum-healthcare'],
        location: 'Ahmedabad, India',
        causes: [
            { title: 'Mobile Medical Diagnostic Van', desc: 'Sponsoring fuel, doctors, and primary medicines for a diagnostic bus treating street dwellers and slum kids weekly.', goal: 700000, type: 'health' },
            { title: 'Emergency Street First-Aid Kits', desc: 'Assembling and distributing compact medical treatment kits to community street workers to treat minor cuts and burns.', goal: 120000, type: 'health' },
            { title: 'Vaccination Drives for Slum Kids', desc: 'Providing free childhood immunizations (MMR, Polio, Tetanus, Hepatitis) in urban slum pockets lacking government reach.', goal: 250000, type: 'health' },
            { title: 'Free Eye Checkups and Specs', desc: 'Conducting optometry camps and gifting free prescription reading spectacles to senior street citizens and manual laborers.', goal: 200000, type: 'health' },
            { title: 'Skin Infection Treatment Drives', desc: 'Providing dermatology checkups and distributing anti-fungal ointments and soaps to slum clusters during monsoon.', goal: 180000, type: 'health' }
        ]
    },
    {
        name: 'Sankalp Skill Academy',
        bio: 'Empowering jobless youth through certified technical skills training, matching them with job placements.',
        category: 'education',
        tags: ['youth-skills', 'employment-training', 'carpentry', 'electrician'],
        location: 'Indore, India',
        causes: [
            { title: 'Electrician Skill Lab Training', desc: 'Buying wiring testboards, multimeters, conduit benders, and electric motors to build a free practical training lab.', goal: 400000, type: 'education' },
            { title: 'Carpentry Tools and Workshop', desc: 'Sponsoring saws, sanders, chisels, workbenches, and wood stocks for a 3-month certified carpentry training course.', goal: 350000, type: 'education' },
            { title: 'Plumbing and Sanitation Lab', desc: 'Constructing a practical pipe plumbing mockup lab to train youth in water fitting and sanitary installations.', goal: 300000, type: 'education' },
            { title: 'Appliance Repair Training Center', desc: 'Supplying old TVs, AC units, refrigerators, and repair tools for a specialized household appliance repair course.', goal: 450000, type: 'education' },
            { title: 'Youth Placement Office Setup', desc: 'Setting up computers and hiring counselors to run a dedicated job board, matching trainees with local manufacturers.', goal: 200000, type: 'education' }
        ]
    },
    {
        name: 'WildLife Defenders',
        bio: 'Active conservation of endangered forest animals, patrolling wildlife zones, anti-poaching, and habitat restoration.',
        category: 'animal-welfare',
        tags: ['wildlife-protection', 'forest-patrols', 'anti-poaching', 'habitat-restoration'],
        location: 'Guwahati, India',
        causes: [
            { title: 'Anti-Poaching Night Vision Gears', desc: 'Purchasing infrared binoculars and thermal scopes for forest guards patrolling rhino and tiger sanctuaries at night.', goal: 500000, type: 'animals' },
            { title: 'Elephant Trench Construction', desc: 'Digging deep containment trenches around forest boundaries to prevent elephant herds from entering human agricultural zones.', goal: 600000, type: 'animals' },
            { title: 'Forest Waterhole Restoration', desc: 'Desilting and deepening dry natural waterholes in wildlife reserves to ensure water during hot summer months.', goal: 300000, type: 'animals' },
            { title: 'Endangered Bird Nesting Boxes', desc: 'Building and mounting secure wooden hornbill nesting boxes high on forest canopies to restore breeding populations.', goal: 150000, type: 'animals' },
            { title: 'Animal Rescue Veterinary Hospital', desc: 'Buying advanced medical monitors, anesthesia machines, and surgical tables for our wildlife trauma ward.', goal: 750000, type: 'animals' }
        ]
    },
    {
        name: 'Sudarshan Response Trust',
        bio: 'Immediate emergency disaster rescue, food distribution, flood relief camps, and long-term home rehabilitation.',
        category: 'disaster-relief',
        tags: ['disaster-relief', 'flood-rescue', 'rehabilitation', 'emergency-kits'],
        location: 'Kochi, India',
        causes: [
            { title: 'Inflatable Water Rescue Boats', desc: 'Buying commercial-grade inflatable motorboats and life jackets to rescue residents trapped during heavy monsoons.', goal: 600000, type: 'hunger' },
            { title: 'Emergency Food and Water Kits', desc: 'Stocking and distributing critical dry rations, energy bars, and packed drinking water bottles to flood camp survivors.', goal: 400000, type: 'hunger' },
            { title: 'Temporary Shelter Camp Tents', desc: 'Purchasing weather-resistant family dome tents, sleeping mats, and mobile toilet cabins for sudden displaced families.', goal: 500000, type: 'hunger' },
            { title: 'Rebuilding Destroyed Slum Roofs', desc: 'Providing sheets of sturdy corrugated tin and timber poles to families to patch up homes damaged by windstorms.', goal: 300000, type: 'hunger' },
            { title: 'Medical Aid and Cholera Prevention', desc: 'Distributing clean water purification tablets, ORS packets, and running diagnostic clinics to stop waterborne epidemics.', goal: 350000, type: 'health' }
        ]
    },
    {
        name: 'Mountain Spring Initiative',
        bio: 'Supplying drinking water to Himalayan communities, installing water filters, and building mountain piping systems.',
        category: 'clean-water',
        tags: ['mountain-springs', 'filtration', 'drinking-water', 'village-piping'],
        location: 'Shimla, India',
        causes: [
            { title: 'Mountain Spring Water Pipings', desc: 'Laying HDPE pipelines down steep mountain slopes to carry clean spring water directly to village storage tanks.', goal: 550000, type: 'water' },
            { title: 'Community Water Storage Tanks', desc: 'Constructing robust concrete storage reservoirs to store and distribute spring water safely to hillside communities.', goal: 450000, type: 'water' },
            { title: 'Hospice Gravity Filter Systems', desc: 'Installing multi-stage gravity-driven sand and carbon filters in public health centers to provide clean drinking water.', goal: 250000, type: 'water' },
            { title: 'Spring Source Protection Fences', desc: 'Building concrete walls and metal fences around pristine spring sources to stop pollution from livestock and tourists.', goal: 200000, type: 'water' },
            { title: 'Community Water Quality Meters', desc: 'Buying electronic water testing kits and training village youth to monitor pH and bacterial levels monthly.', goal: 150000, type: 'water' }
        ]
    },
    {
        name: 'Nourish India Project',
        bio: 'Combating child malnutrition, supplying high-protein weaning pastes, and supporting maternal health.',
        category: 'hunger',
        tags: ['malnutrition', 'infant-nutrition', 'dry-ration', 'mother-care'],
        location: 'Patna, India',
        causes: [
            { title: 'Nutritious High-Protein Pastes', desc: 'Purchasing and distributing packages of Ready-to-Use Therapeutic Food (RUTF) to infants suffering from severe wasting.', goal: 400000, type: 'hunger' },
            { title: 'Nutritional Support for Pregnant Mothers', desc: 'Distributing iron, calcium, and prenatal vitamin supplements to low-income pregnant women in rural healthcare centers.', goal: 300000, type: 'hunger' },
            { title: 'Community Baby Feeding Hubs', desc: 'Setting up clean private rooms in slums to teach mother-care, support breastfeeding, and weigh babies monthly.', goal: 200000, type: 'hunger' },
            { title: 'Slum Anganwadi Nutrition Food', desc: 'Supplying milk powders, boiled eggs, and protein biscuits to under-funded local childcare centers.', goal: 350000, type: 'hunger' },
            { title: 'Severe Wasting Pediatric Ward Aid', desc: 'Buying specialized nutritional formulas, warming tables, and iv fluid stands for pediatric malnutrition wards.', goal: 600000, type: 'hunger' }
        ]
    },
    {
        name: 'Shakti Artisans Group',
        bio: 'Supporting women craftspeople through tailoring projects, online stores, business training, and microfinance.',
        category: 'women-empowerment',
        tags: ['handicrafts', 'tailoring', 'women-entrepreneurs', 'financial-literacy'],
        location: 'Lucknow, India',
        causes: [
            { title: 'Tailoring Training Center Setup', desc: 'Renting a workshop space, installing electric sewing tables, and hiring masters to teach professional garment cutting.', goal: 420000, type: 'education' },
            { title: 'Artisan Web Shop and Cataloging', desc: 'Hiring photographers and launching an online store to sell handwoven embroidery products to international buyers.', goal: 300000, type: 'education' },
            { title: 'Chikan Handcraft Starter Material', desc: 'Purchasing quality threads, cotton fabrics, and design prints to distribute as starter kits to rural women.', goal: 250000, type: 'hunger' },
            { title: 'Business Literacy Seminars', desc: 'Running microfinance classes on keeping ledger accounts, calculating margins, and registering tax codes.', goal: 150000, type: 'education' },
            { title: 'Artisan Exhibition Stall Rentals', desc: 'Renting stalls and covering travel costs for women artisans to sell their products directly in metro handicraft fairs.', goal: 220000, type: 'hunger' }
        ]
    },
    {
        name: 'Uday Special Needs',
        bio: 'Caring for autistic children, providing free prosthetics, special schools, and physical therapy sessions.',
        category: 'disability-support',
        tags: ['special-needs', 'prosthetics', 'autism-care', 'inclusive-education'],
        location: 'Bhopal, India',
        causes: [
            { title: 'Autism Therapy Room Sensory Kits', desc: 'Fitting therapeutic playrooms with swings, weighted blankets, sensory lights, and speech rehabilitation aids.', goal: 350000, type: 'health' },
            { title: 'Free Prosthetic Limbs Support', desc: 'Funding custom-designed mechanical prosthetic hands and legs for young kids losing limbs in train and road accidents.', goal: 600000, type: 'health' },
            { title: 'Special School Teacher Salaries', desc: 'Covering monthly stipends for specialized educators and behavioral therapists at our free special-needs school.', goal: 500000, type: 'education' },
            { title: 'Physiotherapy Center Machinery', desc: 'Purchasing therapeutic lasers, parallel bars, walkers, and massage tables for our community rehabilitation ward.', goal: 400000, type: 'health' },
            { title: 'Special Needs Transport Bus', desc: 'Buying a utility transport van with hydraulic lift ramps to transport wheelchair-bound kids to school daily.', goal: 850000, type: 'health' }
        ]
    },
    {
        name: 'Vidya STEM Labs',
        bio: 'Building computer laboratories, teaching coding, establishing STEM infrastructure in community public schools.',
        category: 'education',
        tags: ['computer-labs', 'coding-education', 'school-infrastructure', 'stem'],
        location: 'Ranchi, India',
        causes: [
            { title: 'School Computer Lab Desktops', desc: 'Purchasing 15 student desktops, chairs, networking routers, and installing offline learning wikis in a village school.', goal: 500000, type: 'education' },
            { title: 'Robotics and STEM Kit Supplies', desc: 'Supplying school science laboratories with microcontroller kits, sensors, motors, and logic training manuals.', goal: 300000, type: 'education' },
            { title: 'Solar Powered Computer Stations', desc: 'Installing solar battery systems to run the computer lab during frequent rural electric power blackouts.', goal: 450000, type: 'education' },
            { title: 'STEM Teacher Training Seminars', desc: 'Running intensive weekend training bootcamps for public school teachers to learn and teach basic Python coding.', goal: 200000, type: 'education' },
            { title: 'Offline Education Servers', desc: 'Installing local servers pre-loaded with educational software, science videos, and math tests in offline tribal schools.', goal: 150000, type: 'education' }
        ]
    },
    {
        name: 'Vrksha Tree Seeders',
        bio: 'Restoring green lungs in urban metros, seedballing dry barren hills, and planting dense micro-forests.',
        category: 'environment',
        tags: ['urban-forests', 'sapling-nurseries', 'seedballing', 'green-belts'],
        location: 'Nagpur, India',
        causes: [
            { title: 'Urban Miyawaki Sapling Packs', desc: 'Buying native mini-forest plants, compost fertilizers, and straw mulch to plant green lungs in empty city spaces.', goal: 400000, type: 'environment' },
            { title: 'Native Plant Nursery Construction', desc: 'Erecting shade nets, drip irrigation lines, and nursery bags to grow 20,000 native tree saplings from organic seeds.', goal: 300000, type: 'environment' },
            { title: 'Monsoon Seedball Manufacture', desc: 'Making 50,000 clay-compost seedballs to drop on barren rocky hills before the monsoon rain cycles.', goal: 120000, type: 'environment' },
            { title: 'Lake Wetland Re-Greening Drives', desc: 'Planting water-filtering reeds, grass patches, and shady trees along local lake basins to restore animal ecosystems.', goal: 350000, type: 'environment' },
            { title: 'School Green Belt Gardens', desc: 'Helping 20 government schools establish native mini-gardens and teaching children basic environmental care.', goal: 200000, type: 'environment' }
        ]
    }
];

const seedDatabase = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ Connected successfully.');

        // Wiping collections clean
        console.log('🗑️ Wiping existing data...');
        await Promise.all([
            User.deleteMany({}),
            NGO.deleteMany({}),
            Cause.deleteMany({}),
            Post.deleteMany({}),
            Donation.deleteMany({}),
            EscrowTransaction.deleteMany({}),
            FeedScore.deleteMany({}),
            ImpactVideo.deleteMany({})
        ]);
        console.log('✅ Wiped successfully.');

        // Drop and re-create the causes collection to remove any stale compound indexes
        try {
            await mongoose.connection.dropCollection('causes');
            console.log('🗂️ Causes collection dropped (stale indexes cleared).');
        } catch (e) {
            // Collection may not exist yet - that is fine
        }

        // Create one global admin user for testing
        const adminPassword = await hashPassword('admin123');
        const adminUser = await User.create({
            name: 'DonerHQ Admin',
            email: 'admin@donerhq.com',
            password: adminPassword,
            role: 'admin',
            onboardingComplete: true
        });
        console.log(`👑 Admin User Created: ${adminUser.email}`);

        // Loop over the 20 NGO templates
        for (let i = 0; i < ngoDataTemplates.length; i++) {
            const template = ngoDataTemplates[i];
            const email = `${template.name.toLowerCase().replace(/[^a-z]/g, '')}@donerhq.org`;
            const password = await hashPassword('password123');

            // 1. Create User account for NGO
            const user = await User.create({
                name: template.name,
                email,
                password,
                role: 'ngo',
                onboardingComplete: true
            });

            // Select logo image
            const logo = images.logos[i % images.logos.length];

            // 2. Create NGO profile
            const ngo = await NGO.create({
                name: template.name,
                bio: template.bio,
                logo,
                categories: [template.category],
                tags: template.tags,
                location: template.location,
                status: 'approved',
                verified: true,
                transparencyScore: 80 + (i % 18), // 80% to 97%
                followerCount: 250 + (i * 45),    // 250 to 1105 followers
                totalRaised: 120000 + (i * 34000), // realistic raised amount
                userId: user._id,
                doc80G: 'https://cloudinary.com/placeholder-80G.pdf',
                docFCRA: 'https://cloudinary.com/placeholder-FCRA.pdf',
            });

            const causeIds = [];
            const postIds = [];

            // 3. Create 5 Causes for this NGO
            for (let j = 0; j < template.causes.length; j++) {
                const causeTemplate = template.causes[j];
                
                // Select cover image
                const categoryImages = images[causeTemplate.type] || images.education;
                const coverImage = categoryImages[j % categoryImages.length];

                // Random dates
                const deadline = new Date();
                deadline.setDate(deadline.getDate() + 30 + (j * 15));

                const cause = await Cause.create({
                    ngoId: ngo._id,
                    title: causeTemplate.title,
                    description: causeTemplate.desc,
                    goalAmount: causeTemplate.goal,
                    raisedAmount: Math.round(causeTemplate.goal * (0.1 + (j * 0.15))), // partially funded
                    deadline,
                    status: 'active',
                    escrowStatus: 'holding',
                    donorCount: 12 + (j * 8),
                    categories: [template.category],
                    tags: template.tags.slice(0, 3),
                    coverImage
                });
                causeIds.push(cause._id);
            }

            // 4. Create 5 Posts for this NGO
            for (let k = 0; k < 5; k++) {
                const categoryImages = images[template.category] || images.education;
                const mediaUrl = categoryImages[(k + 2) % categoryImages.length];
                
                // Select one of the causes created above to link to the post
                const linkedCauseId = causeIds[k % causeIds.length];

                const post = await Post.create({
                    ngoId: ngo._id,
                    type: 'photo',
                    mediaUrl,
                    caption: `Update from the field: We are making significant progress on our mission. Thanks to our donor community, we have taken major steps forward. Here is a snapshot of our team's activities on the ground. Check out our linked cause to contribute!`,
                    tags: template.tags,
                    linkedCauseId,
                    likes: 18 + (k * 12),
                    likedBy: [],
                    comments: [],
                    commentCount: 0,
                    shares: 5 + (k * 3),
                    donateClicks: 8 + (k * 4),
                    reach: 120 + (k * 65)
                });
                postIds.push(post._id);
            }

            // 5. Update NGO document with Cause and Post IDs
            ngo.causes = causeIds;
            ngo.posts = postIds;
            await ngo.save();

            console.log(`🏢 NGO [${i+1}/20] Seeded: ${ngo.name} (${causeIds.length} causes, ${postIds.length} posts)`);
        }

        console.log('🎉 Seeding successfully completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
};

seedDatabase();
