"""
Data models for the 3D City Viewer application.
"""

class Building:
    """
    Represents a building with its properties.
    """
    def __init__(self, data):
        self.id = data.get('id', 'unknown')
        self.name = data.get('name', 'Unnamed Building')
        self.building_type = data.get('building', 'commercial')
        self.levels = data.get('building:levels', '3')
        self.height = data.get('height') or (float(self.levels) * 3 if self.levels else 10)
        self.amenity = data.get('amenity', '')
        self.shop = data.get('shop', '')
        self.office = data.get('office', '')
        self.year_built = data.get('start_date', 'unknown')
        self.material = data.get('material', 'concrete')
        self.roof_shape = data.get('roof:shape', 'flat')
        self.address = data.get('addr:street', '')
        self.housenumber = data.get('addr:housenumber', '')
        
    def to_dict(self):
        """
        Convert the building to a dictionary.
        """
        return {
            'id': self.id,
            'name': self.name,
            'type': self.building_type,
            'levels': self.levels,
            'height': self.height,
            'amenity': self.amenity,
            'shop': self.shop,
            'office': self.office,
            'year_built': self.year_built,
            'material': self.material,
            'roof_shape': self.roof_shape,
            'address': self.address,
            'housenumber': self.housenumber
        }
        
    def matches_filter(self, filter_criteria):
        """
        Check if the building matches the given filter criteria.
        
        Args:
            filter_criteria (dict): A dictionary with attribute, operator, and value.
            
        Returns:
            bool: True if the building matches the filter, False otherwise.
        """
        attribute = filter_criteria.get('attribute')
        operator = filter_criteria.get('operator')
        value = filter_criteria.get('value')
        
        # Get the building attribute value
        if attribute == 'building':
            building_value = self.building_type
        elif attribute == 'building:levels':
            building_value = self.levels
        elif attribute == 'height':
            building_value = self.height
        elif attribute == 'start_date':
            building_value = self.year_built
        else:
            building_value = getattr(self, attribute, None)
            
        if building_value is None:
            return False
            
        # Convert to numbers for numeric comparisons
        if operator in ['>', '<', '>=', '<=']:
            try:
                building_value = float(building_value)
                value = float(value)
            except (ValueError, TypeError):
                return False
                
        # Apply the operator
        if operator == '>':
            return building_value > value
        elif operator == '<':
            return building_value < value
        elif operator == '>=':
            return building_value >= value
        elif operator == '<=':
            return building_value <= value
        elif operator in ['=', '==']:
            return str(building_value).lower() == str(value).lower()
        elif operator == 'contains':
            return str(value).lower() in str(building_value).lower()
        
        return False
