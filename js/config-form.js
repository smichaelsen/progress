import { fetchParqetPortfolios, fetchPortfolioAllocation } from './api.js';

const IMPORTED_PORTFOLIOS_KEY = 'parqetImportedPortfolios';
const VALIDATION_DELAY_MS = 600;

const form = document.getElementById('config-form');
const portfolioFields = document.getElementById('portfolio-fields');
const btnAddPortfolio = document.getElementById('btn-add-portfolio');
const btnImportPortfolios = document.getElementById('btn-import-portfolios');
const bearerTokenInput = document.getElementById('input-bearer-token');
const importStatus = document.getElementById('import-status');
const progressContainer = document.querySelector('.progress-container');
const countdownContainer = document.getElementById('countdown-container');

function formatEur(value) {
    return value.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getImportedPortfolios() {
    try {
        const raw = sessionStorage.getItem(IMPORTED_PORTFOLIOS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function storeImportedPortfolios(portfolios) {
    sessionStorage.setItem(IMPORTED_PORTFOLIOS_KEY, JSON.stringify(portfolios));
}

function findImportedPortfolio(portfolioId) {
    return getImportedPortfolios().find(portfolio => portfolio.id === portfolioId) || null;
}

function setImportStatus(message, state = '') {
    importStatus.textContent = message;
    importStatus.className = state ? `import-status ${state}` : 'import-status';
}

function renderSubAccounts(row, portfolio) {
    let container = row.querySelector('.subaccounts');

    if (!container) {
        container = document.createElement('div');
        container.className = 'subaccounts';
        row.appendChild(container);
    }

    const selectedValues = row.dataset.selectedSubAccounts
        ? row.dataset.selectedSubAccounts.split(',').filter(Boolean)
        : [];

    if (!portfolio || !Array.isArray(portfolio.subAccounts) || portfolio.subAccounts.length === 0) {
        container.innerHTML = '';
        delete row.dataset.hasImportedSubAccounts;
        return;
    }

    row.dataset.hasImportedSubAccounts = 'true';
    container.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'subaccounts-title';
    title.textContent = `Sub accounts for ${portfolio.name}`;
    container.appendChild(title);

    const options = document.createElement('div');
    options.className = 'subaccounts-options';

    portfolio.subAccounts.forEach(subAccount => {
        const checked = selectedValues.length > 0
            ? selectedValues.includes(subAccount.selectionValue)
            : true;

        const label = document.createElement('label');
        label.className = 'subaccount-option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'subaccount-checkbox';
        checkbox.value = subAccount.selectionValue;
        checkbox.checked = checked;

        const text = document.createElement('span');
        text.textContent = subAccount.name;

        label.appendChild(checkbox);
        label.appendChild(text);
        options.appendChild(label);
    });

    container.appendChild(options);
}

function syncRowPortfolio(row, portfolioId) {
    const portfolio = findImportedPortfolio(portfolioId);
    renderSubAccounts(row, portfolio);
}

async function validatePortfolioId(input, status, row) {
    const portfolioId = input.value.trim();

    if (!portfolioId) {
        status.textContent = '';
        status.className = 'portfolio-status';
        renderSubAccounts(row, null);
        return;
    }

    status.textContent = '...';
    status.className = 'portfolio-status validating';
    syncRowPortfolio(row, portfolioId);

    try {
        const { totalValue } = await fetchPortfolioAllocation(portfolioId);

        if (input.value.trim() === portfolioId) {
            status.innerHTML = `<span class="status-icon valid">&#10003;</span> ${formatEur(totalValue)} EUR`;
            status.className = 'portfolio-status valid';
            syncRowPortfolio(row, portfolioId);
        }
    } catch {
        if (input.value.trim() === portfolioId) {
            status.innerHTML = '<span class="status-icon invalid">&#10007;</span> Portfolio not found';
            status.className = 'portfolio-status invalid';
            renderSubAccounts(row, null);
        }
    }
}

function createPortfolioRow(value = '', removable = false, selectedSubAccounts = []) {
    const row = document.createElement('div');
    row.className = 'portfolio-row';
    row.dataset.selectedSubAccounts = selectedSubAccounts.join(',');

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

    let debounceTimer;
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);

        const portfolioId = input.value.trim();
        row.dataset.selectedSubAccounts = '';
        syncRowPortfolio(row, portfolioId);

        if (!portfolioId) {
            status.textContent = '';
            status.className = 'portfolio-status';
            return;
        }

        status.textContent = '...';
        status.className = 'portfolio-status validating';
        debounceTimer = setTimeout(() => validatePortfolioId(input, status, row), VALIDATION_DELAY_MS);
    });

    if (value) {
        syncRowPortfolio(row, value);
        validatePortfolioId(input, status, row);
    }

    return row;
}

function populateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const importedPortfolios = getImportedPortfolios();
    const portfolioIdParam = params.get('portfolioId');
    const subAccountParam = params.get('subAccount');
    const ids = portfolioIdParam ? portfolioIdParam.split(',').filter(Boolean) : [];
    const selectedSubAccounts = subAccountParam ? subAccountParam.split(',').filter(Boolean) : [];

    portfolioFields.innerHTML = '';
    setImportStatus(importedPortfolios.length > 0 ? `Imported ${importedPortfolios.length} portfolios available in this tab.` : '');

    if (ids.length > 0) {
        ids.forEach((id, index) => {
            const portfolio = findImportedPortfolio(id);
            const rowSelections = portfolio
                ? selectedSubAccounts.filter(value => value.startsWith(`${id}:`))
                : [];
            portfolioFields.appendChild(createPortfolioRow(id, index > 0, rowSelections));
        });
    } else if (importedPortfolios.length > 0) {
        importedPortfolios.forEach((portfolio, index) => {
            portfolioFields.appendChild(createPortfolioRow(portfolio.id, index > 0));
        });
    } else {
        portfolioFields.appendChild(createPortfolioRow('', false));
    }

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

async function importAuthenticatedPortfolios() {
    const bearerToken = bearerTokenInput.value.trim();

    if (!bearerToken) {
        setImportStatus('Paste a bearer token first.', 'error');
        return;
    }

    btnImportPortfolios.disabled = true;
    setImportStatus('Importing portfolios...', 'loading');

    try {
        const portfolios = await fetchParqetPortfolios(bearerToken);
        const publicPortfolios = portfolios.filter(portfolio => portfolio.public);
        storeImportedPortfolios(publicPortfolios);

        portfolioFields.innerHTML = '';
        publicPortfolios.forEach((portfolio, index) => {
            portfolioFields.appendChild(createPortfolioRow(portfolio.id, index > 0));
        });

        if (publicPortfolios.length === 0) {
            portfolioFields.appendChild(createPortfolioRow('', false));
        }

        const subAccountCount = publicPortfolios.reduce((sum, portfolio) => sum + portfolio.subAccounts.length, 0);
        const privateCount = portfolios.length - publicPortfolios.length;
        const privateNote = privateCount > 0 ? ` Skipped ${privateCount} private portfolios.` : '';
        setImportStatus(`Imported ${publicPortfolios.length} public portfolios and ${subAccountCount} sub accounts.${privateNote}`, 'success');
    } catch (error) {
        setImportStatus(error.message || 'Portfolio import failed.', 'error');
    } finally {
        btnImportPortfolios.disabled = false;
    }
}

export function showForm() {
    populateFromUrl();
    progressContainer.style.display = 'none';
    countdownContainer.style.display = 'none';
    form.style.display = 'block';

    const firstInput = form.querySelector('input');
    if (firstInput) firstInput.focus();
}

export function initConfigForm() {
    btnAddPortfolio.addEventListener('click', () => {
        portfolioFields.appendChild(createPortfolioRow('', true));
        const inputs = portfolioFields.querySelectorAll('.portfolio-input');
        inputs[inputs.length - 1].focus();
    });

    btnImportPortfolios.addEventListener('click', importAuthenticatedPortfolios);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const params = new URLSearchParams();
        const ids = [];
        const subAccounts = [];

        const rows = portfolioFields.querySelectorAll('.portfolio-row');
        rows.forEach(row => {
            const input = row.querySelector('.portfolio-input');
            const portfolioId = input.value.trim();

            if (!portfolioId) {
                return;
            }

            const checkboxes = row.querySelectorAll('.subaccount-checkbox');
            if (checkboxes.length > 0) {
                const selected = Array.from(checkboxes)
                    .filter(checkbox => checkbox.checked)
                    .map(checkbox => checkbox.value);

                if (selected.length === 0) {
                    return;
                }

                ids.push(portfolioId);
                subAccounts.push(...selected);
                return;
            }

            ids.push(portfolioId);
        });

        if (ids.length > 0) {
            params.set('portfolioId', ids.join(','));
        }

        if (subAccounts.length > 0) {
            params.set('subAccount', subAccounts.join(','));
        }

        const targetValue = document.getElementById('input-target-value').value.trim();
        if (targetValue) {
            params.set('targetValue', targetValue);
        }

        const yearlyReturn = document.getElementById('input-yearly-return').value.trim().replace(',', '.');
        if (yearlyReturn) {
            params.set('assumedYearlyReturn', yearlyReturn);
        }

        const monthlyContribution = document.getElementById('input-monthly-contribution').value.trim();
        if (monthlyContribution) {
            params.set('monthlyContribution', monthlyContribution);
        }

        window.location.search = params.toString();
    });
}
