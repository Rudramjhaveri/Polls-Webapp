const VOTED_POLLS_STORAGE_KEY = 'votedPolls';
const ADMIN_LOGGED_IN_STORAGE_KEY = 'isAdminLoggedIn';

// Admin state management
function isAdminLoggedIn() {
    return sessionStorage.getItem(ADMIN_LOGGED_IN_STORAGE_KEY) === 'true';
}

function setAdminLoggedIn(isLoggedIn) {
    if (isLoggedIn) {
        sessionStorage.setItem(ADMIN_LOGGED_IN_STORAGE_KEY, 'true');
    } else {
        sessionStorage.removeItem(ADMIN_LOGGED_IN_STORAGE_KEY);
    }
}

function showAdminLoginForm() {
    document.getElementById('admin-login-form').classList.remove('hidden');
    document.getElementById('poll-list').classList.add('hidden');
    document.getElementById('poll-detail').classList.add('hidden');
    document.getElementById('create-poll-form').classList.add('hidden');
}

function showCreatePollForm() {
     if (isAdminLoggedIn()) {
        document.getElementById('create-poll-form').classList.remove('hidden');
        document.getElementById('poll-list').classList.add('hidden');
        document.getElementById('poll-detail').classList.add('hidden');
        document.getElementById('admin-login-form').classList.add('hidden');
         // Reset and initialize the new poll form
        const newPollForm = document.getElementById('new-poll-form');
        if(newPollForm) {
            newPollForm.reset();
             // Ensure at least MIN_OPTIONS are visible
            const optionsContainer = document.getElementById('options-container');
             // Remove existing options beyond the minimum before adding
             while(optionsContainer.children.length > MIN_OPTIONS) {
                 optionsContainer.removeChild(optionsContainer.lastElementChild);
             }
             while(optionsContainer.children.length < MIN_OPTIONS) {
                 addOptionInput(); // Assuming addOptionInput creates a textarea with correct class
             }
            updateOptionButtons();
        }
     } else {
        showAdminLoginForm();
         showToast('Please login as admin to create polls.', 'info');
     }
}

function hideAllFormsAndShowPollList() {
    document.getElementById('admin-login-form').classList.add('hidden');
    document.getElementById('create-poll-form').classList.add('hidden');
    document.getElementById('poll-detail').classList.add('hidden'); // Hide detail view as well
    document.getElementById('poll-list').classList.remove('hidden');
}

/**
 * Checks if the user has already voted on a specific poll.
 * @param {string} pollId - The ID of the poll.
 * @returns {boolean} - True if the user has voted, false otherwise.
 */
function hasUserVoted(pollId) {
    const votedPolls = JSON.parse(localStorage.getItem(VOTED_POLLS_STORAGE_KEY) || '{}');
    return votedPolls[pollId] === true;
}

/**
 * Marks a poll as voted in localStorage.
 * @param {string} pollId - The ID of the poll.
 */
function markPollAsVoted(pollId) {
    const votedPolls = JSON.parse(localStorage.getItem(VOTED_POLLS_STORAGE_KEY) || '{}');
    votedPolls[pollId] = true;
    localStorage.setItem(VOTED_POLLS_STORAGE_KEY, JSON.stringify(votedPolls));
}

/**
 * Handles the form submission for voting.
 * @param {Event} event - The submit event.
 * @param {string} pollId - The ID of the poll being voted on.
 */
