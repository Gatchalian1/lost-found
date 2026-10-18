/* =====================================================
   CampusFind - Lost and Found System
   JavaScript file (all pages use this one file)

   Group project - Web Systems
   Riverside High School
   ===================================================== */

/* ---------- storage key (only the login id is kept on the device) ---------- */
var SESSION_KEY = 'cf_session_v3';

/* =====================================================
   1. SHARED DATA (Supabase)
   The records now live in a Supabase database, so every device
   (your PC, a student's phone) reads and writes the SAME data.
   Each table is loaded once when a page opens and kept in the
   CACHE_ arrays below. That way the rest of this file can keep
   using simple functions that return data right away.
   ===================================================== */

var CACHE_USERS = [];
var CACHE_ITEMS = [];
var CACHE_CLAIMS = [];

/* database row (snake_case) -> object used by the pages (camelCase) */
function mapUser(row) {
  return {
    id: row.id, name: row.name, email: row.email, password: row.password,
    role: row.role, studentId: row.student_id, course: row.course, status: row.status
  };
}

function mapItem(row) {
  return {
    id: row.id, type: row.type, name: row.name, category: row.category,
    location: row.location, date: row.date, description: row.description,
    contact: row.contact, photo: row.photo, status: row.status,
    reporter: row.reporter, reporterId: row.reporter_id, dateAdded: row.date_added
  };
}

function mapClaim(row) {
  return {
    id: row.id, itemId: row.item_id, studentId: row.student_id,
    studentName: row.student_name, message: row.message, status: row.status,
    note: row.note, date: row.date
  };
}

/* object used by the pages -> database row (for saving) */
function userRow(u) {
  return {
    id: u.id, name: u.name, email: u.email, password: u.password,
    role: u.role, student_id: u.studentId, course: u.course, status: u.status
  };
}

function itemRow(i) {
  return {
    id: i.id, type: i.type, name: i.name, category: i.category,
    location: i.location, date: i.date, description: i.description,
    contact: i.contact, photo: i.photo, status: i.status,
    reporter: i.reporter, reporter_id: i.reporterId, date_added: i.dateAdded
  };
}

function claimRow(c) {
  return {
    id: c.id, item_id: c.itemId, student_id: c.studentId,
    student_name: c.studentName, message: c.message, status: c.status,
    note: c.note, date: c.date
  };
}

/* read all three tables once, then keep them in memory */
async function loadAllData() {
  var results = await Promise.all([
    db.from('users').select('*'),
    db.from('items').select('*'),
    db.from('claims').select('*')
  ]);

  for (var i = 0; i < results.length; i++) {
    if (results[i].error) {
      throw results[i].error;
    }
  }

  CACHE_USERS = results[0].data.map(mapUser);
  CACHE_ITEMS = results[1].data.map(mapItem);
  CACHE_CLAIMS = results[2].data.map(mapClaim);
}

function makeId(prefix) {
  return prefix + '_' + Date.now() + Math.floor(Math.random() * 1000);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

/* =====================================================
   2. DEMO DATA
   The starter records are now seeded ONCE in the database.
   See the file: supabase-setup.sql
   ===================================================== */

/* =====================================================
   3. SMALL HELPERS USED BY ALL PAGES
   ===================================================== */

function getUsers() { return CACHE_USERS; }
function getItems() { return CACHE_ITEMS; }
function getClaims() { return CACHE_CLAIMS; }

function getCurrentUser() {
  var id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    return null;
  }
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === id) {
      return users[i];
    }
  }
  return null;
}

function getItemById(id) {
  var items = getItems();
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      return items[i];
    }
  }
  return null;
}

function formatDate(dateText) {
  if (!dateText) {
    return '-';
  }
  var parts = dateText.slice(0, 10).split('-');
  if (parts.length !== 3) {
    return dateText;
  }
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
}

function getInitials(name) {
  var words = String(name || '?').trim().split(' ');
  var result = '';
  for (var i = 0; i < words.length && i < 2; i++) {
    result += words[i].charAt(0).toUpperCase();
  }
  return result;
}

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusBadge(status) {
  return '<span class="badge badge-' + status + '">' + status.toUpperCase() + '</span>';
}

function typeBadge(type) {
  return '<span class="badge badge-' + type + '">' + type.toUpperCase() + '</span>';
}

function showMessage(boxId, text) {
  var box = document.getElementById(boxId);
  if (box) {
    box.textContent = text;
    box.classList.add('show');
  }
}

