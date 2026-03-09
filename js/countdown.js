// Time constants
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const AVG_DAYS_PER_MONTH = 30.4375;
const AVG_DAYS_PER_YEAR = 365.25;

export const MS_PER_YEAR = MS_PER_DAY * AVG_DAYS_PER_YEAR;

// Module state
let showAbsoluteDate = false;
let currentClickHandler = null;
let countdownInterval = null;

/**
 * Starts the countdown interval, replacing any existing one.
 * @param {Date} targetDate - The date when the target will be reached
 */
export function startCountdown(targetDate) {
    stopCountdown();
    updateCountdown(targetDate);
    initCountdownClickHandler(targetDate);
    countdownInterval = setInterval(() => updateCountdown(targetDate), MS_PER_SECOND);
}

/**
 * Stops and clears the countdown interval.
 */
export function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

/**
 * Updates the countdown display based on the target date
 * @param {Date} targetDate - The date when the target will be reached
 */
function updateCountdown(targetDate) {
    const countdownElement = document.getElementById('countdown');
    const now = new Date();
    const difference = targetDate - now;

    if (difference <= 0) {
        countdownElement.innerText = 'Target reached!';
        stopCountdown();
        return;
    }

    if (showAbsoluteDate) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        countdownElement.innerText = targetDate.toLocaleDateString(undefined, options);
    } else {
        const years = Math.floor(difference / (MS_PER_DAY * AVG_DAYS_PER_YEAR));
        const months = Math.floor((difference / (MS_PER_DAY * AVG_DAYS_PER_MONTH)) % 12);
        const days = Math.floor((difference / MS_PER_DAY) % AVG_DAYS_PER_MONTH);
        const hours = Math.floor((difference / MS_PER_HOUR) % 24);
        const minutes = Math.floor((difference / MS_PER_MINUTE) % 60);
        const seconds = Math.floor((difference / MS_PER_SECOND) % 60);

        let displayText = '';
        if (years > 0) displayText += `${years} year${years !== 1 ? 's' : ''}, `;
        if (months > 0) displayText += `${months} month${months !== 1 ? 's' : ''}, `;
        if (days > 0) displayText += `${days} day${days !== 1 ? 's' : ''}, `;
        displayText += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        countdownElement.innerText = displayText;
    }
}

/**
 * Initialize the countdown click handler
 * @param {Date} targetDate - The date when the target will be reached
 */
function initCountdownClickHandler(targetDate) {
    const countdownElement = document.getElementById('countdown');

    if (currentClickHandler) {
        countdownElement.removeEventListener('click', currentClickHandler);
    }

    currentClickHandler = () => {
        showAbsoluteDate = !showAbsoluteDate;
        updateCountdown(targetDate);
    };
    countdownElement.addEventListener('click', currentClickHandler);
    countdownElement.style.cursor = 'pointer';
}
