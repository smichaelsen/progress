// Track whether to show countdown or absolute date
let showAbsoluteDate = false;

/**
 * Updates the countdown display based on the target date
 * @param {Date} targetDate - The date when the target will be reached
 */
export function updateCountdown(targetDate) {
    const now = new Date();
    const difference = targetDate - now;

    if (difference <= 0) {
        document.getElementById('countdown').innerText = 'Target reached!';
        if (window.countdownInterval) {
            clearInterval(window.countdownInterval);
            window.countdownInterval = null;
        }
        return;
    }

    // Format the display text based on the current mode
    let displayText = '';

    if (showAbsoluteDate) {
        // Format the absolute end date/time
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        displayText = targetDate.toLocaleDateString(undefined, options);
    } else {
        // Calculate time components for countdown
        const seconds = Math.floor((difference / 1000) % 60);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const days = Math.floor((difference / (1000 * 60 * 60 * 24)) % 30.4375); // Average days in a month
        const months = Math.floor((difference / (1000 * 60 * 60 * 24 * 30.4375)) % 12);
        const years = Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25));

        // Format the countdown text
        if (years > 0) displayText += `${years} year${years !== 1 ? 's' : ''}, `;
        if (months > 0) displayText += `${months} month${months !== 1 ? 's' : ''}, `;
        if (days > 0) displayText += `${days} day${days !== 1 ? 's' : ''}, `;
        displayText += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    document.getElementById('countdown').innerText = displayText;
}

/**
 * Initialize the countdown click handler
 * This should be called once when the countdown is first displayed
 * @param {Date} targetDate - The date when the target will be reached
 */
export function initCountdownClickHandler(targetDate) {
    const countdownElement = document.getElementById('countdown');

    // Remove any existing click handlers to prevent duplicates
    countdownElement.removeEventListener('click', toggleDisplayMode);

    // Add click handler with the current target date
    countdownElement.addEventListener('click', () => toggleDisplayMode(targetDate));

    // Add cursor pointer to indicate it's clickable
    countdownElement.style.cursor = 'pointer';
}

/**
 * Toggle between showing countdown and absolute date
 * @param {Date} targetDate - The date when the target will be reached
 */
function toggleDisplayMode(targetDate) {
    showAbsoluteDate = !showAbsoluteDate;
    updateCountdown(targetDate);
}