function hideMessage(boxId) {
  var box = document.getElementById(boxId);
  if (box) {
    box.classList.remove('show');
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

/* changes the visible section on a portal page */
function goToPage(pageName) {
  var sections = document.querySelectorAll('[id^="page-"]');
  for (var i = 0; i < sections.length; i++) {
    sections[i].classList.add('hidden');
  }

  var target = document.getElementById('page-' + pageName);
  if (target) {
    target.classList.remove('hidden');
  }

  var links = document.querySelectorAll('.nav-link');
  for (var j = 0; j < links.length; j++) {
    if (links[j].getAttribute('data-page') === pageName) {
      links[j].classList.add('active');
    } else {
      links[j].classList.remove('active');
    }
  }

  window.scrollTo(0, 0);
}

/* =====================================================
   4. LOGIN PAGE
   ===================================================== */

async function startLoginPage() {
  try {
    await loadAllData();
  } catch (err) {
    alert('Could not reach the database. Please check your internet connection and refresh the page.');
    return;
  }

  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');
  var loginButton = document.getElementById('showLogin');
  var registerButton = document.getElementById('showRegister');

  loginButton.onclick = function () {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginButton.classList.add('active');
    registerButton.classList.remove('active');
  };

  registerButton.onclick = function () {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    registerButton.classList.add('active');
    loginButton.classList.remove('active');
  };

  /* ---- login ---- */
  loginForm.onsubmit = function (event) {
    event.preventDefault();
    hideMessage('loginError');

    var email = document.getElementById('loginEmail').value.trim().toLowerCase();
    var password = document.getElementById('loginPassword').value;

    if (email === '' || password === '') {
      showMessage('loginError', 'Please type your email and password.');
      return;
    }

    var users = getUsers();
    var found = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === email) {
        found = users[i];
      }
    }

    if (found == null) {
      showMessage('loginError', 'No account was found with that email.');
      return;
    }
    if (found.password !== password) {
      showMessage('loginError', 'Incorrect password. Please try again.');
      return;
    }
    if (found.status === 'inactive') {
      showMessage('loginError', 'This account is deactivated. Please visit the office.');
      return;
    }

    localStorage.setItem(SESSION_KEY, found.id);

    if (found.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'student.html';
    }
  };

  /* ---- register ---- */
  registerForm.onsubmit = async function (event) {
    event.preventDefault();
    hideMessage('registerError');

    var name = document.getElementById('regName').value.trim();
    var studentId = document.getElementById('regId').value.trim();
    var course = document.getElementById('regCourse').value.trim();
    var email = document.getElementById('regEmail').value.trim().toLowerCase();
    var password = document.getElementById('regPassword').value;

    if (name === '' || studentId === '' || course === '' || email === '' || password === '') {
      showMessage('registerError', 'Please fill up all the fields.');
      return;
    }
    if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
      showMessage('registerError', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 5) {
      showMessage('registerError', 'Password must be at least 5 characters.');
      return;
    }

    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === email) {
        showMessage('registerError', 'That email is already registered. Please login instead.');
        return;
      }
    }

    var newUser = {
      id: makeId('u'),
      name: name,
      email: email,
      password: password,
      role: 'student',
      studentId: studentId,
      course: course,
      status: 'active'
    };

    var result = await db.from('users').insert(userRow(newUser));
    if (result.error) {
      showMessage('registerError', 'Could not create the account. Please try again.');
      return;
    }
    CACHE_USERS.push(newUser);

    localStorage.setItem(SESSION_KEY, newUser.id);
    window.location.href = 'student.html';
  };
}

/* =====================================================
   5. STUDENT PORTAL
   ===================================================== */

var currentItemId = '';    // item being claimed right now
var reportType = 'lost';   // "lost" or "found" on the report page
var reportPhoto = '';      // the picture chosen in the report page

