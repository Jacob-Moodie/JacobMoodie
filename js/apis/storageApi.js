import {
  sanitizeInput,
  sanitizeArray,
  validateRequired,
  validateUrl
} from "../security.js";

import {
    Project
} from "../projects.js";
  
  const titleField = document.getElementById("projectTitle");
  const descriptionField = document.getElementById("projectDescription");
  const technologiesUsedField = document.getElementById("projectTech");
  const linkField = document.getElementById("projectLink");
  const imageInput = document.getElementById("projectImage");
  const projectForm = document.querySelector("#projectForm");

  const storageKey = "projects";

  const sessionKey = "projectsSession";
  const rateLimitKey = "projectsRequestCount";
  const maxRequests = 5;

  // Saves the session data 
  const saveSessionData = (key, value) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        if (error.name === "QuotaExceededError") {
            console.error("Session storage is full.");
        } else {
            console.error("Error saving session data:", error);
        }
    }
  };

  // gets the data about the session.
  const getSessionData = (key) => {
    try {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error("Error loading session data:", error);
        return null;
    }
  };

  saveSessionData(sessionKey, {
    page: "storage",
    lastAction: "Added project"
  });

  const currentSession = getSessionData(sessionKey);
  console.log(currentSession);

  // checks if you are over the session rate.
  const checkSessionRateLimit = () => {
    const currentCount = Number(sessionStorage.getItem(rateLimitKey)) || 0;

    if (currentCount >= maxRequests) {
        console.error("Rate limit reached. Try again later.");
            return false;
    }
    
    sessionStorage.setItem(rateLimitKey, String(currentCount + 1));
    return true;
  };

  // gets the projects that are stored in the local storage.
  export const getStorageProjects = (key) => {
    try {
        const storedProjects = localStorage.getItem(storageKey);

        if (!storedProjects) {
            return [];
        }

        return JSON.parse(storedProjects);
    } catch (error) {
        console.error("error saving project:", error);
        return [];
    }
  };

  // Saves the uploaded projects to local storage.
  export const saveStorageProjects = (projects) => {
    try {
        localStorage.setItem(storageKey, JSON.stringify(projects));
    } catch (error) {
        console.error("error saving project:", error);
    }
  };

  // Displays the storage projects.
  export const displayStorageProject = (projectStore) => {
if (!titleField || !descriptionField || !technologiesUsedField || !linkField) {
  throw new Error("Project form is missing one or more required fields.");
}

  // Clean up user input before validation and saving.
  const title = sanitizeInput(titleField.value);
  const description = sanitizeInput(descriptionField.value);
  const technologiesUsed = sanitizeInput(technologiesUsedField.value);
  const link = linkField.value.trim() ? validateUrl(linkField.value) : "";
  validateRequired(title, "Project title");
  validateRequired(description, "Project description");
  validateRequired(technologiesUsed, "Project technologiesUsednologies");

  const technologiesUsedArray = sanitizeArray(technologiesUsed.split(","));
const file = imageInput ? imageInput.files[0] : null;

  // Uses a fallback image when no upload is provided.
    let imageUrl = "Images/Chargediscposter.png";

  if (file) {
    // Keep uploads to image files and a reasonable size.
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new Error("Image must be under 2MB.");
    }

    imageUrl = URL.createObjectURL(file);
  }

  return new Project(
    projectStore.count() + 1,
    title,
    description,
    technologiesUsedArray.join(", "),
    imageUrl,
    null,
    link
  );
};

  // Adds a storage project to the storage list.
  const addStorageProject = (project) => {
    const storedProjects = getStorageProjects();

    storedProjects.push(project);
    saveStorageProjects(storedProjects);
  };

  // Deletes a storage project from the storage list.
const deleteStorageProject = (title) => {
  const storedProjects = getStorageProjects();
  const removeTitle = title.trim().toLowerCase();

  const updatedProjects = storedProjects.filter((projects) => {
    if (!projects.title) {
      return true;
    }

    return projects.title.trim().toLowerCase() !== removeTitle;
  });

  saveStorageProjects(updatedProjects);
  displayStorageProject();
};
/*
  // Event listener to add project to the storage list.
  if (projectForm) {
    projectForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!checkSessionRateLimit()) {
    return;
    }

const newStorageProject = {
  id: Date.now(),
  title: sanitizeInput(titleField.value),
  description: sanitizeInput(descriptionField.value),
  technologiesUsed: sanitizeInput(techField.value),
  image: "Images/Chargediscposter.png",
  video: null,
  link: sanitizeInput(linkField.value)
};

    addStorageProject(newStorageProject);

console.log("Project saved to local storage.");
    projectForm.reset();
  });
  }

*/
