// No data is loaded here — `render: null` marks this route as client-rendered so
// the header badge flips to "CSR". The page fetches everything in the browser.
export const loader = () => ({ render: null });