async function startStudentPage() {
  try {
    await loadAllData();
  } catch (err) {
    alert('Could not reach the database. Please check your internet connection and refresh the page.');
    return;
  }

  var user = getCurrentUser();
  if (user == null || user.role !== 'student') {
    window.location.href = 'index.html';
    return;
  }

  // show the student's name on the sidebar and the dashboard
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userAvatar').textContent = getInitials(user.name);
  document.getElementById('welcomeTitle').textContent = 'Welcome, ' + user.name + '!';

  // default values for the report form
  document.getElementById('itemContact').value = user.email;
  document.getElementById('itemDate').value = todayString();

  // sidebar links
  var links = document.querySelectorAll('.nav-link');
  for (var i = 0; i < links.length; i++) {
    links[i].onclick = function (event) {
      event.preventDefault();
      var page = this.getAttribute('data-page');
      goToPage(page);
      if (page === 'dashboard') { loadStudentDashboard(user); }
      if (page === 'found') { loadFoundItems(); }
      if (page === 'reports') { loadMyReports(user); }
    };
  }

  // search and filter on the found items page
  document.getElementById('searchFound').oninput = loadFoundItems;
  document.getElementById('filterCategory').onchange = loadFoundItems;

  // photo picker on the report page
  document.getElementById('itemPhoto').onchange = function () {
    pickPhoto(this);
  };

  // report form
  document.getElementById('itemReportForm').onsubmit = function (event) {
    event.preventDefault();
    saveItemReport(user);
  };

  // load the first page
  loadStudentDashboard(user);
}

/* ---- dashboard ---- */
function loadStudentDashboard(user) {
  var items = getItems();
  var claims = getClaims();

  var myReports = 0;
  var myClaims = 0;
  var pending = 0;
  var recovered = 0;

  for (var i = 0; i < items.length; i++) {
    if (items[i].reporterId === user.id) {
      myReports++;
    }
  }

  for (var j = 0; j < claims.length; j++) {
    if (claims[j].studentId === user.id) {
      myClaims++;
      if (claims[j].status === 'pending') { pending++; }
      if (claims[j].status === 'approved') { recovered++; }
    }
  }

  document.getElementById('statLost').textContent = myReports;
  document.getElementById('statClaims').textContent = myClaims;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statRecovered').textContent = recovered;

  // latest found items (only the ones not yet returned)
  var found = [];
  for (var k = 0; k < items.length; k++) {
    if (items[k].type === 'found' && items[k].status !== 'returned') {
      found.push(items[k]);
    }
  }
  found.reverse();

  var box = document.getElementById('latestItems');
  if (found.length === 0) {
    box.innerHTML = '<div class="empty-box"><div class="big">&#128230;</div><p>No items found yet.</p></div>';
    return;
  }

  var html = '';
  for (var n = 0; n < found.length && n < 3; n++) {
    html += buildItemCard(found[n]);
  }
  box.innerHTML = html;
}

/* ---- the "I lost an item" / "I found an item" buttons ---- */
function setReportType(type) {
  reportType = type;

  if (type === 'found') {
    document.getElementById('typeFound').classList.add('active');
    document.getElementById('typeLost').classList.remove('active');
    document.getElementById('locationLabel').textContent = 'Where did you find it? *';
    document.getElementById('dateLabel').textContent = 'Date found *';
  } else {
    document.getElementById('typeLost').classList.add('active');
    document.getElementById('typeFound').classList.remove('active');
    document.getElementById('locationLabel').textContent = 'Where did you lose it? *';
    document.getElementById('dateLabel').textContent = 'Date lost *';
  }

  hideMessage('reportOk');
  hideMessage('reportError');
}

/* ---- reading the picture chosen by the student ---- */
function pickPhoto(input) {
  var file = input.files[0];
  if (!file) {
    return;
  }
  if (file.type.indexOf('image/') !== 0) {
    alert('Please choose an image file (jpg or png).');
    input.value = '';
    return;
  }

  makePhotoSmall(file, function (dataUrl) {
    reportPhoto = dataUrl;
    if (dataUrl === '') {
      return;
    }
    document.getElementById('photoPreview').src = dataUrl;
    document.getElementById('photoPreview').classList.remove('hidden');
    document.getElementById('removePhoto').classList.remove('hidden');
  });
}

/* Photos from phones are very big, so we shrink them first.
   This way they still fit inside the localStorage limit. */
function makePhotoSmall(file, done) {
  var reader = new FileReader();

  reader.onload = function (event) {
    var dataUrl = event.target.result;

    try {
      var image = new Image();
      image.onload = function () {
        try {
          var maxSide = 640;
          var width = image.width;
          var height = image.height;

          if (width >= height && width > maxSide) {
            height = Math.round(height * maxSide / width);
            width = maxSide;
          } else if (height > maxSide) {
            width = Math.round(width * maxSide / height);
            height = maxSide;
          }

          var canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(image, 0, 0, width, height);
          done(canvas.toDataURL('image/jpeg', 0.7));
        } catch (resizeError) {
          // the photo could not be resized, so we keep the original
          done(dataUrl);
        }
      };
      image.onerror = function () { done(dataUrl); };
      image.src = dataUrl;
    } catch (error) {
      // if the browser cannot resize, just keep the original picture
      done(dataUrl);
    }
  };

  reader.onerror = function () { done(''); };
  reader.readAsDataURL(file);
}

