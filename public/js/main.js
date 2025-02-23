import { icons } from "./icons.js";

function updateApiLink(username) {
  const apiLink = document.getElementById("directApiLink");
  if (!username.trim()) {
    apiLink.innerHTML =
      '<span class="text-gray-500">GET /api/repos?username=GITHUB_USERNAME</span>';
    return;
  }

  const url = `${window.location.origin}/api/repos?username=${username}`;
  apiLink.innerHTML = `<a href="${url}" class="hover:underline">${url}</a>`;
}

async function fetchRepos(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  if (!username) {
    updateApiLink("");
    return;
  }

  updateApiLink(username);

  const results = document.getElementById("results");
  results.innerHTML = '<div class="text-center">Loading...</div>';

  try {
    const response = await fetch(`/api/repos?username=${username}`);
    const data = await response.json();

    if (response.ok) {
      results.innerHTML = data
        .map(
          (repo) => `
              <div class="bg-white rounded-lg shadow-md p-6">
                  <div class="flex items-center justify-between mb-4">
                      <h2 class="text-xl font-semibold">
                          <a href="${
                            repo.link
                          }" target="_blank" class="text-blue-500 hover:underline">
                              ${repo.owner}/${repo.repo}
                          </a>
                      </h2>
                      <div class="flex items-center space-x-4">
                          <span class="flex items-center">
                              ${icons.star}
                              ${repo.stars}
                          </span>
                          <span class="flex items-center">
                              ${icons.fork}
                              ${repo.forks}
                          </span>
                      </div>
                  </div>
                  <p class="text-gray-600 mb-4">${
                    repo.description || "No description available"
                  }</p>
                  ${
                    repo.language
                      ? `
                      <div class="flex items-center">
                          <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${repo.languageColor}"></span>
                          <span>${repo.language}</span>
                      </div>
                  `
                      : ""
                  }
              </div>
          `
        )
        .join("");
    } else {
      results.innerHTML = `<div class="text-red-500 text-center">${data.error}</div>`;
    }
  } catch (error) {
    results.innerHTML =
      '<div class="text-red-500 text-center">An error occurred while fetching repositories</div>';
  }
}

// Add this to initialize all event listeners
function initializeApp() {
  const form = document.getElementById("repoForm");
  form.addEventListener("submit", fetchRepos);

  const usernameInput = document.getElementById("username");
  usernameInput.addEventListener("input", (e) => {
    updateApiLink(e.target.value);
  });

  // Initialize with placeholder
  updateApiLink("");
}

// Call initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);
