import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { hashPassword } from '../src/models/User.js';
import NGO from '../src/models/NGO.js';
import Cause from '../src/models/Cause.js';
import Post from '../src/models/Post.js';

dotenv.config();

const SEED_PASSWORD = 'password123';

const NGOS_DATA = [
    {
        name: "Green Earth Initiative",
        email: "contact@greenearth.org",
        location: "Bangalore, Karnataka",
        category: "Environment",
        bio: "Dedicated to urban reforestation, lake conservation, and sustainable waste management systems across metropolitan India.",
        logo: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=300&h=300&fit=crop",
        causes: [
            {
                title: "Clean Air Mission: Urban Tree Belts",
                description: "Planting 5,00,000 native saplings along high-traffic bypasses and expressways to create natural carbon sinks and buffer zones.",
                goalAmount: 350000,
                coverImage: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800"
            },
            {
                title: "Zero Waste Neighborhood Composting",
                description: "Installing community compost bins and establishing dry waste collection hubs to reduce municipal landfill volume by 40%.",
                goalAmount: 200000,
                coverImage: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800"
            },
            {
                title: "Mini-Forests in Government Schools",
                description: "Engaging school children to plant and care for 50 Miyawaki micro-forests directly within school boundaries, teaching biodiversity.",
                goalAmount: 150000,
                coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800"
            },
            {
                title: "Lake Reclamation: De-Silting and Bunding",
                description: "Revitalizing a highly silted local lake by desilting, installing trash meshes in inlets, and planting binding vetiver grass.",
                goalAmount: 750000,
                coverImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800"
            },
            {
                title: "Solar Street Lighting for Off-Grid Hamlets",
                description: "Setting up 50 high-efficiency solar streetlights in remote tribal hamlets bordering forests to improve safety and mobility.",
                goalAmount: 280000,
                coverImage: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=800"
            }
        ],
        posts: [
            { caption: "We just finished digging 100 compost pits in our target communities! This will prevent organic waste from going to landfills. #zerowaste #sustainablelife", type: "photo", media: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800" },
            { caption: "Today, we planted 400 native trees with the help of 120 local volunteers. Every sapling matters! #reforestation #climateaction", type: "photo", media: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800" },
            { caption: "Our Miyawaki forest project at Government School #4 is showing incredible growth. Look at these green shoots! #biodiversity #kidsfornature", type: "photo", media: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800" },
            { caption: "Plastic cleanups are not enough; we need systemic changes. Here is our monthly report on plastic collection in lake inlets. #savewater #lakecleanup", type: "photo", media: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800" },
            { caption: "Exciting news! The solar lighting setups for the forest edge villages are complete. Kids can now study safely under the street lamps. #solarpower", type: "photo", media: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=800" },
            { caption: "A preview of our upcoming lake bund restoration site. We are using natural geotextiles to hold the soil. #ecorestoration", type: "photo", media: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800" },
            { caption: "Our composting workshops have trained over 400 households this week. Empowering families to manage waste at the source. #gogreen", type: "photo", media: "https://images.unsplash.com/photo-1591389703635-e15a07b842d7?q=80&w=800" },
            { caption: "Water levels have risen in our desilted check dam! This is proof that rainwater harvesting works. #watersecurity #ruralimpact", type: "photo", media: "https://images.unsplash.com/photo-1541944743827-e04bb64aa840?q=80&w=800" },
            { caption: "Our volunteers educating students on why native trees outperform exotic species in urban environments. #education #ecoawareness", type: "photo", media: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800" },
            { caption: "Transparency check: We've uploaded the ledger details for the lake cleanup project. Thank you to all our transparent nodes! #donerhq", type: "photo", media: "https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=800" }
        ]
    },
    {
        name: "EduSpark Foundation",
        email: "hello@eduspark.io",
        location: "New Delhi, Delhi",
        category: "Education",
        bio: "Empowering underprivileged children and youth in urban slums through digital literacy, logic, and modern coding bootcamps.",
        logo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=300&h=300&fit=crop",
        causes: [
            {
                title: "Laptops for Tomorrow's Programmers",
                description: "Purchasing 40 durable, refurbished laptops for our community computer center to train youths in Python and web development.",
                goalAmount: 480000,
                coverImage: "https://images.unsplash.com/photo-1588702547919-26089e690eca?q=80&w=800"
            },
            {
                title: "Coding Bootcamps for Underprivileged Girls",
                description: "Sponsoring a 6-month full-stack development curriculum and job placement training for 30 high school graduate girls.",
                goalAmount: 360000,
                coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800"
            },
            {
                title: "Mobile Science and Robotics Lab",
                description: "Equipping a minivan with scientific apparatus, microscopes, and robotic kits to conduct weekly hands-on workshops in rural schools.",
                goalAmount: 500000,
                coverImage: "https://images.unsplash.com/photo-1564910443496-5fd2d76b47fa?q=80&w=800"
            },
            {
                title: "Primary School Learning Kit Drive",
                description: "Distributing school bags, geometry sets, clean uniforms, and notebooks to 1,500 children from daily-wage earner families.",
                goalAmount: 220000,
                coverImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800"
            },
            {
                title: "Slum Community Digital Desks",
                description: "Establishing 5 community centers equipped with high-speed internet and online tutoring facilities for open school candidates.",
                goalAmount: 400000,
                coverImage: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800"
            }
        ],
        posts: [
            { caption: "Our first cohort of Python students is graduating next week! Look at the custom projects they've built. #digitalliteracy #coders", type: "photo", media: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800" },
            { caption: "We just received 15 new laptops from a corporate donor! The kids were so eager to unbox and run their first HTML codes. #codinglife", type: "photo", media: "https://images.unsplash.com/photo-1588702547919-26089e690eca?q=80&w=800" },
            { caption: "Our Mobile Science Lab visited a village in Alwar today. The children saw plant cells under a microscope for the first time! #stem", type: "photo", media: "https://images.unsplash.com/photo-1564910443496-5fd2d76b47fa?q=80&w=800" },
            { caption: "Education is more than books. It's about building confidence. Here is a snap from our interactive public speaking workshop. #confidence", type: "photo", media: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800" },
            { caption: "We are distributing school supplies to 300 primary school children this morning. Seeing these smiles makes it all worth it! #schoolsupplies", type: "photo", media: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800" },
            { caption: "Our coding camp girls presenting their final web apps. Many of these girls are the first in their families to use a computer. #girlspower", type: "photo", media: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800" },
            { caption: "An evening study session at our slum learning desk. Dedicated mentors helping kids prepare for their final examinations. #success", type: "photo", media: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800" },
            { caption: "STEM learning is the foundation of future logical problem solvers. We've introduced basic electronics kits. #roboticsforchildren", type: "photo", media: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800" },
            { caption: "Our library is expanding! Thanks to your generous book donations, we've added a dedicated section for storybooks. #readingisfun", type: "photo", media: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800" },
            { caption: "Ledger check: The hardware and shipping records for our laptop drive are now available on the blockchain explorer. #transparency #donerhq", type: "photo", media: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800" }
        ]
    },
    {
        name: "HealPulse Integrated Healthcare",
        email: "info@healpulse.org",
        location: "Mumbai, Maharashtra",
        category: "Health",
        bio: "Bridging the critical gap in rural and slum healthcare access via mobile clinics, surgical sponsorships, and diagnostic camps.",
        logo: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=300&h=300&fit=crop",
        causes: [
            {
                title: "Rural Mobile Diagnostic Clinic Van",
                description: "Purchasing and customizing a mobile van equipped with basic ECG, X-Ray, and blood analysers to conduct diagnostic camps.",
                goalAmount: 900000,
                coverImage: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800"
            },
            {
                title: "Pediatric Heart Surgery Sponsorship",
                description: "Funding life-saving cardiac surgeries and intensive post-operative care for 15 children from low-income agricultural families.",
                goalAmount: 600000,
                coverImage: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=800"
            },
            {
                title: "Maternal Health and Safe Delivery Centers",
                description: "Setting up 2 basic maternal health clinics in remote villages of Maharashtra with trained nurses and safe delivery equipment.",
                goalAmount: 450000,
                coverImage: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=800"
            },
            {
                title: "Free Life-Saving Medicine Bank",
                description: "Procuring and distributing free daily medications for diabetes, high blood pressure, and asthma to impoverished senior citizens.",
                goalAmount: 250000,
                coverImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800"
            },
            {
                title: "Vision Restoration: Free Cataract Camps",
                description: "Conducting screening camps and performing 250 free cataract surgeries with intraocular lens implantation for blind elderly villagers.",
                goalAmount: 375000,
                coverImage: "https://images.unsplash.com/photo-1579684389782-64d84b5e902a?q=80&w=800"
            }
        ],
        posts: [
            { caption: "Our mobile health van reached a remote tribal hamlet in Palghar today. Over 150 patients were screened and treated. #mobileclinic", type: "photo", media: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800" },
            { caption: "Success! Little Aditya's cardiac surgery was a complete success, and he has been discharged. Thanks to all who funded this! #health", type: "photo", media: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=800" },
            { caption: "We are holding a maternal health workshop for expectant mothers in rural communities, teaching prenatal nutrition and safety. #maternalhealth", type: "photo", media: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=800" },
            { caption: "Our pharmacy team stocking up on life-saving insulin and asthma inhalers. These will be distributed free of cost to patients. #healthforall", type: "photo", media: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800" },
            { caption: "Clear sight changes lives. Over 40 elders received cataract surgeries at our camp this morning. Here is their first view of the world! #vision", type: "photo", media: "https://images.unsplash.com/photo-1579684389782-64d84b5e902a?q=80&w=800" },
            { caption: "Our emergency medical team setting out to deliver medicine packages in flood-affected pockets. Rain or shine, health comes first. #rescue", type: "photo", media: "https://images.unsplash.com/photo-1583324113626-70df0f4deaab?q=80&w=800" },
            { caption: "Regular checkups are the best prevention. Free pediatric health checkup camp conducted in Dharavi slum today. #prevention", type: "photo", media: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=800" },
            { caption: "We just finished installing a high-flow oxygen concentrator bank in a rural government hospital. Immediate backup ready! #hospitalsupport", type: "photo", media: "https://images.unsplash.com/photo-1513222485730-7be9823ae2c4?q=80&w=800" },
            { caption: "Teaching sanitation and clean hygiene practices to schoolchildren to prevent waterborne monsoon illnesses. #hygienematters", type: "photo", media: "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=800" },
            { caption: "On-chain ledger check: We've recorded the hospital procurement receipts and surgeon credentials for our child surgery program. #ledger #donerhq", type: "photo", media: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=800" }
        ]
    },
    {
        name: "AquaPure Network",
        email: "cleanwater@aquapure.org",
        location: "Jaipur, Rajasthan",
        category: "Environment",
        bio: "Implementing sustainable rainwater harvesting, stepwell restoration, and community-led water purification systems in drought-prone states.",
        logo: "https://images.unsplash.com/photo-1527063167133-784013317c91?q=80&w=300&h=300&fit=crop",
        causes: [
            {
                title: "Drought-Resistant Rainwater Harvesting Pits",
                description: "Designing and constructing 100 deep-well recharge structures in rural community spaces to secure groundwater levels before summer.",
                goalAmount: 500000,
                coverImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800"
            },
            {
                title: "Reverse Osmosis (RO) Safe Drinking Plants",
                description: "Installing and setting up solar-powered RO water purification plants in 10 villages facing high fluoride and heavy metal pollution.",
                goalAmount: 650000,
                coverImage: "https://images.unsplash.com/photo-1541944743827-e04bb64aa840?q=80&w=800"
            },
            {
                title: "Ancient Stepwell (Baori) Heritage Restoration",
                description: "Reviving historical rainwater reservoirs by clearing trash, desilting clay, and building safety walls around 3 heritage stepwells.",
                goalAmount: 800000,
                coverImage: "https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=800"
            },
            {
                title: "Water Quality Monitoring Toolkit for Youth",
                description: "Training rural youth assemblies and providing 150 digital testing kits to check and prevent chemical contamination in local wells.",
                goalAmount: 180000,
                coverImage: "https://images.unsplash.com/photo-1576086213369-97a306dca665?q=80&w=800"
            },
            {
                title: "Hygiene & Safe Restrooms: Girls' Schools",
                description: "Constructing modern, ventilated restrooms with running water and bio-septic tanks in 5 girls' secondary schools.",
                goalAmount: 420000,
                coverImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800"
            }
        ],
        posts: [
            { caption: "We started excavations for our 20th rainwater harvesting pit today. This will recharge groundwater for 300 families! #cleanwater #rainwater", type: "photo", media: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800" },
            { caption: "Our solar-powered water purification station in Phalodi is now online. Safe, chemical-free water for ₹1 per liter! #cleanwaterforall", type: "photo", media: "https://images.unsplash.com/photo-1541944743827-e04bb64aa840?q=80&w=800" },
            { caption: "Look at the before-and-after of the stepwell we cleaned. Over 10 tons of plastic and mud cleared out to reveal clean water. #baorirevival", type: "photo", media: "https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=800" },
            { caption: "Conducting chemical water testing alongside villagers. Awareness is the first shield against arsenic and fluoride poisoning. #waterquality", type: "photo", media: "https://images.unsplash.com/photo-1576086213369-97a306dca665?q=80&w=800" },
            { caption: "A proud moment! The new sanitary toilet block at the local girls' high school is ready, securing health and school attendance. #hygiene", type: "photo", media: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800" },
            { caption: "Water delivery tankers dispatched to far-flung desert hamlets during this extreme heatwave. Temporary relief while wells dry up. #relief", type: "photo", media: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=800" },
            { caption: "Setting up greywater treatment filters in community washing areas. Recycling waste water to irrigate village kitchens. #sustainability", type: "photo", media: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800" },
            { caption: "Our geological team mapping underground aquifers to select ideal drilling points for our community borewells. #geology", type: "photo", media: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800" },
            { caption: "Villagers forming a management committee to look after the new water filtration plant. True community ownership! #empowerment", type: "photo", media: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800" },
            { caption: "Transparency data posted: The pipeline equipment purchases and contractor payments are audited and anchored. #audited #donerhq", type: "photo", media: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800" }
        ]
    },
    {
        name: "PawRescue Hub",
        email: "help@pawrescue.org",
        location: "Pune, Maharashtra",
        category: "Animal Welfare",
        bio: "A network of emergency veterinary responders, mobile ambulances, stray sterilizations, and shelters for abandoned street animals.",
        logo: "https://images.unsplash.com/photo-1548191265-cc70d3d45bd1?q=80&w=300&h=300&fit=crop",
        causes: [
            {
                title: "24/7 Mobile Veterinary Ambulance",
                description: "Equipping a rescue vehicle with basic medical kits, oxygen cylinders, stretchers, and minor surgery tools for street animals.",
                goalAmount: 450000,
                coverImage: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800"
            },
            {
                title: "Stray Feeding & Anti-Rabies Vaccination",
                description: "Feeding 1,00,000 street dogs daily and running extensive vaccination drives across suburban wards to reduce rabies transmission.",
                goalAmount: 240000,
                coverImage: "https://images.unsplash.com/photo-1548191265-cc70d3d45bd1?q=80&w=800"
            },
            {
                title: "Shelter Clinic & Recovery Ward Upgrade",
                description: "Reconstructing damaged enclosures, building a post-op recovery room, and installing quarantine units for sick street cats.",
                goalAmount: 550000,
                coverImage: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?q=80&w=800"
            },
            {
                title: "ABC (Animal Birth Control) Sterilization Campaign",
                description: "Funding 500 sterilization surgeries for stray dogs and cats conducted by certified vets to humanely control street populations.",
                goalAmount: 380000,
                coverImage: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=800"
            },
            {
                title: "Sanctuary Care for Paralyzed Animals",
                description: "Providing diapers, specialized support carts, customized bedding, and regular physical therapy for 30 permanently disabled rescues.",
                goalAmount: 200000,
                coverImage: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800"
            }
        ],
        posts: [
            { caption: "Emergency call resolved! We rescued this puppy trapped inside a narrow stormwater drain this morning. He is safe now! #animalrescue", type: "photo", media: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800" },
            { caption: "Our daily stray feeding route is underway. 800 street dogs received hot meals today. Thank you for supporting the drive! #dogfeeding", type: "photo", media: "https://images.unsplash.com/photo-1548191265-cc70d3d45bd1?q=80&w=800" },
            { caption: "Work has begun on our new quarantine clinic ward. This will prevent contagious infections from spreading in the shelter. #shelterlife", type: "photo", media: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?q=80&w=800" },
            { caption: "We've sterilized and vaccinated 45 stray cats in the central ward this week under our humane animal birth control protocol. #abcproject", type: "photo", media: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=800" },
            { caption: "Meet Bruno, one of our permanently disabled residents. His customized wheels arrived today! Watch him zoom around the field! #paralyzedrescue", type: "photo", media: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800" },
            { caption: "A successful adoption! Simba was abandoned with a broken leg, but today he went home with a loving family. Happy trails, buddy! #adoptnotshop", type: "photo", media: "https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=800" },
            { caption: "Our veterinary surgeon performing a delicate orthopedic surgery on a cow hit by a vehicle. Big or small, we rescue them all. #veterinary", type: "photo", media: "https://images.unsplash.com/photo-1579684389782-64d84b5e902a?q=80&w=800" },
            { caption: "Delivering winter blankets and custom coats for our senior shelter residents to keep them warm and prevent joint stiffness. #animalcare", type: "photo", media: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=800" },
            { caption: "Our awareness team visiting schools to teach kids how to interact safely with stray dogs and prevent dog bite incidents. #childeducation", type: "photo", media: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800" },
            { caption: "On-chain audit audit: Every invoice for surgical medicines and vaccine batches is uploaded and verified on the ledger. #transparency #donerhq", type: "photo", media: "https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=800" }
        ]
    },
    {
        name: "Tech4Rural Development",
        email: "connect@tech4rural.org",
        location: "Hyderabad, Telangana",
        category: "Environment",
        bio: "Deploying precision agriculture sensors, solar drip irrigation, and local green energy microgrids to support marginal farmers.",
        logo: "https://images.unsplash.com/photo-1560343060-c142ba3b1234?q=80&w=300&h=300&fit=crop",
        causes: [
            {
                title: "Precision Farming Soil Sensor Kits",
                description: "Procuring and distributing 150 low-cost soil moisture, NPK, and humidity sensors to help dryland farmers optimize water usage.",
                goalAmount: 300000,
                coverImage: "https://images.unsplash.com/photo-1560343060-c142ba3b1234?q=80&w=800"
            },
            {
                title: "Solar Drip Irrigation Systems for Smallholdings",
                description: "Installing solar-powered water pumps and sub-surface drip irrigation piping for 20 families cultivating arid plots.",
                goalAmount: 500000,
                coverImage: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=800"
            },
            {
                title: "Rural Education Wifi Mesh Nodes",
                description: "Installing 12 long-range solar-powered outdoor Wifi mesh routers in remote hamlets to provide free local educational portals.",
                goalAmount: 250000,
                coverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800"
            },
            {
                title: "Women-Led Solar Charging Microgrids",
                description: "Assembling solar battery charging stations and training 10 women's self-help groups to operate and charge local household lantern boxes.",
                goalAmount: 380000,
                coverImage: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=800"
            },
            {
                title: "Community Biogas Waste Digesters",
                description: "Constructing 15 domestic-sized biogas digesters using agricultural waste and cattle dung to provide clean, smoke-free cooking fuel.",
                goalAmount: 420000,
                coverImage: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=800"
            }
        ],
        posts: [
            { caption: "Testing our new agricultural telemetry kits. These soil sensors will help farmers save water by checking root moisture. #agritech #smartfarms", type: "photo", media: "https://images.unsplash.com/photo-1560343060-c142ba3b1234?q=80&w=800" },
            { caption: "Our solar pump installation in Medak is complete! The farmer can now irrigate his fields during the day without grid cuts. #solaragri", type: "photo", media: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=800" },
            { caption: "We just activated a local wifi node in a tribal hamlet. Over 40 kids can now access high-quality offline textbook servers! #ruralconnect", type: "photo", media: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800" },
            { caption: "Our solar microgrid trainees. These women will run battery-swapping stations, generating income and lighting up dark homes. #womeninpower", type: "photo", media: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=800" },
            { caption: "Construction is underway for a household biogas unit. Eliminating firewood collection and bringing clean fuel to village kitchens. #biogas", type: "photo", media: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=800" },
            { caption: "A visual explanation of our sub-surface drip layout. It feeds water directly to the plant roots, cutting weed growth and evaporation. #savesoil", type: "photo", media: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800" },
            { caption: "Monitoring local weather patterns via our low-cost community weather stations. Helping farmers plan sowing activities better. #precisionfarming", type: "photo", media: "https://images.unsplash.com/photo-1530982009887-a255cfc12836?q=80&w=800" },
            { caption: "Conducting training workshops for smallholders. Showing them how to interpret soil test metrics and avoid excessive fertilizer costs. #ecoagri", type: "photo", media: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?q=80&w=800" },
            { caption: "A young student exploring coding packages loaded on our local mesh server. Connecting rural minds to global logic! #stemeducation", type: "photo", media: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800" },
            { caption: "Ledger report posted: The microgrid component purchasing bills and transport logs are logged on-chain. #auditedledger #donerhq", type: "photo", media: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800" }
        ]
    },
    {
        name: "ArtSoul Cultural Collective",
        email: "admin@artsoul.org",
        location: "Kolkata, West Bengal",
        category: "Education",
        bio: "Preserving traditional folk art forms and supporting handloom weavers by providing training, equipment, and digital marketplaces.",
        logo: "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=300&h=300&fit=crop",
        causes: [
            {
                title: "Traditional Painter Apprenticeship Sponsorship",
                description: "Sponsoring training stipends and natural pigments for 20 young artists studying under master scroll painters (Patachitrakars).",
                goalAmount: 240000,
                coverImage: "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=800"
            },
            {
                title: "Handloom Loom Upgrades for Rural Weavers",
                description: "Replacing worn-out wooden looms and installing high-tensile metal frames for 15 master weaver families in West Bengal.",
                goalAmount: 375000,
                coverImage: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=800"
            },
            {
                title: "Folk Music Audio Archiving and Preservation",
                description: "Traveling with mobile recording gears to digitize, index, and archive traditional music sung by aging Baul and Santhal vocalists.",
                goalAmount: 300000,
                coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800"
            },
            {
                title: "Digital E-Commerce Training for Artisans",
                description: "Hosting digital workshops and providing smartphone camera accessories to help 100 artisans catalog and sell crafts directly online.",
                goalAmount: 150000,
                coverImage: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800"
            },
            {
                title: "Children's Traditional Clay & Puppet Workshops",
                description: "Funding weekend craft camps in 10 municipal schools to teach children traditional clay modeling and puppetry, preserving folklore.",
                goalAmount: 200000,
                coverImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800"
            }
        ],
        posts: [
            { caption: "Our master scroll painter showing his apprentice how to mix yellow pigment from organic turmeric and tree gum. #patachitra #folkart", type: "photo", media: "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=800" },
            { caption: "The new heavy-duty metal frame loom has been assembled at our weaver's workstation. This will cut production fatigue by half! #weavers", type: "photo", media: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=800" },
            { caption: "We captured some beautiful acoustic tracks in the fields of Birbhum today. Digitizing these rare songs for our heritage archive. #baulsongs", type: "photo", media: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800" },
            { caption: "Teaching artisans how to set up product photography using simple white sheets and sunlight. Direct selling cuts out middlemen! #craftcommerce", type: "photo", media: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800" },
            { caption: "A snapshot of the kids molding clay birds in our heritage puppet workshop today. Keeping old stories alive in young hands! #claycraft", type: "photo", media: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800" },
            { caption: "A showcase of the finished handloom sarees ready for shipment. Intricate patterns that tell tales of rural Bengal. #slowfashion", type: "photo", media: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800" },
            { caption: "Conducting design workshop with modern fashion graduates. Fusing contemporary trends with ancient tribal embroidery. #craftfusion", type: "photo", media: "https://images.unsplash.com/photo-1576016770956-debb63d900ef?q=80&w=800" },
            { caption: "Our community gallery is officially open to visitors! Come explore the vibrant collection of handmade pottery and woodcrafts. #handmade", type: "photo", media: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800" },
            { caption: "Preparing natural indigo dye paste. No toxic chemicals or synthetic run-offs enter our local waterways. #ecoproducts", type: "photo", media: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800" },
            { caption: "Audited Ledger: The payment logs for natural pigment procurements and artisan stipends are published on-chain. #ledger #donerhq", type: "photo", media: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800" }
        ]
    },
    {
        name: "SeniorSun Elderly Care",
        email: "support@seniorsun.org",
        location: "Chennai, Tamil Nadu",
        category: "Health",
        bio: "Providing comprehensive residential healthcare, emergency shelter, and active-aging social circles for vulnerable elderly citizens.",
        logo: "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?q=80&w=300&h=300&fit=crop",
        causes: [
            {
                title: "Homeless Senior Citizens' Shelter Warmth",
                description: "Providing clean bedding, water heaters, thermal wear, and daily hot milk to 50 residents of our night shelter.",
                goalAmount: 200000,
                coverImage: "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?q=80&w=800"
            },
            {
                title: "Senior Mobility & Sight Care Fund",
                description: "Financing 100 sets of prescription glasses, orthopedic walking aids, and regular physical rehabilitation therapy sessions.",
                goalAmount: 180000,
                coverImage: "https://images.unsplash.com/photo-1579684389782-64d84b5e902a?q=80&w=800"
            },
            {
                title: "Shelter Nursing and Emergency Medical Fund",
                description: "Funding the monthly salaries of 2 full-time resident nurses and stocking life-saving cardiac and asthma medicine inventories.",
                goalAmount: 360000,
                coverImage: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=800"
            },
            {
                title: "Silver Generation Recreation & Art Hub",
                description: "Creating a dedicated outdoor social workspace with art supplies, sewing machines, and chess tables to combat isolation.",
                goalAmount: 150000,
                coverImage: "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=800"
            },
            {
                title: "Daily Nutritional Meal Drive for Elderly",
                description: "Serving twice-daily balanced, soft hot meals designed by geriatric nutritionists for 100 low-income elders in the local slum.",
                goalAmount: 300000,
                coverImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800"
            }
        ],
        posts: [
            { caption: "Morning yoga session at our residential center. Staying active and mobile is the key to healthy aging! #activeaging #yogaforseniors", type: "photo", media: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800" },
            { caption: "We just distributed 45 orthopedic walking frames and quad-canes today. Restoring independence to our dear elders! #mobilitysupport", type: "photo", media: "https://images.unsplash.com/photo-1579684389782-64d84b5e902a?q=80&w=800" },
            { caption: "Our resident nurse conducting routine health checkups for blood pressure and oxygen saturation. Regular monitoring saves lives! #nursingcare", type: "photo", media: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=800" },
            { caption: "We opened our community recreation room today! The chess tournament was a hit, with some intense games between our residents. #chessnight", type: "photo", media: "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?q=80&w=800" },
            { caption: "Our kitchen crew packaging healthy, low-sodium meals for home delivery to bedridden senior citizens. Nutrition delivered! #fooddrive", type: "photo", media: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800" },
            { caption: "A heartwarming moment of storytelling. Our residents sharing folklore and wisdom with visiting local school children. #intergenerational", type: "photo", media: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800" },
            { caption: "Dr. Anand conducting our monthly geriatric medicine review camp. Ensuring all chronic conditions are managed smoothly. #preventivehealth", type: "photo", media: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=800" },
            { caption: "Look at these beautiful hand-knit sweaters our residents made! Keeping warm and keeping busy. #handcrafts #warmwinters", type: "photo", media: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800" },
            { caption: "A quiet walk in our garden during sunset. Providing a peaceful, green environment for healing and reflection. #seniorhaven", type: "photo", media: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=800" },
            { caption: "Transparency log updated: Medical bills and oxygen cylinder supply invoices have been successfully anchored to the ledger. #donerhq", type: "photo", media: "https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=800" }
        ]
    },
    {
        name: "WomenVoice Empowerment",
        email: "lead@womenvoice.org",
        location: "Ahmedabad, Gujarat",
        category: "Women Empowerment",
        bio: "Driving gender equity and economic self-reliance through vocational tailoring, microfinance training, and legal advocacy.",
        logo: "https://images.unsplash.com/photo-1484860137475-597b1aff5503?q=80&w=300&h=300&fit=crop",
        causes: [
            {
                title: "Sewing Machines & Vocational Tailoring Grants",
                description: "Procuring and distributing 50 industrial-grade sewing machines and fabric starter kits for rural women starting home businesses.",
                goalAmount: 300000,
                coverImage: "https://images.unsplash.com/photo-1484860137475-597b1aff5503?q=80&w=800"
            },
            {
                title: "Rural Women Financial Literacy & Savings Hubs",
                description: "Establishing 20 mobile training nodes on basic accounting, digital banking systems, and microfinance cooperative setups.",
                goalAmount: 150000,
                coverImage: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800"
            },
            {
                title: "Women's Free Legal Aid & Crisis Counsel Desk",
                description: "Funding legal retainers and protection counselors to provide free guidance and safe shelters to domestic abuse survivors.",
                goalAmount: 320000,
                coverImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800"
            },
            {
                title: "Young Girls' Personal Safety & Self-Defense Camps",
                description: "Organizing 25 self-defense, safety awareness, and confidence workshops for 500 adolescent girls in low-income schools.",
                goalAmount: 200000,
                coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800"
            },
            {
                title: "Micro-Entrepreneurship Toolkits and Cohorts",
                description: "Sponsoring 10 women's self-help groups with food processing units, dry-fruit packaging sealers, and basic business permits.",
                goalAmount: 350000,
                coverImage: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=800"
            }
        ],
        posts: [
            { caption: "We distributed 15 sewing machines to our vocational course graduates today! Financial independence starts here. #womenempowerment", type: "photo", media: "https://images.unsplash.com/photo-1484860137475-597b1aff5503?q=80&w=800" },
            { caption: "Our financial literacy trainer explaining how to access government-backed microfinance credit via mobile apps. #digitalliteracy", type: "photo", media: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800" },
            { caption: "Our legal aid cell held a counseling session on women's rights and workplace safety laws. Knowledge is safety! #legalawareness", type: "photo", media: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800" },
            { caption: "A snapshot of the girls practicing safety escapes in our self-defense camp today. Stronger, safer, and bolder! #selfdefense", type: "photo", media: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800" },
            { caption: "Our micro-entrepreneurs packaging organic dried spices for the upcoming regional trade fair. True zero-waste packaging! #ruralbiz", type: "photo", media: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=800" },
            { caption: "Success! Sunita, a recipient of our micro-grant, just opened her local tailoring shop. We are so proud of her journey! #entrepreneurship", type: "photo", media: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800" },
            { caption: "A review of our mobile counseling unit. Helping women in remote blocks access psychological and crisis support. #mentalhealth", type: "photo", media: "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=800" },
            { caption: "Organizing leadership workshops for community women leaders. Developing voices that represent local needs. #communityleaders", type: "photo", media: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800" },
            { caption: "Our trainees learning tie-dye and block-printing techniques using eco-friendly vegetable dyes. #traditionalcrafts #sustainable", type: "photo", media: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800" },
            { caption: "Transparency check: Sewing machine purchase invoices and training stipend transfer logs are audited on the ledger. #donerhq", type: "photo", media: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800" }
        ]
    },
    {
        name: "FoodShield Hunger Relief",
        email: "meals@foodshield.org",
        location: "Indore, Madhya Pradesh",
        category: "Hunger",
        bio: "Eradicating food wastage by transporting clean surplus from weddings and hotels to hungry communities via refrigerated vehicles.",
        logo: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=300&h=300&fit=crop",
        causes: [
            {
                title: "Surplus Food Recovery Refrigerated Truck",
                description: "Funding the procurement and modifications of a refrigerated cargo van to collect and transport cooked surplus meals safely.",
                goalAmount: 850000,
                coverImage: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800"
            },
            {
                title: "Community Hot Kitchen Daily Running Cost",
                description: "Sponsoring fresh ingredients, biogas cylinders, and clean water supplies for our kitchen serving 1,000 workers daily.",
                goalAmount: 300000,
                coverImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800"
            },
            {
                title: "Kindergarten (Anganwadi) Milk & Egg Drive",
                description: "Supplying fresh milk, organic eggs, and seasonal fruits twice a week to 500 rural children to combat early childhood malnutrition.",
                goalAmount: 240000,
                coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800"
            },
            {
                title: "Emergency Dry-Grain Bank Reservoirs",
                description: "Building community storage silos and stockpiling dry rice, wheat, pulses, and oil to support 300 families during floods.",
                goalAmount: 400000,
                coverImage: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=800"
            },
            {
                title: "Slum Nutrition & Hunger Clean Drive",
                description: "Organizing weekly hot meal distribution camps and basic health checkups across low-income urban settlements.",
                goalAmount: 260000,
                coverImage: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800"
            }
        ],
        posts: [
            { caption: "Our food recovery van collected 400 surplus hot meals from a wedding venue tonight. Handing them out now in the central ward! #zerowaste", type: "photo", media: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800" },
            { caption: "Our community kitchen served nutritious daal-chawal to over 950 laborers and street dwellers this afternoon. #hungerrelief", type: "photo", media: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800" },
            { caption: "Fresh milk and organic eggs delivered to the village Anganwadi. Tackling childhood stunting at the grassroots level! #nutritiondrive", type: "photo", media: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800" },
            { caption: "Stockpiling emergency grain sacks in our newly constructed storage silo. Disaster preparedness protects lives. #grainbank", type: "photo", media: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=800" },
            { caption: "A snapshot of our distribution camp. Food is a fundamental human right. Thank you to all who fund our weekly drives! #foodforall", type: "photo", media: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800" },
            { caption: "We just received a bulk donation of fresh vegetables from the local wholesale market. Sorting and preparing for tomorrow's menu! #veggiedrive", type: "photo", media: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800" },
            { caption: "Our volunteers educating slum residents on clean cooking methods and storing food safely to prevent spoilage. #foodhygiene", type: "photo", media: "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=800" },
            { caption: "Providing clean drinking water dispensers alongside our food tables. Complete nutritional care for the community. #cleanwater", type: "photo", media: "https://images.unsplash.com/photo-1541944743827-e04bb64aa840?q=80&w=800" },
            { caption: "Training community women to manage and operate local dry-ration distribution desks. Decentralized food networks! #localpower", type: "photo", media: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800" },
            { caption: "On-chain ledger check: Procurement audits for grain sacks and clean water dispensers are updated and anchored. #transparency #donerhq", type: "photo", media: "https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=800" }
        ]
    }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/donerhq');
        console.log("Connected to MongoDB for Master Seeding...");

        // 1. Wipe existing NGO-related data to avoid duplicate conflicts
        console.log("Clearing existing Posts, Causes, and NGOs...");
        await Post.deleteMany({});
        await Cause.deleteMany({});
        
        // Find existing users created by the seeder and clean them
        const seederEmails = NGOS_DATA.map(n => n.email);
        const seededUsers = await User.find({ email: { $in: seederEmails } });
        const seededUserIds = seededUsers.map(u => u._id);
        
        await NGO.deleteMany({ userId: { $in: seededUserIds } });
        await User.deleteMany({ email: { $in: seederEmails } });

        console.log("Cleared old seeder profiles and logs. Beginning write cycle...");

        // 2. Generate and Insert NGO and User profiles
        for (const data of NGOS_DATA) {
            // Create user login account
            const user = await User.create({
                name: data.name,
                email: data.email,
                password: await hashPassword(SEED_PASSWORD),
                role: 'ngo',
                onboardingComplete: true
            });

            // Create NGO profile linked to user
            const ngo = await NGO.create({
                userId: user._id,
                name: data.name,
                bio: data.bio,
                logo: data.logo,
                category: data.category,
                location: data.location,
                status: 'approved',
                verified: true,
                transparencyScore: Math.floor(Math.random() * (98 - 85) + 85),
                followerCount: Math.floor(Math.random() * 4000) + 1000,
                totalRaised: Math.floor(Math.random() * 500000) + 100000,
                doc80G: "https://images.unsplash.com/photo-1568605117036-5fe5e7bbe0b7?q=80&w=800",
                docFCRA: "https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=800"
            });

            // Set profile back-reference on user
            user.ngoProfile = ngo._id;
            await user.save();

            // 3. Create Causes for this NGO
            const createdCauses = [];
            for (const causeData of data.causes) {
                const cause = await Cause.create({
                    ngoId: ngo._id,
                    title: causeData.title,
                    description: causeData.description,
                    goalAmount: causeData.goalAmount,
                    raisedAmount: Math.floor(Math.random() * (causeData.goalAmount * 0.4)),
                    deadline: new Date(Date.now() + (Math.floor(Math.random() * 60) + 30) * 24 * 60 * 60 * 1000), // 30-90 days in future
                    status: 'active',
                    category: data.category,
                    coverImage: causeData.coverImage,
                    donorCount: Math.floor(Math.random() * 200) + 15
                });
                createdCauses.push(cause);
            }

            // Link causes to NGO schema
            ngo.causes = createdCauses.map(c => c._id);
            await ngo.save();

            // 4. Create Posts for this NGO
            const createdPosts = [];
            let postIndex = 0;
            for (const postData of data.posts) {
                // Link some posts to one of the created causes
                const linkedCause = createdCauses[postIndex % createdCauses.length];
                
                const post = await Post.create({
                    ngoId: ngo._id,
                    type: postData.type,
                    mediaUrl: postData.media,
                    caption: postData.caption,
                    tags: [data.category.toLowerCase(), 'impact', 'verification'],
                    linkedCauseId: postIndex % 2 === 0 ? linkedCause._id : null, // alternate linking
                    likes: Math.floor(Math.random() * 400) + 50,
                    likedBy: [],
                    shares: Math.floor(Math.random() * 60),
                    donateClicks: Math.floor(Math.random() * 120),
                    reach: Math.floor(Math.random() * 3000) + 500,
                    commentCount: 0,
                    comments: []
                });
                createdPosts.push(post);
                postIndex++;
            }

            // Link posts to NGO schema
            ngo.posts = createdPosts.map(p => p._id);
            await ngo.save();

            console.log(`✅ Seeded NGO: "${data.name}" with 5 Causes and 10 Posts.`);
        }

        console.log("\n🚀 DB SEEDING TASK COMPLETED SUCCESSFULLY!");
        console.log("Credentials for all accounts: password = 'password123'");
        console.log("Seeded Accounts:");
        NGOS_DATA.forEach(n => console.log(`  - ${n.name}: ${n.email}`));
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Master Seeding Failed:", error);
        process.exit(1);
    }
};

seed();
