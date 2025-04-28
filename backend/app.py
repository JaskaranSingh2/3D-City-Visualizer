from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import json
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("gemini_debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("gemini_app")

# Load environment variables
load_dotenv()

# Configure API key - check for either GEMINI_API_KEY or GOOGLE_API_KEY
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("No API key found. Please set GEMINI_API_KEY or GOOGLE_API_KEY in .env file")

genai.configure(api_key=api_key)

# Initialize Flask app
app = Flask(__name__)
import os

# Set allowed origins for CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")  # Allow all origins by default, can be restricted in production
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for now to simplify debugging

# Add a root route for basic testing
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "API is running",
        "endpoints": [
            "/api/summary - POST request for building summary",
            "/api/query - POST request for general queries",
            "/api/filter - POST request for building filtering"
        ]
    })

# Configure Gemini model
try:
    # Try to use Gemini 2.5 Pro first
    model = genai.GenerativeModel('gemini-2.5-pro-preview-03-25')
    print("Using Gemini 2.5 Pro model")
except Exception as e:
    # Fall back to Gemini 1.5 Pro if 2.5 is not available
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        print("Using Gemini 1.5 Pro model")
    except Exception as e:
        # Fall back to Gemini 1.0 Pro as a last resort
        model = genai.GenerativeModel('gemini-pro')
        print("Using Gemini Pro model")

# # List available models
# try:
#     models = genai.list_models()
#     model_names = [m.name for m in models]
#     print(f"Available models: {', '.join(model_names)}")
# except Exception as e:
#     print(f"Error listing models: {e}")

@app.route('/api/summary', methods=['POST'])
def get_building_summary():
    """Generate a summary for a building using Gemini 2.5 Pro"""
    try:
        data = request.json
        print(f"Received /api/summary request with data: {data}")  # Debug log
        building_data = data.get('building_data', {})

        # Create prompt for Gemini
        # Extract building context if available
        building_context = building_data.get('building_context', None)
        context_info = ""

        if building_context:
            context_info = f"""
            Additional Context Information:
            Estimated Year Built: {building_context.get('estimatedYear', 'unknown')}
            Confidence: {building_context.get('confidence', 'low')}
            Architectural Style: {building_context.get('architecturalStyle', 'Unknown')}
            Notable Features: {building_context.get('notableFeatures', 'Unknown')}
            Historical Context: {building_context.get('historicalContext', 'Unknown')}
            Cultural Significance: {building_context.get('culturalSignificance', 'Unknown')}
            Material Information: {building_context.get('materialInfo', 'Unknown')}
            Sustainability Features: {building_context.get('sustainabilityInfo', 'Unknown')}
            Similar Examples: {building_context.get('similarExamples', 'Unknown')}
            Urban Context: {building_context.get('urbanContext', 'Unknown')}
            Reasoning: {building_context.get('reasoning', 'No additional information available')}
            """

        prompt = f"""
        Generate a detailed summary for this building in Calgary:

        Building ID: {building_data.get('id', 'unknown')}
        Name: {building_data.get('name', 'Unnamed Building')}
        Type: {building_data.get('type', 'commercial')}
        Floors: {building_data.get('levels', '3')}
        Height: {building_data.get('height', '10')} meters
        Actual Height: {building_data.get('actualHeight', 'unknown')}
        Amenities: {building_data.get('amenity', 'None')}
        Shops: {building_data.get('shop', 'None')}
        Offices: {building_data.get('office', 'None')}
        Year Built: {building_data.get('year_built', 'unknown')}
        Building Material: {building_data.get('material', 'concrete')}
        Roof Shape: {building_data.get('roof_shape', 'flat')}
        Address: {building_data.get('addr:street', 'Unknown')} {building_data.get('addr:housenumber', '')}
        {context_info}

        Provide the following information in JSON format:
        1. A detailed summary of the building (2-3 sentences). Include architectural style, historical context, and notable features if available from the context information.
        2. Estimated construction cost (based on building type, size, materials, and historical context)
        3. Building type classification (be specific about the architectural style if known)
        4. Urban significance (how this building contributes to Calgary's urban landscape, including any cultural or historical significance)
        5. Assessed value (provide a realistic property value based on building type, size, location, and historical significance in Calgary)
        6. Zoning information (provide a realistic zoning code for this type of building in Calgary, e.g. RC-G for residential, CC-X for downtown commercial, etc.)

        Format your response as valid JSON with these keys: summary, constructionCost, buildingType, urbanSignificance, assessedValue, zoning
        """

        # Generate response from Gemini with error handling for different API versions
        print("\n\n==== SENDING PROMPT TO GEMINI ====")
        print(prompt)
        print("==== END OF PROMPT ====\n")

        try:
            # Try the newer API format
            response = model.generate_content(prompt)
            print("\n==== GEMINI RESPONSE ====")
            if hasattr(response, 'text'):
                print(response.text)
            elif hasattr(response, 'result'):
                print(response.result)
            else:
                print(str(response))
            print("==== END OF GEMINI RESPONSE ====\n")
        except AttributeError:
            # Fall back to older API format if needed
            try:
                response = model.generate(prompt)
                print("\n==== GEMINI RESPONSE (FALLBACK 1) ====")
                print(str(response))
                print("==== END OF GEMINI RESPONSE ====\n")
            except AttributeError:
                # Last resort - try direct generation
                response = genai.generate_text(model=model.name, prompt=prompt)
                print("\n==== GEMINI RESPONSE (FALLBACK 2) ====")
                print(str(response))
                print("==== END OF GEMINI RESPONSE ====\n")

        # Handle different response formats
        if hasattr(response, 'text'):
            result = response.text
        elif hasattr(response, 'result'):
            result = response.result
        elif isinstance(response, str):
            result = response
        else:
            # Try to extract text from the response object
            try:
                result = str(response)
            except:
                raise ValueError("Could not extract text from model response")

        # Extract JSON from response
        try:
            # Clean up the response if it contains markdown code blocks
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0].strip()
            elif "```" in result:
                result = result.split("```")[1].split("```")[0].strip()

            # Try to parse as JSON first
            try:
                parsed_result = json.loads(result)
            except json.JSONDecodeError:
                # Fall back to eval if JSON parsing fails
                parsed_result = eval(result)

            # Return the response
            return jsonify(parsed_result)
        except Exception as e:
            # If parsing fails, return a structured response with the raw text
            print(f"Error parsing JSON: {e}")
            return jsonify({
                "summary": f"This is a {building_data.get('levels', '3')}-story {building_data.get('type', 'commercial')} building in Calgary.",
                "constructionCost": "Estimated cost unavailable",
                "buildingType": building_data.get('type', 'Commercial').capitalize(),
                "urbanSignificance": "This building contributes to Calgary's urban landscape.",
                "assessedValue": f"${int(float(building_data.get('levels', 3)) * 500000):,}",
                "zoning": "RC-G" if building_data.get('type', '').lower() == 'residential' else "C-COR1"
            })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/api/query', methods=['POST'])
