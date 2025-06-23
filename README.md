# Dynamic Modular Web Framework

## Overview

A lightweight, front-end web framework designed for building applications with a dynamic modular structure. It features a collapsible and searchable left-hand navigator that dynamically loads modules. Each module consists of its own HTML, CSS (via global styles or module-specific if extended), and JavaScript. Content is displayed in a main panel with a fullscreen option. The navigator supports categorization and sub-categorization of modules.

## Features

*   **Modular Architecture:** Easily add or remove functional units (modules).
*   **Dynamic Navigator:**
    *   Loads modules based on configuration files.
    *   Supports hierarchical categories and subcategories for modules.
    *   User-defined ordering for categories, subcategories, and modules.
    *   Collapsible to maximize content space.
    *   Quick search/filter for navigator items.
*   **Dynamic Content Loading:** Module HTML and JavaScript are loaded on demand.
*   **Fullscreen Mode:** View module content in fullscreen.
*   **Simple Configuration:** Uses JSON files for module and category setup.
*   **Vanilla JS:** Built with plain HTML, CSS, and JavaScript; no external libraries required for core functionality.

## Live Demo

You can try out a live version of this framework here:
[Dynamic Modular Web Framework Demo](https://yihuangdb.github.io/DynamicModularWebFramework/)

## Project Structure

```
.
├── css/
│   └── style.css           # Global stylesheets
├── js/
│   └── app.js              # Core JavaScript logic for the framework
├── modules/
│   ├── dashboard/          # Example: dashboard module
│   │   ├── dashboard_content.html
│   │   ├── dashboard_script.js
│   │   └── module_config.json
│   ├── settings/           # Example: settings module
│   │   └── ...
│   └── profile/            # Example: profile module
│       └── ...
├── categories.json         # Defines categories and subcategories for the navigator
└── index.html              # Main HTML file / entry point
```

## Getting Started

1.  **Clone/Download:** Get the project files onto your local machine.
2.  **Serve Locally (Recommended):**
    For `fetch` requests (used to load module configurations, HTML, and JS files) to work correctly from the local file system, it's best to serve the project directory using a local web server.
    *   If you have Python 3: `python -m http.server`
    *   If you have Node.js and `npx`: `npx live-server` or `npx http-server`
    *   Alternatively, use an IDE extension like VS Code's "Live Server".
3.  **Open in Browser:** Navigate to `index.html` (e.g., `http://localhost:8000/index.html`).

## Creating Modules

Each module resides in its own subdirectory within the `modules/` directory.

1.  **Create Module Directory:**
    Example: `modules/my_new_module/`

2.  **Create `module_config.json`:**
    In your module's directory (e.g., `modules/my_new_module/module_config.json`), create this file to define your module:
    ```json
    {
      "name": "My New Module",         // Display name in the navigator
      "html_file": "content.html",    // Path to the module's HTML file (relative to module dir)
      "js_file": "script.js",         // Path to the module's JS file (relative to module dir)
      "categoryId": "cat_general",    // ID of the category it belongs to (from categories.json)
      "subcategoryId": null,          // Optional: ID of the subcategory (from categories.json)
      "orderInCategory": 3            // Optional: Order within its category/subcategory (lower numbers first)
    }
    ```
    *   `name`: (String) The display name in the navigator.
    *   `html_file`: (String) The filename of the module's HTML content (e.g., `my_new_module_content.html`). Path is relative to the module's own directory.
    *   `js_file`: (String) The filename of the module's JavaScript (e.g., `my_new_module_script.js`). Path is relative to the module's own directory.
    *   `categoryId`: (String) The ID of the category this module belongs to. Must match an `id` in `categories.json`.
    *   `subcategoryId`: (String|null) Optional. If the module is under a subcategory, provide its ID. Must match a subcategory `id` in `categories.json` whose `parentCategoryId` is the same as `categoryId`.
    *   `orderInCategory`: (Number) Optional. Defines the sort order of this module within its assigned category or subcategory. Lower numbers appear first. Defaults to 0 if omitted.

3.  **Create Module HTML File:**
    Create the HTML file specified in `html_file` (e.g., `modules/my_new_module/content.html`). This is the content that will be loaded into the main panel.
    ```html
    <h1>Welcome to My New Module!</h1>
    <p>This is the content for the new module.</p>
    ```

4.  **Create Module JavaScript File (Optional):**
    Create the JS file specified in `js_file` (e.g., `modules/my_new_module/script.js`). This script is loaded when your module's content is displayed.
    ```javascript
    console.log("My New Module script loaded!");
    // Add module-specific behavior here
    ```

5.  **Register Module in `js/app.js`:**
    Open `js/app.js` and add the path to your new module's `module_config.json` to the `moduleConfigs` array:
    ```javascript
    const moduleConfigs = [
        "modules/dashboard/module_config.json",
        "modules/settings/module_config.json",
        "modules/profile/module_config.json",
        "modules/my_new_module/module_config.json" // Add your new module here
    ];
    ```

## Defining Categories and Subcategories

Categories and subcategories for the navigator are defined in the `categories.json` file in the project root.

**`categories.json` Structure:**
```json
{
  "categories": [
    {
      "id": "cat_general",    // Unique ID for the category
      "name": "General",      // Display name for the category
      "order": 1              // Display order for categories (lower numbers first)
    },
    // ... more categories
  ],
  "subcategories": [
    {
      "id": "subcat_example",         // Unique ID for the subcategory
      "name": "Example Subcategory",  // Display name for the subcategory
      "parentCategoryId": "cat_general", // ID of the parent category
      "order": 1                      // Display order within its parent category
    },
    // ... more subcategories
  ]
}
```
*   **`categories` Array:**
    *   `id`: A unique string identifier for the category. Referenced by modules and subcategories.
    *   `name`: The text displayed for the category header in the navigator.
    *   `order`: A number determining the category's position in the navigator.
*   **`subcategories` Array:**
    *   `id`: A unique string identifier for the subcategory. Referenced by modules.
    *   `name`: The text displayed for the subcategory header.
    *   `parentCategoryId`: The `id` of the category this subcategory belongs to.
    *   `order`: A number determining the subcategory's position within its parent category.

Modules link to these definitions using their `categoryId` and `subcategoryId` properties in their `module_config.json`.

## Using the Framework

*   **Navigator:**
    *   **Categories/Subcategories:** Modules are grouped under expandable/collapsible categories and subcategories.
    *   **Search:** Type in the search box to filter modules by name. Category and subcategory names are also searchable.
    *   **Hide/Show Navigator:** Click the "Hide Nav" / "Show Nav" button to toggle the navigator's visibility.
    *   **Selecting Modules:** Click on a module name in the navigator to load its content into the main panel. The active module is highlighted.
*   **Content Area:**
    *   **Fullscreen:** Click the "Fullscreen" / "Exit Fullscreen" button to toggle a distraction-free view of the current module's content.

## Future Enhancements

*   Implement click-to-collapse/expand for categories and subcategories in the navigator.
*   Add a dedicated section for "Uncategorized" modules if any `module_config.json` files lack proper `categoryId`.
*   More sophisticated state management for module scripts (e.g., unload/cleanup functions).
*   Theming options.
```