function clearPhoto() {
  reportPhoto = '';
  document.getElementById('itemPhoto').value = '';
  document.getElementById('photoPreview').classList.add('hidden');
  document.getElementById('removePhoto').classList.add('hidden');
}

function clearReportForm() {
  document.getElementById('itemReportForm').reset();

  var user = getCurrentUser();
  if (user != null) {
    document.getElementById('itemContact').value = user.email;
  }
  document.getElementById('itemDate').value = todayString();

  clearPhoto();
}

/* ---- submit a lost or found report ---- */
async function saveItemReport(user) {
  hideMessage('reportOk');
  hideMessage('reportError');

  var name = document.getElementById('itemName').value.trim();
  var category = document.getElementById('itemCategory').value;
  var location = document.getElementById('itemLocation').value;
  var date = document.getElementById('itemDate').value;
  var contact = document.getElementById('itemContact').value.trim();
  var description = document.getElementById('itemDescription').value.trim();

  if (name === '' || category === '' || location === '' || date === '' || contact === '' || description === '') {
    showMessage('reportError', 'Please complete all the required fields.');
    return;
  }
  if (description.length < 10) {
    showMessage('reportError', 'Please describe the item a little more (at least 10 characters).');
    return;
  }

  var newItem = {
    id: makeId('i'),
    type: reportType,
    name: name,
    category: category,
    location: location,
    date: date,
    description: description,
    contact: contact,
    photo: reportPhoto,
    status: 'open',
    reporter: user.name,
    reporterId: user.id,
    dateAdded: todayString()
  };

  var result = await db.from('items').insert(itemRow(newItem));
  if (result.error) {
    showMessage('reportError', 'Could not submit your report. Please check your internet and try again.');
    return;
  }
  CACHE_ITEMS.push(newItem);

  var wasLost = (reportType === 'lost');
  clearReportForm();

  if (wasLost) {
    showMessage('reportOk', 'Your lost item report was submitted. The office will contact you if your item is found.');
  } else {
    showMessage('reportOk', 'Thank you for turning in the item. Please bring it to the Lost and Found office.');
  }

  loadStudentDashboard(user);
}

/* ---- found items list ---- */
function buildItemCard(item) {
  var me = getCurrentUser();

  var photo = '';
  if (item.photo) {
    photo = '<img class="item-photo" src="' + item.photo + '" alt="Photo of the item">';
  }

  var action = '';
  if (me != null && item.reporterId === me.id) {
    action = '<span class="small">Your report</span>';
  } else if (item.status === 'open' || item.status === 'matched') {
    action = '<button class="btn btn-main btn-small" onclick="openClaimModal(\'' + item.id + '\')">Claim this item</button>';
  } else {
    action = '<span class="badge badge-returned">Already returned</span>';
  }

  return '<div class="item-card">' +
    photo +
    '<h3>' + escapeHtml(item.name) + '</h3>' +
    '<p class="meta">Category: ' + escapeHtml(item.category) + '</p>' +
    '<p class="meta">Found at: ' + escapeHtml(item.location) + '</p>' +
    '<p class="meta">Date found: ' + formatDate(item.date) + '</p>' +
    '<p class="meta" style="margin-top:8px;">' + escapeHtml(item.description) + '</p>' +
    '<div class="footer">' +
      statusBadge(item.status) +
      action +
    '</div>' +
  '</div>';
}

function loadFoundItems() {
  var items = getItems();
  var search = document.getElementById('searchFound').value.toLowerCase();
  var category = document.getElementById('filterCategory').value;

  var results = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.type !== 'found') {
      continue;
    }
    if (category !== '' && item.category !== category) {
      continue;
    }
    var text = (item.name + ' ' + item.location + ' ' + item.description).toLowerCase();
    if (search !== '' && text.indexOf(search) === -1) {
      continue;
    }
    results.push(item);
  }

  var listBox = document.getElementById('foundList');
  var emptyBox = document.getElementById('foundEmpty');

  if (results.length === 0) {
    listBox.innerHTML = '';
    emptyBox.classList.remove('hidden');
    return;
  }

  emptyBox.classList.add('hidden');
  var html = '';
  for (var j = 0; j < results.length; j++) {
    html += buildItemCard(results[j]);
  }
  listBox.innerHTML = html;
}

