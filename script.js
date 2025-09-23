document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements (same as before)
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
    const randomThemeBtn = document.getElementById('random-theme-btn');
    const downloadBtn = document.getElementById('download-btn');
    const counterBar = document.getElementById('counter-bar');
    const counterToggle = document.getElementById('counter-toggle');
    const gridSizeSlider = document.getElementById('grid-size-slider');
    const gridSizeValue = document.getElementById('grid-size-value');

    // State (same as before)
    let tags = [];
    let dateData = {};
    let longPressTimer;
    let isLongPress = false;
    let targetCell = null;

    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localToday = new Date(today.getTime() - offset);
    const todayString = localToday.toISOString().split('T')[0];

    function init() {
        loadState();
        setDefaultDates();
        renderTags();
        bindEvents();
        generateCalendar();
    }

    // UPDATED: createMonthGrid function has the new logic
    function createMonthGrid(year, month) {
        // Get the start and end dates from the inputs for comparison
        const startDate = new Date(startDateInput.value);
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date(endDateInput.value);
        endDate.setUTCHours(0, 0, 0, 0);

        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-grid glassmorphic';
        const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
        monthContainer.innerHTML = `<h3 class="month-header">${monthName}</h3>`;
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayNameEl = document.createElement('div');
            dayNameEl.className = 'day-name';
            dayNameEl.textContent = day;
            calendarGrid.appendChild(dayNameEl);
        });

        const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'date-cell empty-day';
            calendarGrid.appendChild(emptyCell);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell';
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dateCell.dataset.date = dateStr;

            // --- THIS IS THE FIX ---
            const currentCellDate = new Date(dateStr);
            currentCellDate.setUTCHours(0, 0, 0, 0);
            if (currentCellDate < startDate || currentCellDate > endDate) {
                dateCell.classList.add('disabled');
            }
            // --- End of Fix ---

            if (dateStr === todayString) { dateCell.classList.add('today'); }
            dateCell.innerHTML = `<span class="date-number">${day}</span>`;
            if (dateData[dateStr]) {
                const tagData = dateData[dateStr];
                if(tagData.color) { dateCell.style.backgroundColor = tagData.color; dateCell.dataset.currentTag = tagData.name; }
                if(tagData.customText) { dateCell.innerHTML += `<span class="date-tag">${tagData.customText}</span>`; }
            }
            calendarGrid.appendChild(dateCell);
        }
        monthContainer.appendChild(calendarGrid);

        const wrapper = document.createElement('div');
        wrapper.className = 'month-grid-wrapper';
        wrapper.appendChild(monthContainer);
        calendarContainer.appendChild(wrapper);
    }

    // --- (The rest of the script is unchanged) ---
    function saveState() { try { localStorage.setItem('plannerTags', JSON.stringify(tags)); localStorage.setItem('plannerDateData', JSON.stringify(dateData)); localStorage.setItem('plannerCounterVisible', counterToggle.checked); localStorage.setItem('plannerGridColumns', gridSizeSlider.value); } catch (e) { console.error("Failed to save state:", e); } }
    function loadState() { const savedTags = localStorage.getItem('plannerTags'); const savedDateData = localStorage.getItem('plannerDateData'); const counterVisible = localStorage.getItem('plannerCounterVisible'); const savedGridColumns = localStorage.getItem('plannerGridColumns'); tags = savedTags ? JSON.parse(savedTags) : [ { name: 'Holiday', color: '#e74c3c' }, { name: 'Absent', color: '#f1c40f' } ]; dateData = savedDateData ? JSON.parse(savedDateData) : {}; counterToggle.checked = counterVisible !== null ? JSON.parse(counterVisible) : true; if (savedGridColumns) { gridSizeSlider.value = savedGridColumns; gridSizeValue.textContent = savedGridColumns; calendarContainer.style.gridTemplateColumns = `repeat(${savedGridColumns}, 1fr)`; } updateCounterVisibility(); }
    function setDefaultDates() { const twoMonthsLater = new Date(localToday); twoMonthsLater.setMonth(localToday.getMonth() + 2); startDateInput.value = todayString; endDateInput.value = twoMonthsLater.toISOString().split('T')[0]; }
    function bindEvents() { settingsToggle.addEventListener('click', () => settingsPanel.classList.toggle('show')); generateBtn.addEventListener('click', generateCalendar); addTagBtn.addEventListener('click', addTag); randomThemeBtn.addEventListener('click', applyRandomTheme); tagList.addEventListener('click', handleTagListClick); downloadBtn.addEventListener('click', downloadCalendar); counterToggle.addEventListener('change', () => { updateCounterVisibility(); saveState(); }); gridSizeSlider.addEventListener('input', (e) => { const columns = e.target.value; gridSizeValue.textContent = columns; calendarContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`; }); gridSizeSlider.addEventListener('change', saveState); calendarContainer.addEventListener('click', handleDateClick); calendarContainer.addEventListener('mousedown', handleDateMouseDown); calendarContainer.addEventListener('mouseup', handleDateMouseUp); calendarContainer.addEventListener('mouseleave', handleDateMouseUp); calendarContainer.addEventListener('touchstart', handleDateMouseDown, { passive: true }); calendarContainer.addEventListener('touchend', handleDateMouseUp); calendarContainer.addEventListener('contextmenu', e => e.preventDefault()); saveTagBtn.addEventListener('click', saveCustomTag); cancelTagBtn.addEventListener('click', hideModal); modal.addEventListener('click', e => { if (e.target === modal) hideModal(); }); }
    function applyRandomTheme() { const baseHue = Math.floor(Math.random() * 360); const sat = 50 + Math.floor(Math.random() * 20); const light = 55 + Math.floor(Math.random() * 10); const color1 = `hsl(${baseHue}, ${sat}%, ${light}%)`; const color2 = `hsl(${(baseHue + 40) % 360}, ${sat - 5}%, ${light - 10}%)`; const accent = `hsl(${(baseHue + 20) % 360}, ${sat + 20}%, ${light + 5}%)`; const root = document.documentElement; root.style.setProperty('--bg-gradient', `linear-gradient(to right top, ${color1}, ${color2})`); root.style.setProperty('--accent-color', accent); }
    function downloadCalendar() { const bodyGradient = getComputedStyle(document.documentElement).getPropertyValue('background'); html2canvas(calendarContainer, { useCORS: true, allowTaint: true, onclone: (doc) => { doc.getElementById('calendar-container').style.background = bodyGradient; } }).then(canvas => { const link = document.createElement('a'); link.download = `calendar-plan-${new Date().toISOString().split('T')[0]}.png`; link.href = canvas.toDataURL('image/png'); link.click(); }); }
    function updateCounter() { let counts = {}; tags.forEach(tag => counts[tag.name] = 0); let taggedDays = 0; const allDateCells = calendarContainer.querySelectorAll('.date-cell:not(.empty-day):not(.disabled)'); const totalDays = allDateCells.length; allDateCells.forEach(cell => { const dateStr = cell.dataset.date; if (dateData[dateStr] && dateData[dateStr].name) { const tagName = dateData[dateStr].name; if (counts[tagName] !== undefined) { counts[tagName]++; taggedDays++; } } }); counterBar.innerHTML = ''; tags.forEach(tag => { counterBar.innerHTML += `<div class="counter-item"><div class="tag-color-swatch" style="background-color: ${tag.color};"></div><span class="counter-label">${tag.name}:</span><span class="counter-value">${counts[tag.name] || 0}</span></div>`; }); counterBar.innerHTML += `<div class="counter-item"><span class="counter-label">Untagged:</span><span class="counter-value">${totalDays - taggedDays}</span></div>`; }
    function updateCounterVisibility() { if (counterToggle.checked) { counterBar.classList.remove('hidden'); } else { counterBar.classList.add('hidden'); } }
    function renderTags() { tagList.innerHTML = ''; tags.forEach(tag => { const li = document.createElement('li'); li.innerHTML = `<div class="tag-item-content"><div class="tag-color-swatch" style="background-color: ${tag.color};"></div>${tag.name}</div><span class="delete-tag-btn" data-tag-name="${tag.name}" title="Delete Tag">&times;</span>`; tagList.appendChild(li); }); }
    function addTag() { const name = newTagNameInput.value.trim(); const color = newTagColorInput.value; if (name && !tags.some(t => t.name.toLowerCase() === name.toLowerCase())) { tags.push({ name, color }); renderTags(); updateCounter(); saveState(); newTagNameInput.value = ''; } else if (!name) { alert('Please enter a tag name.'); } else { alert('This tag name already exists.'); } }
    function handleTagListClick(e) { if (e.target.classList.contains('delete-tag-btn')) { const tagName = e.target.dataset.tagName; if (confirm(`Are you sure you want to delete the "${tagName}" tag?`)) { tags = tags.filter(tag => tag.name !== tagName); Object.keys(dateData).forEach(date => { if (dateData[date].name === tagName) { delete dateData[date].name; delete dateData[date].color; if (Object.keys(dateData[date]).length === 0) delete dateData[date]; } }); renderTags(); generateCalendar(); saveState(); } } }
    function generateCalendar() { calendarContainer.innerHTML = ''; const startDate = new Date(startDateInput.value); const endDate = new Date(endDateInput.value); if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) { calendarContainer.innerHTML = '<div class="error-message glassmorphic">Invalid date range. Please select a start date that is before the end date.</div>'; return; } startDate.setUTCHours(0, 0, 0, 0); endDate.setUTCHours(0, 0, 0, 0); let currentDate = new Date(startDate); while (currentDate <= endDate) { createMonthGrid(currentDate.getUTCFullYear(), currentDate.getUTCMonth()); currentDate.setUTCMonth(currentDate.getUTCMonth() + 1); } updateCounter(); }
    function handleDateMouseDown(e) { targetCell = e.target.closest('.date-cell'); if (!targetCell || targetCell.classList.contains('empty-day') || targetCell.classList.contains('disabled')) return; isLongPress = false; longPressTimer = setTimeout(() => { isLongPress = true; showModal(targetCell); }, 700); }
    function handleDateMouseUp() { clearTimeout(longPressTimer); }
    function handleDateClick(e) { targetCell = e.target.closest('.date-cell'); if (!targetCell || targetCell.classList.contains('empty-day') || targetCell.classList.contains('disabled') || isLongPress) return; const dateStr = targetCell.dataset.date; if (dateStr.endsWith('-10-28')) { triggerConfettiShower(); } const currentTagName = targetCell.dataset.currentTag; const currentIndex = tags.findIndex(tag => tag.name === currentTagName); const nextIndex = currentIndex + 1; if (nextIndex < tags.length) { const nextTag = tags[nextIndex]; targetCell.style.backgroundColor = nextTag.color; targetCell.dataset.currentTag = nextTag.name; dateData[dateStr] = { ...(dateData[dateStr] || {}), color: nextTag.color, name: nextTag.name }; } else { targetCell.style.backgroundColor = ''; targetCell.removeAttribute('data-current-tag'); if (dateData[dateStr]) { delete dateData[dateStr].color; delete dateData[dateStr].name; if (Object.keys(dateData[dateStr]).length === 0) delete dateData[dateStr]; } } updateCounter(); saveState(); }
    function triggerConfettiShower() { const duration = 2 * 1000; const animationEnd = Date.now() + duration; const colors = ['#FFFFFF', '#FFC0CB', '#FFD700', getComputedStyle(document.documentElement).getPropertyValue('--accent-color')]; const randomInRange = (min, max) => Math.random() * (max - min) + min; const interval = setInterval(() => { const timeLeft = animationEnd - Date.now(); if (timeLeft <= 0) { return clearInterval(interval); } const particleCount = 50 * (timeLeft / duration); confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: colors }); confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: colors }); }, 250); }
    function showModal(cell) { customTagInput.value = dateData[cell.dataset.date]?.customText || ''; modal.classList.remove('hidden'); customTagInput.focus(); }
    function hideModal() { modal.classList.add('hidden'); }
    function saveCustomTag() { if (!targetCell) return; const dateStr = targetCell.dataset.date; const customText = customTagInput.value.trim(); const existingTagEl = targetCell.querySelector('.date-tag'); if (existingTagEl) existingTagEl.remove(); if (customText) { targetCell.innerHTML += `<span class="date-tag">${customText}</span>`; if (!dateData[dateStr]) dateData[dateStr] = {}; dateData[dateStr].customText = customText; } else { if (dateData[dateStr]) { delete dateData[dateStr].customText; if (Object.keys(dateData[dateStr]).length === 0) delete dateData[dateStr]; } } hideModal(); saveState(); }
    
    init();
});
