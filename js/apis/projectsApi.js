// ./js/apis/projectsApi.js

export const fetchProjects = async function () {
  try {
    const response = await fetch("/api/projects", {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch project data. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Project data must be an array.");
    }

    console.log("Projects loaded from server:");
    console.table(data);

    return data;
  } catch (error) {
    console.error("API error while loading projects:", error);
    return [];
  }
};