async function handleVoteSubmit(event, pollId) {
    event.preventDefault();
    showLoading();

    try {
        if (hasUserVoted(pollId)) {
            showToast('You have already voted on this poll.', 'info');
            return;
        }

        const selectedOption = document.querySelector('input[name="pollOption"]:checked');
        if (!selectedOption) {
            showToast('Please select an option.', 'error');
            return;
        }

        const optionIndex = parseInt(selectedOption.value, 10);
        const result = await api.voteOnPoll(pollId, optionIndex);

        if (result && result.success) {
            markPollAsVoted(pollId);
            showToast('Vote recorded successfully!', 'success');
            await loadPollDetail(pollId); // Reload detail to show results
        } else {
            throw new Error(result.message || 'Failed to record vote');
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        showToast(error.message || 'Failed to submit vote. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Loads and displays the list of all polls.
 */
window.loadPollList = async function() {
    showLoading();
    try {
        const polls = await api.fetchPolls();
        if (polls) {
            renderPollList(polls);
        } else {
             showToast('Could not fetch polls.', 'error');
            document.getElementById('poll-list').innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
                    <p class="text-red-500 text-lg">Error loading polls. Please try again.</p>
                </div>`;
        }
        hideAllFormsAndShowPollList(); // Ensure only poll list is visible
    } catch (error) {
        console.error('Error loading polls:', error);
        showToast(error.message || 'Failed to load polls. Please try again.', 'error');
        document.getElementById('poll-list').innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
                <p class="text-red-500 text-lg">Error loading polls. Please try again.</p>
            </div>`;
    } finally {
        hideLoading();
    }
};

/**
 * Loads and displays the details for a specific poll.
 * @param {string} pollId - The ID of the poll.
 */
async function loadPollDetail(pollId) {
    showLoading();
    try {
        const pollData = await api.fetchPoll(pollId);
        if (pollData) {
            const hasVoted = hasUserVoted(pollData.id); // Use pollData.id
            renderPollDetail(pollData, hasVoted);

            if (!hasVoted) {
                const voteForm = document.getElementById('vote-form');
                if (voteForm) {
                    voteForm.addEventListener('submit', (event) => handleVoteSubmit(event, pollId));
                }
            }
        } else { // Poll not found or could not be loaded
            showToast('Poll not found or could not be loaded.', 'error');
            setTimeout(() => { window.location.hash = ''; }, 2000); // Redirect to home after a short delay
        }
    } catch (error) {
        console.error('Error loading poll details:', error);
        showToast(error.message || 'Failed to load poll details.', 'error');
        document.getElementById('poll-detail').innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fas fa-exclamation-circle text-5xl mb-4"></i>
                <p class="text-lg">Error loading poll details.</p>
            </div>`;
        setTimeout(() => { window.location.hash = ''; }, 2000); // Redirect to home after a short delay
    } finally {
        hideLoading();
    }
}

/**
 * Handles the routing based on the URL hash.
 */
function handleRouting() {
    const hash = window.location.hash;
    if (hash.startsWith('#/polls/')) {
        const pollId = hash.substring('#/polls/'.length);
         // Hide other sections before loading poll detail
        document.getElementById('poll-list').classList.add('hidden');
        document.getElementById('create-poll-form').classList.add('hidden');
        document.getElementById('admin-login-form').classList.add('hidden');
        document.getElementById('poll-detail').classList.remove('hidden');
        loadPollDetail(pollId);
    } else {
         // Hide other sections before showing poll list
        document.getElementById('create-poll-form').classList.add('hidden');
        document.getElementById('admin-login-form').classList.add('hidden');
        document.getElementById('poll-detail').classList.add('hidden');
        document.getElementById('poll-list').classList.remove('hidden');
        loadPollList();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');

    // Initial load and routing setup
    window.addEventListener('hashchange', handleRouting);
    handleRouting();

    // Set up search and filter
    const searchInput = document.getElementById('search-polls');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const searchTerm = e.target.value.toLowerCase();
                showLoading();
                try {
                    const polls = await api.fetchPolls();
                    if (polls) {
                        const filteredPolls = polls.filter(poll =>
                            poll.question.toLowerCase().includes(searchTerm) ||
                            poll.options.some(opt => opt.toLowerCase().includes(searchTerm))
                        );
                        renderPollList(filteredPolls);
                    } else {
                         showToast('No polls found matching your search.', 'info');
                          renderPollList([]); // Render empty list
                    }
                } catch (error) {
                    console.error('Error searching polls:', error);
                    showToast('Error searching polls. Please try again.', 'error');
                     renderPollList([]); // Render empty list on error
                } finally {
                    hideLoading();
                }
            }, 300); // Debounce search
        });
    }

    // Set up sort
    const sortSelect = document.getElementById('sort-polls');
    if (sortSelect) {
        sortSelect.addEventListener('change', async () => {
            showLoading();
            try {
                const polls = await api.fetchPolls();
                if (polls) {
                    renderPollList(polls);
                } else {
                     showToast('Could not load polls for sorting.', 'error');
                      renderPollList([]); // Render empty list on error
                }
            } catch (error) {
                console.error('Error sorting polls:', error);
                showToast('Error sorting polls. Please try again.', 'error');
                 renderPollList([]); // Render empty list on error
            } finally {
                hideLoading();
            }
        });
    }

    // Set up create poll button and form toggling
    const createPollBtn = document.getElementById('create-poll-btn');
    const cancelCreatePollBtns = document.querySelectorAll('#cancel-create-poll'); // Use querySelectorAll as there are two cancel buttons
    const adminLoginForm = document.getElementById('admin-login-form');
    const loginForm = document.getElementById('login-form');

    if (createPollBtn) {
        createPollBtn.addEventListener('click', showCreatePollForm); // Call showCreatePollForm
    }

    // Add listeners to all cancel buttons
    cancelCreatePollBtns.forEach(btn => {
        btn.addEventListener('click', hideAllFormsAndShowPollList); // Call hideAllFormsAndShowPollList
    });

    // Handle Admin Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();

            const usernameInput = document.getElementById('admin-username');
            const passwordInput = document.getElementById('admin-password');

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                showToast('Please enter both username and password.', 'error');
                hideLoading();
                return;
            }

            try {
                const result = await api.adminLogin(username, password);
                if (result && result.success) {
                    setAdminLoggedIn(true);
                    showToast('Admin login successful!', 'success');
                    showCreatePollForm(); // Show create form after login
                } else {
                    throw new Error(result.error || 'Login failed');
                }
            } catch (error) {
                console.error('Error during admin login:', error);
                 let errorMessage = 'Admin login failed. ';
                 if (error.message) {
                     errorMessage += error.message;
                 }
                showToast(errorMessage, 'error');
            } finally {
                hideLoading();
            }
        });
    }

    // Set up new poll form submission (modified to include auth)
    const newPollForm = document.getElementById('new-poll-form');
    const addOptionBtn = document.getElementById('add-option-btn');
    const removeOptionBtn = document.getElementById('remove-option-btn');

    if (addOptionBtn) {
        addOptionBtn.addEventListener('click', addOptionInput);
    }
    if (removeOptionBtn) {
        removeOptionBtn.addEventListener('click', removeOptionInput);
    }

    if (newPollForm) {
        newPollForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();

            if (!isAdminLoggedIn()) {
                 showToast('You must be logged in as admin to create a poll.', 'error');
                 hideLoading();
                 return;
            }

            const questionInput = document.getElementById('poll-question');
            const optionInputs = document.querySelectorAll('#options-container textarea[name="options[]"]');

            const question = questionInput.value.trim();
            const options = Array.from(optionInputs)
                .map(textarea => textarea.value.trim())
                .filter(option => option !== '');

            if (!question) {
                 showToast('Poll question cannot be empty.', 'error');
                 hideLoading();
                 return;
            }

            if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
                 showToast(`Please provide between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.`, 'error');
                 hideLoading();
                 return;
            }

            try {
                // For this example, we'll retrieve username/password from the login form inputs directly.
                // In a real app, you'd use a token stored after successful login.
                const username = document.getElementById('admin-username').value; 
                const password = document.getElementById('admin-password').value; 

                // Manually construct fetch call with Basic Authentication
                const response = await fetch(`${API_BASE_URL}/polls`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + btoa(username + ':' + password) // Basic Auth header
                    },
                    body: JSON.stringify({ question, options })
                });

                 if (!response.ok) {
                     const errorData = await response.json();
                     throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                 }

                 const responseData = await response.json();

                if (responseData && responseData.id) { // Check for id in successful response
                    hideAllFormsAndShowPollList();
                    await loadPollList();
                    showToast('Poll created successfully!', 'success');
                } else {
                     showToast('Failed to create poll: Invalid response format.', 'error');
                }
            } catch (error) {
                console.error('Error creating poll:', error);
                let errorMessage = 'Failed to create poll. ';
                if (error.message) {
                    errorMessage += error.message;
                } else if (error.response) {
                    try {
                        const errorData = await error.response.json();
                        errorMessage += errorData.error || 'Unknown error occurred';
                    } catch (e) {
                         errorMessage += `HTTP error! status: ${error.response.status}`;
                    }
                } else {
                     errorMessage += 'Network error or server not reachable.';
                }
                showToast(errorMessage, 'error');
            } finally {
                hideLoading();
            }
        });
    }

    // Set up export button
    const exportPollsBtn = document.getElementById('export-polls-btn');
    if (exportPollsBtn) {
        exportPollsBtn.addEventListener('click', async () => {
            showLoading();
            try {
                const polls = await api.fetchPolls();
                if (polls && polls.length > 0) {
                    // Format data for CSV
                    let csvContent = "Question,Options,Total Votes,Created At\n"; // CSV Header
                    polls.forEach(poll => {
                        // Escape double quotes by replacing them with two double quotes
                        const escapeCsv = (value) => `"${value.replace(/"/g, '""')}"`;

                        const question = escapeCsv(poll.question);
                        const options = escapeCsv(poll.options.join(', ')); // Join options with comma, then escape
                        const totalVotes = poll.total_votes;
                        const createdAt = poll.created_at;
                        csvContent += `${question},${options},${totalVotes},${createdAt}\n`;
                    });

                    // Create a Blob with the CSV data
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

                    // Create a download link
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute('download', 'polls_export.csv');

                    // Append link to body, click it, and remove it
                    document.body.appendChild(link);
                    link.click();

                    // Clean up the object URL after a short delay to allow download
                    setTimeout(() => URL.revokeObjectURL(link.href), 7000);

                    document.body.removeChild(link);

                    showToast('Poll data exported successfully!', 'success');

                } else if (polls && polls.length === 0) {
                    showToast('No polls to export.', 'info');
                } else {
                     throw new Error('Could not fetch polls for export.');
                }
            } catch (error) {
                console.error('Error exporting polls:', error);
                showToast(error.message || 'Failed to export polls. Please try again.', 'error');
            } finally {
                hideLoading();
            }
        });
    }
}); 