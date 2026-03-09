import { startCountdown, stopCountdown, MS_PER_YEAR } from './countdown.js';
import { fetchPortfolioAllocation } from './api.js';

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
        return fetchPortfolioAllocation(portfolioId).then(({ totalValue }) => {
            sum += totalValue;
        }).catch(error => {
            console.error(`Failed to fetch portfolio ${portfolioId}:`, error);
        });
    });

    Promise.all(requests).catch(error => {
        console.error('Failed to fetch portfolio data:', error);
    }).then(() => {
        const progressPercentage = (
            Math.min(100.0, (sum / targetValue) * 100)
        ).toFixed(decimals);

        const progressElement = document.getElementById('progress');
        progressElement.value = sum;
        progressElement.max = targetValue;
        document.getElementById('percentage').innerText = `${progressPercentage}%`;

        // Calculate time to reach target if assumedYearlyReturn is provided
        if (assumedYearlyReturn > 0 && sum > 0 && sum < targetValue) {
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

                // Calculate more precise fraction of the last month
                if (currentValue > targetValue && months > 0) {
                    // Back up one month to get the value before exceeding target
                    const previousValue = currentValue / (1 + monthlyRate) - monthlyContribution;

                    // Calculate how much we need to grow from previousValue to reach targetValue
                    const remainingGrowth = targetValue - previousValue;

                    // Calculate what fraction of a month is needed for this growth
                    // This considers both the monthly contribution and the interest
                    const valueAfterContribution = previousValue + monthlyContribution;
                    const interestNeeded = targetValue - valueAfterContribution;

                    if (interestNeeded > 0) {
                        // If we still need growth after the contribution
                        const interestRate = valueAfterContribution * monthlyRate;
                        const fractionOfMonth = interestNeeded / interestRate;

                        // Adjust the months count (subtract 1 for the last month we backed up, add the fraction)
                        months = months - 1 + Math.min(1, Math.max(0, fractionOfMonth));
                    } else {
                        // If the contribution alone exceeds what we need
                        const fractionOfMonth = remainingGrowth / monthlyContribution;
                        months = months - 1 + Math.min(1, Math.max(0, fractionOfMonth));
                    }
                }

                yearsToTarget = months / 12;
            }

            // Calculate the target date
            const targetDate = new Date(Date.now() + yearsToTarget * MS_PER_YEAR);

            // Show the countdown element and start ticking
            document.getElementById('countdown-container').style.display = 'block';
            startCountdown(targetDate);
        } else {
            // Hide the countdown if no yearly return or already reached target
            document.getElementById('countdown-container').style.display = 'none';
            stopCountdown();
        }
    });
}
