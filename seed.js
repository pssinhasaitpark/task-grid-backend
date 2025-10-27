import mongoose from "mongoose";
import dotenv from "dotenv";
import Location from "./app/models/user/location.js";
import {
  Country as CscCountry,
  State as CscState,
  City as CscCity,
} from "country-state-city";

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");


    await Location.deleteMany({});

    const india = CscCountry.getCountryByCode("IN");
    await Location.create({
      name: india.name,
      isoCode: india.isoCode,
      type: "country",
      latitude: null,
      longitude: null
    });


    const indianStates = CscState.getStatesOfCountry("IN");
    const stateDocs = indianStates.map((state) => ({
      name: state.name,
      isoCode: state.isoCode,
      countryCode: state.countryCode,
      type: "state",
      latitude: null,
      longitude: null
    }));
    await Location.insertMany(stateDocs);

 
    const indianCities = CscCity.getCitiesOfCountry("IN");
    const cityDocs = indianCities.map((city) => ({
      name: city.name,
      countryCode: city.countryCode,
      stateCode: city.stateCode,
      type: "city",
      latitude: city.latitude ? parseFloat(city.latitude) : null,
      longitude: city.longitude ? parseFloat(city.longitude) : null
    }));
    await Location.insertMany(cityDocs);

    console.log("✅ Seed complete — Only India data inserted with city coordinates.");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();
