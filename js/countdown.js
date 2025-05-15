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

    // Calculate time components
    const seconds = Math.floor((difference / 1000) % 60);
    const minutes = Math.floor((difference / (1000 * 60)) % 60);
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const days = Math.floor((difference / (1000 * 60 * 60 * 24)) % 30.4375); // Average days in a month
    const months = Math.floor((difference / (1000 * 60 * 60 * 24 * 30.4375)) % 12);
    const years = Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25));

    // Format the countdown text
    let countdownText = '';
    if (years > 0) countdownText += `${years} year${years !== 1 ? 's' : ''}, `;
    if (months > 0) countdownText += `${months} month${months !== 1 ? 's' : ''}, `;
    if (days > 0) countdownText += `${days} day${days !== 1 ? 's' : ''}, `;
    countdownText += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    document.getElementById('countdown').innerText = countdownText;
}