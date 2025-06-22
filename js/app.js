const ICONS = {
    MENU: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>',
    FULLSCREEN_ENTER: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    FULLSCREEN_EXIT: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
    CARET_RIGHT: '<svg class="nav-category-caret" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 17l5-5-5-5v10z"/></svg>',
    STAR_ICON: '<svg class="nav-item-favorite-icon" viewBox="0 0 24 24"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>'
};

document.addEventListener('DOMContentLoaded', async () => {
    // Holds navigator configuration like title, categories, subcategories
    let navigatorConfig = {
        title: "Modules",       // Default title
        iconSVG: "",          // Default empty SVG string
        categories: [],
        subcategories: []
    };

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
        "modules/profile/module_config.json",
        "modules/demo_separator_1/module_config.json" // Added separator
    ];

    async function fetchNavigatorConfig() { // Renamed function
        try {
            const response = await fetch('modules.json'); // Renamed file
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} while fetching modules.json`);
            }
            const data = await response.json();

            navigatorConfig.title = data.navigatorTitle || "Modules"; // Use default if not present
            navigatorConfig.iconSVG = data.navigatorIconSVG || "";   // Use empty string if not present
            navigatorConfig.categories = data.categories || [];
            navigatorConfig.subcategories = data.subcategories || [];

            // console.log('Navigator config loaded:', navigatorConfig);
        } catch (error) {
            console.error('Error fetching navigator config data (modules.json):', error);
            // navigatorConfig will retain its default values
            // (default title, empty iconSVG, empty categories/subcategories)
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

        // 1. Sort categories and subcategories using navigatorConfig
        navigatorConfig.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
        navigatorConfig.subcategories.sort((a, b) => (a.order || 0) - (b.order || 0));

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
        navigatorConfig.categories.forEach(category => { // Use navigatorConfig
            const categoryLi = document.createElement('li');
            categoryLi.classList.add('nav-category');

            const categoryHeader = document.createElement('div');
            categoryHeader.classList.add('nav-category-header');
            // Prepend caret icon, then the name. Add 'expanded' class to caret by default.
            categoryHeader.innerHTML = ICONS.CARET_RIGHT + `<span class="category-name-text">${category.name}</span>`;
            const caretSvg = categoryHeader.querySelector('.nav-category-caret');
            if (caretSvg) {
                caretSvg.classList.add('expanded'); // Expanded by default
            }
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
            navigatorConfig.subcategories.filter(sc => sc.parentCategoryId === category.id).forEach(subcategory => { // Use navigatorConfig
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
            // And add click listener for collapsibility
            if (categoryModuleListUl.hasChildNodes()) { // Check if UL has children to be collapsible
                categoryLi.appendChild(categoryModuleListUl);

                const caretElement = categoryHeader.querySelector('.nav-category-caret');
                // Default to expanded: add 'expanded' class to caret (already done during header creation)
                // UL does not get 'collapsed' class by default, so it's visible

                categoryHeader.addEventListener('click', () => {
                    // Toggle 'collapsed' class on the UL (module list)
                    categoryModuleListUl.classList.toggle('collapsed');

                    // Toggle 'expanded' class on the caret SVG
                    if (caretElement) {
                        caretElement.classList.toggle('expanded');
                    }
                });
                navList.appendChild(categoryLi); // Append the fully constructed category LI
            }
            // If category has no modules/subcategories, it won't be added to navList based on previous logic.
            // If we wanted to show empty categories, the logic here and above would need adjustment.
            // Current logic: if categoryModuleListUl hasChildNodes is false, categoryLi (with only header) is not appended.
            // The line `if (categoryLi.querySelector('.nav-item'))` was a bit redundant if this check is here.
            // Let's stick to `if (categoryModuleListUl.hasChildNodes())` for appending and adding listener.
        });

        // TODO: Handle uncategorized modules by appending them at the end.
    }

    // Helper function to create module list items (refactored from previous version)
    function createModuleListItem(module) {
        const li = document.createElement('li');

        if (module.type === "separator") {
            li.classList.add('nav-separator');
        } else {
            li.classList.add('nav-item');
            li.innerHTML = ''; // Clear existing content

            // Add Item Icon (if available)
            if (module.itemIconSVG && typeof module.itemIconSVG === 'string' && module.itemIconSVG.trim() !== '') {
                // Create a temporary div to parse the SVG string and get the SVG element
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = module.itemIconSVG; // This should yield an <svg> element as firstChild
                const svgElement = tempDiv.firstChild;
                if (svgElement && svgElement.tagName === 'svg') { // Check if it's an SVG element
                    // The class "nav-item-main-icon" should be on the SVG root tag in the string
                    li.appendChild(svgElement);
                } else if (svgElement) { // Fallback if firstChild is not svg but exists (e.g. wrapped in another span from string)
                    console.warn("Parsed itemIconSVG did not directly yield an SVG element for module:", module.name, "Got:", svgElement);
                    // Try to find SVG inside
                    const innerSvg = svgElement.querySelector && svgElement.querySelector('svg.nav-item-main-icon');
                    if (innerSvg) li.appendChild(innerSvg);
                    else li.appendChild(svgElement); // Append whatever was parsed if no specific SVG found
                }
            }

            // Add Module Name
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('nav-item-name');
            nameSpan.textContent = module.name || 'Unnamed Module';
            li.appendChild(nameSpan);

            // Add Favorite Toggle Icon
            const favoriteToggleSpan = document.createElement('span');
            favoriteToggleSpan.classList.add('favorite-toggle-container');
            favoriteToggleSpan.innerHTML = ICONS.STAR_ICON; // Default is outline star
            li.appendChild(favoriteToggleSpan);

            // Set data attributes
            li.dataset.moduleId = module.id || (module.name ? module.name.toLowerCase().replace(/\s+/g, '-') : `module-${Date.now()}`);
            if (module.html_file) {
                li.dataset.htmlFile = module.html_file;
            }
            if (module.js_file) {
                li.dataset.jsFile = module.js_file;
            }
        }
        return li;
    }

    // Initial loading sequence
    await fetchNavigatorConfig(); // Call renamed function

    // Get reference to the title heading element
    const navigatorTitleHeading = document.getElementById('navigator-title-heading');

    // Set the navigator title dynamically
    if (navigatorTitleHeading) {
        navigatorTitleHeading.innerHTML = ''; // Clear any existing content

        // Add Icon (if available)
        if (navigatorConfig.iconSVG && typeof navigatorConfig.iconSVG === 'string' && navigatorConfig.iconSVG.trim() !== '') {
            const iconSpan = document.createElement('span');
            iconSpan.innerHTML = navigatorConfig.iconSVG;
            // The SVG string from modules.json should include class="navigator-title-icon"
            navigatorTitleHeading.appendChild(iconSpan);
        }

        // Add Title Text
        const titleTextSpan = document.createElement('span');
        titleTextSpan.textContent = navigatorConfig.title; // Default is already handled in fetchNavigatorConfig or navigatorConfig init
        navigatorTitleHeading.appendChild(titleTextSpan);

    } else {
        console.error("Element with ID 'navigator-title-heading' not found.");
    }

    loadNavigatorItems();

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
        const favoriteToggleContainer = event.target.closest('.favorite-toggle-container');
        const navItemClicked = event.target.closest('.nav-item'); // This is the LI element

        if (favoriteToggleContainer && navItemClicked) { // Check if the click is on a favorite icon within a nav item
            event.stopPropagation(); // Prevent the navItem click listener (module load)

            // Toggle the visual state of the favorite icon
            favoriteToggleContainer.classList.toggle('is-favorite');

            // Get module ID if needed for future persistence
            const moduleId = navItemClicked.dataset.moduleId;
            // if (favoriteToggleContainer.classList.contains('is-favorite')) {
            //     console.log(`Module ${moduleId} marked as favorite (visual only).`);
            // } else {
            //     console.log(`Module ${moduleId} un-marked as favorite (visual only).`);
            // }
            return; // Action handled, no further processing for this click.
        }

        // --- Existing module loading logic ---
        // If the click was not on a nav-item's interactive part (e.g., empty space in UL, or not on fav icon)
        if (!navItemClicked) {
            return;
        }
        // If we reached here, it means a .nav-item was clicked but not its favorite icon.
        // Proceed with module loading.

        // Highlight active item
        const currentActive = navList.querySelector('.nav-item.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }
        navItemClicked.classList.add('active');

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

    if (!moduleContentWrapper) {
        console.error("Critical error: The 'module-content-wrapper' element is missing from index.html.");
        return;
    }

        // Use navItemClicked for data attributes from here on for module loading
        const htmlFileName = navItemClicked.dataset.htmlFile;
        const jsFileName = navItemClicked.dataset.jsFile;
        const moduleId = navItemClicked.dataset.moduleId;

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
