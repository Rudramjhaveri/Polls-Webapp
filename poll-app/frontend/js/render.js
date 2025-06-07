let currentChart = null; // Variable to hold the current Chart.js instance
const MAX_OPTIONS = 5;
const MIN_OPTIONS = 2;

/**
 * Shows or hides the poll creation form
 * @param {boolean} show - Whether to show or hide the form
 */
function toggleCreatePollForm(show) {
    const form = document.getElementById('create-poll-form');
    const pollList = document.getElementById('poll-list');
    const pollDetail = document.getElementById('poll-detail');
    
    if (show) {
        form.classList.remove('hidden');
        pollList.classList.add('hidden');
        pollDetail.classList.add('hidden');
        // Reset form
        document.getElementById('new-poll-form').reset();
        updateOptionButtons();
    } else {
        form.classList.add('hidden');
        pollList.classList.remove('hidden');
    }
}

/**
 * Updates the visibility of add/remove option buttons based on current option count
 */
function updateOptionButtons() {
    const optionsContainer = document.getElementById('options-container');
    const addButton = document.getElementById('add-option-btn');
    const removeButton = document.getElementById('remove-option-btn');
    const optionCount = optionsContainer.children.length;

    addButton.classList.toggle('hidden', optionCount >= MAX_OPTIONS);
    removeButton.classList.toggle('hidden', optionCount <= MIN_OPTIONS);
}

/**
 * Adds a new option input field to the poll creation form
 */
function addOptionInput() {
    const container = document.getElementById('options-container');
    const optionCount = container.children.length + 1;
    
    if (optionCount <= MAX_OPTIONS) {
        const div = document.createElement('div');
        div.className = 'option-input flex gap-2';
        div.innerHTML = `
            <textarea name="options[]" required rows="1"
                class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Option ${optionCount}"></textarea>
        `;
        container.appendChild(div);
        updateOptionButtons();
    }
}

/**
 * Removes the last option input field from the poll creation form
 */
function removeOptionInput() {
    const container = document.getElementById('options-container');
    if (container.children.length > MIN_OPTIONS) {
        container.removeChild(container.lastElementChild);
        updateOptionButtons();
    }
}

// Utility functions for UI
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `animate__animated animate__fadeInRight bg-${type === 'success' ? 'green' : 'red'}-500 text-white px-6 py-3 rounded-lg shadow-lg mb-4 flex items-center justify-between`;
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="ml-4 hover:text-gray-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('animate__fadeOutRight');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
    
    // Allow manual close
    toast.querySelector('button').addEventListener('click', () => {
        toast.classList.add('animate__fadeOutRight');
        setTimeout(() => toast.remove(), 300);
    });
}

/**
 * Renders the list of polls on the homepage.
 * @param {Array<Object>} polls - An array of poll objects.
 */
function renderPollList(polls) {
    const pollListContainer = document.getElementById('poll-list');
    const pollDetailContainer = document.getElementById('poll-detail');
    const createPollForm = document.getElementById('create-poll-form');

    pollListContainer.innerHTML = ''; // Clear previous list
    pollDetailContainer.innerHTML = ''; // Clear previous detail
    createPollForm.classList.add('hidden');
    pollListContainer.classList.remove('hidden');
    pollDetailContainer.classList.add('hidden');

    if (!polls || polls.length === 0) {
        pollListContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-poll text-gray-400 text-5xl mb-4"></i>
                <p class="text-gray-500 text-lg">No polls available. Create one to get started!</p>
            </div>`;
        return;
    }

    // Sort polls based on selected option
    const sortSelect = document.getElementById('sort-polls');
    const sortBy = sortSelect.value;
    polls.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'oldest':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'most-votes':
                return (b.total_votes || 0) - (a.total_votes || 0);
            case 'least-votes':
                return (a.total_votes || 0) - (b.total_votes || 0);
            default:
                return 0;
        }
    });

    polls.forEach((poll, index) => {
        const pollCard = document.createElement('div');
        pollCard.className = 'poll-card bg-white rounded-lg shadow-md p-6 animate__animated animate__fadeIn';
        pollCard.style.animationDelay = `${index * 100}ms`;
        
        const totalVotes = poll.total_votes || 0;
        const createdDate = new Date(poll.created_at).toLocaleDateString();
        
        pollCard.innerHTML = `
            <div class="flex flex-col h-full">
                <div class="flex-grow">
                    <h2 class="text-xl font-semibold mb-4 text-gray-800">${poll.question}</h2>
                    <ul class="space-y-2 mb-4">
                        ${poll.options.map(option => `
                            <li class="flex items-center text-gray-600">
                                <i class="fas fa-circle text-xs text-blue-500 mr-2"></i>
                                ${option}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-100">
                    <div class="flex justify-between items-center text-sm text-gray-500">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-chart-bar"></i>
                            <span>${totalVotes} votes</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-calendar"></i>
                            <span>${createdDate}</span>
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="progress-bar h-full bg-blue-500 rounded-full" 
                                style="width: ${Math.min((totalVotes / 100) * 100, 100)}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        pollCard.addEventListener('click', () => {
            window.location.hash = `#/polls/${poll.id}`;
        });
        
        pollListContainer.appendChild(pollCard);
    });
}

