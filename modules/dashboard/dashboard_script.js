console.log("Dashboard module script loaded and running.");
const widgetBtn = document.getElementById('load-widget-btn');
const widgetContent = document.getElementById('dashboard-dynamic-content');

if (widgetBtn && widgetContent) {
    widgetBtn.addEventListener('click', () => {
        widgetContent.innerHTML = '<p><strong>Widget Data:</strong> Sales are up by 20%!</p>';
        widgetBtn.style.display = 'none'; // Hide button after loading
    });
} else {
    console.error("Dashboard elements not found");
}
