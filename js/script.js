// ./js/script.js

import {
  sanitizeInput,
  validateEmail,
  handleError,
  canSubmit,
  validateCSRFToken,
  saveUsedToken,
  issueNewCSRFToken
} from "./security.js";

import {
  createProtectedProjectStoreFromData,
  renderProjects
} from "./projects.js";

import { autoFillLocation } from "./apis/geolocationApi.js";

import { resumeData } from "./resume.js";
import { fetchProjects } from "./apis/projectsApi.js";
import { 
  getStorageProjects, 
  displayStorageProject, 
  saveStorageProjects 
} from "./apis/storageApi.js";

// Runs page setup after the HTML is ready.
document.addEventListener("DOMContentLoaded", async () => {
  
  const useLocationBtn = document.getElementById("useLocation");

  if (useLocationBtn) {
    useLocationBtn.addEventListener("click", autoFillLocation);
  }
  
  let projectStore;

  const container = document.getElementById("projectPoster");

  const rebuildProjectStore = async function () {
    const fetchedProjects = await fetchProjects();
    const savedProjects = getStorageProjects();

    const allProjects = [...fetchedProjects, ...savedProjects];

    projectStore = createProtectedProjectStoreFromData(allProjects);

    if (container) {
      renderProjects(container, projectStore);
    }
  };

  const contactMe = {
    company: "Lineage",
    firstName: "",
    lastName: "",
    city: "Plover",
    state: "WI",
    zip: 54467,
    phone: "",
    email: "",
    comments: ""
  };

  console.log("Contact Me table:");
  console.table(contactMe);

  const about = [
    {
      title: "Character:",
      moreInfo: "Driven, determined, and passionate about learning and growth."
    },
    {
      title: "Leadership:",
      moreInfo: `Experienced leading warehouse teams of 25–30
      people, coordinating across departments daily.`
    },
    {
      title: "Schooling:",
      moreInfo: `Currently enrolled at NTC, sharpening my
      skills in software development while balancing full-time work.`
    }
  ];

  const [aboutCharacter, aboutLeadership, aboutSchooling] = about;

  console.log("About Me table:");
  console.table(about);
  console.log("Character Section:", aboutCharacter);
  console.log("Leadership Section:", aboutLeadership);
  console.log("Schooling Section:", aboutSchooling);

  const projectsCompleted = projectStore ? projectStore.count() : 0;
  const projectsGoal = 5;
  const projectsDifference = projectsGoal - projectsCompleted;

  //console.log("How many projects I have to complete:", projectsDifference);

  const isOnTrack = projectsCompleted >= projectsGoal && projectsDifference >= 0;
  //console.log("I am on track with my projects goal:", isOnTrack);

  const status = projectsCompleted >= projectsGoal ? "On Track" : "Need more completed.";
  //console.log("Status of projects completed:", status);

  const address = `${contactMe.city}, ${contactMe.state}, ${String(contactMe.zip)}`;
  console.log("Contact's Address:", address);

  const unimportantProjects = "12";
  const projectsPossible = Number(unimportantProjects) + projectsCompleted;
  //console.log("Amount of projects I could use:", projectsPossible);

  const companyEntered = Boolean(contactMe.company);
  //console.log("The company was entered:", companyEntered);

  resumeData();

// Build projectStore from JSON + localStorage, then render it.
await rebuildProjectStore();

// Wire up filter buttons.
if (container) {
  document.querySelectorAll(".filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedFilter = sanitizeInput(btn.dataset.filter || "all").toLowerCase();
      renderProjects(container, projectStore, selectedFilter);
    });
  });
}

  const contactForm = document.getElementById("contactMe");

  // Contact form: checks input, token, and submission rate.
  if (contactForm) {
    const contactValidityChecks = {
      company: "You must enter your company.",
      firstName: "You must enter your first name.",
      lastName: "You must enter your last name.",
      email: "You must enter a valid email address.",
      questionsBox: "Please enter a message."
    };

    const checkContactFieldValid = function (field) {
      field.setCustomValidity("");

      if (!field.checkValidity()) {
        field.setCustomValidity(contactValidityChecks[field.id] || "Please fill out this field.");
      }

      if (field.id === "email" && field.value.trim()) {
        try {
          validateEmail(field.value);
        } catch (error) {
          field.setCustomValidity(contactValidityChecks.email);
        }
      }
    };

    const runContactFieldChecks = function () {
      // Re-check all important fields before submit.
      ["company", "firstName", "lastName", "email", "questionsBox"].forEach((id) => {
        const field = document.getElementById(id);

        if (field) {
          checkContactFieldValid(field);
        }
      });
    };

    const logFormEntries = function (data) {
      // Helpful for debugging what was submitted.
      for (const pair of data.entries()) {
        console.log(`"${pair[0]}", "${pair[1]}"`);
      }
    };

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      try {
        if (!canSubmit("contactForm")) {
          throw new Error("Too many submissions. Please wait a minute and try again.");
        }

        runContactFieldChecks();

        if (!contactForm.reportValidity()) {
          return;
        }

        const formData = new FormData(contactForm);
        const submittedToken = formData.get("csrfToken");
        validateCSRFToken(submittedToken);

        const formObject = {
          company: sanitizeInput(formData.get("company")),
          firstName: sanitizeInput(formData.get("firstName")),
          lastName: sanitizeInput(formData.get("lastName")),
          email: validateEmail(formData.get("email")),
          questionsBox: sanitizeInput(formData.get("questionsBox"))
        };

        sessionStorage.setItem("lastContactSubmission", JSON.stringify(formObject));

        saveUsedToken(submittedToken);

        console.log("Contact Form Submitted:");
        console.table(formObject);
        logFormEntries(formData);

        alert("Form submitted successfully!");
        contactForm.reset();
        issueNewCSRFToken();
      } catch (error) {
        handleError(error.message || "The contact form could not be submitted.", error);
      }
    });

    ["company", "firstName", "lastName", "email", "questionsBox"].forEach((id) => {
      const field = document.getElementById(id);

      if (field) {
        field.addEventListener("input", () => {
          checkContactFieldValid(field);
        });
      }
    });
  }

  const projectForm = document.getElementById("projectForm");

  // Project form: same checks, then add and re-render.
