/**
 * Extract error message from API response
 * Handles both simple error messages and validation error objects
 */
export const extractErrorMessage = (error) => {
    try {
        // Check if error has response data
        if (error.response?.data) {
            const data = error.response.data;

            // Some endpoints (e.g. UsersAuthAPI's Unauthorized("...")/NotFound("..."))
            // return a bare JSON string body instead of an object.
            if (typeof data === 'string' && data.trim()) {
                return [data];
            }

            // Handle validation errors (structured error object with field-level errors)
            if (data.errors && typeof data.errors === 'object') {
                const errorMessages = [];
                
                // Iterate through each field's errors
                Object.entries(data.errors).forEach(([field, messages]) => {
                    if (Array.isArray(messages)) {
                        // Join multiple messages for the same field
                        messages.forEach(msg => {
                            errorMessages.push(`${field}: ${msg}`);
                        });
                    } else if (typeof messages === 'string') {
                        errorMessages.push(`${field}: ${messages}`);
                    }
                });

                if (errorMessages.length > 0) {
                    return errorMessages;
                }
            }

            // Handle simple error message
            if (data.error && typeof data.error === 'string') {
                return [data.error];
            }

            // Handle details field
            if (data.details && typeof data.details === 'string') {
                return [data.details];
            }

            // Handle title field (from Problem Details RFC 9110)
            if (data.title && typeof data.title === 'string') {
                return [data.title];
            }

            // Handle generic message
            if (data.message && typeof data.message === 'string') {
                return [data.message];
            }
        }

        // Fallback to error message
        if (error.message) {
            return [error.message];
        }

        return ['An unknown error occurred'];
    } catch (err) {
        console.error('Error extracting error message:', err);
        return ['An error occurred while processing your request'];
    }
};

/**
 * Format error messages for display
 * Returns either a single string or HTML for multiple errors
 */
export const formatErrorDisplay = (error) => {
    const messages = extractErrorMessage(error);

    if (messages.length === 1) {
        return messages[0];
    }

    // Return array for multi-error display
    return messages;
};
