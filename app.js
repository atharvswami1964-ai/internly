/* InternHub – Online Internship Management (HTML + CSS + JS, data in localStorage) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const today = () => new Date().toISOString().slice(0, 10);
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const load = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };

  /* ---------- data ---------- */
  let users = load('ih_users'), jobs = load('ih_jobs'), apps = load('ih_apps');
  let session = localStorage.getItem('ih_session');
  const save = () => {
    localStorage.setItem('ih_users', JSON.stringify(users));
    localStorage.setItem('ih_jobs', JSON.stringify(jobs));
    localStorage.setItem('ih_apps', JSON.stringify(apps));
  };
  const me = () => users.find(u => u.id === session);
  const isOpen = j => j.status === 'open' && j.deadline >= today();

  (function seed() {
    if (users.length) return;
    const d = n => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
    users = [
      { id: 'p1', name: 'Neha Kulkarni', email: 'provider@demo.com', pass: 'demo123', role: 'provider', org: 'Nimbus Tech' },
      { id: 'p2', name: 'Rahul Patil', email: 'rahul@greenleaf.in', pass: 'demo123', role: 'provider', org: 'GreenLeaf Analytics' },
      { id: 's1', name: 'Demo Student', email: 'student@demo.com', pass: 'demo123', role: 'student', org: 'Demo Engineering College' }
    ];
    const J = (providerId, company, title, location, mode, duration, stipend, skills, deadline, desc) =>
      ({ id: uid(), providerId, company, title, location, mode, duration, stipend, skills, deadline, desc, status: 'open', created: today() });
    jobs = [
      J('p1', 'Nimbus Tech', 'Frontend Developer Intern', 'Pune', 'Hybrid', '3 months', 10000, ['HTML', 'CSS', 'JavaScript', 'React'], d(21), 'Build responsive screens for our customer dashboard, fix UI bugs and work with designers in weekly sprints.'),
      J('p1', 'Nimbus Tech', 'Backend Developer Intern', 'Remote', 'Remote', '6 months', 15000, ['Node.js', 'SQL', 'REST'], d(30), 'Design and ship small REST APIs, write tests and help us improve database performance.'),
      J('p2', 'GreenLeaf Analytics', 'Data Analyst Intern', 'Mumbai', 'On-site', '2 months', 8000, ['Excel', 'Python', 'SQL'], d(14), 'Clean datasets, build dashboards and present weekly insights to the product team.'),
      J('p2', 'GreenLeaf Analytics', 'Content & Research Intern', 'Remote', 'Remote', '1 month', 0, ['Writing', 'Research'], d(10), 'Research sustainability topics and write short explainers for our blog and newsletter.'),
      J('p2', 'GreenLeaf Analytics', 'UI/UX Design Intern', 'Pune', 'Hybrid', '3 months', 12000, ['Figma', 'Wireframing'], d(25), 'Create wireframes and prototypes, run quick user tests and refine our design system.')
    ];
    apps = [{ id: uid(), jobId: jobs[0].id, studentId: 's1', note: 'I have built three small projects with HTML, CSS and JS.', status: 'pending', date: today() }];
    save();
  })();

  /* ---------- ui state ---------- */
  const ui = { view: 'home', tab: 'overview', role: 'student', q: '', mode: 'all' };

  const toast = (msg, err) => {
    const t = $('#toast');
    t.textContent = msg; t.className = 'show' + (err ? ' err' : '');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.className = '', 2600);
  };
  const money = n => n > 0 ? '₹' + Number(n).toLocaleString('en-IN') + '/month' : 'Unpaid';
  const badge = s => `<span class="badge b-${s}">${s[0].toUpperCase() + s.slice(1)}</span>`;
  const empty = (msg, btn) => `<div class="empty"><p>${msg}</p>${btn || ''}</div>`;

  /* ---------- navigation ---------- */
  function renderNav() {
    const u = me();
    $('#navLinks').innerHTML = u
      ? `<button class="nl ${ui.view === 'home' ? 'on' : ''}" data-go="home">Browse</button>
         <button class="nl ${ui.view === 'dashboard' ? 'on' : ''}" data-go="dashboard">Dashboard</button>
         <span class="who">${esc(u.name)} (${u.role})</span>
         <button class="btn ghost sm" data-act="logout">Log out</button>`
      : `<button class="nl ${ui.view === 'home' ? 'on' : ''}" data-go="home">Browse</button>
         <button class="nl ${ui.view === 'login' ? 'on' : ''}" data-go="login">Log in</button>
         <button class="btn sm" data-go="signup">Sign up</button>`;
  }

  function render() {
    renderNav();
    const app = $('#app');
    if (ui.view === 'dashboard' && !me()) ui.view = 'login';
    const views = { home: viewHome, login: viewLogin, signup: viewSignup, dashboard: viewDashboard };
    app.innerHTML = views[ui.view]();
    if (ui.view === 'home' || (ui.view === 'dashboard' && ui.tab === 'browse')) refreshList();
  }

  /* ---------- internship cards ---------- */
  function filtered() {
    const q = ui.q.toLowerCase();
    return jobs.filter(isOpen).filter(j =>
      (ui.mode === 'all' || j.mode === ui.mode) &&
      (!q || [j.title, j.company, j.location, j.skills.join(' ')].join(' ').toLowerCase().includes(q))
    ).sort((a, b) => b.created.localeCompare(a.created));
  }
  function card(j) {
    const u = me();
    let action;
    if (!u) action = `<button class="btn sm" data-go="login">Log in to apply</button>`;
    else if (u.role === 'student') {
      const a = apps.find(x => x.jobId === j.id && x.studentId === u.id);
      action = a ? badge(a.status) : `<button class="btn sm" data-act="apply" data-id="${j.id}">Apply now</button>`;
    } else action = j.providerId === u.id ? `<span class="chip">Your listing</span>` : '';
    return `<article class="card job">
      <div><h3>${esc(j.title)}</h3><div class="co">${esc(j.company)}</div></div>
      <div class="chips"><span class="chip">${esc(j.location)}</span><span class="chip">${j.mode}</span><span class="chip">${esc(j.duration)}</span><span class="chip">${money(j.stipend)}</span></div>
      <p class="desc">${esc(j.desc)}</p>
      <div class="skills">${j.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
      <div class="job-foot"><span>Apply by ${fmt(j.deadline)}</span>${action}</div>
    </article>`;
  }
  function refreshList() {
    const el = $('#list'); if (!el) return;
    const list = filtered();
    el.innerHTML = list.length ? list.map(card).join('') : empty('No internships match your search. Try a different keyword or filter.');
    el.className = list.length ? 'grid' : '';
  }
  const searchBar = () => `<div class="bar">
    <input id="q" type="search" placeholder="Search by title, company, skill or city" value="${esc(ui.q)}" aria-label="Search internships">
    <select id="mode" style="width:auto" aria-label="Work mode">
      ${['all', 'Remote', 'On-site', 'Hybrid'].map(m => `<option value="${m}" ${ui.mode === m ? 'selected' : ''}>${m === 'all' ? 'All work modes' : m}</option>`).join('')}
    </select></div>`;

  /* ---------- views ---------- */
  function viewHome() {
    const u = me();
    const cta = u ? `<button class="btn" data-go="dashboard">Open my dashboard</button>`
      : `<button class="btn" data-go="signup" data-role="student">I'm a student</button>
         <button class="btn ghost" data-go="signup" data-role="provider">I'm hiring interns</button>`;
    return `<section class="hero">
        <h1>Find an internship. Or find your next intern.</h1>
        <p>Providers publish openings, students apply in one click, and both sides track every application from a simple dashboard.</p>
        <div class="cta">${cta}</div>
        <div class="counts">
          <div><b>${jobs.filter(isOpen).length}</b>open internships</div>
          <div><b>${users.filter(x => x.role === 'provider').length}</b>providers</div>
          <div><b>${users.filter(x => x.role === 'student').length}</b>students</div>
        </div>
      </section>
      <section class="sec"><div class="sec-h"><h2>Latest internships</h2></div>${searchBar()}<div id="list"></div></section>`;
  }

  function viewLogin() {
    return `<form class="card form" data-form="login">
      <h2>Welcome back</h2><p class="sub">Log in to manage your internships or applications.</p>
      <label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="email">
      <label for="pass">Password</label><input id="pass" name="pass" type="password" required autocomplete="current-password">
      <button class="btn">Log in</button>
      <p class="alt">New here? <button type="button" data-go="signup">Create an account</button></p>
      <div class="demo"><b>Demo logins</b> (password <b>demo123</b>):<br>provider@demo.com · student@demo.com</div>
    </form>`;
  }

  function viewSignup() {
    const r = ui.role;
    return `<form class="card form" data-form="signup">
      <h2>Create your account</h2><p class="sub">Choose how you will use InternHub.</p>
      <div class="roles">
        <label><input type="radio" name="role" value="student" ${r === 'student' ? 'checked' : ''}><span>Student<small>Find and apply</small></span></label>
        <label><input type="radio" name="role" value="provider" ${r === 'provider' ? 'checked' : ''}><span>Provider<small>Publish internships</small></span></label>
      </div>
      <label for="name">Full name</label><input id="name" name="name" required>
      <label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="email">
      <label for="org" id="orgLabel">${r === 'provider' ? 'Organisation' : 'College'}</label><input id="org" name="org" required>
      <label for="pass">Password (min 6 characters)</label><input id="pass" name="pass" type="password" minlength="6" required autocomplete="new-password">
      <button class="btn">Sign up</button>
      <p class="alt">Already registered? <button type="button" data-go="login">Log in</button></p>
    </form>`;
  }

  /* ---------- dashboard ---------- */
  function viewDashboard() {
    const u = me();
    const tabs = u.role === 'provider'
      ? [['overview', 'Overview'], ['publish', 'Publish internship'], ['applicants', 'Applicants']]
      : [['overview', 'Overview'], ['browse', 'Browse internships'], ['applications', 'My applications']];
    if (!tabs.some(t => t[0] === ui.tab)) ui.tab = 'overview';
    const body = u.role === 'provider' ? providerTab(u) : studentTab(u);
    return `<div class="dash">
      <nav class="side" aria-label="Dashboard">${tabs.map(t => `<button class="nl ${ui.tab === t[0] ? 'on' : ''}" data-go="dashboard" data-tab="${t[0]}">${t[1]}</button>`).join('')}</nav>
      <section>${body}</section></div>`;
  }
  const head = (t, s) => `<div class="dash-h"><h1>${t}</h1><p>${s}</p></div>`;
  const stat = (n, l, hl) => `<div class="card stat ${hl ? 'hl' : ''}"><b>${n}</b><span>${l}</span></div>`;

  function providerTab(u) {
    const mine = jobs.filter(j => j.providerId === u.id);
    const myApps = apps.filter(a => mine.some(j => j.id === a.jobId));
    if (ui.tab === 'publish') return head('Publish an internship', 'Fill in the details. It goes live as soon as you publish.') + `
      <form class="card form wide" data-form="publish">
        <label for="title">Internship title</label><input id="title" name="title" placeholder="e.g. Web Development Intern" required>
        <div class="row">
          <div><label for="location">Location</label><input id="location" name="location" placeholder="City or Remote" required></div>
          <div><label for="mode2">Work mode</label><select id="mode2" name="mode"><option>On-site</option><option>Remote</option><option>Hybrid</option></select></div>
        </div>
        <div class="row">
          <div><label for="duration">Duration</label><select id="duration" name="duration"><option>1 month</option><option>2 months</option><option selected>3 months</option><option>6 months</option></select></div>
          <div><label for="stipend">Stipend (₹ per month, 0 for unpaid)</label><input id="stipend" name="stipend" type="number" min="0" step="500" value="0" required></div>
        </div>
        <div class="row">
          <div><label for="skills">Skills (comma separated)</label><input id="skills" name="skills" placeholder="HTML, CSS, JavaScript" required></div>
          <div><label for="deadline">Apply by</label><input id="deadline" name="deadline" type="date" min="${today()}" required></div>
        </div>
        <label for="desc">Description</label><textarea id="desc" name="desc" placeholder="What will the intern work on?" required></textarea>
        <button class="btn">Publish internship</button>
      </form>`;
    if (ui.tab === 'applicants') return head('Applicants', 'Review applications and update their status.') +
      (myApps.length ? `<div class="list">${myApps.slice().reverse().map(a => {
        const s = users.find(x => x.id === a.studentId), j = jobs.find(x => x.id === a.jobId);
        return `<div class="card item"><div>
            <h3>${esc(s?.name)} ${badge(a.status)}</h3>
            <div class="meta">${esc(s?.email)} · ${esc(s?.org)}</div>
            <div class="meta">Applied for <b>${esc(j?.title)}</b> on ${fmt(a.date)}</div>
            ${a.note ? `<div class="note">${esc(a.note)}</div>` : ''}</div>
          <div class="acts">
            ${a.status !== 'shortlisted' ? `<button class="btn ghost sm" data-act="status" data-id="${a.id}" data-val="shortlisted">Shortlist</button>` : ''}
            ${a.status !== 'accepted' ? `<button class="btn ok sm" data-act="status" data-id="${a.id}" data-val="accepted">Accept</button>` : ''}
            ${a.status !== 'rejected' ? `<button class="btn bad sm" data-act="status" data-id="${a.id}" data-val="rejected">Reject</button>` : ''}
          </div></div>`;
      }).join('')}</div>` : empty('No applications yet. Students will appear here once they apply.'));
    // overview
    return head(`Hello, ${esc(u.name.split(' ')[0])}`, `Your internships at ${esc(u.org)}.`) + `
      <div class="stats">
        ${stat(mine.length, 'Published')}${stat(mine.filter(isOpen).length, 'Open now')}
        ${stat(myApps.length, 'Applications')}${stat(myApps.filter(a => a.status === 'pending').length, 'Waiting for review', true)}
        ${stat(myApps.filter(a => a.status === 'accepted').length, 'Accepted')}
      </div>
      <h2 class="sm">Your internships</h2>
      ${mine.length ? `<div class="list">${mine.slice().reverse().map(j => {
        const n = apps.filter(a => a.jobId === j.id).length;
        const st = isOpen(j) ? 'open' : 'closed';
        return `<div class="card item"><div>
            <h3>${esc(j.title)} ${badge(st)}</h3>
            <div class="meta">${esc(j.location)} · ${j.mode} · ${esc(j.duration)} · ${money(j.stipend)}</div>
            <div class="meta">Apply by ${fmt(j.deadline)} · ${n} application${n === 1 ? '' : 's'}</div></div>
          <div class="acts">
            <button class="btn ghost sm" data-act="toggle" data-id="${j.id}">${j.status === 'open' ? 'Close' : 'Reopen'}</button>
            <button class="btn bad sm" data-act="delete" data-id="${j.id}">Delete</button>
          </div></div>`;
      }).join('')}</div>` : empty('You have not published anything yet.', `<button class="btn" data-go="dashboard" data-tab="publish">Publish your first internship</button>`)}`;
  }

  function studentTab(u) {
    const mine = apps.filter(a => a.studentId === u.id);
    if (ui.tab === 'browse') return head('Browse internships', 'Open positions you can apply to right now.') + searchBar() + '<div id="list"></div>';
    if (ui.tab === 'applications' || ui.tab === 'overview') {
      const rows = mine.slice().reverse().map(a => {
        const j = jobs.find(x => x.id === a.jobId);
        return `<div class="card item"><div>
            <h3>${esc(j ? j.title : 'Removed internship')} ${badge(a.status)}</h3>
            <div class="meta">${j ? esc(j.company) + ' · ' + esc(j.location) + ' · ' + j.mode : ''}</div>
            <div class="meta">Applied on ${fmt(a.date)}</div></div>
          <div class="acts">${a.status === 'pending' ? `<button class="btn bad sm" data-act="withdraw" data-id="${a.id}">Withdraw</button>` : ''}</div></div>`;
      }).join('');
      const list = mine.length ? `<div class="list">${ui.tab === 'overview' ? rows.split('<div class="card item">').slice(1, 4).map(x => '<div class="card item">' + x).join('') : rows}</div>`
        : empty('You have not applied anywhere yet.', `<button class="btn" data-go="dashboard" data-tab="browse">Browse internships</button>`);
      if (ui.tab === 'applications') return head('My applications', 'Track the status of every application.') + list;
      return head(`Hello, ${esc(u.name.split(' ')[0])}`, `Here is where your applications stand.`) + `
        <div class="stats">
          ${stat(mine.length, 'Applied')}${stat(mine.filter(a => a.status === 'pending').length, 'Pending')}
          ${stat(mine.filter(a => a.status === 'shortlisted').length, 'Shortlisted', true)}${stat(mine.filter(a => a.status === 'accepted').length, 'Accepted')}
        </div>
        <h2 class="sm">Recent applications</h2>${list}`;
    }
  }

  /* ---------- actions ---------- */
  const acts = {
    logout() { session = null; localStorage.removeItem('ih_session'); ui.view = 'home'; ui.tab = 'overview'; render(); toast('You have been logged out.'); },
    apply(id) {
      const j = jobs.find(x => x.id === id), dlg = $('#dlg');
      dlg.innerHTML = `<form data-form="apply" data-id="${id}">
        <h3>Apply: ${esc(j.title)}</h3><div class="co">${esc(j.company)}</div>
        <label for="note">Why are you a good fit? (optional)</label>
        <textarea id="note" name="note" placeholder="Share your skills, projects or interests."></textarea>
        <div class="dlg-act"><button type="button" class="btn ghost" data-act="closeDlg">Cancel</button><button class="btn">Submit application</button></div></form>`;
      dlg.showModal();
    },
    closeDlg() { $('#dlg').close(); },
    status(id, val) { const a = apps.find(x => x.id === id); a.status = val; save(); render(); toast('Application ' + val + '.'); },
    withdraw(id) { if (!confirm('Withdraw this application?')) return; apps = apps.filter(a => a.id !== id); save(); render(); toast('Application withdrawn.'); },
    toggle(id) { const j = jobs.find(x => x.id === id); j.status = j.status === 'open' ? 'closed' : 'open'; save(); render(); toast(j.status === 'open' ? 'Internship reopened.' : 'Internship closed.'); },
    delete(id) {
      if (!confirm('Delete this internship and all its applications?')) return;
      jobs = jobs.filter(j => j.id !== id); apps = apps.filter(a => a.jobId !== id); save(); render(); toast('Internship deleted.');
    }
  };

  const forms = {
    login(f) {
      const d = Object.fromEntries(new FormData(f));
      const u = users.find(x => x.email === d.email.trim().toLowerCase() && x.pass === d.pass);
      if (!u) return toast('Email or password is incorrect.', true);
      startSession(u);
    },
    signup(f) {
      const d = Object.fromEntries(new FormData(f)), email = d.email.trim().toLowerCase();
      if (users.some(x => x.email === email)) return toast('That email is already registered. Log in instead.', true);
      const u = { id: uid(), name: d.name.trim(), email, pass: d.pass, role: d.role, org: d.org.trim() };
      users.push(u); save(); startSession(u); toast('Account created. Welcome, ' + u.name.split(' ')[0] + '!');
    },
    publish(f) {
      const d = Object.fromEntries(new FormData(f)), u = me();
      jobs.push({
        id: uid(), providerId: u.id, company: u.org, title: d.title.trim(), location: d.location.trim(), mode: d.mode,
        duration: d.duration, stipend: Number(d.stipend) || 0, deadline: d.deadline, desc: d.desc.trim(),
        skills: d.skills.split(',').map(s => s.trim()).filter(Boolean), status: 'open', created: today()
      });
      save(); ui.tab = 'overview'; render(); toast('Internship published.');
    },
    apply(f) {
      const u = me(), id = f.dataset.id;
      if (apps.some(a => a.jobId === id && a.studentId === u.id)) return toast('You have already applied.', true);
      apps.push({ id: uid(), jobId: id, studentId: u.id, note: new FormData(f).get('note').trim(), status: 'pending', date: today() });
      save(); $('#dlg').close(); render(); toast('Application submitted.');
    }
  };
  function startSession(u) { session = u.id; localStorage.setItem('ih_session', u.id); ui.view = 'dashboard'; ui.tab = 'overview'; render(); window.scrollTo(0, 0); }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-go],[data-act]'); if (!el) return;
    e.preventDefault();
    if (el.dataset.act) return acts[el.dataset.act](el.dataset.id, el.dataset.val);
    ui.view = el.dataset.go;
    if (el.dataset.role) ui.role = el.dataset.role;
    ui.tab = el.dataset.tab || 'overview';
    render(); window.scrollTo(0, 0);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form]'); if (!f) return;
    e.preventDefault(); forms[f.dataset.form](f);
  });
  document.addEventListener('input', e => { if (e.target.id === 'q') { ui.q = e.target.value; refreshList(); } });
  document.addEventListener('change', e => {
    if (e.target.id === 'mode') { ui.mode = e.target.value; refreshList(); }
    if (e.target.name === 'role') { ui.role = e.target.value; $('#orgLabel').textContent = ui.role === 'provider' ? 'Organisation' : 'College'; }
  });

  if (me()) ui.view = 'dashboard';
  render();
})();
