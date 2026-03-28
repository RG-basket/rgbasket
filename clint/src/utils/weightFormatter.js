/**
 * Formats weight and unit for display.
 * Handles special cases like "500 (without head)" and unit "g" 
 * to display as "500g without head" instead of "500 (without head)g".
 * 
 * @param {string|object} weightOrObj - The weight string or weight object {weight, unit}
 * @param {string} unitParam - The unit string (optional if weightOrObj is object)
 * @returns {string} Formatted weight string
 */
export const formatWeight = (weightOrObj, unitParam) => {
    let weight = "";
    let unit = "";

    if (typeof weightOrObj === 'object' && weightOrObj !== null) {
        weight = weightOrObj.weight || "";
        unit = weightOrObj.unit || "";
    } else {
        weight = weightOrObj || "";
        unit = unitParam || "";
    }

    if (!weight) return "";
    
    // Ensure weight is string
    weight = String(weight).trim();
    unit = String(unit || "").trim();

    const lowerUnit = unit.toLowerCase();
    
    // Piece/Unit units usually don't need the unit appended if it's already in the text
    // Fixed standard for this app: just return weight for piece/unit
    if (!unit || lowerUnit === "piece" || lowerUnit === "unit") {
        return weight;
    }

    // Check for parentheses (special case requested by user)
    // Example: "500 (without head)" with unit "g" -> "500g without head"
    const parenMatch = weight.match(/\(([^)]+)\)/);
    
    if (parenMatch) {
        const extraText = parenMatch[1].trim(); // content inside ()
        const beforeParen = weight.replace(/\([^)]+\)/, '').trim();
        return `${beforeParen}${unit} ${extraText}`;
    }

    // Standard case: concatenate without space (e.g. 500g, 1kg)
    // Most components in this app follow this style.
    return `${weight}${unit}`;
};
