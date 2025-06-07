import uuid
from flask import Blueprint, jsonify, request
from datetime import datetime
import re
import json
import os

polls_bp = Blueprint('polls', __name__)

# In-memory storage for polls and votes
POLLS_FILE = 'polls.json'
VOTES_FILE = 'votes.json'

# Hardcoded Admin Credentials (Replace with secure method in production)
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin')

def load_data():
    """Load polls and votes data from JSON files"""
    polls = {}
    votes = {}

    # Ensure the data directory exists
    data_dir = 'data'
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    polls_path = os.path.join(data_dir, POLLS_FILE)
    votes_path = os.path.join(data_dir, VOTES_FILE)

    if os.path.exists(polls_path):
        try:
            with open(polls_path, 'r') as f:
                polls = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {polls_path}. Starting with empty polls.")
            polls = {}

    if os.path.exists(votes_path):
        try:
            with open(votes_path, 'r') as f:
                votes = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {votes_path}. Starting with empty votes.")
            votes = {}

    return polls, votes

def save_data(polls, votes):
    """Save polls and votes data to JSON files"""
     # Ensure the data directory exists
    data_dir = 'data'
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    polls_path = os.path.join(data_dir, POLLS_FILE)
    votes_path = os.path.join(data_dir, VOTES_FILE)

    with open(polls_path, 'w') as f:
        json.dump(polls, f, indent=2)

    with open(votes_path, 'w') as f:
        json.dump(votes, f, indent=2)

def validate_poll_data(data):
    """Validate poll creation data"""
    if not data or not isinstance(data, dict):
        return False, "Invalid poll data"

    question = data.get('question', '').strip()
    options = data.get('options', [])

    if not question:
        return False, "Poll question is required"

    if not isinstance(options, list) or len(options) < 2 or len(options) > 5:
        return False, "Poll must have between 2 and 5 options"

    if not all(isinstance(opt, str) and opt.strip() for opt in options):
        return False, "All options must be non-empty strings"

    if len(set(opt.lower() for opt in options)) != len(options):
        return False, "Duplicate options are not allowed"

    return True, None

def get_user_identifier():
    """Get a unique identifier for the user (IP + User-Agent)"""
    # Using a combination of IP and User-Agent is a simple approach for this lightweight tool
    # More robust methods would involve session management or user accounts
    ip = request.remote_addr
    user_agent = request.headers.get('User-Agent', '')
    return f"{ip}:{user_agent}"

@polls_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """Handle admin login"""
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Username and password are required'}), 400

    username = data.get('username')
    password = data.get('password')

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        # In a real application, you would issue a token here
        return jsonify({'success': True, 'message': 'Login successful'}), 200
    else:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@polls_bp.route('/polls', methods=['GET'])
def get_polls():
    """Get all polls"""
    try:
        polls, _ = load_data()
        polls_list = [
            {
                'id': poll_id,
                'question': poll['question'],
                'options': poll['options'],
                'created_at': poll['created_at'],
                'total_votes': sum(poll['votes'])
            }
            for poll_id, poll in polls.items()
        ]
        return jsonify(polls_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@polls_bp.route('/polls/<poll_id>', methods=['GET'])
def get_poll(poll_id):
    """Get a specific poll by ID"""
    try:
        polls, votes = load_data()
        if poll_id not in polls:
            return jsonify({'error': 'Poll not found'}), 404

        poll = polls[poll_id]
        user_id = get_user_identifier()
        has_voted = user_id in votes.get(poll_id, [])

        return jsonify({
            'id': poll_id,
            'question': poll['question'],
            'options': poll['options'],
            'votes': poll['votes'],
            'created_at': poll['created_at'],
            'total_votes': sum(poll['votes']),
            'has_voted': has_voted
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@polls_bp.route('/polls', methods=['POST'])
def create_poll():
    """Create a new poll (Admin only)"""
    # Basic admin check: require username and password in header
    auth = request.authorization
    if not auth or auth.username != ADMIN_USERNAME or auth.password != ADMIN_PASSWORD:
         return jsonify({'error': 'Admin privileges required'}), 401 # Unauthorized

    try:
        data = request.get_json()
        is_valid, error_message = validate_poll_data(data)

        if not is_valid:
            return jsonify({'error': error_message}), 400

        polls, votes_data = load_data() # Load votes data as well
        poll_id = str(uuid.uuid4())

        new_poll = {
            'question': data['question'].strip(),
            'options': [opt.strip() for opt in data['options']],
            'votes': [0] * len(data['options']),
            'created_at': datetime.now().isoformat()
        }

        polls[poll_id] = new_poll
        save_data(polls, votes_data) # Save both polls and votes data

        return jsonify({
            'id': poll_id,
            'question': new_poll['question'],
            'options': new_poll['options'],
            'created_at': new_poll['created_at'],
            'success': True
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@polls_bp.route('/polls/<poll_id>/vote', methods=['POST'])
def vote_poll(poll_id):
    """Submit a vote for a poll"""
    try:
        data = request.get_json()
        if not data or 'option_index' not in data:
            return jsonify({'error': 'Option index is required'}), 400
        
        option_index = data['option_index']
        polls, votes = load_data()
        
        if poll_id not in polls:
            return jsonify({'error': 'Poll not found'}), 404
        
        poll = polls[poll_id]
        if not isinstance(option_index, int) or option_index < 0 or option_index >= len(poll['options']):
            return jsonify({'error': 'Invalid option index'}), 400
        
        user_id = get_user_identifier()
        if poll_id not in votes:
            votes[poll_id] = []
        
        if user_id in votes[poll_id]:
            return jsonify({'error': 'You have already voted on this poll'}), 400
        
        # Record the vote
        poll['votes'][option_index] += 1
        votes[poll_id].append(user_id)
        
        save_data(polls, votes)
        
        return jsonify({
            'success': True,
            'message': 'Vote recorded successfully',
            'total_votes': sum(poll['votes'])
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@polls_bp.route('/polls/<poll_id>', methods=['DELETE'])
def delete_poll(poll_id):
    """Delete a poll by ID"""
    try:
        polls, votes = load_data()

        if poll_id not in polls:
            return jsonify({'error': 'Poll not found'}), 404

        # Remove poll and associated votes
        del polls[poll_id]
        if poll_id in votes:
            del votes[poll_id]

        save_data(polls, votes) # Save updated data

        return jsonify({'success': True, 'message': 'Poll deleted successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Initialize with some sample polls if none exist
def init_sample_polls():
    polls, _ = load_data()
    if not polls:
        sample_polls = {
            str(uuid.uuid4()): {
                'question': 'What is your favorite color?',
                'options': ['Red', 'Blue', 'Green', 'Yellow', 'Purple'],
                'votes': [0, 0, 0, 0, 0],
                'created_at': datetime.now().isoformat()
            }
        }
        save_data(sample_polls, {})

# Initialize sample polls when the module is loaded
init_sample_polls() 