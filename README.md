# متصفح المخطوطات العربية (Arabic Manuscript Browser)

This application allows you to browse, search, and filter a large collection of Arabic manuscript metadata. The application is designed to efficiently handle a large dataset by splitting it into manageable chunks.

## Project Structure

The project consists of two main parts:

1. **Data Processing Script**: Python script to process the original 50MB JSON file into more manageable CSV files.
2. **React Application**: Web interface for browsing and searching the manuscript data.

## Data Processing

The Python script (`data-processing-script.py`) processes the original JSON data by:

1. Extracting manuscript metadata from each page in the volumes
2. Creating a main CSV file with manuscript details
3. Creating chunked CSV files for manuscript locations based on ID ranges

## React Application Features

- **Main Manuscript Browser**:
  - Display manuscript data in a sortable, paginated table
  - Search across all fields or limit to specific fields
  - Filter by categories, century, death date, etc.
  - Navigate to detailed view by clicking on a manuscript

- **Manuscript Details View**:
  - Display complete information about a single manuscript
  - Show all locations where the manuscript is available
  - Easy navigation back to the main browser

## Getting Started

### Prerequisites

- Node.js (v14+)
- Python 3.6+
- Original manuscript data JSON file

### Data Processing

1. Place your original JSON file in the root directory and name it `manuscript_data.json`
2. Run the Python script:
   ```
   python data-processing-script.py
   ```
3. This will create the processed CSV files in the `output` directory

### Running the React App

1. Install dependencies:
   ```
   cd manuscript-browser
   npm install
   ```

2. Copy the processed data to the public directory:
   ```
   mkdir -p public/data/chunks
   cp ../output/manuscript_metadata.csv public/data/
   cp ../output/chunks/* public/data/chunks/
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Access the application at http://localhost:3000

## Deployment

To deploy this application as a static site:

1. Build the React application:
   ```
   npm run build
   ```

2. Copy the build directory to your web server
3. Ensure the data files are accessible in the `data` directory

## Performance Considerations

- The application uses chunking to handle the large dataset efficiently
- Data is loaded lazily - location data is only loaded when needed
- Caching is implemented to prevent reloading data unnecessarily
- Heavy operations like search and filtering are optimized for performance

## Future Improvements

- Add export functionality for search results
- Implement advanced statistical analysis of the manuscript collection
- Add visualization features (charts, maps) for the manuscript data
- Improve mobile responsiveness
- Add support for offline browsing