/* ---- my reports and claims ---- */
function loadMyReports(user) {
  var items = getItems();
  var claims = getClaims();

  /* my item reports (lost and found) */
  var reportsBody = document.getElementById('myReportsTable');
  var reportsEmpty = document.getElementById('myReportsEmpty');
  var rows = '';

  for (var i = 0; i < items.length; i++) {
    if (items[i].reporterId === user.id) {
      rows += '<tr>' +
        '<td>' + escapeHtml(items[i].name) + '</td>' +
        '<td>' + typeBadge(items[i].type) + '</td>' +
        '<td>' + escapeHtml(items[i].category) + '</td>' +
        '<td>' + escapeHtml(items[i].location) + '</td>' +
        '<td>' + formatDate(items[i].date) + '</td>' +
        '<td>' + statusBadge(items[i].status) + '</td>' +
      '</tr>';
    }
  }

  if (rows === '') {
    reportsBody.innerHTML = '';
    reportsEmpty.classList.remove('hidden');
  } else {
    reportsBody.innerHTML = rows;
    reportsEmpty.classList.add('hidden');
  }

  /* my claims */
  var claimsBody = document.getElementById('myClaimsTable');
  var claimsEmpty = document.getElementById('myClaimsEmpty');
  var claimRows = '';

  for (var j = 0; j < claims.length; j++) {
    if (claims[j].studentId === user.id) {
      var item = getItemById(claims[j].itemId);
      var itemName = item ? item.name : 'Item removed';
      claimRows += '<tr>' +
        '<td>' + escapeHtml(itemName) + '</td>' +
        '<td>' + escapeHtml(claims[j].message) + '</td>' +
        '<td>' + formatDate(claims[j].date) + '</td>' +
        '<td>' + statusBadge(claims[j].status) + '</td>' +
        '<td>' + (claims[j].note ? escapeHtml(claims[j].note) : '-') + '</td>' +
      '</tr>';
    }
  }

  if (claimRows === '') {
    claimsBody.innerHTML = '';
    claimsEmpty.classList.remove('hidden');
  } else {
    claimsBody.innerHTML = claimRows;
    claimsEmpty.classList.add('hidden');
  }
}

/* ---- claim modal ---- */
function openClaimModal(itemId) {
  var user = getCurrentUser();
  var item = getItemById(itemId);
  if (item == null) {
    return;
  }

  if (user != null && item.reporterId === user.id) {
    alert('You are the one who reported this item, so you cannot claim it.');
    return;
  }

  currentItemId = itemId;
  document.getElementById('claimItemName').textContent = 'Item: ' + item.name + ' (found at ' + item.location + ')';
  document.getElementById('claimMessage').value = '';
  hideMessage('claimError');
  document.getElementById('claimModal').classList.remove('hidden');
}

function closeClaimModal() {
  document.getElementById('claimModal').classList.add('hidden');
}

async function submitClaim() {
  var user = getCurrentUser();
  if (user == null) {
    return;
  }

  hideMessage('claimError');
  var message = document.getElementById('claimMessage').value.trim();

  if (message.length < 10) {
    showMessage('claimError', 'Please explain why the item is yours (at least 10 characters).');
    return;
  }

  var item = getItemById(currentItemId);
  if (item == null) {
    showMessage('claimError', 'This item is no longer available.');
    return;
  }

  // do not allow the same student to claim the same item twice
  var claims = getClaims();
  for (var i = 0; i < claims.length; i++) {
    if (claims[i].itemId === currentItemId && claims[i].studentId === user.id && claims[i].status === 'pending') {
      showMessage('claimError', 'You already sent a claim for this item. Please wait for the office.');
      return;
    }
  }

  var newClaim = {
    id: makeId('c'),
    itemId: currentItemId,
    studentId: user.id,
    studentName: user.name,
    message: message,
    status: 'pending',
    note: '',
    date: todayString()
  };

  var result = await db.from('claims').insert(claimRow(newClaim));
  if (result.error) {
    showMessage('claimError', 'Could not send your claim. Please check your internet and try again.');
    return;
  }
  CACHE_CLAIMS.push(newClaim);

  closeClaimModal();
  alert('Your claim was submitted. Please wait for the office to review it.');
  loadFoundItems();
}

/* =====================================================
   6. ADMIN PORTAL
   ===================================================== */

