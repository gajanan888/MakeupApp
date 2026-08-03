/**
 * Location Helper Utility
 * Handles robust city & location matching between customers and artists.
 */

/**
 * Extracts a display city name from a full location/address string.
 */
export const getCleanCityName = (locString) => {
  if (!locString) return '';
  const str = String(locString).trim();
  if (!str) return '';
  
  // If string contains commas, extract the city token or first token
  const parts = str.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) return parts[0];

  // Look for known major city names in the parts
  const knownCities = [
    'Pune', 'Mumbai', 'Delhi', 'New Delhi', 'Bangalore', 'Bengaluru',
    'Hyderabad', 'Kolkata', 'Chennai', 'Ahmedabad', 'Surat', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
    'Pimpri-Chinchwad', 'PCMC', 'Noida', 'Gurgaon', 'Gurugram', 'Ghaziabad',
  ];

  for (const part of parts) {
    for (const kc of knownCities) {
      if (part.toLowerCase().includes(kc.toLowerCase())) {
        return kc;
      }
    }
  }

  // Fallback to the first or second part if no known city matched
  return parts[0];
};

/**
 * Robustly checks if a customer's location/city matches an artist's location/city.
 * Handles sub-areas, metro regions, partial text matches, and missing location fields.
 */
export const isLocationMatch = (customerLocOrCity, artistLocOrCity) => {
  // If either location is missing or empty, allow booking (do not block)
  if (!customerLocOrCity || !artistLocOrCity) return true;

  const custLower = String(customerLocOrCity).toLowerCase().trim();
  const artLower = String(artistLocOrCity).toLowerCase().trim();

  if (!custLower || !artLower) return true;

  // 1. Direct equality or substring match
  if (custLower === artLower || custLower.includes(artLower) || artLower.includes(custLower)) {
    return true;
  }

  // 2. Tokenized word overlap (e.g. "Kothrud, Pune" vs "Pune, Maharashtra")
  const getTokens = (s) =>
    s.split(/[\s,.-]+/).map((t) => t.trim()).filter((t) => t.length > 2);

  const custTokens = getTokens(custLower);
  const artTokens = getTokens(artLower);

  const hasOverlap = custTokens.some((ct) =>
    artTokens.some((at) => ct === at || ct.includes(at) || at.includes(ct))
  );
  if (hasOverlap) return true;

  // 3. Metro Region Aliases (e.g. Pune & PCMC/Haveli/Kothrud; Mumbai & Thane/Navi Mumbai; Delhi & Gurgaon/Noida)
  const metroGroups = [
    ['pune', 'pcmc', 'pimpri', 'chinchwad', 'haveli', 'kothrud', 'baner', 'wakad', 'viman nagar', 'hinjewadi', 'hadapsar', 'katraj'],
    ['mumbai', 'navi mumbai', 'thane', 'andheri', 'bandra', 'borivali', 'dadar', 'juhu', 'powai', 'kurla', 'chembur'],
    ['delhi', 'new delhi', 'noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad', 'ncr'],
    ['bangalore', 'bengaluru', 'whitefield', 'koramangala', 'indiranagar'],
    ['hyderabad', 'secunderabad', 'hitech city', 'gachibowli'],
    ['kolkata', 'calcutta', 'howrah', 'salt lake'],
    ['chennai', 'madras']
  ];

  for (const group of metroGroups) {
    const custInGroup = group.some((g) => custLower.includes(g));
    const artInGroup = group.some((g) => artLower.includes(g));
    if (custInGroup && artInGroup) {
      return true;
    }
  }

  return false;
};
