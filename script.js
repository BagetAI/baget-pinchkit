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
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            name: 'PinchKit Lead',
            preferred_recipe: 'Trio Pack'
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success) {
          showMessage('Success! You are on the priority waitlist.', 'success');
          form.reset();
        } else {
          showMessage(data.error || 'Something went wrong. Please try again.', 'error');
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