async function startAdminPage() {
  try {
    await loadAllData();
  } catch (err) {
    alert('Could not reach the database. Please check your internet connection and refresh the page.');
    return;
  }

  var user = getCurrentUser();
  if (user == null || user.role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('adminName').textContent = user.name;
  document.getElementById('adminAvatar').textContent = getInitials(user.name);
  document.getElementById('adminWelcome').textContent = 'Welcome, ' + user.name + '!';

  document.getElementById('fDate').value = todayString();

  /* sidebar links */
  var links = document.querySelectorAll('.nav-link');
  for (var i = 0; i < links.length; i++) {
    links[i].onclick = function (event) {
      event.preventDefault();
      var page = this.getAttribute('data-page');
      goToPage(page);
      refreshAdminPage(page);
    };
  }

  /* add found item form */
  document.getElementById('foundForm').onsubmit = function (event) {
    event.preventDefault();
    addFoundItem(user);
  };

  /* search boxes */
  document.getElementById('searchAdminFound').oninput = loadFoundTable;
  document.getElementById('searchAdminLost').oninput = loadLostTable;

  loadAdminDashboard();
}

function refreshAdminPage(page) {
  if (page === 'dashboard') { loadAdminDashboard(); }
  if (page === 'found') { loadFoundTable(); }
  if (page === 'lost') { loadLostTable(); }
  if (page === 'claims') { loadClaimsTable(); }
  if (page === 'students') { loadStudentsTable(); }
}

/* ---- dashboard ---- */
function loadAdminDashboard() {
  var items = getItems();
  var claims = getClaims();

  var lost = 0, found = 0, returned = 0, pending = 0;

  for (var i = 0; i < items.length; i++) {
    if (items[i].type === 'lost') { lost++; }
    if (items[i].type === 'found') { found++; }
    if (items[i].status === 'returned') { returned++; }
  }
  for (var j = 0; j < claims.length; j++) {
    if (claims[j].status === 'pending') { pending++; }
  }

  document.getElementById('statLostItems').textContent = lost;
  document.getElementById('statFoundItems').textContent = found;
  document.getElementById('statPendingClaims').textContent = pending;
  document.getElementById('statReturnedItems').textContent = returned;

  /* pending claims table */
  var rows = '';
  for (var k = 0; k < claims.length; k++) {
    if (claims[k].status === 'pending') {
      var item = getItemById(claims[k].itemId);
      rows += '<tr>' +
        '<td>' + escapeHtml(item ? item.name : 'Item removed') + '</td>' +
        '<td>' + escapeHtml(claims[k].studentName) + '</td>' +
        '<td>' + formatDate(claims[k].date) + '</td>' +
        '<td><button class="btn btn-main btn-small" onclick="decideClaim(\'' + claims[k].id + '\', \'approved\')">Approve</button></td>' +
      '</tr>';
    }
  }

  var body = document.getElementById('dashboardClaims');
  var empty = document.getElementById('dashboardClaimsEmpty');
  if (rows === '') {
    body.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    body.innerHTML = rows;
    empty.classList.add('hidden');
  }
}

/* ---- add a found item ---- */
async function addFoundItem(user) {
  hideMessage('addItemOk');
  hideMessage('addItemError');

  var name = document.getElementById('fName').value.trim();
  var category = document.getElementById('fCategory').value;
  var location = document.getElementById('fLocation').value;
  var date = document.getElementById('fDate').value;
  var description = document.getElementById('fDescription').value.trim();

  if (name === '' || category === '' || location === '' || date === '' || description === '') {
    showMessage('addItemError', 'Please complete all the required fields.');
    return;
  }

  var newItem = {
    id: makeId('i'),
    type: 'found',
    name: name,
    category: category,
    location: location,
    date: date,
    description: description,
    contact: '',
    photo: '',
    status: 'open',
    reporter: user.name,
    reporterId: user.id,
    dateAdded: todayString()
  };

  var result = await db.from('items').insert(itemRow(newItem));
  if (result.error) {
    showMessage('addItemError', 'Could not save the item. Please check your internet and try again.');
    return;
  }
  CACHE_ITEMS.push(newItem);

  document.getElementById('foundForm').reset();
  document.getElementById('fDate').value = todayString();

  showMessage('addItemOk', 'The found item was saved successfully.');
  loadFoundTable();
}

/* ---- found items table ---- */
function loadFoundTable() {
  var items = getItems();
  var search = document.getElementById('searchAdminFound').value.toLowerCase();
  var rows = '';

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.type !== 'found') {
      continue;
    }
    if (search !== '' && (item.name + ' ' + item.location).toLowerCase().indexOf(search) === -1) {
      continue;
    }

    var photo = item.photo ? '<img class="thumb" src="' + item.photo + '" alt="">' : '';

    var returnButton = '';
    if (item.status !== 'returned') {
      returnButton = '<button class="btn btn-green btn-small" onclick="markItemReturned(\'' + item.id + '\')">Returned</button>';
    }

    rows += '<tr>' +
      '<td>' + photo + escapeHtml(item.name) + '</td>' +
      '<td>' + escapeHtml(item.category) + '</td>' +
      '<td>' + escapeHtml(item.location) + '</td>' +
      '<td>' + formatDate(item.date) + '</td>' +
      '<td>' + statusBadge(item.status) + '</td>' +
      '<td>' + returnButton +
        ' <button class="btn btn-red btn-small" onclick="deleteItem(\'' + item.id + '\')">Delete</button></td>' +
    '</tr>';
  }

  var body = document.getElementById('foundTable');
  var empty = document.getElementById('foundTableEmpty');
  if (rows === '') {
    body.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    body.innerHTML = rows;
    empty.classList.add('hidden');
  }
}

