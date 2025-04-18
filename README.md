# Urban Design 3D City Dashboard with LLM Querying

An interactive 3D cityscape visualization application built with Next.js, React, Three.js, and Gemini 2.5 Pro integration. This application allows users to explore a 3D model of Calgary's downtown area, view building information, and query buildings using natural language.

## Project Overview

This project focuses on creating a web-based dashboard that visualizes Calgary's urban landscape with natural language querying capabilities. The application fetches building data from OpenStreetMap, processes it for 3D visualization, and integrates with Google's Gemini 2.5 Pro LLM to provide intelligent responses to user queries.

## Features

- **Interactive 3D Building Visualization**: View buildings from Calgary with proper positioning and scaling
- **Building Information Display**: Hover over buildings to see basic information, click for detailed AI-generated analysis
- **Natural Language Building Queries**: Filter buildings using natural language (e.g., "show buildings taller than 100 meters" or "highlight commercial buildings")
- **Realistic Ground Plane**: High-performance ground with reflections and optimized rendering
- **LLM Integration**: Ask questions about the city and buildings using Google's Gemini 2.5 Pro
- **High Performance Rendering**: Optimized for smooth performance with many buildings

## Tech Stack

### Frontend
- React with TypeScript
- Three.js for 3D rendering
- React Three Fiber & Drei for React integration with Three.js
- Tailwind CSS for styling

### Backend
- Flask for API endpoints
- Google Gemini 2.5 Pro for AI integration

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- Google Gemini API key (get one at [Google AI Studio](https://ai.google.dev/))

### Frontend Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. The application will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Create a `.env` file:
   ```
   cp .env.example .env
   ```

6. Add your Gemini API key to the `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

7. Start the Flask server:
   ```
   python app.py
   ```

8. The backend will run on `http://localhost:5000`

## Usage

- **Navigate the 3D Scene**:
  - **WASD Keys**: Move camera position at high speed (W-forward, A-left, S-backward, D-right)
  - **Shift + WASD**: Sprint (5x faster movement for rapid navigation)
  - **Mouse Drag**: Rotate camera
  - **Mouse Wheel**: Zoom in/out
- **Interact with Buildings**:
  - **Hover**: Preview building information
  - **Click**: Select a building to view detailed AI-generated analysis
- **Query Buildings**: Use the building query interface to filter buildings using natural language
  - Example queries:
    - "show buildings taller than 100 meters"
    - "highlight commercial buildings"
    - "what's the oldest building?"
    - "show buildings with RC-G zoning"
    - "find buildings worth more than $10 million"
    - "show me art deco buildings"
    - "highlight culturally significant buildings"
- **Ask Questions**: Use the AI chat interface to ask questions about the city and architecture

## Project Structure

- `src/`: Frontend source code
  - `components/`: React components
  - `services/`: API services
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions
- `backend/`: Flask backend
  - `app.py`: Main Flask application
  - `requirements.txt`: Python dependencies
