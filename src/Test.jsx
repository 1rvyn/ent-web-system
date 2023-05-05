import React, { useState } from 'react';

function Test(props) {
  const [message, setMessage] = useState('');
  const { isLoggedIn } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('https://irvyn.love/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to submit message');
      }

      setMessage('');
      alert('Message submitted successfully');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Message:
          <input type="text" value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

export default Test;
