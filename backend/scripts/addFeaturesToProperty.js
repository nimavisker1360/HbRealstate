import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

// Interior Features in English
const interiorFeatures = [
  "ADSL",
  "Smart Home",
  "Burglar Alarm",
  "Fire Alarm",
  "Aluminum Joinery",
  "American Door",
  "Built-in Oven",
  "White Goods",
  "Dishwasher",
  "Dryer Machine",
  "Washing Machine",
  "Laundry Room",
  "Steel Door",
  "Shower Cabin",
  "Fiber Internet",
  "Oven",
  "Dressing Room",
  "Built-in Wardrobe",
  "Intercom System",
  "Crown Molding",
  "Pantry",
  "Air Conditioning",
  "Laminate Flooring",
  "Furniture",
  "Built-in Kitchen",
  "Laminate Kitchen",
  "Kitchen Natural Gas",
  "Parquet Flooring",
  "PVC Joinery",
  "Ceramic Flooring",
  "Stovetop",
  "Spot Lighting",
];

// Exterior Features in English
const exteriorFeatures = [
  "24/7 Security",
  "Doorman",
  "EV Charging Station",
  "Steam Room",
  "Children's Playground",
  "Turkish Bath (Hamam)",
  "Booster Pump",
  "Thermal Insulation",
  "Generator",
  "Cable TV",
  "Security Camera",
  "Nursery/Daycare",
  "Private Pool",
  "Sauna",
  "Sound Insulation",
  "Siding",
  "Sports Area",
  "Water Tank",
  "Satellite",
  "Fire Escape",
  "Indoor Swimming Pool",
];

async function addFeatures() {
  console.log("🏠 Adding features to Turkish property...\n");
  
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");
    
    const db = client.db("CaseCentralYT");
    const residencies = db.collection("Residency");
    
    // Update the Turkish property
    const result = await residencies.updateOne(
      { title: "Satılık 2+1 Daire - Makyol Santral" },
      { 
        $set: { 
          interiorFeatures: interiorFeatures,
          exteriorFeatures: exteriorFeatures
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log("✅ Features added successfully!");
      console.log(`   Interior Features: ${interiorFeatures.length}`);
      console.log(`   Exterior Features: ${exteriorFeatures.length}`);
    } else {
      console.log("⚠️ No changes made - property might not exist");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

addFeatures();
