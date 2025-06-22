document.addEventListener('DOMContentLoaded', () => {

    const searchContainer = document.getElementById('search-container');
    const mainContent = document.getElementById('main-content');
    const searchForm = document.getElementById('search-form');
    const usernameInput = document.getElementById('username-input');
    const projectList = document.getElementById('project-list');
    const profileLink = document.getElementById('profile-link');
    const searchErrorMessage = document.getElementById('search-error-message');

    function getUsernameFromParams() {
        const params = new URLSearchParams(window.location.search);
        return params.get("user");
    }

    function getColorFromParams() {
        const params = new URLSearchParams(window.location.search);
        let color = params.get("color");
        if (!color) return null;
        const hexRegex = /^#?([0-9a-fA-F]{6})$/;
        const match = color.match(hexRegex);
        return match ? `#${match[1]}` : null;
    }

    function getLuminance(hex) {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    function applyCustomTheme(customColor) {
        const root = document.documentElement;
        root.style.setProperty('--primary-bg-color', customColor);

        const luminance = getLuminance(customColor);

        if (luminance > 0.5) {
            root.style.setProperty('--accent-color', '#333333');
            root.style.setProperty('--subtle-accent-color', '#555555');
            root.style.setProperty('--footer-text-color', '#666666');
            root.style.setProperty('--separator-color', 'rgba(0, 0, 0, 0.1)');
        } else {
            root.style.setProperty('--accent-color', '#FFFACD');
            root.style.setProperty('--subtle-accent-color', '#dfd794');
            root.style.setProperty('--footer-text-color', '#c1c1c1');
            root.style.setProperty('--separator-color', 'rgba(255, 250, 205, 0.2)');
        }
    }

    function showMainContent() {
        searchContainer.style.display = 'none';
        mainContent.style.display = 'block';
    }

    function showSearch() {
        searchContainer.style.display = 'flex';
        mainContent.style.display = 'none';
    }

    async function loadRepos(username) {
        projectList.innerHTML = "<li>Loading...</li>";
        profileLink.textContent = username;
        profileLink.href = `https://github.com/${username}`;

        try {
            const res = await fetch(`https://api.github.com/users/${username}/repos?sort=created&direction=desc`);
            if (!res.ok) {
                throw new Error(`The profile "${username}" was not found.`);
            }
            const repos = await res.json();
            const filtered = repos.filter(repo => repo.name.toLowerCase() !== username.toLowerCase());

            if (filtered.length === 0) {
                projectList.innerHTML = "<li>No public project found</li>";
                return;
            }

            projectList.innerHTML = "";
            filtered.forEach(repo => {
                const li = document.createElement("li");
                li.innerHTML = `
                  <a class="titreMenu" href="${repo.html_url}" target="_blank">${repo.name}</a>
  <div class="project-details">
    <div class="project-description">${repo.description || "No description"}</div>
    <div>${repo.language ? "Language: " + repo.language : ""}</div>
    ${repo.archived ? '<div class="Archive">Archived</div>' : ""}

    <div class="project-stats">
        <span>
            <svg viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.192L.644 6.16a.75.75 0 01.416-1.28l4.21-.611L7.127.668A.75.75 0 018 .25z"></path></svg>
            ${repo.stargazers_count}
        </span>
    </div>
    
  </div>
`;
                projectList.appendChild(li);
            });
        } catch (err) {
            window.location.href = window.location.pathname;
        }
    }

    async function loadUserStats(username) {
        const statsDiv = document.getElementById("github-stats");
        try {
            const res = await fetch(`https://api.github.com/users/${username}`);
            if (!res.ok) throw new Error("Unable to load stats.");
            const user = await res.json();

            statsDiv.innerHTML = `${user.public_repos} repos<br> ${user.followers} followers`;
        } catch (err) {
            statsDiv.textContent = "Error loading stats.";
        }
    }

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const userToSearch = usernameInput.value.trim();
        if (userToSearch) {
            searchErrorMessage.textContent = "";
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.set('user', userToSearch);
            const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            showMainContent();
            loadRepos(userToSearch);
        }
    });

    usernameInput.addEventListener('input', () => {
        searchErrorMessage.textContent = "";
    });

    const customColor = getColorFromParams();
    if (customColor) {
        applyCustomTheme(customColor);
    }

    const initialUsername = getUsernameFromParams();
    if (initialUsername) {
        showMainContent();
        loadRepos(initialUsername);
        loadUserStats(initialUsername);
    } else {
        showSearch();
    }
});