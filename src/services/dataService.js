import Papa from 'papaparse';

// Cache for manuscript data to avoid reloading
let manuscriptCache = null;
const locationChunkCache = {};

/**
 * Load the main manuscript metadata CSV file
 */
export const loadManuscriptData = async () => {
  // Return cached data if available
  if (manuscriptCache) {
    return manuscriptCache;
  }

  try {
    const response = await fetch('/data/manuscript_metadata.csv');
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        transform: value => value.trim(),
        complete: (results) => {
          // Process the data to parse JSON columns
          const processedData = results.data.map(row => ({
            ...row,
            categories: JSON.parse(row.categories || '[]'),
            titles: JSON.parse(row.titles || '[]'),
            shuhras: JSON.parse(row.shuhras || '[]')
          }));
          
          // Cache the data
          manuscriptCache = processedData;
          resolve(processedData);
        },
        error: (error) => {
          console.error('Error parsing manuscript CSV:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error loading manuscript data:', error);
    throw error;
  }
};

/**
 * Get location data for a specific manuscript ID
 */
export const getManuscriptLocations = async (manuscriptId) => {
  // Log for debugging
  console.log(`Looking up locations for manuscript: ${manuscriptId}`);
  
  try {
    // Determine which chunk file should contain this ID
    const chunkNumber = getChunkNumberForId(manuscriptId);
    console.log(`Determined chunk number: ${chunkNumber}`);
    
    // Load the chunk if not already cached
    if (!locationChunkCache[chunkNumber]) {
      console.log(`Loading chunk ${chunkNumber} - not in cache`);
      await loadLocationChunk(chunkNumber);
    } else {
      console.log(`Using cached chunk ${chunkNumber} with ${locationChunkCache[chunkNumber].length} entries`);
    }
    
    // Normalize the incoming ID for comparison (trim and lowercase)
    const normalizedId = manuscriptId.trim();
    
    // Find the manuscript in the cached chunk with flexible matching
    const manuscriptData = locationChunkCache[chunkNumber]?.find(item => {
      // Check for exact match first
      if (item.unique_id === normalizedId) return true;
      
      // If it has a prefix like "MS" but the stored ID doesn't, try matching just the numeric part
      const numericIdPattern = /\d+/;
      const numericSearchId = normalizedId.match(numericIdPattern)?.[0];
      const numericStoredId = item.unique_id.match(numericIdPattern)?.[0];
      
      return numericSearchId && numericStoredId && numericSearchId === numericStoredId;
    });
    
    if (manuscriptData) {
      console.log(`Found manuscript data with ID ${manuscriptData.unique_id} in chunk ${chunkNumber}`);
      return manuscriptData.ms_locations;
    } else {
      console.log(`No manuscript data found for ID ${manuscriptId} in chunk ${chunkNumber}`);
      return [];
    }
  } catch (error) {
    console.error(`Error retrieving manuscript locations for ID ${manuscriptId}:`, error);
    return [];
  }
};

/**
 * Load a specific location chunk file
 */
const loadLocationChunk = async (chunkNumber) => {
  try {
    console.log(`Attempting to fetch chunk file: /data/chunks/locations_${chunkNumber}.csv`);
    const response = await fetch(`/data/chunks/locations_${chunkNumber}.csv`);
    
    if (!response.ok) {
      console.warn(`Chunk file ${chunkNumber} not found or server error (${response.status}). Creating empty cache entry.`);
      locationChunkCache[chunkNumber] = [];
      return [];
    }
    
    const csvText = await response.text();
    console.log(`Loaded chunk file ${chunkNumber}, content length: ${csvText.length} bytes`);
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        complete: (results) => {
          console.log(`Parsed chunk ${chunkNumber} with ${results.data.length} entries`);
          
          // Process the data to parse JSON in ms_locations column
          const processedData = results.data.map(row => {
            try {
              return {
                unique_id: row.unique_id.trim(),
                ms_locations: JSON.parse(row.ms_locations || '[]')
              };
            } catch (error) {
              console.error(`Error parsing ms_locations for ID ${row.unique_id}:`, error);
              return {
                unique_id: row.unique_id.trim(),
                ms_locations: []
              };
            }
          });
          
          // Cache the chunk
          locationChunkCache[chunkNumber] = processedData;
          resolve(processedData);
        },
        error: (error) => {
          console.error(`Error parsing location chunk ${chunkNumber}:`, error);
          // Create an empty cache entry on error
          locationChunkCache[chunkNumber] = [];
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error loading location chunk ${chunkNumber}:`, error);
    // Create an empty cache entry on error
    locationChunkCache[chunkNumber] = [];
    throw error;
  }
};

/**
 * Determine which chunk file would contain a specific manuscript ID
 * This function should match the chunking logic in the Python script
 */
const getChunkNumberForId = (manuscriptId) => {
  // This is a simplified approach that assumes IDs are sequential
  // and the chunk size is 1000 as in the Python script
  const CHUNK_SIZE = 1000;
  
  // Extract numeric part from the ID (also handle Arabic numerals)
  const arabicToEnglishStr = arabicToEnglishDigits(manuscriptId);
  const numericMatch = arabicToEnglishStr.match(/\d+/);
  const idNumber = numericMatch ? parseInt(numericMatch[0], 10) : 0;
  
  const chunkNum = Math.floor(idNumber / CHUNK_SIZE) + 1;
  return chunkNum;
};

/**
 * Convert Arabic numerals to English numerals
 * For example: ١٠٥٤ -> 1054
 */
const arabicToEnglishDigits = (str) => {
  if (!str) return str;
  
  // Map Arabic numerals to English equivalents
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  
  // Replace each Arabic digit with its English equivalent
  arabicDigits.forEach((digit, index) => {
    result = result.replace(new RegExp(digit, 'g'), index);
  });
  
  return result;
};

/**
 * Extract numeric value from a string (for date comparison)
 * For example: "١٠٥٤هـ" -> 1054
 */
export const extractNumericValue = (str) => {
  if (!str) return null;
  
  // First convert any Arabic numerals to English
  const englishStr = arabicToEnglishDigits(str);
  
  // Remove any non-digit characters (like هـ, /, -, etc.)
  const numericStr = englishStr.replace(/\D/g, '');
  
  // Parse the numeric value
  const numericValue = parseInt(numericStr, 10);
  return isNaN(numericValue) ? null : numericValue;
};

/**
 * Check if a date is within a specified range
 */
const isDateInRange = (date, min, max) => {
  // If date is empty/null and only max date is provided, include it in results
  if (!date || date.trim() === '') {
    return !min || min.trim() === '';
  }
  
  // Extract numeric value from date string
  const dateValue = extractNumericValue(date);
  if (dateValue === null) return false;
  
  // Check min bound if provided
  if (min && min.trim() !== '') {
    const minValue = extractNumericValue(min);
    if (minValue !== null && dateValue < minValue) {
      return false;
    }
  }
  
  // Check max bound if provided
  if (max && max.trim() !== '') {
    const maxValue = extractNumericValue(max);
    if (maxValue !== null && dateValue > maxValue) {
      return false;
    }
  }
  
  return true;
};

/**
 * Search and filter manuscripts
 */
export const searchManuscripts = async (searchTerm, searchFields = [], filterCriteria = {}) => {
  // Load all manuscript data
  const allManuscripts = await loadManuscriptData();
  
  // If no search term and no filters, return all data
  if (!searchTerm && Object.keys(filterCriteria).length === 0) {
    return allManuscripts;
  }
  
  return allManuscripts.filter(manuscript => {
    // Text search logic
    if (searchTerm && searchTerm.trim() !== '') {
      // Search in specific fields if provided
      if (searchFields && searchFields.length > 0) {
        const matchesSearchFields = searchFields.some(field => {
          // Array fields (categories, titles, shuhras)
          if (Array.isArray(manuscript[field])) {
            return manuscript[field].some(value => 
              value.toLowerCase().includes(searchTerm.toLowerCase())
            );
          } 
          // Text fields
          else if (manuscript[field]) {
            return manuscript[field].toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        });
        
        if (!matchesSearchFields) return false;
      } 
      // Search in all fields if no specific fields provided
      else {
        const textFields = ['unique_id', 'author', 'death_date', 'century'];
        const arrayFields = ['categories', 'titles', 'shuhras'];
        
        const matchesTextField = textFields.some(field => 
          manuscript[field] && manuscript[field].toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const matchesArrayField = arrayFields.some(field => 
          Array.isArray(manuscript[field]) && manuscript[field].some(value => 
            value.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
        
        if (!matchesTextField && !matchesArrayField) return false;
      }
    }
    
    // Apply filters
    for (const [field, value] of Object.entries(filterCriteria)) {
      // Skip empty filters
      if (!value || (typeof value === 'object' && Object.values(value).every(v => !v))) {
        continue;
      }
      
      // Special handling for date range
      if (field === 'death_date_range') {
        const { min, max } = value;
        if ((min && min.trim() !== '') || (max && max.trim() !== '')) {
          if (!isDateInRange(manuscript.death_date, min, max)) {
            return false;
          }
        }
      }
      // Category filter
      else if (field === 'categories') {
        if (!manuscript.categories.includes(value)) {
          return false;
        }
      }
      // Century filter
      else if (field === 'century') {
        if (manuscript.century !== value) {
          return false;
        }
      }
      // Title filter
      else if (field === 'titles') {
        if (!manuscript.titles.some(title => title.includes(value))) {
          return false;
        }
      }
      // Shuhras filter
      else if (field === 'shuhras') {
        if (!manuscript.shuhras.some(shuhra => shuhra.includes(value))) {
          return false;
        }
      }
      // Death date exact search
      else if (field === 'death_date') {
        if (!manuscript.death_date || !manuscript.death_date.includes(value)) {
          return false;
        }
      }
      // Author filter
      else if (field === 'author') {
        if (!manuscript.author || !manuscript.author.includes(value)) {
          return false;
        }
      }
      // ID filter
      else if (field === 'unique_id') {
        if (!manuscript.unique_id || !manuscript.unique_id.includes(value)) {
          return false;
        }
      }
    }
    
    // Manuscript passed all filters
    return true;
  });
};

/**
 * Get unique values for a field to populate filter dropdowns
 */
export const getUniqueFieldValues = async (field) => {
  const allManuscripts = await loadManuscriptData();
  const uniqueValues = new Set();
  
  allManuscripts.forEach(manuscript => {
    if (Array.isArray(manuscript[field])) {
      manuscript[field].forEach(value => {
        if (value && value.trim() !== '') {
          uniqueValues.add(value);
        }
      });
    } else if (manuscript[field] && manuscript[field].trim() !== '') {
      uniqueValues.add(manuscript[field]);
    }
  });
  
  return Array.from(uniqueValues).sort();
};