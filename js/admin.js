async function loadDummy() {
  const res = await fetch('data/dummy.json');
  return res.json();
}
async function initAdmin() {
  const db = await loadDummy();
  const list = document.getElementById('adminBookings');
  const metricWeek = document.getElementById('metricWeek');
  const metricPosts = document.getElementById('metricPosts');
  db.bookings.forEach(b => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<strong>${b.title}</strong> — ${new Date(b.startTime).toLocaleString()} (${b.duration}m) — <span class="badge">${b.status}</span>`;
    list.appendChild(div);
  });
  metricWeek.textContent = db.bookings.filter(b => (Date.now() - new Date(b.startTime).getTime()) < 7*86400000).length;
  metricPosts.textContent = db.blogPosts.filter(p => p.status === 'published').length;
}
initAdmin();
