/**
 * Fetches allocation data for a single portfolio from the Parqet API.
 * @param {string} portfolioId - The portfolio ID to query
 * @param {string[]} subAccounts - Optional sub-account filters
 * @returns {Promise<{totalValue: number}>} The total value of all assets
 * @throws {Error} If the API request fails or returns unexpected data
 */
export async function fetchPortfolioAllocation(portfolioId, subAccounts = []) {
    const response = await fetch('https://api.parqet.com/v1/allocation/assemble', {
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            portfolioIds: [portfolioId],
            subAccounts,
            holdingIds: [],
            currency: 'EUR',
            assetTypes: []
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const assets = data?.assets?.identifier;

    if (!Array.isArray(assets)) {
        throw new Error('Unexpected response structure');
    }

    let totalValue = 0;
    assets.forEach(asset => {
        totalValue += asset.value;
    });

    return { totalValue };
}

/**
 * Fetches authenticated portfolio metadata including sub-accounts.
 * @param {string} bearerToken - Parqet bearer token
 * @returns {Promise<Array<Object>>} Simplified portfolio list
 * @throws {Error} If the API request fails
 */
export async function fetchParqetPortfolios(bearerToken) {
    const response = await fetch('https://api.parqet.com/v1/portfolios', {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Authorization': `Bearer ${bearerToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Portfolio import failed: ${response.status} ${response.statusText}`);
    }

    const portfolios = await response.json();

    if (!Array.isArray(portfolios)) {
        throw new Error('Unexpected portfolio response structure');
    }

    return portfolios.map(portfolio => ({
        id: portfolio._id,
        name: portfolio.name,
        public: portfolio.public,
        subAccounts: Array.isArray(portfolio.subAccounts)
            ? portfolio.subAccounts.map(subAccount => ({
                name: subAccount.name,
                hashedAccountNumber: subAccount.hashedAccountNumber,
                selectionValue: `${portfolio._id}:${subAccount.hashedAccountNumber ?? 'null'}`
            }))
            : []
    }));
}
