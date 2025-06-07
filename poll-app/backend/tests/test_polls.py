import unittest
import json
from app import app

class TestPollsAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        # Generate a test user ID
        self.test_user_id = 'test-user-123'
        self.headers = {
            'Content-Type': 'application/json',
            'X-User-ID': self.test_user_id
        }

    def test_get_polls(self):
        """Test getting all polls"""
        response = self.app.get('/polls', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check that we have at least 2 sample polls
        self.assertGreaterEqual(len(data), 2)
        
        # Check structure of first poll
        poll = data[0]
        self.assertIn('id', poll)
        self.assertIn('question', poll)
        self.assertIn('options', poll)
        self.assertIn('total_votes', poll)
        
        # Check that options are between 2 and 5
        self.assertGreaterEqual(len(poll['options']), 2)
        self.assertLessEqual(len(poll['options']), 5)

    def test_get_single_poll(self):
        """Test getting a single poll"""
        # First get all polls to get a valid poll ID
        response = self.app.get('/polls', headers=self.headers)
        poll_id = json.loads(response.data)[0]['id']
        
        response = self.app.get(f'/polls/{poll_id}', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check poll structure
        self.assertEqual(data['id'], poll_id)
        self.assertIn('question', data)
        self.assertIn('options', data)
        self.assertIn('results', data)
        self.assertIn('total_votes', data)
        self.assertIn('has_voted', data)
        self.assertIn('user_vote', data)
        
        # Check results structure
        result = data['results'][0]
        self.assertIn('option', result)
        self.assertIn('votes', result)
        self.assertIn('percentage', result)

    def test_create_poll_validation(self):
        """Test poll creation validation"""
        # Test missing question
        response = self.app.post('/polls',
            headers=self.headers,
            json={'options': ['Option 1', 'Option 2']}
        )
        self.assertEqual(response.status_code, 400)
        
        # Test too few options
        response = self.app.post('/polls',
            headers=self.headers,
            json={'question': 'Test?', 'options': ['Option 1']}
        )
        self.assertEqual(response.status_code, 400)
        
        # Test too many options
        response = self.app.post('/polls',
            headers=self.headers,
            json={
                'question': 'Test?',
                'options': ['1', '2', '3', '4', '5', '6']
            }
        )
        self.assertEqual(response.status_code, 400)
        
        # Test duplicate options
        response = self.app.post('/polls',
            headers=self.headers,
            json={
                'question': 'Test?',
                'options': ['Option 1', 'Option 1']
            }
        )
        self.assertEqual(response.status_code, 400)
        
        # Test valid poll creation
        response = self.app.post('/polls',
            headers=self.headers,
            json={
                'question': 'Test Question?',
                'options': ['Option 1', 'Option 2']
            }
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('id', data)

    def test_vote_validation(self):
        """Test vote validation"""
        # Create a test poll
        response = self.app.post('/polls',
            headers=self.headers,
            json={
                'question': 'Test Question?',
                'options': ['Option 1', 'Option 2']
            }
        )
        poll_id = json.loads(response.data)['id']
        
        # Test missing option_index
        response = self.app.post(f'/polls/{poll_id}/vote',
            headers=self.headers,
            json={'user_id': self.test_user_id}
        )
        self.assertEqual(response.status_code, 400)
        
        # Test invalid option_index
        response = self.app.post(f'/polls/{poll_id}/vote',
            headers=self.headers,
            json={
                'option_index': 999,
                'user_id': self.test_user_id
            }
        )
        self.assertEqual(response.status_code, 400)
        
        # Test missing user_id
        response = self.app.post(f'/polls/{poll_id}/vote',
            headers=self.headers,
            json={'option_index': 0}
        )
        self.assertEqual(response.status_code, 400)

    def test_duplicate_vote_prevention(self):
        """Test that users can't vote twice on the same poll"""
        # Create a test poll
        response = self.app.post('/polls',
            headers=self.headers,
            json={
                'question': 'Test Question?',
                'options': ['Option 1', 'Option 2']
            }
        )
        poll_id = json.loads(response.data)['id']
        
        # Submit first vote
        response = self.app.post(f'/polls/{poll_id}/vote',
            headers=self.headers,
            json={
                'option_index': 0,
                'user_id': self.test_user_id
            }
        )
        self.assertEqual(response.status_code, 200)
        
        # Try to vote again
        response = self.app.post(f'/polls/{poll_id}/vote',
            headers=self.headers,
            json={
                'option_index': 1,
                'user_id': self.test_user_id
            }
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('already voted', data['message'].lower())

    def test_vote_counting(self):
        """Test that votes are counted correctly"""
        # Create a test poll
        response = self.app.post('/polls',
            headers=self.headers,
            json={
                'question': 'Test Question?',
                'options': ['Option 1', 'Option 2']
            }
        )
        poll_id = json.loads(response.data)['id']
        
        # Submit a vote
        response = self.app.post(f'/polls/{poll_id}/vote',
            headers=self.headers,
            json={
                'option_index': 0,
                'user_id': self.test_user_id
            }
        )
        self.assertEqual(response.status_code, 200)
        
        # Check vote count
        response = self.app.get(f'/polls/{poll_id}', headers=self.headers)
        data = json.loads(response.data)
        self.assertEqual(data['total_votes'], 1)
        self.assertEqual(data['results'][0]['votes'], 1)
        self.assertEqual(data['results'][1]['votes'], 0)

if __name__ == '__main__':
    unittest.main() 