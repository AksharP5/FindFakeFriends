// Add JSZip via CDN dynamically
(function() {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  script.onload = initializeApp;
  document.head.appendChild(script);
})();

function initializeApp() {
  const fileInput = document.getElementById('zipFile');
  const analyzeButton = document.getElementById('analyzeBtn');
  const resetButton = document.getElementById('resetBtn');
  const resultsSection = document.getElementById('results');
  const dropZone = document.getElementById('dropZone');
  const fileNameDisplay = document.getElementById('fileName');
  let errorDisplay = document.getElementById('errorMsg');

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventType => {
    dropZone.addEventListener(eventType, preventDragDefaults, false);
  });

  function preventDragDefaults(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventType => {
    dropZone.addEventListener(eventType, () => dropZone.classList.add('drag-over'), false);
  });

  ['dragleave', 'drop'].forEach(eventType => {
    dropZone.addEventListener(eventType, () => dropZone.classList.remove('drag-over'), false);
  });

  dropZone.addEventListener('drop', event => {
    fileInput.files = event.dataTransfer.files;
    updateFileNameDisplay();
  }, false);

  function updateFileNameDisplay() {
    if (fileInput.files.length > 0) {
      fileNameDisplay.textContent = fileInput.files[0].name;
      fileNameDisplay.classList.add('visible');
    } else {
      fileNameDisplay.classList.remove('visible');
    }
  }

  fileInput.addEventListener('change', updateFileNameDisplay);

  if (!errorDisplay) {
    errorDisplay = document.createElement('div');
    errorDisplay.id = 'errorMsg';
    errorDisplay.className = 'error-message';
    errorDisplay.style.display = 'none';
    fileInput.parentNode.insertBefore(errorDisplay, fileInput.nextSibling);
  }

  function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.classList.add('error-message');
    errorDisplay.style.display = 'block';
    resultsSection.style.display = 'none';
  }

  function clearError() {
    errorDisplay.textContent = '';
    errorDisplay.classList.remove('error-message');
    errorDisplay.style.display = 'none';
  }

  function clearResults() {
    document.getElementById('fakeFriendsList').innerHTML = '';
    document.getElementById('notYourFriendsList').innerHTML = '';
    document.getElementById('trueFriendsList').innerHTML = '';
    resultsSection.style.display = 'none';
  }

  function resetApp() {
    fileInput.value = '';
    fileNameDisplay.classList.remove('visible');
    clearResults();
    clearError();
  }

  resetButton.onclick = resetApp;

  window.openTab = function(event, tabId) {
    Array.from(document.getElementsByClassName('tabcontent')).forEach(tab => {
      tab.style.display = 'none';
    });
    Array.from(document.getElementsByClassName('tablinks')).forEach(tab => {
      tab.className = tab.className.replace(' active', '');
    });
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.className += ' active';
  };

  window.addEventListener('DOMContentLoaded', () => {
    const defaultTab = document.getElementById('defaultTab');
    if (defaultTab) defaultTab.click();
  });

  analyzeButton.onclick = async function() {
    clearError();
    clearResults();
    const file = fileInput.files[0];
    if (!file) {
      showError('Please select your Instagram ZIP file.');
      return;
    }
    document.getElementById('loadingSpinner').style.display = 'block';
    try {
      const jszip = window.JSZip;
      const zip = await jszip.loadAsync(file);
      const fileNames = Object.keys(zip.files);
      const followersPath = fileNames.find(name =>
        name.endsWith('connections/followers_and_following/followers_1.html')
      );
      const followingPath = fileNames.find(name =>
        name.endsWith('connections/followers_and_following/following.html')
      );
      if (!followersPath || !followingPath) {
        showError('Could not find the required Instagram followers/following files in your ZIP.');
        return;
      }
      if (!followersPath.endsWith('.html') || !followingPath.endsWith('.html')) {
        showError('Please upload a ZIP with followers_1.html and following.html in the correct folder. JSON is not supported yet.');
        return;
      }
      const followersHtml = await zip.files[followersPath].async('string');
      const followingHtml = await zip.files[followingPath].async('string');
      const extractUsernames = html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return Array.from(doc.querySelectorAll('a[href*="instagram.com/"]'))
          .map(a => a.textContent.trim().toLowerCase())
          .filter(Boolean);
      };
      const followers = extractUsernames(followersHtml);
      const following = extractUsernames(followingHtml);
      const followersSet = new Set(followers);
      const followingSet = new Set(following);
      let notFollowingBack = following.filter(user => !followersSet.has(user));
      let notFollowedBack = followers.filter(user => !followingSet.has(user));
      let mutuals = followers.filter(user => followingSet.has(user));
      function updateCounts() {
        document.getElementById('fakeFriendsCount').textContent = notFollowingBack.length;
        document.getElementById('notYourFriendsCount').textContent = notFollowedBack.length;
        document.getElementById('trueFriendsCount').textContent = mutuals.length;
      }
      function renderUserList(users, container, type) {
        container.innerHTML = '';
        if (users.length === 0) {
          const emptyState = document.createElement('div');
          emptyState.className = `empty-state ${type}`;
          let message = '';
          switch(type) {
            case 'fake':
              message = 'No fake friends found! Everyone follows you back.';
              break;
            case 'notyour':
              message = 'You follow everyone back! No one-way relationships here.';
              break;
            case 'true':
              message = 'No mutual followers yet. Start following people to see them here!';
              break;
          }
          emptyState.textContent = message;
          container.appendChild(emptyState);
          return;
        }
        users.forEach((username, idx) => {
          const card = document.createElement('div');
          card.className = 'user-card';
          const profileLink = document.createElement('a');
          profileLink.href = `https://instagram.com/${username}`;
          profileLink.target = '_blank';
          profileLink.rel = 'noopener noreferrer';
          profileLink.className = 'username-link';
          profileLink.textContent = username;
          card.appendChild(profileLink);
          const actionButton = document.createElement('a');
          actionButton.target = '_blank';
          actionButton.rel = 'noopener noreferrer';
          actionButton.style.textDecoration = 'none';
          if (type === 'fake') {
            actionButton.href = `https://instagram.com/${username}`;
            actionButton.className = 'action-btn';
            actionButton.textContent = 'Unfollow';
          } else if (type === 'notyour') {
            actionButton.href = `https://instagram.com/${username}`;
            actionButton.className = 'action-btn follow';
            actionButton.textContent = 'Follow';
          } else if (type === 'true') {
            actionButton.href = `https://instagram.com/${username}`;
            actionButton.className = 'action-btn view';
            actionButton.textContent = 'View Profile';
          }
          card.appendChild(actionButton);
          const removeButton = document.createElement('button');
          removeButton.className = 'remove-btn';
          removeButton.innerHTML = '&times;';
          removeButton.title = 'Remove from list';
          removeButton.onclick = function() {
            if (type === 'fake') {
              notFollowingBack.splice(idx, 1);
              renderAll();
            } else if (type === 'notyour') {
              notFollowedBack.splice(idx, 1);
              renderAll();
            } else if (type === 'true') {
              mutuals.splice(idx, 1);
              renderAll();
            }
          };
          card.appendChild(removeButton);
          container.appendChild(card);
        });
      }
      function renderAll() {
        renderUserList(notFollowingBack, document.getElementById('fakeFriendsList'), 'fake');
        renderUserList(notFollowedBack, document.getElementById('notYourFriendsList'), 'notyour');
        renderUserList(mutuals, document.getElementById('trueFriendsList'), 'true');
        updateCounts();
      }
      renderAll();
      resultsSection.style.display = 'block';
    } catch (err) {
      showError('There was an error reading your ZIP file. Please try again.');
    } finally {
      document.getElementById('loadingSpinner').style.display = 'none';
    }
  };
}
