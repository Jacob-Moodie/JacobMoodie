  //./js/apis/geolocationApi.js

// Gets user's current latitude and longitude.
export const autoFillLocation = async () => {
  try {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported.");
      return;
    }

    // Get position
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        maximumAge: 0,
        timeout: 15000
      });
    });

    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    console.log("Coordinates:", lat, lon);

    // Reverse geocode to get city, state, zip info.
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch location data.");
    }

    const data = await response.json();

    let city =
    data.address.city ||
    data.address.town ||
    data.address.village ||
    "";

    city = city.replace(/^(Village|City|Town) of /i, "").trim();

    const state = data.address.state || "";
    const zip = data.address.postcode || "";

    const cityField = document.getElementById("city");
    const stateField = document.getElementById("state");
    const zipField = document.getElementById("zip");

    if (cityField && !cityField.value) {
    cityField.value = city;
    }

    if (stateField && !stateField.value) {
    stateField.value = state;
    }

    if (zipField && !zipField.value) {
    zipField.value = zip;
    }

  } catch (error) {
    console.error("Geolocation autofill failed:", error.message);
  }
};