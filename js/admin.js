const GITHUB_OWNER = 'shutong20221229-rgb';
const GITHUB_REPO = 'vblog';
const BRANCH = 'main';

let githubToken = localStorage.getItem('github_token');
let posts = [];
let siteConfig = {};

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    if (githubToken) {
        showDashboard();
    }
});

// Login and Authentication
async function login() {
    const tokenInput = document.getElementById('github-token').value;
    if (!tokenInput) return alert('请输入 Token');

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
            headers: { 'Authorization': `token ${tokenInput}` }
        });

        if (response.ok) {
            localStorage.setItem('github_token', tokenInput);
            githubToken = tokenInput;
            showDashboard();
        } else {
            alert('验证失败，请检查 Token 或 仓库名是否正确');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('登录出错，请重试');
    }
}

function logout() {
    localStorage.removeItem('github_token');
    window.location.reload();
}

// UI Switching
async function showDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    await fetchData();
    renderPosts();
    populateConfig();
}

function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    
    if (sectionId === 'posts') {
        document.getElementById('posts-section').classList.add('active');
    } else if (sectionId === 'settings') {
        document.getElementById('settings-section').classList.add('active');
    } else if (sectionId === 'add-post') {
        clearPostForm();
        document.getElementById('post-form-section').classList.add('active');
    }
}

// Data Fetching via GitHub API
async function fetchData() {
    posts = await getFileContent('data/posts.json');
    siteConfig = await getFileContent('data/config.json');
}

async function getFileContent(path) {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${BRANCH}`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        const data = await response.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error fetching ${path}:`, error);
        return [];
    }
}

// Rendering
function renderPosts() {
    const list = document.getElementById('admin-posts-list');
    list.innerHTML = '';

    posts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'admin-post-item glass';
        item.innerHTML = `
            <div class="post-info">
                <h3>${post.title}</h3>
                <p>${post.date} | ${post.category}</p>
            </div>
            <div class="post-actions">
                <button class="btn btn-sm" onclick="editPost(${post.id})">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="deletePost(${post.id})">删除</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function populateConfig() {
    document.getElementById('config-title').value = siteConfig.siteTitle || '';
    document.getElementById('config-hero-title').value = siteConfig.heroTitle || '';
    document.getElementById('config-hero-subtitle').value = siteConfig.heroSubtitle || '';
}

// Save Content via GitHub API
async function saveToGithub(path, content, message) {
    try {
        // 1. Get current SHA
        const getFile = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${BRANCH}`, {
            headers: { 'Authorization': `token ${githubToken}` }
        });
        const fileData = await getFile.json();
        const sha = fileData.sha;

        // 2. Put new content
        const body = {
            message: message,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
            sha: sha,
            branch: BRANCH
        };

        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            showToast('已保存并开始发布...');
            return true;
        } else {
            alert('保存失败，请检查网络或 Token 权限');
            return false;
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('保存过程中出错');
        return false;
    }
}

// Post CRUD
function clearPostForm() {
    document.getElementById('form-title').innerText = '撰写新文章';
    document.getElementById('edit-post-id').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-category').value = 'Moments';
    document.getElementById('post-image').value = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1000';
    document.getElementById('post-excerpt').value = '';
    document.getElementById('post-content').value = '';
}

function editPost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    document.getElementById('form-title').innerText = '编辑文章';
    document.getElementById('edit-post-id').value = post.id;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-category').value = post.category;
    document.getElementById('post-image').value = post.image;
    document.getElementById('post-excerpt').value = post.excerpt;
    document.getElementById('post-content').value = post.content;

    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('post-form-section').classList.add('active');
}

async function savePost() {
    const idValue = document.getElementById('edit-post-id').value;
    const title = document.getElementById('post-title').value;
    const category = document.getElementById('post-category').value;
    const image = document.getElementById('post-image').value;
    const excerpt = document.getElementById('post-excerpt').value;
    const content = document.getElementById('post-content').value;

    if (!title || !content) return alert('标题和正文不能为空');

    const postData = {
        id: idValue ? parseInt(idValue) : Date.now(),
        title, category, image, excerpt, content,
        date: new Date().toISOString().split('T')[0]
    };

    if (idValue) {
        posts = posts.map(p => p.id === parseInt(idValue) ? postData : p);
    } else {
        posts.push(postData);
    }

    const success = await saveToGithub('data/posts.json', posts, idValue ? 'Update post' : 'Add new post');
    if (success) {
        showSection('posts');
        renderPosts();
    }
}

async function deletePost(id) {
    if (!confirm('确定要删除这篇文章吗？')) return;

    posts = posts.filter(p => p.id !== id);
    const success = await saveToGithub('data/posts.json', posts, 'Delete post');
    if (success) {
        renderPosts();
    }
}

// Config Saving
async function saveConfig() {
    const updatedConfig = {
        siteTitle: document.getElementById('config-title').value,
        heroTitle: document.getElementById('config-hero-title').value,
        heroSubtitle: document.getElementById('config-hero-subtitle').value,
        footerText: siteConfig.footerText
    };

    const success = await saveToGithub('data/config.json', updatedConfig, 'Update site config');
    if (success) {
        siteConfig = updatedConfig;
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
