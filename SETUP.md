# 3D City Viewer Setup Guide

This guide provides detailed instructions for setting up and running the 3D City Viewer application.

## Project Structure

The project consists of two main parts:
1. **Frontend**: A React application with Three.js for 3D visualization
2. **Backend**: A Flask server with Google Gemini 2.5 Pro integration for AI features

## Frontend Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Backend Setup

### Create Virtual Environment

```bash
cd backend
python -m venv venv
```

### Activate Virtual Environment

On Windows:
```bash
venv\Scripts\activate
```

On macOS/Linux:
```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure API Key

1. Create a `.env` file in the backend directory:
   ```bash
   cp .env.example .env
   ```

2. Get a Google Gemini API key from [Google AI Studio](https://ai.google.dev/)

3. Add your API key to the `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Start the Backend Server

```bash
python app.py
```

The backend will run on `http://localhost:5000`.

## Testing the Backend

You can test the backend API endpoints using the provided test script:

```bash
python test_api.py
```

This will send test requests to both API endpoints and display the responses.

## Troubleshooting

### CORS Issues

If you encounter CORS issues when the frontend tries to communicate with the backend, make sure:
1. The backend server is running
2. The API base URL in `src/services/llmService.ts` matches your backend URL (default is `http://localhost:5000`)

### Missing Textures

The application uses procedurally generated textures for the ground, so no external texture files are needed.

### API Key Issues

If you see authentication errors in the backend logs, verify that:
1. You've created the `.env` file with your Gemini API key
2. The API key is valid and has access to the Gemini 2.5 Pro model

## Features Implemented

1. **Building Placement**
   - Proper building positioning on a ground plane
   - Buildings correctly scaled and oriented
   - Collision detection between buildings
   - Grid-based placement system

2. **Ground Implementation**
   - Procedurally generated ground texture
   - Road network visualization
   - Proper shadows and lighting

3. **Interactive Building Information**
   - Hover state for buildings with color change
   - Information overlay showing building details
   - Selection state for buildings

4. **LLM Integration**
   - API service layer for Gemini 2.5 Pro communication
   - Query interface in the sidebar
   - Building information enrichment with AI-generated content