/**
 * Renders the detail view for a single poll.
 * @param {Object} pollData - The poll object with vote counts.
 * @param {boolean} hasVoted - Indicates if the user has already voted on this poll.
 */
function renderPollDetail(pollData, hasVoted) {
    const pollListContainer = document.getElementById('poll-list');
    const pollDetailContainer = document.getElementById('poll-detail');
    const createPollForm = document.getElementById('create-poll-form');

    pollListContainer.classList.add('hidden');
    createPollForm.classList.add('hidden');
    pollDetailContainer.classList.remove('hidden');
    pollDetailContainer.innerHTML = '';

    if (!pollData) {
        pollDetailContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
                <p class="text-red-500 text-lg">Could not load poll details.</p>
            </div>`;
        return;
    }

    const pollElement = document.createElement('div');
    pollElement.className = 'animate__animated animate__fadeIn flex flex-col lg:flex-row gap-6';

    const pollContent = document.createElement('div');
    pollContent.className = 'lg:w-1/2 flex-shrink-0';
    
    const totalVotes = pollData.total_votes || 0;
    const createdDate = new Date(pollData.created_at).toLocaleDateString();
    
    pollContent.innerHTML = `
        <div class="mb-6">
            <h2 class="text-3xl font-bold text-gray-800 mb-2">${pollData.question}</h2>
            <div class="flex items-center space-x-4 text-sm text-gray-500">
                <div class="flex items-center space-x-1">
                    <i class="fas fa-chart-bar"></i>
                    <span>${totalVotes} votes</span>
                </div>
                <div class="flex items-center space-x-1">
                    <i class="fas fa-calendar"></i>
                    <span>Created ${createdDate}</span>
                </div>
            </div>
        </div>
    `;

    if (hasVoted) {
        pollContent.innerHTML += `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate__animated animate__fadeIn">
                <div class="flex items-center space-x-2 text-green-600">
                    <i class="fas fa-check-circle text-xl"></i>
                    <p class="font-semibold">You have already voted on this poll.</p>
                </div>
            </div>
        `;
    } else {
        const optionsForm = document.createElement('form');
        optionsForm.id = 'vote-form';
        optionsForm.className = 'space-y-4 mb-6';
        
        pollData.options.forEach((option, index) => {
            optionsForm.innerHTML += `
                <div class="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors">
                    <input type="radio" id="option-${index}" name="pollOption" value="${index}" 
                        class="h-5 w-5 text-blue-600 focus:ring-blue-500">
                    <label for="option-${index}" class="ml-3 block text-gray-700 flex-grow cursor-pointer">
                        ${option}
                    </label>
                </div>
            `;
        });
        
        optionsForm.innerHTML += `
            <button type="submit" 
                class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                <i class="fas fa-vote-yea"></i>
                <span>Submit Vote</span>
            </button>
        `;
        
        pollContent.appendChild(optionsForm);
    }

    pollContent.innerHTML += `
        <button id="back-to-list-btn" 
            class="btn bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
            <i class="fas fa-arrow-left"></i>
            <span>Back to Poll List</span>
        </button>
    `;

    // Add Delete button
    pollContent.innerHTML += `
        <button id="delete-poll-btn" 
            class="btn bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 flex items-center space-x-2 mt-4">
            <i class="fas fa-trash-alt"></i>
            <span>Delete Poll</span>
        </button>
    `;

    pollElement.appendChild(pollContent);
    pollDetailContainer.appendChild(pollElement);

    // Add event listener for back button
    document.getElementById('back-to-list-btn').addEventListener('click', () => {
        window.location.hash = '';
    });

    // Add event listener for delete button
    const deletePollBtn = document.getElementById('delete-poll-btn');
    if (deletePollBtn) {
        deletePollBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this poll?')) {
                showLoading();
                try {
                    const result = await deletePoll(pollData.id);
                    if (result && result.success) {
                        showToast('Poll deleted successfully!', 'success');
                        window.location.hash = ''; // Go back to poll list
                    } else {
                        throw new Error(result.message || 'Failed to delete poll');
                    }
                } catch (error) {
                    console.error('Error deleting poll:', error);
                    showToast(error.message || 'Failed to delete poll. Please try again.', 'error');
                } finally {
                    hideLoading();
                }
            }
        });
    }

    // Render results chart if hasVoted or there are votes
    if (hasVoted || pollData.votes.some(v => v > 0)) {
        renderResultsChart(pollData);
    }
}

/**
 * Renders the Chart.js horizontal bar chart for poll results.
 * @param {Object} pollData - The poll object with vote counts.
 */
function renderResultsChart(pollData) {
     const pollDetailContainer = document.getElementById('poll-detail');

    // Create a container for the chart if it doesn't exist
    let chartContainer = document.getElementById('chart-container');
    if (!chartContainer) {
        chartContainer = document.createElement('div');
        chartContainer.id = 'chart-container';
        chartContainer.classList.add('lg:w-1/2', 'flex-shrink-0', 'mt-6', 'lg:mt-0'); // Add margin for spacing
        const pollElement = pollDetailContainer.querySelector('.flex-col');
        if (pollElement) {
             pollElement.appendChild(chartContainer);
        } else {
             pollDetailContainer.appendChild(chartContainer);
        }
    }

     // Create the canvas element for the chart
    let chartCanvas = document.getElementById('results-chart');
    if (!chartCanvas) {
        chartCanvas = document.createElement('canvas');
        chartCanvas.id = 'results-chart';
        chartContainer.appendChild(chartCanvas);
    }

    // Destroy the previous chart instance if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    const totalVotes = pollData.votes.reduce((sum, count) => sum + count, 0);

    const chartData = {
        labels: pollData.options,
        datasets: [{
            label: 'Votes',
            data: pollData.votes,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    const chartOptions = {
        indexAxis: 'y', // Display as horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                     // Ensure integers are displayed on the x-axis
                     callback: function(value) {
                         if (Number.isInteger(value)) {
                             return value;
                         }
                     },
                     stepSize: 1
                 },
                title: {
                    display: true,
                    text: 'Number of Votes'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.dataset.label || '';
                        const value = context.raw;
                        const percentage = totalVotes > 0 ? ((value / totalVotes) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };

    // Create the new chart
    currentChart = new Chart(chartCanvas,
        {
            type: 'bar',
            data: chartData,
            options: chartOptions
        }
    );

    // Add percentage labels to the DOM next to the chart bars if needed (Optional - Chart.js tooltips handle this)
    // This part would require more complex DOM manipulation or a plugin, sticking to tooltips for simplicity.
}

// Initialize event listeners for poll creation form
document.addEventListener('DOMContentLoaded', () => {
    const createPollBtn = document.getElementById('create-poll-btn');
    const cancelCreatePollBtn = document.getElementById('cancel-create-poll');
    const addOptionBtn = document.getElementById('add-option-btn');
    const removeOptionBtn = document.getElementById('remove-option-btn');
    const newPollForm = document.getElementById('new-poll-form');

    createPollBtn.addEventListener('click', () => toggleCreatePollForm(true));
    cancelCreatePollBtn.addEventListener('click', () => toggleCreatePollForm(false));
    addOptionBtn.addEventListener('click', addOptionInput);
    removeOptionBtn.addEventListener('click', removeOptionInput);

    newPollForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const question = document.getElementById('poll-question').value.trim();
        const options = Array.from(document.querySelectorAll('input[name="options[]"]'))
            .map(input => input.value.trim())
            .filter(option => option !== '');

        if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
            alert(`Please provide between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.`);
            return;
        }

        try {
            const response = await createPoll({ question, options });
            if (response && response.success) {
                // Hide the form
                toggleCreatePollForm(false);
                // Reload the poll list to show the new poll
                await loadPollList();
                // Show success message
                alert('Poll created successfully!');
            } else {
                throw new Error('Invalid response from server');
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
            }
            alert(errorMessage);
        }
    });

    // Add search functionality
    const searchInput = document.getElementById('search-polls');
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const polls = await fetchPolls();
        if (polls) {
            const filteredPolls = polls.filter(poll => 
                poll.question.toLowerCase().includes(searchTerm) ||
                poll.options.some(opt => opt.toLowerCase().includes(searchTerm))
            );
            renderPollList(filteredPolls);
        }
    });

    // Add sort functionality
    const sortSelect = document.getElementById('sort-polls');
    sortSelect.addEventListener('change', async () => {
        const polls = await fetchPolls();
        if (polls) {
            renderPollList(polls);
        }
    });

    // Add theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    });
}); 