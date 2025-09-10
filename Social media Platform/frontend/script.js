// Global variables
const API_BASE_URL = 'http://127.0.0.1:8000/api';
let currentUser = null;
let authToken = null;

// DOM elements
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const postsContainer = document.getElementById('posts-container');
const postContent = document.getElementById('post-content');
const createPostBtn = document.getElementById('create-post-btn');
const postImage = document.getElementById('post-image');
const currentUsername = document.getElementById('current-username');
const currentUserBio = document.getElementById('current-user-bio');
const loadingSpinner = document.getElementById('loading-spinner');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Skip authentication - go directly to dashboard
    // Create a default user
    currentUser = {
        id: 1,
        username: 'Alex Thompson',
        email: 'alex@socialapp.com',
        first_name: 'Alex',
        last_name: 'Thompson'
    };
    authToken = 'guest-token';
    
    // Store in localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('authToken', authToken);
    
    // Show dashboard immediately
    showDashboard();
    loadUserProfile();
    loadPosts();
}

function setupEventListeners() {
    // Auth form tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchAuthTab(this.dataset.tab);
        });
    });

    // Auth forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Navigation
    document.getElementById('logout-link').addEventListener('click', handleLogout);

    // Post creation
    createPostBtn.addEventListener('click', handleCreatePost);
    postImage.addEventListener('change', handleImagePreview);

    // Sidebar navigation
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchSection(this.dataset.section);
        });
    });

    // Mobile navigation toggle
    document.getElementById('nav-toggle').addEventListener('click', toggleMobileNav);

    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Authentication functions
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            currentUser = data.user;
            authToken = data.token;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
            showDashboard();
            loadUserProfile();
            loadPosts();
            clearAuthForms();
        } else {
            errorDiv.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        hideLoading();
        errorDiv.textContent = 'Network error. Please try again.';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = {
        username: document.getElementById('register-username').value,
        email: document.getElementById('register-email').value,
        first_name: document.getElementById('register-firstname').value,
        last_name: document.getElementById('register-lastname').value,
        password: document.getElementById('register-password').value
    };
    const errorDiv = document.getElementById('register-error');

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            errorDiv.textContent = 'Registration successful! Please login.';
            switchAuthTab('login');
        } else {
            errorDiv.textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        hideLoading();
        errorDiv.textContent = 'Network error. Please try again.';
    }
}

function handleLogout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    showAuth();
}

// UI functions
function showAuth() {
    authContainer.classList.remove('hidden');
    dashboard.classList.add('hidden');
}

