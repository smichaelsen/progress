import { updateCountdown } from './countdown.js';

/**
 * Global variables for configuration
 */
let portfolioIds = [];
let decimals = 0;
let targetValue = 0;
let assumedYearlyReturn = 0;
let monthlyContribution = 0;

/**
 * Sets the configuration values
 * @param {Object} config - Configuration object
 */
export function setConfig(config) {
    if (config.portfolioIds) portfolioIds = config.portfolioIds;
    if (config.decimals !== undefined) decimals = config.decimals;
    if (config.targetValue !== undefined) targetValue = config.targetValue;
    if (config.assumedYearlyReturn !== undefined) assumedYearlyReturn = config.assumedYearlyReturn;
    if (config.monthlyContribution !== undefined) monthlyContribution = config.monthlyContribution;
}

/**
 * Updates the progress bar and countdown based on portfolio values
 */
export function updateProgress() {
    let sum = 0;
    const requests = portfolioIds.map(portfolioId => {
        return fetch('https://api.parqet.com/v1/allocation/assemble', {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                portfolioIds: [
                    portfolioId
                ],
                holdingIds: [],
                currency: 'EUR',
                assetTypes: []
            })
        }).then(response => response.json()).then(data => {
            data.assets.identifier.forEach(asset => {
                sum += asset.value;
            });
        }).catch(error => {
            console.error(error);
        });
    });

    Promise.all(requests).then(() => {
        const progressPercentage = (
            Math.min(100.0, (sum / targetValue) * 100)
        ).toFixed(decimals);

        document.getElementById('progress').value = sum;
        document.getElementById('progress').setAttribute('max', targetValue);
        document.getElementById('percentage').innerText = `${progressPercentage}%`;

        // Calculate time to reach target if assumedYearlyReturn is provided
        if (assumedYearlyReturn > 0 && sum < targetValue) {
            let yearsToTarget;

            if (monthlyContribution <= 0) {
                // If no monthly contribution, use simple compound interest formula
                // Formula: years = ln(target/current) / ln(1 + rate)
                yearsToTarget = Math.log(targetValue / sum) / Math.log(1 + (assumedYearlyReturn / 100));
            } else {
                // With monthly contributions, we need to calculate numerically
                // because there's no simple closed-form formula
                const monthlyRate = assumedYearlyReturn / 100 / 12;
                let currentValue = sum;
                let months = 0;

                // Simulate month by month until we reach the target
                while (currentValue < targetValue && months < 1200) { // Cap at 100 years
                    // Add monthly contribution
                    currentValue += monthlyContribution;
                    // Apply monthly interest
                    currentValue *= (1 + monthlyRate);
                    months++;
                }

                yearsToTarget = months / 12;
            }

            console.log({ yearsToTarget });

            // Store the target date
            const targetDate = new Date();
            targetDate.setFullYear(targetDate.getFullYear() + Math.floor(yearsToTarget));

            // Add the remaining fraction of a year
            const remainingFraction = yearsToTarget - Math.floor(yearsToTarget);
            const millisecondsInYear = 365.25 * 24 * 60 * 60 * 1000;
            targetDate.setTime(targetDate.getTime() + (remainingFraction * millisecondsInYear));

            // Show the countdown element
            document.getElementById('countdown-container').style.display = 'block';

            // Start the countdown
            updateCountdown(targetDate);

            // Update countdown every second
            if (!window.countdownInterval) {
                window.countdownInterval = setInterval(() => updateCountdown(targetDate), 1000);
            }
        } else {
            // Hide the countdown if no yearly return or already reached target
            document.getElementById('countdown-container').style.display = 'none';
            if (window.countdownInterval) {
                clearInterval(window.countdownInterval);
                window.countdownInterval = null;
            }
        }
    });
}