async function markItemReturned(itemId) {
  if (!confirm('Mark this item as returned to its owner?')) {
    return;
  }

  var result = await db.from('items').update({ status: 'returned' }).eq('id', itemId);
  if (result.error) {
    alert('Could not update the item. Please check your internet and try again.');
    return;
  }

  var items = getItems();
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === itemId) {
      items[i].status = 'returned';
    }
  }
  loadFoundTable();
}

async function deleteItem(itemId) {
  if (!confirm('Delete this item permanently?')) {
    return;
  }

  var result = await db.from('items').delete().eq('id', itemId);
  if (result.error) {
    alert('Could not delete the item. Please check your internet and try again.');
    return;
  }

  // also remove the claims connected to this item
  await db.from('claims').delete().eq('item_id', itemId);

  CACHE_ITEMS = CACHE_ITEMS.filter(function (it) { return it.id !== itemId; });
  CACHE_CLAIMS = CACHE_CLAIMS.filter(function (c) { return c.itemId !== itemId; });

  loadFoundTable();
}

/* ---- lost reports table ---- */
function loadLostTable() {
  var items = getItems();
  var search = document.getElementById('searchAdminLost').value.toLowerCase();
  var rows = '';

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.type !== 'lost') {
      continue;
    }
    if (search !== '' && (item.name + ' ' + item.reporter).toLowerCase().indexOf(search) === -1) {
      continue;
    }

    var matchButton = '';
    if (item.status === 'open') {
      matchButton = '<button class="btn btn-main btn-small" onclick="markReportMatched(\'' + item.id + '\')">Matched</button>';
    }

    rows += '<tr>' +
      '<td>' + escapeHtml(item.name) + '</td>' +
      '<td>' + escapeHtml(item.reporter) + '</td>' +
      '<td>' + escapeHtml(item.contact || '-') + '</td>' +
      '<td>' + escapeHtml(item.location) + '</td>' +
      '<td>' + statusBadge(item.status) + '</td>' +
      '<td>' + matchButton +
        ' <button class="btn btn-red btn-small" onclick="deleteReport(\'' + item.id + '\')">Delete</button></td>' +
    '</tr>';
  }

  var body = document.getElementById('lostTable');
  var empty = document.getElementById('lostTableEmpty');
  if (rows === '') {
    body.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    body.innerHTML = rows;
    empty.classList.add('hidden');
  }
}

async function markReportMatched(itemId) {
  var result = await db.from('items').update({ status: 'matched' }).eq('id', itemId);
  if (result.error) {
    alert('Could not update the report. Please check your internet and try again.');
    return;
  }

  var items = getItems();
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === itemId) {
      items[i].status = 'matched';
    }
  }
  loadLostTable();
}

async function deleteReport(itemId) {
  if (!confirm('Delete this lost item report?')) {
    return;
  }

  var result = await db.from('items').delete().eq('id', itemId);
  if (result.error) {
    alert('Could not delete the report. Please check your internet and try again.');
    return;
  }

  CACHE_ITEMS = CACHE_ITEMS.filter(function (it) { return it.id !== itemId; });
  CACHE_CLAIMS = CACHE_CLAIMS.filter(function (c) { return c.itemId !== itemId; });

  loadLostTable();
}

