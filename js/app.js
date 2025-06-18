const ICONS = {
    MENU: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>',
    FULLSCREEN_ENTER: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    FULLSCREEN_EXIT: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>'
};

document.addEventListener('DOMContentLoaded', async () => {
    // Define categories and subcategories here to be in scope for functions
    let categories = [];
    let subcategories = [];

    // DOM Element references
    const leftNavigator = document.getElementById('left-navigator');
    const contentArea = document.getElementById('content-area');
    const toggleNavBtn = document.getElementById('toggle-nav-btn');
    const navList = document.getElementById('nav-list');
    const navSearchInput = document.getElementById('nav-search');
    const toggleFullscreenButton = document.getElementById('toggle-fullscreen-btn');
    const moduleContentWrapper = document.getElementById('module-content-wrapper'); // Added this line

    const navWidth = leftNavigator.offsetWidth + "px"; // Used by toggleNavBtn

    // Set initial icons for buttons
    if (toggleNavBtn) {
        toggleNavBtn.innerHTML = ICONS.MENU;
        toggleNavBtn.title = "Hide Navigator"; // Initial title
    }
    if (toggleFullscreenButton) {
        toggleFullscreenButton.innerHTML = ICONS.FULLSCREEN_ENTER;
        toggleFullscreenButton.title = "Enter Fullscreen";
    }

    const initialLeftNavWidthPx = leftNavigator.offsetWidth + 'px'; // Store initial full width
    const COLLAPSED_NAV_WIDTH_PX = '50px'; // Define collapsed width

    toggleNavBtn.addEventListener('click', () => {
        // If in fullscreen mode, this button should do nothing regarding navigator visibility.
        if (moduleContentWrapper.classList.contains('module-content-fullscreen')) {
            // console.log("Toggle Navigator button clicked while in fullscreen - no action taken.");
            return;
        }

        // Logic for when NOT in fullscreen mode (toggles between full and collapsed/minimal)
        const isNowCollapsed = leftNavigator.classList.toggle('navigator-collapsed');

        // Update title based on the new state
        toggleNavBtn.title = isNowCollapsed ? "Expand Navigator" : "Collapse Navigator";

        // Adjust contentArea margin
        contentArea.style.marginLeft = isNowCollapsed ? COLLAPSED_NAV_WIDTH_PX : initialLeftNavWidthPx;

        // If we just collapsed the navigator, ensure 'navigator-fully-hidden' is not present
        if (isNowCollapsed) {
            leftNavigator.classList.remove('navigator-fully-hidden'); // Clean up, just in case
        }
    });

    const moduleConfigs = [
        "modules/dashboard/module_config.json",
        "modules/settings/module_config.json",
        "modules/profile/module_config.json" // Add this line
    ];

    async function fetchCategoryData() {
        try {
            const response = await fetch('categories.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} while fetching categories.json`);
            }
            const data = await response.json();
            // Assign to the outer scope variables
            categories = data.categories || [];
            subcategories = data.subcategories || [];
            // console.log('Categories loaded:', categories);
            // console.log('Subcategories loaded:', subcategories);
        } catch (error) {
            console.error('Error fetching category data:', error);
            // Fallback to empty arrays
            categories = [];
            subcategories = [];
        }
    }

    async function fetchModuleConfig(configPath) {
        try {
            const response = await fetch(configPath);
            if (!response.ok) {
                // console.error(`Failed to fetch module config: ${configPath}`, response.status); // Keep original error for more detail
                throw new Error(`HTTP error! status: ${response.status} while fetching ${configPath}`);
            }
            const moduleData = await response.json();
            moduleData.path = configPath; // Store original path
            // e.g., configPath = "modules/dashboard/module_config.json"
            // pathParts will be ["modules", "dashboard", "module_config.json"]
            // moduleData.id will be "dashboard"
            const pathParts = configPath.split('/');
            moduleData.id = pathParts.length > 1 ? pathParts[pathParts.length - 2] : moduleData.name.toLowerCase().replace(/\s+/g, '-');
            return moduleData;
        } catch (error) {
            // console.error(`Error processing module config ${configPath}:`, error); // Keep original error
            // The original console.error was more generic, let's stick to that or make this more specific.
            console.error(`Failed to fetch or process module config ${configPath}:`, error);
            return null;
        }
    }

    async function loadNavigatorItems() { // Make it async if it wasn't already, to fetch module configs
        const navList = document.getElementById('nav-list');
        if (!navList) {
            console.error('Navigation list element (#nav-list) not found.');
            return;
        }
        navList.innerHTML = ''; // Clear existing items

        // 1. Sort categories and subcategories (if not already sorted during fetch)
        // Assuming 'categories' and 'subcategories' are accessible from the outer scope
        categories.sort((a, b) => (a.order || 0) - (b.order || 0));
        subcategories.sort((a, b) => (a.order || 0) - (b.order || 0));

        // 2. Fetch all module configurations
        let rawModuleConfigs = [];
        // Note: fetchModuleConfig is already designed to be used with map and Promise.all
        // moduleConfigs is the array of paths defined at the top of DOMContentLoaded
        try {
            const responses = await Promise.all(moduleConfigs.map(configPath => fetchModuleConfig(configPath)));
            rawModuleConfigs = responses.filter(mc => mc); // Filter out any nulls from failed fetches
        } catch (error) {
            console.error("Error fetching one or more module configurations:", error);
            // Decide how to handle this - perhaps render what we have, or show an error
        }

        // 3. Sort modules by their orderInCategory
        rawModuleConfigs.sort((a, b) => (a.orderInCategory || 0) - (b.orderInCategory || 0));

        // 4. Group modules by category and subcategory for easier lookup
        const modulesByCategory = {}; // { categoryId: [module, module] }
        const modulesBySubCategory = {}; // { subcategoryId: [module, module] }

        rawModuleConfigs.forEach(module => {
            if (module.subcategoryId) {
                if (!modulesBySubCategory[module.subcategoryId]) modulesBySubCategory[module.subcategoryId] = [];
                modulesBySubCategory[module.subcategoryId].push(module);
            } else if (module.categoryId) {
                if (!modulesByCategory[module.categoryId]) modulesByCategory[module.categoryId] = [];
                modulesByCategory[module.categoryId].push(module);
            }
            // TODO: Handle modules without any categoryId (put them in a default "Uncategorized" group later)
        });


        // 5. Render categories, subcategories, and their modules
        categories.forEach(category => {
            const categoryLi = document.createElement('li');
            categoryLi.classList.add('nav-category');

            const categoryHeader = document.createElement('div');
            categoryHeader.classList.add('nav-category-header');
            categoryHeader.textContent = category.name;
            // Add a caret for collapsibility if desired (e.g., an <i> or <span> element)
            // categoryHeader.innerHTML = `${category.name} <span class="caret">&#9662;</span>`; // Example caret
            categoryLi.appendChild(categoryHeader);

            const categoryModuleListUl = document.createElement('ul');
            categoryModuleListUl.classList.add('nav-module-list', 'category-modules');
            // categoryModuleListUl.style.display = 'none'; // Start collapsed if implementing collapsibility

            // Render modules directly under this category
            (modulesByCategory[category.id] || []).forEach(module => {
                const moduleLi = createModuleListItem(module);
                categoryModuleListUl.appendChild(moduleLi);
            });

            // Render subcategories and their modules
            subcategories.filter(sc => sc.parentCategoryId === category.id).forEach(subcategory => {
                const subCategoryLi = document.createElement('li');
                subCategoryLi.classList.add('nav-subcategory');

                const subCategoryHeader = document.createElement('div');
                subCategoryHeader.classList.add('nav-subcategory-header');
                subCategoryHeader.textContent = subcategory.name;
                // subCategoryHeader.innerHTML = `${subcategory.name} <span class="caret">&#9662;</span>`;
                subCategoryLi.appendChild(subCategoryHeader);

                const subCategoryModuleListUl = document.createElement('ul');
                subCategoryModuleListUl.classList.add('nav-module-list', 'subcategory-modules');
                // subCategoryModuleListUl.style.display = 'none'; // Start collapsed

                (modulesBySubCategory[subcategory.id] || []).forEach(module => {
                    const moduleLi = createModuleListItem(module);
                    subCategoryModuleListUl.appendChild(moduleLi);
                });

                if (subCategoryModuleListUl.hasChildNodes()) {
                    subCategoryLi.appendChild(subCategoryModuleListUl);
                    categoryModuleListUl.appendChild(subCategoryLi); // Append subcategory LI to category's UL
                }
            });

            if (categoryModuleListUl.hasChildNodes()) {
                categoryLi.appendChild(categoryModuleListUl);
            }
            // Only append the category if it has modules or subcategories with modules
            if (categoryLi.querySelector('.nav-item')) { // Check if any module item was eventually added
                 navList.appendChild(categoryLi);
            }
        });

        // TODO: Handle uncategorized modules by appending them at the end.
    }

    // Helper function to create module list items (refactored from previous version)
    function createModuleListItem(module) {
        const li = document.createElement('li');
        li.classList.add('nav-item'); // Existing class for styling and click handling
        li.textContent = module.name;
        // module.id is now provided by the updated fetchModuleConfig
        li.dataset.moduleId = module.id || module.name.toLowerCase().replace(/\s+/g, '-');
        li.dataset.htmlFile = module.html_file;
        li.dataset.jsFile = module.js_file;

        return li;
    }

    // Initial loading sequence
    await fetchCategoryData(); // Wait for categories to load first
    loadNavigatorItems();      // This function will be modified later to use the loaded category data

    navSearchInput.addEventListener('input', () => {
        const searchTerm = navSearchInput.value.toLowerCase().trim();
        const allNavItems = navList.querySelectorAll('.nav-item');
        const allSubCategoryLis = navList.querySelectorAll('.nav-subcategory');
        const allCategoryLis = navList.querySelectorAll('.nav-category');

        // If search term is empty, show everything and exit
        if (searchTerm === "") {
            allNavItems.forEach(item => item.style.display = '');
            allSubCategoryLis.forEach(item => item.style.display = '');
            allCategoryLis.forEach(item => item.style.display = '');
            // If using collapsibility, ensure they are reset to default collapsed/expanded state
            return;
        }

        // 1. Filter individual module items (.nav-item)
        allNavItems.forEach(item => {
            const itemName = item.textContent.toLowerCase();
            if (itemName.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        // 2. Update visibility of subcategory LIs (.nav-subcategory)
        allSubCategoryLis.forEach(subCategoryLi => {
            const subCategoryHeader = subCategoryLi.querySelector('.nav-subcategory-header');
            const subCategoryName = subCategoryHeader ? subCategoryHeader.textContent.toLowerCase() : '';

            // Check if any child .nav-item within this subcategory is visible
            const visibleChildItem = subCategoryLi.querySelector('.nav-item:not([style*="display: none"])');

            if (visibleChildItem || subCategoryName.includes(searchTerm)) {
                subCategoryLi.style.display = '';
            } else {
                subCategoryLi.style.display = 'none';
            }
        });

        // 3. Update visibility of category LIs (.nav-category)
        allCategoryLis.forEach(categoryLi => {
            const categoryHeader = categoryLi.querySelector('.nav-category-header');
            const categoryName = categoryHeader ? categoryHeader.textContent.toLowerCase() : '';

            // Check if any child .nav-item OR .nav-subcategory (that hasn't been hidden) is visible
            const visibleChildModule = categoryLi.querySelector('.nav-module-list > .nav-item:not([style*="display: none"])');
            const visibleChildSubCategory = categoryLi.querySelector('.nav-module-list > .nav-subcategory:not([style*="display: none"])');

            if (visibleChildModule || visibleChildSubCategory || categoryName.includes(searchTerm)) {
                categoryLi.style.display = '';
            } else {
                categoryLi.style.display = 'none';
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
    // moduleContentWrapper is defined in the outer DOMContentLoaded scope and is accessible here.
    // No need to redefine: const moduleWrapper = document.getElementById('module-content-wrapper');

    if (!moduleContentWrapper) { // Check if it was found during initial DOMContentLoaded setup
        console.error("Critical error: The 'module-content-wrapper' element is missing from index.html.");
        // If it's missing, there's nowhere to put content or errors.
        // The initial check for moduleContentWrapper at the top of DOMContentLoaded might be better.
        // For now, this check guards its use.
        return;
    }

        const htmlFileName = listItem.dataset.htmlFile;
        const jsFileName = listItem.dataset.jsFile;
        const moduleId = listItem.dataset.moduleId;

        if (!htmlFileName) {
            console.error('No HTML file specified for this module:', moduleId);
            moduleContentWrapper.innerHTML = '<p>Error: Module content not found.</p>';
            return;
        }

        try {
            const fullHtmlPath = `modules/${moduleId}/${htmlFileName}`;
            const response = await fetch(fullHtmlPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${fullHtmlPath}`);
            }
            const htmlContent = await response.text();
            moduleContentWrapper.innerHTML = htmlContent;

            // Remove any previously loaded module-specific script to avoid conflicts/re-executions
            const oldScript = document.getElementById('module-script');
            if (oldScript) {
                oldScript.remove();
            }

            // Load and execute module-specific JavaScript if it exists
            if (jsFileName) {
                const fullJsPath = `modules/${moduleId}/${jsFileName}`;
                const script = document.createElement('script');
                script.id = 'module-script'; // Add an ID to make it findable for removal
                script.src = fullJsPath;
                script.defer = true; // defer execution until HTML is parsed
                document.body.appendChild(script); // Append to body to ensure execution
            }
        } catch (error) {
            console.error('Error loading module content:', error);
            moduleContentWrapper.innerHTML = `<p>Error loading module: ${moduleId}. Check console for details.</p>`;
        }
    });

    // Updated condition: toggleNavBtn's direct display style is not changed by this listener anymore.
    if (toggleFullscreenButton && moduleContentWrapper && leftNavigator && contentArea) {
        toggleFullscreenButton.addEventListener('click', () => {
            moduleContentWrapper.classList.toggle('module-content-fullscreen');

            if (moduleContentWrapper.classList.contains('module-content-fullscreen')) {
                // ---- Entering Fullscreen ----
                toggleFullscreenButton.innerHTML = ICONS.FULLSCREEN_EXIT;
                toggleFullscreenButton.title = "Exit Fullscreen";

                // Ensure navigator is in the 'collapsed' (50px minimal bar) state
                leftNavigator.classList.remove('navigator-fully-hidden'); // Remove if it was fully hidden
                leftNavigator.classList.add('navigator-collapsed');    // Add/ensure collapsed state for minimal bar

                // Ensure content wrapper makes space for the minimal navigator
                moduleContentWrapper.classList.remove('nav-is-fully-hidden');

                // contentArea.style.overflow = 'hidden'; // Handled by CSS of .module-content-fullscreen
                // Note: toggleNavBtn.title is no longer changed here.

            } else {
                // ---- Exiting Fullscreen ----
                toggleFullscreenButton.innerHTML = ICONS.FULLSCREEN_ENTER;
                toggleFullscreenButton.title = "Enter Fullscreen";

                // Remove fullscreen-specific effect on navigator if it was only due to FS.
                // .navigator-collapsed is NOT necessarily removed here, as its state
                // outside fullscreen is managed by toggleNavBtn.
                // leftNavigator.classList.remove('navigator-collapsed'); // Decided against this, toggleNavBtn is source of truth for this class.
                leftNavigator.classList.remove('navigator-fully-hidden'); // Ensure this is removed (safety)

                // Remove fullscreen-specific classes from content wrapper
                moduleContentWrapper.classList.remove('nav-is-fully-hidden'); // Clean up

                // contentArea.style.overflow = 'auto'; // Handled by CSS when .module-content-fullscreen is removed

                // Restore contentArea.style.marginLeft based on current navigator collapsed state
                if (leftNavigator.classList.contains('navigator-collapsed')) {
                    contentArea.style.marginLeft = COLLAPSED_NAV_WIDTH_PX;
                } else {
                    contentArea.style.marginLeft = initialLeftNavWidthPx;
                }

                // Note: toggleNavBtn.title is no longer changed here.
            }
        });
    } else {
        // Update console error for checked elements
        console.error("One or more elements for fullscreen toggle are missing:", {
            toggleFullscreenButton, moduleContentWrapper, leftNavigator, contentArea
        });
    }
});
