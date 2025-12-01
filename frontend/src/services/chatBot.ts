import axios from 'axios';
import { MessageInterface } from '../types/types';
import { API_KEY, API_URL } from '../config/runpodConfigs';

/**
 * Poll RunPod job status until completion
 */
async function pollJobStatus(jobId: string, maxAttempts: number = 150, pollInterval: number = 2000): Promise<any> {
    // Extract base URL and construct status endpoint
    // If using proxy, the URL will be like /api/runpod/v2/...
    // We need to construct the status endpoint: /api/runpod/v2/{endpoint_id}/status/{jobId}
    let statusUrl: string;
    
    if (API_URL.startsWith('/api/runpod')) {
        // Extract the endpoint ID from the original API URL
        // e.g., /api/runpod/v2/7npr6mt7n0ulbp/runsync -> /api/runpod/v2/7npr6mt7n0ulbp/status/{jobId}
        const urlParts = API_URL.split('/');
        const endpointIdIndex = urlParts.findIndex(part => part === 'v2') + 1;
        if (endpointIdIndex > 0 && endpointIdIndex < urlParts.length) {
            const endpointId = urlParts[endpointIdIndex];
            statusUrl = `/api/runpod/v2/${endpointId}/status/${jobId}`;
        } else {
            throw new Error('Could not determine endpoint ID from API URL');
        }
    } else {
        // Direct API URL (shouldn't happen with proxy, but handle it)
        const urlObj = new URL(API_URL);
        const pathParts = urlObj.pathname.split('/');
        const endpointIdIndex = pathParts.findIndex(part => part === 'v2') + 1;
        if (endpointIdIndex > 0 && endpointIdIndex < pathParts.length) {
            const endpointId = pathParts[endpointIdIndex];
            statusUrl = `https://api.runpod.ai/v2/${endpointId}/status/${jobId}`;
        } else {
            throw new Error('Could not determine endpoint ID from API URL');
        }
    }
    
    console.log('Polling job status at:', statusUrl);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const statusResponse = await axios.get(statusUrl, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                },
                timeout: 10000
            });
            
            const statusData = statusResponse.data;
            console.log(`Poll attempt ${attempt + 1}:`, statusData.status);
            
            if (statusData.status === 'COMPLETED') {
                console.log('Job completed successfully');
                return statusData;
            } else if (statusData.status === 'FAILED') {
                throw new Error(`Job failed: ${statusData.error || 'Unknown error'}`);
            } else if (statusData.status === 'IN_PROGRESS' || statusData.status === 'IN_QUEUE') {
                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } else {
                // Unknown status, wait and retry
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                // Job might not be ready yet, continue polling
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } else {
                throw error;
            }
        }
    }
    
    throw new Error(`Job did not complete within ${maxAttempts * pollInterval / 1000} seconds`);
}

async function callChatBotAPI(messages: MessageInterface[]): Promise<{ message: MessageInterface; fullResponse?: any }> {
    try {
        if (!API_URL || !API_KEY) {
            throw new Error('RunPod API URL or API Key is missing. Please check your .env file.');
        }
        
        // Validate API URL format
        if (!API_URL.includes('runpod.ai') && !API_URL.includes('runpod')) {
            console.warn('Warning: API URL may not be a valid RunPod endpoint');
        }
        
        console.log('Calling RunPod API...', { url: API_URL, messageCount: messages.length });
        
        const response = await axios.post(
            API_URL, 
            {
                input: { messages }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                timeout: 300000 // 300 second timeout (5 minutes) - LLM inference can take time, especially for complex requests
            }
        );
        
        // Log the full response for debugging
        console.log('Full API response:', JSON.stringify(response.data, null, 2));
        
        // Handle async job status (IN_PROGRESS)
        let responseData = response.data;
        if (responseData.status === 'IN_PROGRESS' && responseData.id) {
            console.log('Job is in progress, polling for status...', responseData.id);
            responseData = await pollJobStatus(responseData.id);
        }
        
        // Handle different RunPod response formats
        let outputMessage: MessageInterface | null = null;
        
        if (responseData) {
            // Format 1: { output: MessageInterface }
            if (responseData.output) {
                // Check if output is an array
                if (Array.isArray(responseData.output)) {
                    // If it's an array, take the first element or last element
                    const outputArray = responseData.output;
                    if (outputArray.length > 0) {
                        outputMessage = outputArray[outputArray.length - 1];
                    }
                } else {
                    // If it's a direct object
                    outputMessage = responseData.output;
                }
            }
            // Format 2: Direct response (responseData is the message itself)
            else if (responseData.role && responseData.content !== undefined && responseData.content !== null) {
                outputMessage = responseData;
            }
            // Format 3: Nested in responseData.data
            else if (responseData.data) {
                if (responseData.data.role && responseData.data.content) {
                    outputMessage = responseData.data;
                } else if (responseData.data.output) {
                    outputMessage = responseData.data.output;
                }
            }
        }
        
        if (!outputMessage) {
            console.error('Unexpected response format:', responseData);
            throw new Error(`Invalid response format from API. Received: ${JSON.stringify(responseData)}`);
        }
        
        // Validate response structure - check if role exists and content is not undefined/null
        if (!outputMessage.role || outputMessage.content === undefined || outputMessage.content === null) {
            console.error('Invalid message structure:', outputMessage);
            throw new Error('Invalid message format in API response. Missing role or content.');
        }
        
        // Handle empty content - provide a fallback message
        if (outputMessage.content.trim() === '') {
            console.warn('API returned empty content, using fallback message');
            outputMessage.content = "I'm sorry, I didn't catch that. Could you please elaborate?";
        }
        
        console.log('RunPod API response received successfully', outputMessage);
        
        // Return both the message and full response data for order extraction
        return { 
            message: outputMessage,
            fullResponse: responseData 
        };
    } catch (error: any) {
        console.error('Error calling RunPod API:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            status: error.response?.status
        });
        
        // Provide user-friendly error messages
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout. The API is taking longer than expected. This might happen if the server is starting up. Please try again in a moment.');
        } else if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            if (status === 401) {
                throw new Error('Authentication failed. Please check your API key.');
            } else if (status === 404) {
                throw new Error('API endpoint not found. Please check your API URL.');
            } else if (status === 500) {
                throw new Error('Server error. Please try again later.');
            } else if (errorData?.error) {
                throw new Error(errorData.error);
            } else {
                throw new Error(`API error (${status}): ${errorData?.message || 'Unknown error'}`);
            }
        } else if (error.request) {
            throw new Error('Network error. Please check your internet connection.');
        } else {
            throw error;
        }
    }
}

export { callChatBotAPI };

