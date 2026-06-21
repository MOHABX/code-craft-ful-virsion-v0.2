  const openBtn = document.getElementById('openMenu');
  const closeBtn = document.getElementById('closeMenu');
  const overlay = document.getElementById('overlay');

  openBtn.onclick = () => overlay.classList.add('active');
  closeBtn.onclick = () => overlay.classList.remove('active');
  overlay.onclick = (e) => { if(e.target === overlay) overlay.classList.remove('active'); }
