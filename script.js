document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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

    // State
    let tags = [ { name: 'Holiday', color: '#e74c3c' }, { name: 'Absent', color: '#f1c40f' } ];
    let dateData = {};
    let longPressTimer;
    let isLongPress = false;
    let targetCell = null;

    // NEW: Get today's date string for highlighting
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localToday = new Date(today.getTime() - offset);
    const todayString = localToday.toISOString().split('T')[0];

    function init() {
        setDefaultDates();
        renderTags();
        bindEvents();
        generateCalendar();
    }

    function setDefaultDates() {
        const twoMonthsLater = new Date(localToday); // Use the already-calculated localToday
        twoMonthsLater.setMonth(localToday.getMonth() + 2);
        startDateInput.value = todayString;
        endDateInput.value = twoMonthsLater.toISOString().split('T')[0];
    }

    function bindEvents() {
        settingsToggle.addEventListener('click', () => settingsPanel.classList.toggle('show'));
        generateBtn.addEventListener('click', generateCalendar);
        addTagBtn.addEventListener('click', addTag);
        randomThemeBtn.addEventListener('click', applyRandomTheme);
        tagList.addEventListener('click', handleTagListClick);

        calendarContainer.addEventListener('click', handleDateClick);
        calendarContainer.addEventListener('mousedown', handleDateMouseDown);
        calendarContainer.addEventListener('mouseup', handleDateMouseUp);
        calendarContainer.addEventListener('mouseleave', handleDateMouseUp);
        calendarContainer.addEventListener('touchstart', handleDateMouseDown, { passive: true });
        calendarContainer.addEventListener('touchend', handleDateMouseUp);
        calendarContainer.addEventListener('contextmenu', e => e.preventDefault());

        saveTagBtn.addEventListener('click', saveCustomTag);
        cancelTagBtn.addEventListener('click', hideModal);
        modal.addEventListener('click', e => { if (e.target === modal) hideModal(); });
    }

    function applyRandomTheme() {
        const baseHue = Math.floor(Math.random() * 360);
        const sat = 50 + Math.floor(Math.random() * 20);
        const light = 55 + Math.floor(Math.random() * 10);
        const color1 = `hsl(${baseHue}, ${sat}%, ${light}%)`;
        const color2 = `hsl(${(baseHue + 40) % 360}, ${sat - 5}%, ${light - 10}%)`;
        const accent = `hsl(${(baseHue + 20) % 360}, ${sat + 20}%, ${light + 5}%)`;
        const root = document.documentElement;
        root.style.setProperty('--bg-gradient', `linear-gradient(to right top, ${color1}, ${color2})`);
        root.style.setProperty('--accent-color', accent);
    }

    function renderTags() {
        tagList.innerHTML = '';
        tags.forEach(tag => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="tag-item-content">
                    <div class="tag-color-swatch" style="background-color: ${tag.color};"></div>
                    ${tag.name}
                </div>
                <span class="delete-tag-btn" data-tag-name="${tag.name}" title="Delete Tag">&times;</span>`;
            tagList.appendChild(li);
        });
    }

    function addTag() {
        const name = newTagNameInput.value.trim();
        const color = newTagColorInput.value;
        if (name && !tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
            tags.push({ name, color });
            renderTags();
            newTagNameInput.value = '';
        } else if (!name) { alert('Please enter a tag name.'); } 
        else { alert('This tag name already exists.'); }
    }

    function handleTagListClick(e) {
        if (e.target.classList.contains('delete-tag-btn')) {
            const tagName = e.target.dataset.tagName;
            if (confirm(`Are you sure you want to delete the "${tagName}" tag?`)) {
                tags = tags.filter(tag => tag.name !== tagName);
                Object.keys(dateData).forEach(date => {
                    if (dateData[date].name === tagName) {
                        delete dateData[date].name;
                        delete dateData[date].color;
                        if (Object.keys(dateData[date]).length === 0) delete dateData[date];
                    }
                });
                renderTags();
                generateCalendar();
            }
        }
    }

    function generateCalendar() {
        calendarContainer.innerHTML = '';
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
            calendarContainer.innerHTML = '<p class="glassmorphic" style="padding: 1rem; text-align: center;">Invalid date range.</p>';
            return;
        }
        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(0, 0, 0, 0);
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            createMonthGrid(currentDate.getUTCFullYear(), currentDate.getUTCMonth());
            currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
        }
    }

    function createMonthGrid(year, month) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-grid glassmorphic';
        const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
        monthContainer.innerHTML = `<h3 class="month-header">${monthName}</h3>`;
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            calendarGrid.innerHTML += `<div class="day-name">${day}</div>`;
        });
        const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        for (let i = 0; i < firstDay; i++) { calendarGrid.appendChild(document.createElement('div')).className = 'date-cell empty-day'; }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell';
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dateCell.dataset.date = dateStr;

            // NEW: Apply the 'today' class if the date matches
            if (dateStr === todayString) {
                dateCell.classList.add('today');
            }

            dateCell.innerHTML = `<span class="date-number">${day}</span>`;
            if (dateData[dateStr]) {
                const tagData = dateData[dateStr];
                if(tagData.color) { dateCell.style.backgroundColor = tagData.color; dateCell.dataset.currentTag = tagData.name; }
                if(tagData.customText) { dateCell.innerHTML += `<span class="date-tag">${tagData.customText}</span>`; }
            }
            calendarGrid.appendChild(dateCell);
        }
        monthContainer.appendChild(calendarGrid);
        calendarContainer.appendChild(monthContainer);
    }
    
    function handleDateMouseDown(e) {
        targetCell = e.target.closest('.date-cell');
        if (!targetCell || targetCell.classList.contains('empty-day')) return;
        isLongPress = false;
        longPressTimer = setTimeout(() => { isLongPress = true; showModal(targetCell); }, 700);
    }

    function handleDateMouseUp() { clearTimeout(longPressTimer); }

    function handleDateClick(e) {
        if (!targetCell || targetCell.classList.contains('empty-day') || isLongPress) return;
        const dateStr = targetCell.dataset.date;
        const currentTagName = targetCell.dataset.currentTag;
        const currentIndex = tags.findIndex(tag => tag.name === currentTagName);
        const nextIndex = currentIndex + 1;
        if (nextIndex < tags.length) {
            const nextTag = tags[nextIndex];
            targetCell.style.backgroundColor = nextTag.color;
            targetCell.dataset.currentTag = nextTag.name;
            dateData[dateStr] = { ...(dateData[dateStr] || {}), color: nextTag.color, name: nextTag.name };
        } else {
            targetCell.style.backgroundColor = '';
            targetCell.removeAttribute('data-current-tag');
            if (dateData[dateStr]) {
                delete dateData[dateStr].color;
                delete dateData[dateStr].name;
                if (Object.keys(dateData[dateStr]).length === 0) delete dateData[dateStr];
            }
        }
    }
    
    function showModal(cell) {
        customTagInput.value = dateData[cell.dataset.date]?.customText || '';
        modal.classList.remove('hidden');
        customTagInput.focus();
    }
    
    function hideModal() { modal.classList.add('hidden'); }
    
    function saveCustomTag() {
        if (!targetCell) return;
        const dateStr = targetCell.dataset.date;
        const customText = customTagInput.value.trim();
        const existingTagEl = targetCell.querySelector('.date-tag');
        if (existingTagEl) existingTagEl.remove();
        if (customText) {
            targetCell.innerHTML += `<span class="date-tag">${customText}</span>`;
            if (!dateData[dateStr]) dateData[dateStr] = {};
            dateData[dateStr].customText = customText;
        } else {
            if (dateData[dateStr]) {
                delete dateData[dateStr].customText;
                if (Object.keys(dateData[dateStr]).length === 0) delete dateData[dateStr];
            }
        }
        hideModal();
    }

    init();
});
