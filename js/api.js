/**
 * Fetches allocation data for a single portfolio from the Parqet API.
 * @param {string} portfolioId - The portfolio ID to query
 * @returns {Promise<{totalValue: number}>} The total value of all assets
 * @throws {Error} If the API request fails or returns unexpected data
 */
export async function fetchPortfolioAllocation(portfolioId) {
    const response = await fetch('https://api.parqet.com/v1/allocation/assemble', {
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            portfolioIds: [portfolioId],
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