def process_query():
    """Process a general query about buildings or urban planning using Gemini 2.5 Pro"""
    try:
        data = request.json
        print(f"Received /api/query request with data: {data}")  # Debug log
        query = data.get('query', '')
        context = data.get('context', {})

        # Create prompt for Gemini
        prompt = f"""
        You are an expert on urban architecture and city planning, especially for Calgary, Canada.

        User Query: {query}

        Context:
        - Location: {context.get('location', 'Calgary')}
        - Topic: {context.get('topic', 'urban architecture and city planning')}

        Provide a detailed, informative response to the query. If you don't have specific information
        about Calgary related to this query, you can provide general information about urban planning
        and architecture principles, but clearly state that you're providing general information.

        If relevant, include sources or references that would support your response.
        """

        # Generate response from Gemini with error handling for different API versions
        print("\n\n==== SENDING QUERY PROMPT TO GEMINI ====")
        print(prompt)
        print("==== END OF QUERY PROMPT ====\n")

        try:
            # Try the newer API format
            response = model.generate_content(prompt)
            print("\n==== GEMINI QUERY RESPONSE ====")
            if hasattr(response, 'text'):
                print(response.text)
            elif hasattr(response, 'result'):
                print(response.result)
            else:
                print(str(response))
            print("==== END OF GEMINI QUERY RESPONSE ====\n")
        except AttributeError:
            # Fall back to older API format if needed
            try:
                response = model.generate(prompt)
                print("\n==== GEMINI QUERY RESPONSE (FALLBACK 1) ====")
                print(str(response))
                print("==== END OF GEMINI QUERY RESPONSE ====\n")
            except AttributeError:
                # Last resort - try direct generation
                response = genai.generate_text(model=model.name, prompt=prompt)
                print("\n==== GEMINI QUERY RESPONSE (FALLBACK 2) ====")
                print(str(response))
                print("==== END OF GEMINI QUERY RESPONSE ====\n")

        # Handle different response formats
        if hasattr(response, 'text'):
            result = response.text
        elif hasattr(response, 'result'):
            result = response.result
        elif isinstance(response, str):
            result = response
        else:
            # Try to extract text from the response object
            try:
                result = str(response)
            except:
                raise ValueError("Could not extract text from model response")

        # Process response
        sources = []
        if "Sources:" in result:
            main_text, sources_text = result.split("Sources:", 1)
            sources = [s.strip() for s in sources_text.strip().split("\n") if s.strip()]
        else:
            main_text = result

        return jsonify({
            "response": main_text.strip(),
            "sources": sources
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/api/filter', methods=['POST'])
def filter_buildings():
    """Process a building filter query using Gemini 2.5 Pro"""
    try:
        data = request.json
        print(f"Received /api/filter request with data: {data}")  # Debug log
        query = data.get('query', '')

        # Create prompt for Gemini
        prompt = f"""
        You are an expert on building data and filtering. Extract filter criteria from this query: "{query}"

        The available building attributes are:
        - height (in meters, not feet) - all height values are in meters
        - building:levels (number of floors) - also referred to as 'levels' or 'floors'
        - building (type of building: residential, commercial, apartments, etc.)
        - amenity (facilities: restaurant, school, hospital, etc.)
        - shop (type of shop if present)
        - office (type of office if present)
        - name (building name)
        - addr:street (street address) - also referred to as 'street' or 'address'
        - addr:housenumber (house number) - also referred to as 'number'
        - start_date (year built) - also referred to as 'year' or 'built'
        - zoning (zoning code like RC-G, C-COR1, etc.)
        - assessedValue (property value in dollars)

        IMPORTANT: If the query mentions 'floors', 'levels', or 'stories', always use the attribute 'building:levels'.
        If the query mentions 'type', 'building type', or specific types like 'residential', 'commercial', etc., use the attribute 'building'.

        SPECIAL CASES AND KNOWLEDGE-BASED FILTERING:
        Use your knowledge of Calgary's architecture, urban planning, and building information to enhance your responses. When explicit data might be missing, use your knowledge to provide meaningful results.

        1. For historical queries ("oldest building", "historical buildings", "heritage buildings"):
           Instead of relying solely on start_date which may be missing, use your knowledge of Calgary's historical buildings.
           Examples: Stephen Avenue historic buildings (late 1800s), Lougheed House (1891), Calgary City Hall (1911), Grain Exchange Building (1909).
           Create appropriate filters based on names, locations, or architectural styles.

        2. For modern building queries ("newest building", "modern architecture", "recent developments"):
           Use your knowledge of Calgary's recent developments.
           Examples: Telus Sky (2019), Brookfield Place (2017), The Bow (2012), Eighth Avenue Place (2011).
           Create appropriate filters based on names, architectural styles, or materials.

        3. For architectural style queries ("art deco buildings", "brutalist architecture", "glass towers"):
           Use your knowledge of architectural styles in Calgary.
           Examples: The Bow (curved glass), Bankers Hall (postmodern), Calgary Tower (brutalist elements).
           Create appropriate filters based on names, materials, or other attributes.

        4. For cultural significance queries ("important landmarks", "iconic buildings", "cultural centers"):
           Use your knowledge of Calgary's culturally significant buildings.
           Examples: Calgary Tower, Glenbow Museum, TELUS Convention Centre, Arts Commons.
           Create appropriate filters based on names, functions, or locations.

        5. For height-based queries ("tallest buildings", "skyscrapers"):
           Create a filter with attribute="height", operator=">", value="0" and add "sortBy": "height", "sortOrder": "desc".
           Note that height is in meters.

        6. For value-based queries ("most valuable buildings", "expensive properties"):
           Create a filter with attribute="assessedValue", operator=">", value="0" and add "sortBy": "assessedValue", "sortOrder": "desc".

        7. For sustainability queries ("green buildings", "sustainable architecture", "LEED certified"):
           Use your knowledge of Calgary's sustainable buildings.
           Examples: The Bow (energy efficient design), Telus Sky (LEED certification), Eighth Avenue Place (green features).
           Create appropriate filters based on names or other attributes.

        Return a JSON object with an array of filters. Each filter should have:
        - attribute: The building attribute to filter on (from the list above)
        - operator: One of >, <, =, >=, <=, or "contains" for text search
        - value: The value to compare against

        Also include an "explanation" field that briefly explains the filters in plain English.

        Example 1: "show buildings taller than 30 meters"
        Response: {{
          "filters": [
            {{
              "attribute": "height",
              "operator": ">",
              "value": 30
            }}
          ],
          "explanation": "Showing buildings with height greater than 30 meters"
        }}

        Example 2: "find commercial buildings with more than 5 floors"
        Response: {{
          "filters": [
            {{
              "attribute": "building",
              "operator": "=",
              "value": "commercial"
            }},
            {{
              "attribute": "building:levels",
              "operator": ">",
              "value": 5
            }}
          ],
          "explanation": "Showing commercial buildings with more than 5 floors"
        }}

        Example 3: "what is the oldest building"
        Response: {{
          "filters": [
            {{
              "attribute": "name",
              "operator": "contains",
              "value": "historic"
            }}
          ],
          "explanation": "Showing buildings that are likely historical based on their names and Calgary's history. Historical buildings in Calgary include structures from the late 1800s and early 1900s."
        }}

        Example 4: "show me the newest buildings"
        Response: {{
          "filters": [
            {{
              "attribute": "name",
              "operator": "contains",
              "value": "Telus Sky"
            }}
          ],
          "explanation": "Showing modern buildings in Calgary like Telus Sky which was completed in 2019."
        }}

        Example 5: "show me art deco buildings"
        Response: {{
          "filters": [
            {{
              "attribute": "name",
              "operator": "contains",
              "value": "Palliser"
            }}
          ],
          "explanation": "Showing buildings with Art Deco architectural elements in Calgary. The Palliser Hotel (now Fairmont Palliser) features some Art Deco influences."
        }}

        Example 6: "show me culturally significant buildings"
        Response: {{
          "filters": [
            {{
              "attribute": "name",
              "operator": "contains",
              "value": "Calgary Tower"
            }}
          ],
          "explanation": "Showing culturally significant buildings in Calgary. The Calgary Tower is an iconic landmark that symbolizes the city."
        }}

        Example 7: "show me sustainable buildings"
        Response: {{
          "filters": [
            {{
              "attribute": "name",
              "operator": "contains",
              "value": "Bow"
            }}
          ],
          "explanation": "Showing buildings with sustainable design features. The Bow incorporates energy-efficient design elements."
        }}

        Format your response as valid JSON with these keys: filters (array), explanation (string), and optional sortBy and sortOrder fields.
        """

        # Generate response from Gemini with error handling for different API versions
        print("\n\n==== SENDING FILTER PROMPT TO GEMINI ====")
        print(prompt)
        print("==== END OF FILTER PROMPT ====\n")

        try:
            # Try the newer API format
            response = model.generate_content(prompt)
            print("\n==== GEMINI FILTER RESPONSE ====")
            if hasattr(response, 'text'):
                print(response.text)
            elif hasattr(response, 'result'):
                print(response.result)
            else:
                print(str(response))
            print("==== END OF GEMINI FILTER RESPONSE ====\n")
        except AttributeError:
            # Fall back to older API format if needed
            try:
                response = model.generate(prompt)
                print("\n==== GEMINI FILTER RESPONSE (FALLBACK 1) ====")
                print(str(response))
                print("==== END OF GEMINI FILTER RESPONSE ====\n")
            except AttributeError:
                # Last resort - try direct generation
                response = genai.generate_text(model=model.name, prompt=prompt)
                print("\n==== GEMINI FILTER RESPONSE (FALLBACK 2) ====")
                print(str(response))
                print("==== END OF GEMINI FILTER RESPONSE ====\n")

        # Handle different response formats
        if hasattr(response, 'text'):
            result = response.text
        elif hasattr(response, 'result'):
            result = response.result
        elif isinstance(response, str):
            result = response
        else:
            # Try to extract text from the response object
            try:
                result = str(response)
            except:
                raise ValueError("Could not extract text from model response")

        # Process response
        try:
            # Extract JSON from response
            result = result.strip()

            # If the response is wrapped in ```json and ```, extract just the JSON part
            if result.startswith('```json'):
                result = result.split('```json')[1].split('```')[0].strip()
            elif result.startswith('```'):
                result = result.split('```')[1].split('```')[0].strip()

            # Parse the JSON
            parsed_result = json.loads(result)

            # Validate the response structure
            if 'filters' not in parsed_result or 'explanation' not in parsed_result:
                raise ValueError("Response missing required fields")

            # Process and normalize filters
            processed_filters = []
            for filter_item in parsed_result['filters']:
                # Ensure all required fields are present
                if 'attribute' not in filter_item or 'operator' not in filter_item or 'value' not in filter_item:
                    continue

                # Normalize attribute names
                attribute = filter_item['attribute']
                if attribute in ['floors', 'levels', 'stories', 'floor', 'level', 'story']:
                    attribute = 'building:levels'
                elif attribute in ['type', 'building_type']:
                    attribute = 'building'
                elif attribute in ['address', 'street']:
                    attribute = 'addr:street'
                elif attribute in ['number', 'house_number']:
                    attribute = 'addr:housenumber'
                elif attribute in ['year', 'built', 'year_built']:
                    attribute = 'start_date'

                # Special handling for knowledge-based queries
                query_lower = query.lower()

                # Historical/oldest buildings
                if attribute == 'start_date' and ('oldest' in query_lower or 'historical' in query_lower or 'heritage' in query_lower):
                    print("Converting historical building query to use knowledge-based filtering")
                    attribute = 'name'
                    filter_item['operator'] = 'contains'

                    # Use different historical building names based on query nuances
                    if 'oldest' in query_lower:
                        filter_item['value'] = 'historic'
                    elif 'heritage' in query_lower:
                        filter_item['value'] = 'heritage'
                    else:
                        filter_item['value'] = 'historic'

                    # Add explanation about the conversion
                    if not parsed_result['explanation'].endswith('.'):
                        parsed_result['explanation'] += '.'
                    parsed_result['explanation'] += " Using building names and Calgary's historical context to identify likely historical buildings."

                # Modern/newest buildings
                elif attribute == 'start_date' and ('newest' in query_lower or 'modern' in query_lower or 'recent' in query_lower):
                    print("Converting modern building query to use knowledge-based filtering")
                    attribute = 'name'
                    filter_item['operator'] = 'contains'

                    # Use different modern building names based on query nuances
                    if 'newest' in query_lower:
                        filter_item['value'] = 'telus'
                    elif 'modern' in query_lower:
                        filter_item['value'] = 'bow'
                    else:
                        filter_item['value'] = 'brookfield'

                    # Add explanation about the conversion
                    if not parsed_result['explanation'].endswith('.'):
                        parsed_result['explanation'] += '.'
                    parsed_result['explanation'] += " Using building names to identify modern buildings in Calgary's skyline."

                # Architectural style queries
                elif 'style' in query_lower or 'architecture' in query_lower or 'design' in query_lower:
                    print("Converting architectural style query to use knowledge-based filtering")
                    attribute = 'name'
                    filter_item['operator'] = 'contains'

                    # Determine architectural style from query
                    if 'art deco' in query_lower:
                        filter_item['value'] = 'palliser'
                    elif 'modern' in query_lower or 'contemporary' in query_lower:
                        filter_item['value'] = 'bow'
                    elif 'brutalist' in query_lower or 'concrete' in query_lower:
                        filter_item['value'] = 'calgary tower'
                    elif 'glass' in query_lower:
                        filter_item['value'] = 'telus'
                    else:
                        filter_item['value'] = 'bow'

                    # Add explanation about the conversion
                    if not parsed_result['explanation'].endswith('.'):
                        parsed_result['explanation'] += '.'
                    parsed_result['explanation'] += " Using building names to identify buildings with specific architectural styles in Calgary."

                # Cultural significance queries
                elif 'cultural' in query_lower or 'landmark' in query_lower or 'iconic' in query_lower or 'significant' in query_lower:
                    print("Converting cultural significance query to use knowledge-based filtering")
                    attribute = 'name'
                    filter_item['operator'] = 'contains'
                    filter_item['value'] = 'calgary tower'

                    # Add explanation about the conversion
                    if not parsed_result['explanation'].endswith('.'):
                        parsed_result['explanation'] += '.'
                    parsed_result['explanation'] += " Highlighting culturally significant buildings in Calgary's urban landscape."

                # Sustainability queries
                elif 'sustainable' in query_lower or 'green' in query_lower or 'eco' in query_lower or 'leed' in query_lower:
                    print("Converting sustainability query to use knowledge-based filtering")
                    attribute = 'name'
                    filter_item['operator'] = 'contains'
                    filter_item['value'] = 'bow'

                    # Add explanation about the conversion
                    if not parsed_result['explanation'].endswith('.'):
                        parsed_result['explanation'] += '.'
                    parsed_result['explanation'] += " Identifying buildings with sustainable design features in Calgary."

                # Create normalized filter
                processed_filters.append({
                    'attribute': attribute,
                    'operator': filter_item['operator'],
                    'value': filter_item['value']
                })

            # Update the filters in the result
            parsed_result['filters'] = processed_filters

            # Log the processed filters
            print(f"Processed filters: {processed_filters}")
            print(f"Explanation: {parsed_result['explanation']}")

            return jsonify(parsed_result)
        except Exception as e:
            print(f"Error parsing filter response: {e}")
            # Fallback response
            return jsonify({
                "filters": [],
                "explanation": f"Could not parse the query: {query}. Please try a different query format."
            })

    except Exception as e:
        print(f"Error in filter_buildings: {e}")
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/api/building-context', methods=['POST'])
def get_building_context():
    """Get contextual information about buildings based on names and other data"""
    try:
        data = request.json
        print(f"Received /api/building-context request with data: {data}")  # Debug log
        building_name = data.get('name', '')
        building_type = data.get('type', '')
        query_type = data.get('query_type', 'age')  # age, history, etc.

        # Create prompt for Gemini
        prompt = f"""
        You are an expert on Calgary's architecture, urban planning, and building information. Provide comprehensive information about this building:

        Building Name: {building_name}
        Building Type: {building_type}
        Information Requested: {query_type}

        If the building name is generic or unknown, use your knowledge of Calgary's architecture to provide detailed information about buildings of this type in Calgary.

        Include information about:
        1. Architectural style and notable features typical for this type of building in Calgary
        2. Historical context and significance (if applicable)
        3. Typical materials used in construction
        4. Likely zoning and urban planning context
        5. Typical usage patterns and functions
        6. Estimated construction period or year
        7. Notable examples of similar buildings in Calgary
        8. Any cultural or economic significance
        9. Sustainability features (if applicable)
        10. Relationship to Calgary's urban development patterns

        Format your response as valid JSON with these keys:
        - estimatedYear (number, e.g. 1980, or 0 if unknown)
        - confidence (string: "high", "medium", or "low")
        - architecturalStyle (string describing the likely architectural style)
        - notableFeatures (string describing distinctive features)
        - historicalContext (string with historical information)
        - culturalSignificance (string describing cultural importance)
        - materialInfo (string describing typical construction materials)
        - sustainabilityInfo (string describing any sustainability aspects)
        - similarExamples (string listing similar buildings in Calgary)
        - urbanContext (string describing relationship to urban planning)
        - reasoning (string explaining your overall assessment)
        """

        # Generate response from Gemini
        print("\n\n==== SENDING BUILDING CONTEXT PROMPT TO GEMINI ====")
        print(prompt)
        print("==== END OF BUILDING CONTEXT PROMPT ====\n")

        try:
            # Try the newer API format
            response = model.generate_content(prompt)
            print("\n==== GEMINI BUILDING CONTEXT RESPONSE ====")
            if hasattr(response, 'text'):
                print(response.text)
            elif hasattr(response, 'result'):
                print(response.result)
            else:
                print(str(response))
            print("==== END OF GEMINI BUILDING CONTEXT RESPONSE ====\n")

            # Extract the response text
            if hasattr(response, 'text'):
                result = response.text
            elif hasattr(response, 'result'):
                result = response.result
            elif isinstance(response, str):
                result = response
            else:
                result = str(response)

            # Process the response
            result = result.strip()

            # If the response is wrapped in ```json and ```, extract just the JSON part
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0].strip()
            elif "```" in result:
                result = result.split("```")[1].split("```")[0].strip()

            # Parse the JSON
            parsed_result = json.loads(result)

            return jsonify(parsed_result)

        except Exception as e:
            print(f"Error processing building context: {e}")
            # Fallback response
            return jsonify({
                "estimatedYear": 0,
                "confidence": "low",
                "architecturalStyle": "Unknown",
                "notableFeatures": "No specific features identified",
                "historicalContext": "No historical information available",
                "culturalSignificance": "Unknown cultural significance",
                "materialInfo": "Typical construction materials for Calgary buildings include concrete, steel, and glass",
                "sustainabilityInfo": "No specific sustainability information available",
                "similarExamples": "No specific examples identified",
                "urbanContext": "This building is part of Calgary's urban landscape",
                "reasoning": "Unable to determine detailed building context due to insufficient information."
            })

    except Exception as e:
        print(f"Error in get_building_context: {e}")
        return jsonify({
            "error": str(e)
        }), 500

# For local development only
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
