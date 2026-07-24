/**
 * Companies whose public Greenhouse job board we search. Greenhouse has no
 * single "all companies" endpoint — each board is fetched separately via
 * https://boards-api.greenhouse.io/v1/boards/{token}/jobs — so this list is
 * the entire universe of jobs the matcher can find. `token` is verified
 * against the live API; add more by confirming the same URL pattern returns
 * a `jobs` array for that company before adding it here.
 */
export interface GreenhouseCompany {
    name: string;
    token: string;
}

export const GREENHOUSE_COMPANIES: GreenhouseCompany[] = [
    { name: 'Airbnb', token: 'airbnb' },
    { name: 'Stripe', token: 'stripe' },
    { name: 'Robinhood', token: 'robinhood' },
    { name: 'Pinterest', token: 'pinterest' },
    { name: 'Reddit', token: 'reddit' },
    { name: 'Coinbase', token: 'coinbase' },
    { name: 'Discord', token: 'discord' },
    { name: 'Figma', token: 'figma' },
    { name: 'GitLab', token: 'gitlab' },
];
