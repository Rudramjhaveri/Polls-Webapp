# Lightweight Polling Tool

A simple, lightweight web-based polling application that allows users to create polls, vote, and view results in real-time. Built with Flask and vanilla JavaScript.

## Features

- Create polls with 2-5 options
- Vote on polls using radio buttons
- View results with Chart.js visualization
- Prevent duplicate voting using user tracking
- Responsive design with Tailwind CSS
- Real-time vote counting and percentages
- Simple in-memory data storage

## Tech Stack

- **Frontend:**
  - HTML5
  - CSS (Tailwind CSS)
  - Vanilla JavaScript (ES6+)
  - Chart.js for visualizations
- **Backend:**
  - Python 3.x
  - Flask
  - In-memory data storage

## Project Structure

```
poll-app/
├── backend/
│   ├── app.py              # Flask application
│   ├── routes/
│   │   └── polls.py        # Poll endpoints and data storage
│   └── tests/
│       └── test_polls.py   # Unit tests
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   └── styles.css      # Custom styles
│   └── js/
│       ├── api.js          # API client
│       ├── render.js       # UI rendering
│       └── main.js         # Application logic
└── requirements.txt        # Python dependencies
```

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd poll-app
```

2. Set up the Python virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
cd backend
python app.py
```

5. Open `frontend/index.html` in your web browser

## API Endpoints

### 1. Get All Polls
```bash
curl -X GET http://localhost:5000/polls \
  -H "X-User-ID: your-user-id"
```

Response:
```json
[
  {
    "id": "uuid",
    "question": "What is your favorite color?",
    "options": ["Red", "Blue", "Green", "Yellow"],
    "total_votes": 42
  }
]
```

### 2. Get Single Poll
```bash
curl -X GET http://localhost:5000/polls/<poll_id> \
  -H "X-User-ID: your-user-id"
```

Response:
```json
{
  "id": "uuid",
  "question": "What is your favorite color?",
  "options": ["Red", "Blue", "Green", "Yellow"],
  "results": [
    {
      "option": "Red",
      "votes": 15,
      "percentage": 35.7
    }
  ],
  "total_votes": 42,
  "has_voted": false,
  "user_vote": null
}
```

### 3. Create Poll
```bash
curl -X POST http://localhost:5000/polls \
  -H "Content-Type: application/json" \
  -H "X-User-ID: your-user-id" \
  -d '{
    "question": "What is your favorite programming language?",
    "options": ["Python", "JavaScript", "Java", "C++"]
  }'
```

Response:
```json
{
  "success": true,
  "id": "new-poll-uuid",
  "message": "Poll created successfully"
}
```

### 4. Submit Vote
```bash
curl -X POST http://localhost:5000/polls/<poll_id>/vote \
  -H "Content-Type: application/json" \
  -H "X-User-ID: your-user-id" \
  -d '{
    "option_index": 0,
    "user_id": "your-user-id"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "total_votes": 43
}
```

## Input Validation

### Poll Creation
- Question is required and must be less than 200 characters
- Must have between 2 and 5 options
- Each option must be a non-empty string less than 100 characters
- Duplicate options are not allowed

### Voting
- User can only vote once per poll
- Option index must be valid (0 to number of options - 1)
- User ID is required

## Sample Polls

The application comes pre-loaded with two sample polls:
1. "What is your favorite color?" (4 options)
2. "Which programming language do you prefer for web development?" (5 options)

## Testing

Run the test suite:
```bash
cd backend
python -m unittest tests/test_polls.py
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 404: Not Found
- 500: Server Error

## Browser Support

The application works in all modern browsers that support:
- ES6+ JavaScript
- Fetch API
- LocalStorage
- CSS Grid/Flexbox

## Notes

- The application uses in-memory storage, so data will be reset when the server restarts
- User IDs are stored in the browser's localStorage
- No authentication is required, but each user gets a unique ID
- The frontend is served statically for simplicity 