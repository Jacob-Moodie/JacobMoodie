// ./js/projects.js

import {
  sanitizeInput,
  sanitizeArray,
  validateRequired,
  validateUrl
} from "./security.js";

// One project record used by the projects page.
export class Project {
  #privateNotes;

  constructor(id, title, description, technologiesUsed, image, video = null, link = "") {
    validateRequired(title, "Project title");
    validateRequired(description, "Project description");
    validateRequired(technologiesUsed, "Technologies used");
    validateRequired(image, "Project image");

    this.id = Number(id) || Date.now();
    this.title = sanitizeInput(title);
    this.description = sanitizeInput(description);
    this.technologiesUsed = sanitizeInput(technologiesUsed);
    this.image = sanitizeInput(image);
    this.video = video ? sanitizeInput(video) : null;
    this.link = validateUrl(link);
    this.#privateNotes = "Protected project data";
  }

  matchesFilter(filter) {
    // Match based on the tech text saved for each project.
    const tech = this.technologiesUsed.toLowerCase();

    if (filter === "all") {
      return true;
    }

    if (filter === "excel") {
      return tech.includes("excel");
    }

    if (filter === "vba") {
      return tech.includes("vba");
    }

    if (filter === "r4 wms") {
      return tech.includes("r4 wms");
    }

    return true;
  }

  getSafeProjectData() {
    // Return only data needed for display.
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      technologiesUsed: this.technologiesUsed,
      image: this.image,
      video: this.video,
      link: this.link
    };
  }
}

// Simple in-memory project list with helper methods.
export const createProtectedProjectStore = function (initialProjects = []) {
  const projects = [...initialProjects];

  return {
    add(project) {
      if (!(project instanceof Project)) {
        throw new Error("Only Project objects can be added.");
      }

      projects.push(project);
    },

    getAll() {
      return [...projects];
    },

    filterBy(filter) {
      return projects.filter((project) => project.matchesFilter(filter));
    },

    count() {
      return projects.length;
    }
  };
};

// Turns raw JSON objects into Project objects.
export const createProtectedProjectStoreFromData = function (projectData = []) {
  const safeProjects = projectData.map((project) => new Project(
    project.id,
    project.title,
    project.description,
    project.technologiesUsed,
    project.image,
    project.video,
    project.link
  ));

  return createProtectedProjectStore(safeProjects);
};

// Clears old cards before drawing fresh project cards.
export const clearElement = function (element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

// Draws project cards and shows a message when nothing matches.
export const renderProjects = function (container, projectStore, filter = "all") {
  if (!container) {
    console.log("Projects Poster element ID does not exist.");
    return;
  }

  clearElement(container);

  const filteredProjects = filter === "all"
    ? projectStore.getAll()
    : projectStore.filterBy(filter);

  if (filteredProjects.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No projects match that filter yet.";
    container.appendChild(emptyMessage);
    return;
  }

  filteredProjects.forEach((project) => {
    const safeProject = project.getSafeProjectData();

    const poster = document.createElement("div");
    poster.classList.add("projectPoster");

    const row = document.createElement("div");
    row.classList.add("projectRow");

    const title = document.createElement("h2");
    title.textContent = safeProject.title;

    const media = document.createElement("div");
    media.classList.add("projectMedia");

    if (safeProject.video) {
      // Show a video preview when one exists.
      const video = document.createElement("video");
      video.className = "projectVisual";
      video.controls = true;
      video.preload = "metadata";
      video.poster = safeProject.image;

      const source = document.createElement("source");
      source.src = safeProject.video;
      source.type = "video/mp4";

      video.appendChild(source);
      media.appendChild(video);
    } else {
      // Otherwise show an image.
      const image = document.createElement("img");
      image.className = "projectImage";
      image.src = safeProject.image;
      image.alt = safeProject.title;

      //Use a default image if the original is broken.
      image.addEventListener("error", () => {
        image.src = "Images/Chargediscposter.png";
      });
      media.appendChild(image);
    }

    const text = document.createElement("div");
    text.classList.add("projectText");

    const description = document.createElement("p");
    description.textContent = safeProject.description;

    const tech = document.createElement("p");
    tech.className = "tech";

    const strong = document.createElement("strong");
    strong.textContent = "Tech: ";

    tech.appendChild(strong);
    tech.appendChild(document.createTextNode(safeProject.technologiesUsed));

    text.appendChild(description);
    text.appendChild(tech);

    if (safeProject.link) {
      const link = document.createElement("a");
      link.href = safeProject.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "View Project";
      text.appendChild(link);
    }

    row.appendChild(title);
    row.appendChild(media);
    row.appendChild(text);
    poster.appendChild(row);
    container.appendChild(poster);
  });
};
