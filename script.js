document.addEventListener('DOMContentLoaded', () => {
    // All DOM element selections are the same as the stable "Director's Cut"
    const plannerTitle = document.getElementById('planner-title');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const generateBtn = document.getElementById('generate-btn');
    const calendarContainer = document.getElementById('calendar-container');
    const tagList = document.getElementById('tag-list');
    const newTagNameInput = document.getElementById('new-tag-name');
    const newTagColorInput = document.getElementById('new-tag-color');
    const addTagBtn = document.getElementById('add-tag-btn');
    const modal = document.getElementById('tag-modal');
    const customTagInput = document.getElementById('custom-tag-input');
    const saveTagBtn = document.getElementById('save-tag-btn');
    const cancelTagBtn = document.getElementById('cancel-tag-btn');
    const lightThemeBtn = document.getElementById('light-theme-btn');
    const darkThemeBtn = document.getElementById('dark-theme-btn');
    const downloadBtn = document.getElementById('download-btn');
    const counterBar = document.getElementById('counter-bar');
    const counterToggle = document.getElementById('counter-toggle');
    const gridSizeSlider = document.getElementById('grid-size-slider');
    const gridSizeValue = document.getElementById('grid-size-value');
    const welcomeModal = document.getElementById('welcome-modal');
    const closeWelcomeBtn = document.getElementById('close-welcome-btn');
    const resetBtn = document.getElementById('reset-btn');
    const infoBtn = document.getElementById('info-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutBtn = document.getElementById('close-about-btn');

    // State remains the same
    let tags = [];
    let dateData = {};
    let longPressTimer;
    let isLongPress = false;
    let targetCell = null;
    let titleClickCount = 0;
    let titleClickTimer = null;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    function init() {
        loadState();
        setDefaultDates();
        renderTags();
        bindEvents();
        generateCalendar();
    }
    
    // UPDATED: Reverted to the simpler div-based swatch generation for stability
    function updateCounter() {
        let counts = {};
        tags.forEach(tag => counts[tag.name] = 0);
        let taggedDays = 0;
        const allDateCells = calendarContainer.querySelectorAll('.date-cell:not(.empty-day):not(.disabled)');
        const totalActiveDays = allDateCells.length;

        allDateCells.forEach(cell => {
            const dateStr = cell.dataset.date;
            if (dateData[dateStr] && dateData[dateStr].name) {
                const tagName = dateData[dateStr].name;
                if (counts[tagName] !== undefined) {
                    counts[tagName]++;
                    taggedDays++;
                }
            }
        });

        let counterHTML = `<div class="counter-content">`;
        tags.forEach(tag => {
            counterHTML += `
                <div class="counter-item">
                    <div class="counter-color-swatch" style="background-color: ${tag.color};"></div>
                    <span class="counter-label">${tag.name}:</span>
                    <span class="counter-value">${counts[tag.name] || 0}</span>
                </div>`;
        });
        counterHTML += `
            <div class="counter-item">
                <span class="counter-label">Untagged:</span>
                <span class="counter-value">${totalActiveDays - taggedDays}</span>
            </div>`;
        counterHTML += `</div>`;
        counterBar.innerHTML = counterHTML;
    }

    // --- (The rest of the script is the same as the final, complete "Director's Cut" version) ---
    function saveState() { try { const stateToSave = { tags, dateData, counterVisible: counterToggle.checked, gridColumns: gridSizeSlider.value, themeGradient: getComputedStyle(document.documentElement).getPropertyValue('--bg-gradient').trim(), themeAccent: getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim(), welcomed: localStorage.getItem('aetherPlanner_welcomed') === 'true' }; Object.keys(stateToSave).forEach(key => { localStorage.setItem(`aetherPlanner_${key}`, JSON.stringify(stateToSave[key])); }); } catch (e) { console.error("Failed to save state:", e); } }
    function loadState() { const savedTags = localStorage.getItem('aetherPlanner_tags'); const savedDateData = localStorage.getItem('aetherPlanner_dateData'); const counterVisible = localStorage.getItem('aetherPlanner_counterVisible'); const savedGridColumns = localStorage.getItem('aetherPlanner_gridColumns'); const savedGradient = localStorage.getItem('aetherPlanner_themeGradient'); const savedAccent = localStorage.getItem('aetherPlanner_themeAccent'); const hasBeenWelcomed = localStorage.getItem('aetherPlanner_welcomed'); if (savedGradient && savedAccent) { document.documentElement.style.setProperty('--bg-gradient', JSON.parse(savedGradient)); document.documentElement.style.setProperty('--accent-color', JSON.parse(savedAccent)); } tags = savedTags ? JSON.parse(savedTags) : [ { name: 'Weekend', color: '#2ecc71' }, { name: 'Holiday', color: '#e74c3c' }, { name: 'Festival', color: '#f1c40f' } ]; dateData = savedDateData ? JSON.parse(savedDateData) : {}; if (!savedTags && !savedDateData) { const weekendTag = tags.find(t => t.name === 'Weekend'); if (weekendTag) { const defaultStartDate = new Date(todayString); const defaultEndDate = new Date(todayString); defaultEndDate.setMonth(defaultEndDate.getMonth() + 2); let currentDate = new Date(defaultStartDate); while (currentDate <= defaultEndDate) { const dayOfWeek = currentDate.getDay(); if (dayOfWeek === 0 || dayOfWeek === 6) { const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`; dateData[dateStr] = { name: weekendTag.name, color: weekendTag.color }; } currentDate.setDate(currentDate.getDate() + 1); } } } counterToggle.checked = counterVisible !== null ? JSON.parse(counterVisible) : true; let initialColumns; if (savedGridColumns) { initialColumns = JSON.parse(savedGridColumns); } else { initialColumns = window.innerWidth < 768 ? 1 : 3; } gridSizeSlider.value = initialColumns; gridSizeValue.textContent = initialColumns; calendarContainer.style.gridTemplateColumns = `repeat(${initialColumns}, 1fr)`; updateCounterVisibility(); if (!hasBeenWelcomed) { welcomeModal.classList.remove('hidden'); } }
    function bindEvents() { closeWelcomeBtn.addEventListener('click', () => { welcomeModal.classList.add('hidden'); localStorage.setItem('aetherPlanner_welcomed', 'true'); }); infoBtn.addEventListener('click', () => welcomeModal.classList.remove('hidden')); resetBtn.addEventListener('click', () => { if (confirm("Are you sure you want to reset all data?")) { localStorage.clear(); location.reload(); } }); tagList.addEventListener('click', handleTagListClick); tagList.addEventListener('input', handleTagColorChange); settingsToggle.addEventListener('click', () => settingsPanel.classList.toggle('show')); generateBtn.addEventListener('click', generateCalendar); addTagBtn.addEventListener('click', addTag); lightThemeBtn.addEventListener('click', () => applyTheme('random')); darkThemeBtn.addEventListener('click', () => applyTheme('dark')); downloadBtn.addEventListener('click', downloadCalendar); counterToggle.addEventListener('change', () => { updateCounterVisibility(); saveState(); }); gridSizeSlider.addEventListener('input', (e) => { const columns = e.target.value; gridSizeValue.textContent = columns; calendarContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`; }); gridSizeSlider.addEventListener('change', saveState); calendarContainer.addEventListener('click', handleDateClick); calendarContainer.addEventListener('mousedown', handleDateMouseDown); calendarContainer.addEventListener('mouseup', handleDateMouseUp); calendarContainer.addEventListener('mouseleave', handleDateMouseUp); calendarContainer.addEventListener('touchstart', handleDateMouseDown, { passive: true }); calendarContainer.addEventListener('touchend', handleDateMouseUp); calendarContainer.addEventListener('contextmenu', e => e.preventDefault()); saveTagBtn.addEventListener('click', saveCustomTag); cancelTagBtn.addEventListener('click', () => modal.classList.add('hidden')); modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); }); plannerTitle.addEventListener('click', handleTitleClick); closeAboutBtn.addEventListener('click', () => aboutModal.classList.add('hidden')); aboutModal.addEventListener('click', e => { if (e.target === aboutModal) aboutModal.classList.add('hidden'); }); }
    function applyTheme(type = 'random') { let gradient, accent; const baseHue = Math.floor(Math.random() * 360); switch (type) { case 'dark': const darkSat = 60 + Math.floor(Math.random() * 20); const darkLight1 = 10 + Math.floor(Math.random() * 5); const darkLight2 = 15 + Math.floor(Math.random() * 5); const accentLight = 60 + Math.floor(Math.random() * 10); const color1 = `hsl(${baseHue}, ${darkSat}%, ${darkLight1}%)`; const color2 = `hsl(${(baseHue + 40) % 360}, ${darkSat - 10}%, ${darkLight2}%)`; accent = `hsl(${(baseHue + 150) % 360}, ${darkSat + 10}%, ${accentLight}%)`; gradient = `linear-gradient(to right top, ${color1}, ${color2})`; break; case 'random': default: const randSat = 50 + Math.floor(Math.random() * 20); const randLight = 55 + Math.floor(Math.random() * 10); const randColor1 = `hsl(${baseHue}, ${randSat}%, ${randLight}%)`; const randColor2 = `hsl(${(baseHue + 40) % 360}, ${randSat - 5}%, ${randLight - 10}%)`; accent = `hsl(${(baseHue + 20) % 360}, ${randSat + 20}%, ${randLight + 5}%)`; gradient = `linear-gradient(to right top, ${randColor1}, ${randColor2})`; break; } document.documentElement.style.setProperty('--bg-gradient', gradient); document.documentElement.style.setProperty('--accent-color', accent); saveState(); }
    function renderTags() { tagList.innerHTML = ''; tags.forEach(tag => { const li = document.createElement('li'); li.innerHTML = `<div class="tag-item-content"><div class="tag-color-wrapper"><input type="color" class="tag-color-input" value="${tag.color}" data-tag-name="${tag.name}"></div><span class="tag-name" data-tag-name="${tag.name}">${tag.name}</span></div><span class="delete-tag-btn" data-tag-name="${tag.name}" title="Delete Tag">&times;</span>`; tagList.appendChild(li); }); }
    function handleTagColorChange(e) { if (!e.target.classList.contains('tag-color-input')) return; const tagName = e.target.dataset.tagName; const newColor = e.target.value; const tagToUpdate = tags.find(t => t.name === tagName); if (tagToUpdate) { tagToUpdate.color = newColor; } Object.values(dateData).forEach(data => { if (data.name === tagName) { data.color = newColor; } }); generateCalendar(); const saveOnChange = (evt) => { saveState(); evt.target.removeEventListener('change', saveOnChange); }; e.target.addEventListener('change', saveOnChange); }
    function handleTagListClick(e) { const target = e.target; if (target.classList.contains('delete-tag-btn')) { const tagName = target.dataset.tagName; if (confirm(`Are you sure you want to delete the "${tagName}" tag?`)) { tags = tags.filter(tag => tag.name !== tagName); Object.keys(dateData).forEach(date => { if (dateData[date].name === tagName) { delete dateData[date].name; delete dateData[date].color; if (Object.keys(dateData[date]).length === 0) delete dateData[date]; } }); renderTags(); generateCalendar(); saveState(); } } else if (target.classList.contains('tag-name')) { editTagName(target); } }
    function editTagName(spanElement) { const oldName = spanElement.dataset.tagName; const input = document.createElement('input'); input.type = 'text'; input.value = oldName; input.className = 'tag-name-edit'; spanElement.replaceWith(input); input.focus(); input.select(); const saveChanges = () => { const newName = input.value.trim(); if (newName && newName !== oldName && !tags.some(t => t.name.toLowerCase() === newName.toLowerCase())) { const tagToUpdate = tags.find(t => t.name === oldName); if (tagToUpdate) tagToUpdate.name = newName; Object.values(dateData).forEach(data => { if (data.name === oldName) data.name = newName; }); renderTags(); generateCalendar(); saveState(); } else { renderTags(); } }; input.addEventListener('blur', saveChanges); input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') { input.value = oldName; input.blur(); } }); }
    function handleTitleClick() { titleClickCount++; if (titleClickCount === 1) { titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 500); } else if (titleClickCount === 3) { clearTimeout(titleClickTimer); titleClickCount = 0; aboutModal.classList.remove('hidden'); } }
    function setDefaultDates() { const localToday = new Date(todayString); const twoMonthsLater = new Date(localToday); twoMonthsLater.setMonth(localToday.getMonth() + 2); startDateInput.value = todayString; endDateInput.value = twoMonthsLater.toISOString().split('T')[0]; }
    function createMonthGrid(year, month) { const startDate = new Date(startDateInput.value); startDate.setUTCHours(0, 0, 0, 0); const endDate = new Date(endDateInput.value); endDate.setUTCHours(0, 0, 0, 0); const monthContainer = document.createElement('div'); monthContainer.className = 'month-grid glassmorphic'; const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' }); monthContainer.innerHTML = `<h3 class="month-header">${monthName}</h3>`; const calendarGrid = document.createElement('div'); calendarGrid.className = 'calendar'; ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => { const dayNameEl = document.createElement('div'); dayNameEl.className = 'day-name'; dayNameEl.textContent = day; calendarGrid.appendChild(dayNameEl); }); const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay(); const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); for (let i = 0; i < firstDay; i++) { const emptyCell = document.createElement('div'); emptyCell.className = 'date-cell empty-day'; calendarGrid.appendChild(emptyCell); } for (let day = 1; day <= daysInMonth; day++) { const dateCell = document.createElement('div'); dateCell.className = 'date-cell'; const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; dateCell.dataset.date = dateStr; const currentCellDate = new Date(dateStr); currentCellDate.setUTCHours(0, 0, 0, 0); if (currentCellDate < startDate || currentCellDate > endDate) { dateCell.classList.add('disabled'); } if (dateStr === todayString) { dateCell.classList.add('today'); } dateCell.innerHTML = `<span class="date-number">${day}</span>`; if (dateData[dateStr]) { const tagData = dateData[dateStr]; if(tagData.color) { dateCell.style.backgroundColor = tagData.color; dateCell.dataset.currentTag = tagData.name; } if(tagData.customText) { dateCell.innerHTML += `<span class="date-tag">${tagData.customText}</span>`; } } calendarGrid.appendChild(dateCell); } const totalCells = firstDay + daysInMonth; const cellsToAdd = 42 - totalCells; for (let i = 0; i < cellsToAdd; i++) { const emptyCell = document.createElement('div'); emptyCell.className = 'date-cell empty-day'; calendarGrid.appendChild(emptyCell); } monthContainer.appendChild(calendarGrid); const wrapper = document.createElement('div'); wrapper.className = 'month-grid-wrapper'; wrapper.appendChild(monthContainer); calendarContainer.appendChild(wrapper); }
    function generateCalendar() { calendarContainer.innerHTML = ''; const startDate = new Date(startDateInput.value); const endDate = new Date(endDateInput.value); const monthDifference = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()); if (monthDifference > 60) { alert("That's a bit ambitious! Please select a date range of 5 years or less to ensure performance."); return; } if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) { calendarContainer.innerHTML = '<div class="error-message glassmorphic">Invalid date range.</div>'; return; } startDate.setUTCHours(0, 0, 0, 0); endDate.setUTCHours(0, 0, 0, 0); let currentDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1)); while (currentDate <= endDate) { createMonthGrid(currentDate.getUTCFullYear(), currentDate.getUTCMonth()); currentDate.setUTCMonth(currentDate.getUTCMonth() + 1); } updateCounter(); }
    function downloadCalendar() { const bodyGradient = getComputedStyle(document.documentElement).getPropertyValue('background'); html2canvas(calendarContainer, { useCORS: true, allowTaint: true, onclone: (doc) => { doc.getElementById('calendar-container').style.background = bodyGradient; } }).then(canvas => { const link = document.createElement('a'); link.download = `Aether-Planner-${new Date().toISOString().split('T')[0]}.png`; link.href = canvas.toDataURL('image/png'); link.click(); }); }
    function updateCounterVisibility() { if (counterToggle.checked) { counterBar.classList.remove('hidden'); } else { counterBar.classList.add('hidden'); } }
    function addTag() { const name = newTagNameInput.value.trim(); const color = newTagColorInput.value; if (name && !tags.some(t => t.name.toLowerCase() === name.toLowerCase())) { tags.push({ name, color }); renderTags(); updateCounter(); saveState(); newTagNameInput.value = ''; } else if (!name) { alert('Please enter a tag name.'); } else { alert('This tag name already exists.'); } }
    function handleDateMouseDown(e) { targetCell = e.target.closest('.date-cell'); if (!targetCell || targetCell.classList.contains('empty-day') || targetCell.classList.contains('disabled')) return; isLongPress = false; longPressTimer = setTimeout(() => { isLongPress = true; showModal(targetCell); }, 700); }
    function handleDateMouseUp() { clearTimeout(longPressTimer); }
    function handleDateClick(e) { targetCell = e.target.closest('.date-cell'); if (!targetCell || targetCell.classList.contains('empty-day') || targetCell.classList.contains('disabled') || isLongPress) return; const dateStr = targetCell.dataset.date; if (dateStr.endsWith('-10-28')) { triggerConfettiShower(); } const currentTagName = targetCell.dataset.currentTag; const currentIndex = tags.findIndex(tag => tag.name === currentTagName); const nextIndex = currentIndex + 1; if (nextIndex < tags.length) { const nextTag = tags[nextIndex]; targetCell.style.backgroundColor = nextTag.color; targetCell.dataset.currentTag = nextTag.name; dateData[dateStr] = { ...(dateData[dateStr] || {}), color: nextTag.color, name: nextTag.name }; } else { targetCell.style.backgroundColor = ''; targetCell.removeAttribute('data-current-tag'); if (dateData[dateStr]) { delete dateData[dateStr].color; delete dateData[dateStr].name; if (Object.keys(dateData[dateStr]).length === 0) delete dateData[dateStr]; } } updateCounter(); saveState(); }
    function triggerConfettiShower() { const duration = 2 * 1000; const animationEnd = Date.now() + duration; const colors = ['#FFFFFF', '#FFC0CB', '#FFD700', getComputedStyle(document.documentElement).getPropertyValue('--accent-color')]; const randomInRange = (min, max) => Math.random() * (max - min) + min; const interval = setInterval(() => { const timeLeft = animationEnd - Date.now(); if (timeLeft <= 0) { return clearInterval(interval); } const particleCount = 50 * (timeLeft / duration); confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: colors }); confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: colors }); }, 250); }
    function showModal(cell) { customTagInput.value = dateData[cell.dataset.date]?.customText || ''; modal.classList.remove('hidden'); customTagInput.focus(); }
    function hideModal() { modal.classList.add('hidden'); }
    function saveCustomTag() { if (!targetCell) return; const dateStr = targetCell.dataset.date; const customText = customTagInput.value.trim(); const existingTagEl = targetCell.querySelector('.date-tag'); if (existingTagEl) existingTagEl.remove(); if (customText) { targetCell.innerHTML += `<span class="date-tag">${customText}</span>`; if (!dateData[dateStr]) dateData[dateStr] = {}; dateData[dateStr].customText = customText; } else { if (dateData[dateStr]) { delete dateData[dateStr].customText; if (Object.keys(dateData[dateStr]).length === 0) delete dateData[dateStr]; } } hideModal(); saveState(); }

    init();
});
