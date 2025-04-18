# 3D City Viewer Backend

This is the Flask backend for the 3D City Viewer application, providing LLM integration with Google's Gemini 2.5 Pro.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file:
   ```
   cp .env.example .env
   ```

5. Add your Gemini API key to the `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Running the Server

Start the Flask server:
```
python app.py
```

The server will run on `http://localhost:5000`.

## API Endpoints

### Building Summary

**Endpoint:** `/api/summary`
**Method:** POST
**Description:** Generates a summary for a building using Gemini 2.5 Pro

**Request Body:**
```json
{
  "building_data": {
    "id": "123456",
    "name": "Example Building",
    "type": "commercial",
    "levels": "15",
    "height": "60",
    "amenity": "restaurant",
    "shop": "convenience",
    "office": "company",
    "year_built": "2005",
    "material": "glass",
    "roof_shape": "flat"
  }
}
```

**Response:**
```json
{
  "summary": "Example Building is a 15-story commercial building...",
  "constructionCost": "$45 million (estimated)",
  "buildingType": "Commercial",
  "urbanSignificance": "This building contributes to Calgary's urban landscape..."
}
```

### General Query

**Endpoint:** `/api/query`
**Method:** POST
**Description:** Processes a general query about buildings or urban planning

**Request Body:**
```json
{
  "query": "What are the tallest buildings in Calgary?",
  "context": {
    "location": "Calgary",
    "topic": "urban architecture"
  }
}
```

**Response:**
```json
{
  "response": "Calgary's skyline is dominated by several tall buildings...",
  "sources": [
    "Calgary Tower Association",
    "Skyscraper Center Database"
  ]
}
```
