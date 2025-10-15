import Location  from "../../models/user/location.js";

export const searchLocations = async (req, res) => {
  const { countryCode, stateCode, cityId } = req.query;

  try {
    if (!countryCode && !stateCode && !cityId) {
      const countries = await Location.find({ type: 'country' }).sort("name");
      return res.json({ type: "countries", data: countries });
    }

    if (cityId) {
      const city = await Location.findOne({ _id: cityId, type: 'city' });
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      return res.json({ type: "city", data: city });
    }

    if (countryCode && !stateCode) {
      const states = await Location.find({ countryCode, type: 'state' }).sort("name");
      return res.json({ type: "states", data: states });
    }

    if (countryCode && stateCode) {
      const cities = await Location.find({ countryCode, stateCode, type: 'city' }).sort("name");
      return res.json({ type: "cities", data: cities });
    }

    res.status(400).json({ message: "Invalid query" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
      