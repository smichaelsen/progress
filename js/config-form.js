import { fetchPortfolioAllocation } from './api.js';

const form = document.getElementById('config-form');
const portfolioFields = document.getElementById('portfolio-fields');
const btnAddPortfolio = document.getElementById('btn-add-portfolio');
const progressContainer = document.querySelector('.progress-container');
const countdownContainer = document.getElementById('countdown-container');

/** Debounce delay in milliseconds before validating a portfolio ID */
const VALIDATION_DELAY_MS = 600;

/**
 * Validates a portfolio ID by querying the API and updates the status indicator.
 * @param {HTMLInputElement} input - The input element containing the portfolio ID
 * @param {HTMLElement} status - The status indicator element
 */
async function validatePortfolioId(input, status) {
    const portfolioId = input.value.trim();

    if (!portfolioId) {
        status.textContent = '';
        status.className = 'portfolio-status';
        return;
    }

    status.textContent = '...';
    status.className = 'portfolio-status validating';

    try {
        const { totalValue } = await fetchPortfolioAllocation(portfolioId);
        // Only update if the input value hasn't changed during the request
        if (input.value.trim() === portfolioId) {
            const formatted = totalValue.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            status.innerHTML = `<span class="status-icon valid">&#10003;</span> ${formatted} EUR`;
            status.className = 'portfolio-status valid';
        }
    } catch {
        if (input.value.trim() === portfolioId) {
            status.innerHTML = `<span class="status-icon invalid">&#10007;</span> Portfolio not found`;
            status.className = 'portfolio-status invalid';
        }
    }
}

/**
 * Creates a portfolio ID input row.
 * @param {string} value - Initial value for the input
 * @param {boolean} removable - Whether the row should have a remove button
 * @returns {HTMLElement} The portfolio row element
 */
function createPortfolioRow(value = '', removable = false) {
    const row = document.createElement('div');
    row.className = 'portfolio-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Portfolio ID';
    input.value = value;
    input.className = 'portfolio-input';
    row.appendChild(input);

    if (removable) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-remove';
        btn.textContent = 'Remove';
        btn.addEventListener('click', () => row.remove());
        row.appendChild(btn);
    }

    const status = document.createElement('span');
    status.className = 'portfolio-status';
    row.appendChild(status);

    // Debounced validation on input
    let debounceTimer;
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const id = input.value.trim();
        if (!id) {
            status.textContent = '';
            status.className = 'portfolio-status';
            return;
        }
        status.textContent = '...';
        status.className = 'portfolio-status validating';
        debounceTimer = setTimeout(() => validatePortfolioId(input, status), VALIDATION_DELAY_MS);
    });

    // Validate immediately if pre-filled
    if (value) {
        validatePortfolioId(input, status);
    }

    return row;
}

/**
 * Populates the form fields from current URL parameters.
 */
function populateFromUrl() {
    const params = new URLSearchParams(window.location.search);

    // Clear existing portfolio rows
    portfolioFields.innerHTML = '';

    // Portfolio IDs
    const portfolioIdParam = params.get('portfolioId');
    const ids = portfolioIdParam ? portfolioIdParam.split(',').filter(Boolean) : [];

    if (ids.length === 0) {
        // Always show at least one field
        portfolioFields.appendChild(createPortfolioRow('', false));
    } else {
        ids.forEach((id, index) => {
            portfolioFields.appendChild(createPortfolioRow(id, index > 0));
        });
    }

    // Other fields
    const targetValue = params.get('targetValue');
    if (targetValue) {
        document.getElementById('input-target-value').value = targetValue;
    }

    const yearlyReturn = params.get('assumedYearlyReturn');
    if (yearlyReturn) {
        document.getElementById('input-yearly-return').value = yearlyReturn;
    }

    const monthlyContribution = params.get('monthlyContribution');
    if (monthlyContribution) {
        document.getElementById('input-monthly-contribution').value = monthlyContribution;
    }
}

/**
 * Shows the configuration form, hiding the progress display.
 */
export function showForm() {
    populateFromUrl();
    progressContainer.style.display = 'none';
    countdownContainer.style.display = 'none';
    form.style.display = 'block';

    // Focus the first input
    const firstInput = form.querySelector('input');
    if (firstInput) firstInput.focus();
}

/**
 * Initializes the configuration form event handlers.
 */
export function initConfigForm() {
    // Add portfolio button
    btnAddPortfolio.addEventListener('click', () => {
        portfolioFields.appendChild(createPortfolioRow('', true));
        const inputs = portfolioFields.querySelectorAll('input');
        inputs[inputs.length - 1].focus();
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const params = new URLSearchParams();

        // Collect portfolio IDs
        const inputs = portfolioFields.querySelectorAll('.portfolio-input');
        const ids = Array.from(inputs)
            .map(input => input.value.trim())
            .filter(Boolean);

        if (ids.length > 0) {
            params.set('portfolioId', ids.join(','));
        }

        // Target value
        const targetValue = document.getElementById('input-target-value').value.trim();
        if (targetValue) {
            params.set('targetValue', targetValue);
        }

        // Assumed yearly return — convert comma to dot
        const yearlyReturn = document.getElementById('input-yearly-return').value.trim().replace(',', '.');
        if (yearlyReturn) {
            params.set('assumedYearlyReturn', yearlyReturn);
        }

        // Monthly contribution
        const monthlyContribution = document.getElementById('input-monthly-contribution').value.trim();
        if (monthlyContribution) {
            params.set('monthlyContribution', monthlyContribution);
        }

        // Navigate to the new URL with parameters, which triggers a full reload
        window.location.search = params.toString();
    });
}
