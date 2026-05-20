// ./js/resume.js

// Gets resume info from the local JSON file.
export const resumeData = async function () {
  try {
    const response = await fetch("./json/resume.json", {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Resume data loaded:", result);
    return result;
  } catch (error) {
    console.error("Resume data could not be loaded.", error);
    return null;
  }
};