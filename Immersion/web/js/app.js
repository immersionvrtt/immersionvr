// Simple demo booking using dummy data (no backend)
const times = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
const timeSel = document.getElementById('time');
if (timeSel) { times.forEach(t => { const o=document.createElement('option'); o.textContent=t; timeSel.appendChild(o); }); }
const myAppts = document.getElementById('myAppts');

async function loadDummy() {
  const res = await fetch('data/dummy.json');
  return res.json();
}

async function renderMyAppts() {
  const db = await loadDummy();
  if (!myAppts) return;
  myAppts.innerHTML = '';
  db.bookings.slice(0,3).forEach(b => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<strong>${b.title}</strong><br>
    ${new Date(b.startTime).toLocaleString()} • ${b.duration} mins<br>
    <span class="badge">${b.status}</span>
    <div style="margin-top:8px">
      <button class="btn" style="margin-right:8px">Reschedule</button>
      <button class="btn" style="background:linear-gradient(90deg,#ff4d6d,#ff8fa3)">Cancel</button>
    </div>`;
    myAppts.appendChild(div);
  });
}
renderMyAppts();

const confirmBtn = document.getElementById('confirm');
if (confirmBtn) {
  confirmBtn.addEventListener('click', async () => {
    const name = document.getElementById('custName').value || 'Guest';
    const phone = document.getElementById('custPhone').value || '';
    const note = document.getElementById('custNote').value || '';
    document.getElementById('bookMsg').textContent = `Booked! Thanks ${name}. (Demo only — connect Firebase to save)`;
  });
}