if(projectForm){
  projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    if (!canSubmit("projectForm")) {
      throw new Error("Too many submissions. Please wait a minute.");
    }

    const formData = new FormData(projectForm);
    const submittedToken = formData.get("csrfToken");
    validateCSRFToken(submittedToken);

    const newProject = displayStorageProject(projectStore);

    const savedProjects = getStorageProjects();
    savedProjects.push(newProject.getSafeProjectData());
    saveStorageProjects(savedProjects);

    await rebuildProjectStore();

    saveUsedToken(submittedToken);

    alert("Project added successfully!");
    projectForm.reset();
    issueNewCSRFToken();
  } catch (error) {
    handleError(error.message || "Project could not be added.", error);
  }
});
}

  // Fill hidden csrfToken fields when the page first loads.
  issueNewCSRFToken();

  const deleteProjectByTitle = async function (titleToDelete) {
    const cleanTitle = sanitizeInput(titleToDelete).toLowerCase();

    if (!cleanTitle) {
      throw new Error("Enter a project title to delete.");
    }

    const savedProjects = getStorageProjects();

    const updatedProjects = savedProjects.filter((project) =>
      project.title.toLowerCase() !== cleanTitle
    );

    if (updatedProjects.length === savedProjects.length) {
      throw new Error("No saved project found with that title.");
    }

    saveStorageProjects(updatedProjects);

    const fetchedProjects = await fetchProjects();
    const allProjects = [...fetchedProjects, ...updatedProjects];

    projectStore = createProtectedProjectStoreFromData(allProjects);

    renderProjects(container, projectStore);
  };

  const deleteProjectForm = document.getElementById("deleteProjectForm");

  if (deleteProjectForm) {
  deleteProjectForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const deleteTitleField = document.getElementById("deleteProjectTitle");

      await deleteProjectByTitle(deleteTitleField.value);

      alert("Project deleted successfully.");
      deleteProjectForm.reset();
    } catch (error) {
      handleError(error.message || "Project could not be deleted.", error);
    }
  });
  }

});