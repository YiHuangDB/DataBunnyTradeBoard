document.addEventListener('DOMContentLoaded', () => {
    const leftNavigator = document.getElementById('left-navigator');
    const contentArea = document.getElementById('content-area');
    const toggleNavBtn = document.getElementById('toggle-nav-btn');
    const navList = document.getElementById('nav-list');
    const navSearchInput = document.getElementById('nav-search');
    const toggleFullscreenButton = document.getElementById('toggle-fullscreen-btn');
    const moduleContentWrapper = document.getElementById('module-content-wrapper'); // Added this line

    const navWidth = leftNavigator.offsetWidth + "px";

    toggleNavBtn.addEventListener('click', () => {
        leftNavigator.classList.toggle('navigator-hidden');
        if (leftNavigator.classList.contains('navigator-hidden')) {
            contentArea.style.marginLeft = '0';
            toggleNavBtn.textContent = 'Show Nav';
        } else {
            contentArea.style.marginLeft = navWidth;
            toggleNavBtn.textContent = 'Hide Nav';
        }
    });

    const moduleConfigs = [
        "modules/dashboard/module_config.json",
        "modules/settings/module_config.json",
        "modules/profile/module_config.json" // Add this line
    ];

    async function fetchModuleConfig(configPath) {
        try {
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${configPath}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch module config ${configPath}:`, error);
            return null; // Return null or a specific error object if a module fails to load
        }
    }

    async function loadNavigatorItems() {
        if (!navList) {
            console.error("Error: 'nav-list' element not found.");
            return;
        }
        navList.innerHTML = ''; // Clear existing items

        const modulePromises = moduleConfigs.map(fetchModuleConfig);

        try {
            const modules = await Promise.all(modulePromises);
            modules.forEach((module, index) => {
                if (module && module.name) { // Check if module loaded successfully and has a name
                    const li = document.createElement('li');
                    li.textContent = module.name;
                    li.classList.add('nav-item'); // For styling

                    // Extract module ID (directory name) from config path for uniqueness
                    const configPath = moduleConfigs[index];
                    const pathParts = configPath.split('/');
                    const moduleId = pathParts.length > 1 ? pathParts[pathParts.length - 2] : `module-${index}`;

                    li.setAttribute('data-module-id', moduleId);
                    // Construct full paths for html and js files relative to root
                    li.setAttribute('data-html-file', `modules/${moduleId}/${module.html_file}`);
                    li.setAttribute('data-js-file', `modules/${moduleId}/${module.js_file}`);

                    navList.appendChild(li);
                }
            });
        } catch (error) {
            // This catch might not be strictly necessary if fetchModuleConfig handles its own errors and returns null
            console.error("Error loading one or more module configurations:", error);
        }
    }

    loadNavigatorItems();

    navSearchInput.addEventListener('input', () => {
        const searchTerm = navSearchInput.value.toLowerCase();
        const navItems = document.querySelectorAll('#nav-list .nav-item');

        navItems.forEach(item => {
            const itemName = item.textContent.toLowerCase();
            if (itemName.includes(searchTerm)) {
                item.style.display = ''; // Show item
            } else {
                item.style.display = 'none'; // Hide item
            }
        });
    });

    navList.addEventListener('click', async (event) => {
        const listItem = event.target.closest('.nav-item'); // Ensure we get the LI even if a child is clicked

        if (!listItem) {
            return; // Click was not on a nav item
        }

        // Remove .active class from previously active item
        const currentActive = navList.querySelector('.nav-item.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }
        // Add .active class to the clicked item
        listItem.classList.add('active');

        // Clear existing content area's direct children, except the toggle button if it's inside
        // A simpler approach for now is to just overwrite innerHTML, but be mindful if persistent elements are needed.
        // For example, if the toggle button was part of contentArea's initial static content:
        // Array.from(contentArea.children).forEach(child => {
        // if (child.id !== 'toggle-nav-btn') { // Assuming toggle button is inside contentArea
        // contentArea.removeChild(child);
        // }
        // });
        // However, the toggle button is currently outside the part of contentArea that gets overwritten by module HTML.
        // If the button were inside the module HTML, it would be replaced.
        // The current index.html has <button id="toggle-nav-btn"> directly in content-area, then comments.
        // So, direct innerHTML overwrite of contentArea is problematic if we want to keep the button.

        // Let's create a dedicated div for module content within content-area
        // This requires an HTML change. For now, let's assume contentArea can be fully overwritten
        // and the button is outside or we accept it gets removed if it was inside the loaded HTML.
        // Given the current HTML, the button is a direct child of content-area.
        // Overwriting contentArea.innerHTML will remove the button.
        // To preserve the button, we need a sub-container for module content.

        // Let's modify the logic to target a sub-container, or adjust where module HTML is injected.
        // For now, the easiest path is to ensure the button is NOT part of the content loaded into contentArea.
        // The current `index.html` has:
        // <div id="content-area">
        // <button id="toggle-nav-btn">Hide Nav</button>
        // <!-- Main content will go here -->
        // </div>
        // So, if we set contentArea.innerHTML, the button is gone.

        // Option 1: Create a dedicated sub-div in index.html for module content.
        // <div id="content-area">
        // <button id="toggle-nav-btn">Hide Nav</button>
        // <div id="module-content-wrapper"></div>
        // </div>
        // And then: const moduleWrapper = document.getElementById('module-content-wrapper'); moduleWrapper.innerHTML = htmlContent;

        // Option 2: Selectively clear contentArea.
        // This is safer if we can't change index.html now.
        // Let's find or create a specific container for module content.
        // A follow-up would be to refine index.html to have a dedicated content wrapper.
    // UPDATE: The wrapper 'module-content-wrapper' has been added to index.html.

    const moduleWrapper = document.getElementById('module-content-wrapper');
    if (!moduleWrapper) {
        console.error("Critical error: The 'module-content-wrapper' element is missing from index.html.");
        // Fallback to contentArea, but this means the button might be overwritten if not handled
        // For safety, just display an error in contentArea itself.
        contentArea.innerHTML = "<p>Application error: UI structure incomplete (missing module-content-wrapper).</p>";
        return;
    }

        const htmlFile = listItem.dataset.htmlFile;
        const jsFile = listItem.dataset.jsFile;
        const moduleId = listItem.dataset.moduleId;

        if (!htmlFile) {
            console.error('No HTML file specified for this module:', moduleId);
        moduleWrapper.innerHTML = '<p>Error: Module content not found.</p>';
            return;
        }

        try {
            // Fetch HTML content
            const response = await fetch(htmlFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${htmlFile}`);
            }
            const htmlContent = await response.text();

        moduleWrapper.innerHTML = htmlContent;

            // Remove any previously loaded module-specific script to avoid conflicts/re-executions
            const oldScript = document.getElementById('module-script');
            if (oldScript) {
                oldScript.remove();
            }

            // Load and execute module-specific JavaScript if it exists
            if (jsFile) {
                const script = document.createElement('script');
                script.id = 'module-script'; // Add an ID to make it findable for removal
                script.src = jsFile;
                script.defer = true; // defer execution until HTML is parsed
                document.body.appendChild(script); // Append to body to ensure execution
            }
        } catch (error) {
            console.error('Error loading module content:', error);
        moduleWrapper.innerHTML = `<p>Error loading module: ${moduleId}. Check console for details.</p>`;
        }
    });

    if (toggleFullscreenButton && moduleContentWrapper && leftNavigator && toggleNavBtn && contentArea) {
        toggleFullscreenButton.addEventListener('click', () => {
            moduleContentWrapper.classList.toggle('module-content-fullscreen');

            if (moduleContentWrapper.classList.contains('module-content-fullscreen')) {
                // Entering fullscreen
                leftNavigator.style.display = 'none';
                toggleNavBtn.style.display = 'none'; // Hide the nav toggle button
                toggleFullscreenButton.textContent = 'Exit Fullscreen';
                contentArea.style.overflow = 'hidden'; // Hide original #content-area scrollbar
            } else {
                // Exiting fullscreen
                // Only show navigator if it wasn't hidden by its own toggle
                if (!leftNavigator.classList.contains('navigator-hidden')) {
                    leftNavigator.style.display = '';
                }
                toggleNavBtn.style.display = ''; // Show the nav toggle button
                toggleFullscreenButton.textContent = 'Fullscreen';
                contentArea.style.overflow = 'auto'; // Restore content-area scrollbar
            }
        });
    } else {
        console.error("One or more elements for fullscreen toggle are missing:", {
            toggleFullscreenButton, moduleContentWrapper, leftNavigator, toggleNavBtn, contentArea
        });
    }
});
