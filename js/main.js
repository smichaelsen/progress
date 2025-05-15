import { setConfig, updateProgress } from './progress.js';

/**
 * Initialize application by parsing URL parameters and starting the progress update
 */
function initApp() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Parse portfolio IDs
    const portfolioIdParam = urlParams.get('portfolioId');
    const portfolioIds = portfolioIdParam ? portfolioIdParam.split(',') : [];

    // Parse decimals (0 to 3)
    const decimalsParam = parseInt(urlParams.get('decimals'));
    const decimals = Math.min(Math.max(isNaN(decimalsParam) ? 0 : decimalsParam, 0), 3);

    // Parse target value (10 to 1 trillion)
    const targetValueParam = parseInt(urlParams.get('targetValue'));
    const targetValue = Math.min(Math.max(isNaN(targetValueParam) ? 0 : targetValueParam, 10), 1000*1000*1000*1000);

    // Parse assumed yearly return (default to 0)
    const assumedYearlyReturnParam = parseFloat(urlParams.get('assumedYearlyReturn'));
    const assumedYearlyReturn = isNaN(assumedYearlyReturnParam) ? 0 : assumedYearlyReturnParam;

    // Parse monthly contribution (default to 0)
    const monthlyContributionParam = parseFloat(urlParams.get('monthlyContribution'));
    const monthlyContribution = isNaN(monthlyContributionParam) ? 0 : monthlyContributionParam;

    // Set configuration values
    setConfig({
        portfolioIds,
        decimals,
        targetValue,
        assumedYearlyReturn,
        monthlyContribution
    });

    // Start the progress update
    updateProgress();

    // Update hourly
    setInterval(updateProgress, 3600000);
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);