/* ---- claims table ---- */
function loadClaimsTable() {
  var claims = getClaims();
  var rows = '';

  // newest first
  var sorted = claims.slice().reverse();

  for (var i = 0; i < sorted.length; i++) {
    var claim = sorted[i];
    var item = getItemById(claim.itemId);

    var decisionButtons = '';
    if (claim.status === 'pending') {
      decisionButtons =
        '<button class="btn btn-green btn-small" onclick="decideClaim(\'' + claim.id + '\', \'approved\')">Approve</button> ' +
        '<button class="btn btn-red btn-small" onclick="decideClaim(\'' + claim.id + '\', \'rejected\')">Reject</button>';
    } else {
      decisionButtons = '<span class="small">Decision saved</span>';
    }

    rows += '<tr>' +
      '<td>' + escapeHtml(item ? item.name : 'Item removed') + '</td>' +
      '<td>' + escapeHtml(claim.studentName) + '</td>' +
      '<td>' + escapeHtml(claim.message) + '</td>' +
      '<td>' + formatDate(claim.date) + '</td>' +
      '<td>' + statusBadge(claim.status) + '</td>' +
      '<td>' + decisionButtons + '</td>' +
    '</tr>';
  }

  var body = document.getElementById('claimsTable');
  var empty = document.getElementById('claimsTableEmpty');
  if (rows === '') {
    body.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    body.innerHTML = rows;
    empty.classList.add('hidden');
  }
}

async function decideClaim(claimId, decision) {
  var defaultNote = 'Claim approved. Please get your item at the Lost and Found office.';
  if (decision === 'rejected') {
    defaultNote = 'Sorry, the proof of ownership was not enough.';
  }

  var note = prompt('Add a note for the student:', defaultNote);
  if (note === null) {
    return;   // the admin clicked cancel
  }

  var claim = null;
  var claims = getClaims();
  for (var i = 0; i < claims.length; i++) {
    if (claims[i].id === claimId) {
      claim = claims[i];
    }
  }
  if (claim === null) {
    return;
  }

  var result = await db.from('claims').update({ status: decision, note: note }).eq('id', claimId);
  if (result.error) {
    alert('Could not save the decision. Please check your internet and try again.');
    return;
  }
  claim.status = decision;
  claim.note = note;

  // when approved, the item is marked as returned
  if (decision === 'approved') {
    var itemResult = await db.from('items').update({ status: 'returned' }).eq('id', claim.itemId);
    if (itemResult.error) {
      alert('The claim was saved but the item could not be updated. Please refresh and try again.');
    }

    var items = getItems();
    for (var j = 0; j < items.length; j++) {
      if (items[j].id === claim.itemId) {
        items[j].status = 'returned';
      }
    }
  }

  loadClaimsTable();
  loadAdminDashboard();
}

/* ---- students table ---- */
function loadStudentsTable() {
  var users = getUsers();
  var rows = '';

  for (var i = 0; i < users.length; i++) {
    if (users[i].role !== 'student') {
      continue;
    }

    var action = '';
    if (users[i].status === 'active') {
      action = '<button class="btn btn-red btn-small" onclick="toggleStudent(\'' + users[i].id + '\')">Deactivate</button>';
    } else {
      action = '<button class="btn btn-green btn-small" onclick="toggleStudent(\'' + users[i].id + '\')">Activate</button>';
    }

    rows += '<tr>' +
      '<td>' + escapeHtml(users[i].name) + '</td>' +
      '<td>' + escapeHtml(users[i].studentId) + '</td>' +
      '<td>' + escapeHtml(users[i].course) + '</td>' +
      '<td>' + escapeHtml(users[i].email) + '</td>' +
      '<td>' + statusBadge(users[i].status) + '</td>' +
      '<td>' + action + '</td>' +
    '</tr>';
  }

  var body = document.getElementById('studentsTable');
  var empty = document.getElementById('studentsTableEmpty');
  if (rows === '') {
    body.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    body.innerHTML = rows;
    empty.classList.add('hidden');
  }
}

async function toggleStudent(userId) {
  var user = null;
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) {
      user = users[i];
    }
  }
  if (user === null) {
    return;
  }

  var newStatus = (user.status === 'active') ? 'inactive' : 'active';

  var result = await db.from('users').update({ status: newStatus }).eq('id', userId);
  if (result.error) {
    alert('Could not update the student. Please check your internet and try again.');
    return;
  }
  user.status = newStatus;

  loadStudentsTable();
}
