document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.getElementById('posts-grid');
    const body = document.body;
    const currentCategory = body.getAttribute('data-category');
    
    // Elements to update from config
    const siteLogo = document.querySelector('.logo');
    const heroTitle = document.querySelector('.hero h1');
    const heroSubtitle = document.querySelector('.hero p');
    const footerText = document.querySelector('footer p');

    // Fetch and apply config
    const fetchConfig = async () => {
        try {
            const response = await fetch(`data/config.json?v=${Date.now()}`);
            if (!response.ok) return;
            const config = await response.json();
            
            if (siteLogo) siteLogo.innerText = config.siteTitle + ' />';
            if (heroTitle && body.id === 'home-page') heroTitle.innerText = config.heroTitle;
            if (heroSubtitle && body.id === 'home-page') heroSubtitle.innerText = config.heroSubtitle;
            if (footerText) footerText.innerText = config.footerText;
            
            // Update document title for index only
            if (body.id === 'home-page') document.title = `${config.siteTitle} | 个人日志博客`;
        } catch (error) {
            console.error('Error fetching config:', error);
        }
    };

    // Fetch and render posts
    const fetchPosts = async () => {
        try {
            const response = await fetch(`data/posts.json?v=${Date.now()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            let posts = await response.json();
            
            // Filter by category if needed
            if (currentCategory && currentCategory !== 'All') {
                posts = posts.filter(post => post.category === currentCategory);
            }
            
            // Clear loading state
            postsGrid.innerHTML = '';
            
            if (posts.length === 0) {
                postsGrid.innerHTML = '<p class="info">暂无相关内容。</p>';
                return;
            }
            
            // Create and append post cards
            posts.forEach((post, index) => {
                const postCard = createPostCard(post, index);
                postsGrid.appendChild(postCard);
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            postsGrid.innerHTML = '<p class="error">加载内容失败，请稍后再试。</p>';
        }
    };

    const createPostCard = (post, index) => {
        const article = document.createElement('article');
        article.className = 'blog-card glass fade-in';
        article.style.animationDelay = `${index * 0.15}s`;
        
        article.innerHTML = `
            <img src="${post.image}" alt="${post.title}" class="card-image">
            <div class="card-content">
                <span class="card-category">${post.category}</span>
                <h2 class="card-title">${post.title}</h2>
                <p class="card-excerpt">${post.excerpt}</p>
                <div class="card-meta">
                    <span>${post.date}</span>
                </div>
            </div>
        `;
        
        // Add click listener to navigate to post.html
        article.addEventListener('click', () => {
            window.location.href = `post.html?id=${post.id}`;
        });
        
        return article;
    };

    // Initial load
    fetchConfig();
    fetchPosts();
});
