window.startChat = function () {
  const chatSection = document.getElementById('chat-section');

  // Clear previous content (optional)
  chatSection.innerHTML = '';

  // Add message
  const msg = document.createElement('p');
  msg.textContent = 'This will be the chat section';
  msg.style.fontSize = '18px';
  msg.style.textAlign = 'center';
  msg.style.marginTop = '20px';

  chatSection.appendChild(msg);
};
