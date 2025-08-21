async function loadDummy() {
  const res = await fetch('data/dummy.json');
  return res.json();
}
async function renderBlog() {
  const root = document.getElementById('blogList');
  const db = await loadDummy();
  const posts = db.blogPosts.filter(p => p.status === 'published');
  root.innerHTML = '';
  posts.forEach(p => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h3>${p.title}</h3>
    <span class="badge">Published: ${new Date(p.publishedAt).toLocaleDateString()}</span>
    <p>${p.excerpt}</p>`;
    root.appendChild(div);
  });
}
renderBlog();
