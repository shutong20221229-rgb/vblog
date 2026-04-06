document.addEventListener('DOMContentLoaded', () => {
    const postsGrid = document.getElementById('posts-grid');
    const body = document.body;
    const currentCategory = body.getAttribute('data-category'); // e.g., "Journeys", "Gallery"
    
    // Fetch and render posts
    const fetchPosts = async () => {
        try {
            const response = await fetch('data/posts.json');
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
    fetchPosts();
});
