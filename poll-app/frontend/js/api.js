// frontend/js/api.js

const API_BASE_URL = '/api';

// Get or create a user ID
function getUserId() {
    let userId = localStorage.getItem('poll_user_id');
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('poll_user_id', userId);
    }
    return userId;
}

// Add user ID to all requests
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-User-ID': getUserId()
    };
}

/**
 * Fetch all polls from the API
 * @returns {Promise<Array>} Array of poll objects
 */
async function fetchPolls() {
    try {
        const response = await fetch(`${API_BASE_URL}/polls`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching polls:', error);
        throw error;
    }
}

/**
 * Fetch a specific poll by ID
 * @param {string} pollId - The ID of the poll to fetch
 * @returns {Promise<Object>} Poll object with details
 */
async function fetchPoll(pollId) {
    try {
        const response = await fetch(`${API_BASE_URL}/polls/${pollId}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Poll not found');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching poll:', error);
        throw error;
    }
}

/**
 * Create a new poll
 * @param {Object} pollData - The poll data (question and options)
 * @returns {Promise<Object>} Created poll object
 */
async function createPoll(pollData) {
    try {
        const response = await fetch(`${API_BASE_URL}/polls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pollData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create poll');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating poll:', error);
        throw error;
    }
}

/**
 * Submit a vote for a poll
 * @param {string} pollId - The ID of the poll
 * @param {number} optionIndex - The index of the selected option
 * @returns {Promise<Object>} Response with vote confirmation
 */
async function voteOnPoll(pollId, optionIndex) {
    try {
        const response = await fetch(`${API_BASE_URL}/polls/${pollId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ option_index: optionIndex })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit vote');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error voting on poll:', error);
        throw error;
    }
}

/**
 * Deletes a poll by its ID.
 * @param {string} pollId - The ID of the poll to delete.
 * @returns {Promise<Object>} - A promise that resolves with the success message or rejects with an error.
 */
async function deletePoll(pollId) {
    try {
        const response = await fetch(`${API_BASE_URL}/polls/${pollId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting poll:', error);
        throw error;
    }
}

/**
 * Performs admin login.
 * @param {string} username - Admin username.
 * @param {string} password - Admin password.
 * @returns {Promise<Object>} - A promise that resolves with a success message or rejects with an error.
 */
async function adminLogin(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        // In a real application, the backend would return a token here.
        // For this simple example, we just check for success.
        const data = await response.json();
        if (!data.success) {
             throw new Error(data.error || 'Login failed');
        }
        return data;
    } catch (error) {
        console.error('Error during admin login:', error);
        throw error;
    }
}

// Export the API functions
window.api = {
    fetchPolls,
    fetchPoll,
    createPoll,
    voteOnPoll,
    deletePoll,
    adminLogin
}; 