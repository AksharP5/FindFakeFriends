let followersHTML = '';
let followingHTML = '';

const followersInput = document.getElementById('followersFile');
const followingInput = document.getElementById('followingFile');
const resultList = document.getElementById('fakeFriendsList');

followersInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    followersHTML = e.target.result;
  };
  reader.readAsText(file);
});

followingInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    followingHTML = e.target.result;
  };
  reader.readAsText(file);
});

document.getElementById('clearBtn').addEventListener('click', () => {
  followersInput.value = '';
  followingInput.value = '';
  followersHTML = '';
  followingHTML = '';
  resultList.innerHTML = '';
});

function parseInstagramProfileLinks(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const links = [...doc.querySelectorAll('a[href^="https://www.instagram.com/"]')];
  return links.map(link => ({
    username: link.textContent.trim().toLowerCase(),
    profileUrl: link.href,
  }));
}

function getNonFollowers(following, followers) {
  const followerNames = new Set(followers.map(user => user.username));
  return following.filter(user => !followerNames.has(user.username));
}

document.getElementById('analyzeBtn').addEventListener('click', () => {
  resultList.innerHTML = '';

  if (!followersHTML || !followingHTML) {
    alert('Please upload both files before analyzing.');
    return;
  }

  const followers = parseInstagramProfileLinks(followersHTML);
  const following = parseInstagramProfileLinks(followingHTML);
  const nonFollowers = getNonFollowers(following, followers);

  if (nonFollowers.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Everyone you follow follows you back!';
    resultList.appendChild(li);
    return;
  }

  nonFollowers.forEach(user => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = user.profileUrl;
    a.target = '_blank';
    a.textContent = user.username;
    li.appendChild(a);
    resultList.appendChild(li);
  });
});