function showDashboard() {
    authContainer.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

function clearAuthForms() {
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
}

function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

// Post functions
async function handleCreatePost() {
    const content = postContent.value.trim();
    if (!content) return;

    try {
        // Create a new post object
        const newPost = {
            id: Date.now(), // Temporary ID
            author: { 
                username: currentUser.username, 
                first_name: currentUser.first_name, 
                last_name: currentUser.last_name 
            },
            content: content,
            created_at: new Date().toISOString(),
            likes_count: 0,
            comments: [],
            is_liked: false
        };

        // Add post to the UI immediately (at the top)
        const postElement = createPostElement(newPost);
        postsContainer.insertBefore(postElement, postsContainer.firstChild);

        // Clear form
        postContent.value = '';
        postImage.value = '';

        // Show success message
        const createPostBtn = document.getElementById('create-post-btn');
        const originalText = createPostBtn.innerHTML;
        createPostBtn.innerHTML = '<i class="fas fa-check"></i> Posted!';
        createPostBtn.style.background = '#28a745';
        
        setTimeout(() => {
            createPostBtn.innerHTML = originalText;
            createPostBtn.style.background = '';
        }, 2000);

    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
    }
}

async function loadPosts() {
    try {
        showLoading();
        
        // Add sample posts if no posts exist
        const samplePosts = [
            {
                id: 1,
                author: { username: 'Sarah Johnson', first_name: 'Sarah', last_name: 'Johnson' },
                content: 'Just finished an amazing hike in the mountains! The view was absolutely breathtaking. 🏔️✨ #nature #hiking #adventure',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                likes_count: 24,
                comments: [
                    {
                        id: 1,
                        author: { username: 'Mike Chen', first_name: 'Mike', last_name: 'Chen' },
                        content: 'Wow, that looks incredible! Where was this?',
                        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: 2,
                        author: { username: 'Emma Wilson', first_name: 'Emma', last_name: 'Wilson' },
                        content: 'I need to go there! Adding to my bucket list 📝',
                        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
                    }
                ],
                is_liked: false
            },
            {
                id: 2,
                author: { username: 'Alex Rodriguez', first_name: 'Alex', last_name: 'Rodriguez' },
                content: 'Working on a new project and feeling super inspired! Sometimes the best ideas come when you least expect them. 💡 #coding #inspiration #work',
                created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                likes_count: 18,
                comments: [
                    {
                        id: 3,
                        author: { username: 'David Kim', first_name: 'David', last_name: 'Kim' },
                        content: 'What kind of project are you working on?',
                        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                    }
                ],
                is_liked: true
            },
            {
                id: 3,
                author: { username: 'Lisa Park', first_name: 'Lisa', last_name: 'Park' },
                content: 'Coffee and code - the perfect combination for a productive day! ☕️💻 #coffee #coding #productivity',
                created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                likes_count: 31,
                comments: [],
                is_liked: false
            },
            {
                id: 4,
                author: { username: 'Tom Anderson', first_name: 'Tom', last_name: 'Anderson' },
                content: 'Just discovered this amazing new restaurant downtown. The food was absolutely delicious! 🍽️✨ #foodie #restaurant #downtown',
                created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
                likes_count: 15,
                comments: [
                    {
                        id: 4,
                        author: { username: 'Maria Garcia', first_name: 'Maria', last_name: 'Garcia' },
                        content: 'What\'s the name of the restaurant? I\'d love to try it!',
                        created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: 5,
                        author: { username: 'Tom Anderson', first_name: 'Tom', last_name: 'Anderson' },
                        content: 'It\'s called "The Garden Bistro" on Main Street!',
                        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
                    }
                ],
                is_liked: false
            }
        ];
        
        postsContainer.innerHTML = '';
        samplePosts.forEach(post => {
            postsContainer.appendChild(createPostElement(post));
        });
        
    } catch (error) {
        console.error('Error loading posts:', error);
    } finally {
        hideLoading();
    }
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="post-author">
                <h4>${post.author.username}</h4>
                <div class="post-time">${formatDate(post.created_at)}</div>
            </div>
            ${post.author.id === currentUser.id ? `
                <div class="post-options">
                    <button class="post-options-btn" onclick="deletePost(${post.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
        <div class="post-content">${post.content}</div>
        ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
        <div class="post-actions">
            <div class="post-stats">
                <div class="post-stat ${post.is_liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    <i class="fas fa-heart"></i>
                    <span>${post.likes_count}</span>
                </div>
                <div class="post-stat" onclick="showComments(${post.id})">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments.length}</span>
                </div>
            </div>
            <button class="btn btn-secondary" onclick="showComments(${post.id})">
                <i class="fas fa-comment"></i> Comment
            </button>
        </div>
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
            <div class="comment-form">
                <input type="text" class="comment-input" placeholder="Write a comment..." id="comment-input-${post.id}">
                <button class="btn btn-primary" onclick="addComment(${post.id})">Post</button>
            </div>
            <div class="comments-list" id="comments-list-${post.id}">
                ${post.comments.map(comment => createCommentElement(comment)).join('')}
            </div>
        </div>
    `;
    return postDiv;
}

function createCommentElement(comment) {
    return `
        <div class="comment">
            <div class="comment-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="comment-content">
                <div class="comment-author">${comment.author.username}</div>
                <div class="comment-text">${comment.content}</div>
                <div class="comment-time">${formatDate(comment.created_at)}</div>
            </div>
        </div>
    `;
}

async function toggleLike(postId) {
    try {
        // Find the post element
        const postElement = document.querySelector(`[data-post-id="${postId}"]`) || 
                          document.querySelector(`.post-card:nth-child(${Array.from(document.querySelectorAll('.post-card')).findIndex(card => card.innerHTML.includes(`toggleLike(${postId})`)) + 1})`);
        
        if (!postElement) return;

        const likeButton = postElement.querySelector('.post-stat');
        const likeCountElement = likeButton.querySelector('span');
        
        if (!likeButton || !likeCountElement) return;

        const isCurrentlyLiked = likeButton.classList.contains('liked');
        const currentCount = parseInt(likeCountElement.textContent) || 0;

        // Update UI immediately
        if (isCurrentlyLiked) {
            likeButton.classList.remove('liked');
            likeCountElement.textContent = Math.max(0, currentCount - 1);
        } else {
            likeButton.classList.add('liked');
            likeCountElement.textContent = currentCount + 1;
        }

        // Add animation effect
        likeButton.style.transform = 'scale(1.2)';
        setTimeout(() => {
            likeButton.style.transform = 'scale(1)';
        }, 200);

    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

async function addComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const content = commentInput.value.trim();
    if (!content) return;

    try {
        // Create a new comment object
        const newComment = {
            id: Date.now(), // Temporary ID
            author: { 
                username: currentUser.username, 
                first_name: currentUser.first_name, 
                last_name: currentUser.last_name 
            },
            content: content,
            created_at: new Date().toISOString()
        };

        // Add comment to the UI immediately
        const commentsList = document.getElementById(`comments-list-${postId}`);
        if (commentsList) {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <div class="comment-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="comment-content">
                    <div class="comment-author">${newComment.author.username}</div>
                    <div class="comment-text">${newComment.content}</div>
                    <div class="comment-time">${formatDate(newComment.created_at)}</div>
                </div>
            `;
            commentsList.appendChild(commentElement);
        }

        // Clear input
        commentInput.value = '';

        // Update comment count
        const commentCountElement = document.querySelector(`[onclick="showComments(${postId})"] span`);
        if (commentCountElement) {
            const currentCount = parseInt(commentCountElement.textContent) || 0;
            commentCountElement.textContent = currentCount + 1;
        }

    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to add comment. Please try again.');
    }
}

function showComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
    } else {
        commentsSection.style.display = 'none';
    }
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            loadPosts();
        } else {
            alert('Failed to delete post');
        }
    } catch (error) {
        alert('Network error');
    }
}

// User profile functions
async function loadUserProfile() {
    if (!currentUser) return;
    
    currentUsername.textContent = currentUser.username;
    currentUserBio.textContent = 'Passionate about technology, design, and connecting with amazing people! 🚀✨';
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const userProfile = await response.json();
        
        if (userProfile && userProfile.bio) {
            currentUserBio.textContent = userProfile.bio;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Navigation functions
function switchSection(section) {
    document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    switch (section) {
        case 'feed':
            loadPosts();
            break;
        case 'discover':
            loadDiscover();
            break;
        case 'profile':
            loadUserPosts();
            break;
    }
}

async function loadDiscover() {
    // Load all posts for discovery
    loadPosts();
}

async function loadUserPosts() {
    if (!currentUser) return;
    
    try {
        showLoading();
        
        // Create sample user posts
        const userPosts = [
            {
                id: 5,
                author: { username: currentUser.username, first_name: currentUser.first_name, last_name: currentUser.last_name },
                content: 'Just finished building this amazing social media platform! The journey has been incredible. 🚀✨ #coding #webdev #socialmedia',
                created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                likes_count: 12,
                comments: [
                    {
                        id: 6,
                        author: { username: 'Sarah Johnson', first_name: 'Sarah', last_name: 'Johnson' },
                        content: 'This looks amazing! Great work! 👏',
                        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
                    }
                ],
                is_liked: false
            },
            {
                id: 6,
                author: { username: currentUser.username, first_name: currentUser.first_name, last_name: currentUser.last_name },
                content: 'Working on some exciting new features for the platform. Can\'t wait to share them with everyone! 💡 #development #features #excited',
                created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
                likes_count: 8,
                comments: [],
                is_liked: true
            },
            {
                id: 7,
                author: { username: currentUser.username, first_name: currentUser.first_name, last_name: currentUser.last_name },
                content: 'Coffee break time! ☕️ Perfect moment to reflect on the progress made today. #coffee #break #reflection',
                created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
                likes_count: 15,
                comments: [
                    {
                        id: 7,
                        author: { username: 'Mike Chen', first_name: 'Mike', last_name: 'Chen' },
                        content: 'Coffee and coding - the perfect combination!',
                        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
                    }
                ],
                is_liked: false
            }
        ];
        
        postsContainer.innerHTML = `
            <div class="profile-header" style="background: white; border-radius: 24px; padding: 32px; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);">
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                    <div style="font-size: 60px; color: #667eea;">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; color: #333; font-size: 28px;">${currentUser.username}</h2>
                        <p style="margin: 5px 0; color: #666; font-size: 16px;">${currentUser.email}</p>
                        <p style="margin: 10px 0; color: #333; font-size: 16px;">Passionate about technology, design, and connecting with amazing people! 🚀✨</p>
                    </div>
                </div>
                <div style="display: flex; gap: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #667eea;">${userPosts.length}</div>
                        <div style="color: #666; font-size: 14px;">Posts</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #667eea;">127</div>
                        <div style="color: #666; font-size: 14px;">Followers</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #667eea;">89</div>
                        <div style="color: #666; font-size: 14px;">Following</div>
                    </div>
                </div>
            </div>
            <h3 style="color: #333; margin-bottom: 20px;">Your Posts</h3>
        `;
        
        userPosts.forEach(post => {
            postsContainer.appendChild(createPostElement(post));
        });
    } catch (error) {
        console.error('Error loading user posts:', error);
    } finally {
        hideLoading();
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

function toggleMobileNav() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.toggle('active');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function handleImagePreview(event) {
    const file = event.target.files[0];
    if (file) {
        // You can add image preview functionality here
        console.log('Image selected:', file.name);
    }
}
