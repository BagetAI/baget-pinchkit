document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('waitlist-form');
  const messageElement = document.getElementById('form-message');
  const submitButton = document.getElementById('submit-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('email');
      const email = emailInput.value.trim();

      if (!email) {
        showMessage('Please enter a valid email address.', 'error');
        return;
      }

      // Disable the button during submission
      submitButton.disabled = true;
      submitButton.textContent = 'JOINING...';

      try {
        const response = await fetch('https://app.baget.ai/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyId: '0c7363b2-4fe0-40cb-82bb-d4cffb902bd6',
            email: email,
            name: 'PinchKit Lead'
          }),
        });

        if (response.ok) {
          showMessage('Success! You are on the priority waitlist.', 'success');
          form.reset();
        } else {
          const errorData = await response.json().catch(() => ({}));
          showMessage(errorData.message || 'Something went wrong. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Waitlist submission error:', error);
        showMessage('Network error. Please try again later.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'JOIN THE LIST';
      }
    });
  }

  function showMessage(text, type) {
    messageElement.textContent = text;
    messageElement.className = 'form-message ' + type;
  }
});
