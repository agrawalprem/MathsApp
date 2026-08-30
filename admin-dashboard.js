// ============================================================================
// ADMINISTRATOR DASHBOARD - JavaScript Logic
// ============================================================================
// Counts pass/fail/total attempts per class+section by day (and week),
// using the YYYYMMDD prefix of user_scores document IDs.

let availableSchools = [];
let availableClasses = [];
let selectedSchoolId = null;
/** Map key: `${class}|${section}` -> Map of ymd -> { pass, fail } */
let countsByClassDate = new Map();
let dayYmDs = [];
let weekRanges = [];
let listenersBound = false;

function showLoading(show) {
    const el = document.getElementById('loadingMessage');
    if (el) el.style.display = show ? 'block' : 'none';
}

function showError(message) {
    const el = document.getElementById('errorMessage');
    if (!el) return;
    if (!message) {
        el.classList.add('hidden');
        el.textContent = '';
        return;
    }
    el.classList.remove('hidden');
    el.textContent = message;
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatLocalYmd(date) {
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
}

function ymdToInputValue(ymd) {
    return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

function inputValueToYmd(value) {
    return String(value || '').replace(/-/g, '');
}

function parseYmdToLocalDate(ymd) {
    const y = Number(ymd.slice(0, 4));
    const m = Number(ymd.slice(4, 6)) - 1;
    const d = Number(ymd.slice(6, 8));
    return new Date(y, m, d);
}

function addDaysYmd(ymd, days) {
    const dt = parseYmdToLocalDate(ymd);
    dt.setDate(dt.getDate() + days);
    return formatLocalYmd(dt);
}

function defaultDateRange() {
    const to = new Date();
    to.setHours(0, 0, 0, 0);
    const from = new Date(to);
    from.setDate(from.getDate() - 13); // last 14 days inclusive
    return { fromYmd: formatLocalYmd(from), toYmd: formatLocalYmd(to) };
}

function scoreDateFromDocId(docId) {
    const base = String(docId).split('_')[0];
    if (base.length < 8 || !/^\d{8}/.test(base)) return '';
    return base.slice(0, 8);
}

function isPassed(value) {
    return value === true || value === 'true' || value === 1 || value === '1';
}

function classKey(classVal, sectionVal) {
    return `${String(classVal)}|${String(sectionVal)}`;
}

function getMetricFlags() {
    return {
        pass: !!document.getElementById('showPass')?.checked,
        fail: !!document.getElementById('showFail')?.checked,
        total: !!document.getElementById('showTotal')?.checked,
    };
}

function getViewMode() {
    const selected = document.querySelector('input[name="viewMode"]:checked');
    return selected ? selected.value : 'daily';
}

function formatDayHeader(ymd) {
    const dt = parseYmdToLocalDate(ymd);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${weekdays[dt.getDay()]} ${pad2(dt.getDate())} ${months[dt.getMonth()]}`;
}

function formatWeekHeader(week) {
    return `Week ${formatDayHeader(week.startYmd)}–${formatDayHeader(week.endYmd)}`;
}

/** Sunday–Saturday weeks that intersect [fromYmd, toYmd]. */
function buildWeekRanges(fromYmd, toYmd) {
    const weeks = [];
    let cursor = parseYmdToLocalDate(fromYmd);
    // Move back to Sunday of that week
    cursor.setDate(cursor.getDate() - cursor.getDay());

    const end = parseYmdToLocalDate(toYmd);
    while (cursor <= end) {
        const weekStart = new Date(cursor);
        const weekEnd = new Date(cursor);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const startYmd = formatLocalYmd(weekStart);
        const endYmd = formatLocalYmd(weekEnd);
        // Clip to selected range for summing days that exist in dayYmDs
        weeks.push({ startYmd, endYmd });
        cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
}

function buildDayList(fromYmd, toYmd) {
    const days = [];
    let cur = fromYmd;
    while (cur <= toYmd) {
        days.push(cur);
        cur = addDaysYmd(cur, 1);
    }
    return days;
}

function emptyCounts() {
    return { pass: 0, fail: 0 };
}

function getCounts(classVal, sectionVal, ymd) {
    const byDate = countsByClassDate.get(classKey(classVal, sectionVal));
    if (!byDate) return emptyCounts();
    return byDate.get(ymd) || emptyCounts();
}

function sumCountsForDays(classVal, sectionVal, ymds) {
    const total = emptyCounts();
    ymds.forEach((ymd) => {
        const c = getCounts(classVal, sectionVal, ymd);
        total.pass += c.pass;
        total.fail += c.fail;
    });
    return total;
}

function renderCellHtml(counts, metrics) {
    const parts = [];
    if (metrics.pass) {
        parts.push(`<span class="count-pass">${counts.pass}</span>`);
    }
    if (metrics.fail) {
        parts.push(`<span class="count-fail">${counts.fail}</span>`);
    }
    if (metrics.total) {
        parts.push(`<span class="count-total">${counts.pass + counts.fail}</span>`);
    }
    if (parts.length === 0) return '';
    return parts.join('<span class="count-sep">/</span>');
}

async function fetchAllSchools() {
    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
    const schoolMap = new Map();

    // Preferred source: classes collection (schools collection may be empty)
    try {
        const classesSnap = await getDocs(collection(window.firebaseDb, 'classes'));
        classesSnap.forEach((docSnap) => {
            const data = docSnap.data() || {};
            if (data.school_id == null) return;
            const idKey = String(data.school_id);
            if (!schoolMap.has(idKey)) {
                schoolMap.set(idKey, {
                    school_id: data.school_id,
                    school_name: data.school_name || `School ${data.school_id}`,
                });
            } else if (data.school_name && schoolMap.get(idKey).school_name.startsWith('School ')) {
                schoolMap.get(idKey).school_name = data.school_name;
            }
        });
    } catch (err) {
        console.warn('Could not load schools from classes:', err?.message || err);
    }

    // Merge any schools collection docs if present
    try {
        const schoolsSnap = await getDocs(collection(window.firebaseDb, 'schools'));
        schoolsSnap.forEach((docSnap) => {
            const data = docSnap.data() || {};
            const schoolId = data.school_id != null ? data.school_id : docSnap.id;
            const idKey = String(schoolId);
            if (!schoolMap.has(idKey)) {
                schoolMap.set(idKey, {
                    school_id: schoolId,
                    school_name: data.school_name || `School ${schoolId}`,
                });
            } else if (data.school_name) {
                schoolMap.get(idKey).school_name = data.school_name;
            }
        });
    } catch (err) {
        console.warn('Could not load schools collection:', err?.message || err);
    }

    const schools = Array.from(schoolMap.values());
    schools.sort((a, b) =>
        String(a.school_id).localeCompare(String(b.school_id), undefined, { numeric: true })
    );
    return schools;
}

async function fetchClassesForSchool(schoolId) {
    if (!schoolId && schoolId !== 0) return [];
    const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");
    const classMap = new Map();

    const candidates = [];
    const asNum = Number(schoolId);
    if (!Number.isNaN(asNum)) candidates.push(asNum);
    candidates.push(String(schoolId));

    // Prefer classes collection
    for (const candidate of candidates) {
        try {
            const classesRef = collection(window.firebaseDb, 'classes');
            const snap = await getDocs(query(classesRef, where('school_id', '==', candidate)));
            snap.forEach((docSnap) => {
                const data = docSnap.data() || {};
                if (data.class == null || data.section == null) return;
                const classStr = String(data.class);
                const sectionStr = String(data.section);
                const key = classKey(classStr, sectionStr);
                if (!classMap.has(key)) {
                    classMap.set(key, { class: classStr, section: sectionStr });
                }
            });
            if (classMap.size > 0) break;
        } catch (err) {
            console.warn('classes query failed for candidate', candidate, err?.message || err);
        }
    }

    // Fallback: distinct class/section from student profiles
    if (classMap.size === 0) {
        const profilesRef = collection(window.firebaseDb, 'user_profiles');
        for (const candidate of candidates) {
            const studentsQuery = query(
                profilesRef,
                where('user_type', '==', 'Student'),
                where('school_id', '==', candidate)
            );
            const snap = await getDocs(studentsQuery);
            snap.forEach((docSnap) => {
                const data = docSnap.data() || {};
                if (data.class == null || data.section == null) return;
                const classStr = String(data.class);
                const sectionStr = String(data.section);
                const key = classKey(classStr, sectionStr);
                if (!classMap.has(key)) {
                    classMap.set(key, { class: classStr, section: sectionStr });
                }
            });
            if (classMap.size > 0) break;
        }
    }

    const classes = Array.from(classMap.values());
    classes.sort((a, b) => {
        if (a.class !== b.class) {
            return String(a.class).localeCompare(String(b.class), undefined, { numeric: true });
        }
        return String(a.section).localeCompare(String(b.section));
    });
    return classes;
}

async function fetchScoresForSchoolDateRange(schoolId, fromYmd, toYmd) {
    const { collection, query, where, getDocs, orderBy, startAt, endBefore, documentId } =
        await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js");

    const scoresRef = collection(window.firebaseDb, 'user_scores');
    const startId = `${fromYmd}000000`;
    const endId = `${addDaysYmd(toYmd, 1)}000000`;

    const candidates = [];
    const asNum = Number(schoolId);
    if (!Number.isNaN(asNum)) candidates.push(asNum);
    candidates.push(String(schoolId));

    const docs = [];
    const seen = new Set();

    for (const candidate of candidates) {
        let usedFallback = false;
        try {
            const q = query(
                scoresRef,
                where('school_id', '==', candidate),
                orderBy(documentId()),
                startAt(startId),
                endBefore(endId)
            );
            const snap = await getDocs(q);
            snap.forEach((docSnap) => {
                if (seen.has(docSnap.id)) return;
                seen.add(docSnap.id);
                docs.push({ id: docSnap.id, data: docSnap.data() || {} });
            });
        } catch (err) {
            console.warn('Date-ranged score query failed; falling back to school filter:', err?.message || err);
            usedFallback = true;
            const q = query(scoresRef, where('school_id', '==', candidate));
            const snap = await getDocs(q);
            snap.forEach((docSnap) => {
                const ymd = scoreDateFromDocId(docSnap.id);
                if (!ymd || ymd < fromYmd || ymd > toYmd) return;
                if (seen.has(docSnap.id)) return;
                seen.add(docSnap.id);
                docs.push({ id: docSnap.id, data: docSnap.data() || {} });
            });
        }
        if (docs.length > 0 || !usedFallback) {
            // Prefer first candidate that returns data; still try string if number returned empty
            if (docs.length > 0) break;
        }
    }

    return docs;
}

function aggregateScores(scoreDocs) {
    countsByClassDate = new Map();
    scoreDocs.forEach(({ id, data }) => {
        const ymd = scoreDateFromDocId(id);
        if (!ymd) return;
        if (data.class == null || data.section == null) return;
        const key = classKey(data.class, data.section);
        if (!countsByClassDate.has(key)) countsByClassDate.set(key, new Map());
        const byDate = countsByClassDate.get(key);
        if (!byDate.has(ymd)) byDate.set(ymd, emptyCounts());
        const bucket = byDate.get(ymd);
        if (isPassed(data.passed)) bucket.pass += 1;
        else bucket.fail += 1;
    });
}

function ensureClassesIncludeScoreRows() {
    const existing = new Set(availableClasses.map((c) => classKey(c.class, c.section)));
    countsByClassDate.forEach((_v, key) => {
        if (existing.has(key)) return;
        const [classStr, sectionStr] = key.split('|');
        availableClasses.push({ class: classStr, section: sectionStr });
        existing.add(key);
    });
    availableClasses.sort((a, b) => {
        if (a.class !== b.class) {
            return String(a.class).localeCompare(String(b.class), undefined, { numeric: true });
        }
        return String(a.section).localeCompare(String(b.section));
    });
}

function populateSchoolSelector() {
    const select = document.getElementById('schoolSelector');
    if (!select) return;
    select.innerHTML = '<option value="">-- Select School --</option>';
    availableSchools.forEach((school) => {
        const opt = document.createElement('option');
        opt.value = String(school.school_id);
        opt.textContent = school.school_name;
        select.appendChild(opt);
    });
    if (availableSchools.length === 1) {
        select.value = String(availableSchools[0].school_id);
        selectedSchoolId = availableSchools[0].school_id;
    } else if (selectedSchoolId != null) {
        select.value = String(selectedSchoolId);
    }
}

function renderGrid() {
    const metrics = getMetricFlags();
    if (!metrics.pass && !metrics.fail && !metrics.total) {
        showError('Select at least one of Pass, Fail, or Total.');
        return;
    }
    showError('');

    const viewMode = getViewMode();
    const showDaily = viewMode === 'daily' || viewMode === 'both';
    const showWeekly = viewMode === 'weekly' || viewMode === 'both';

    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    if (!thead || !tbody) return;

    thead.innerHTML = '';
    tbody.innerHTML = '';

    const headerRow = document.createElement('tr');
    const classTh = document.createElement('th');
    classTh.className = 'sticky-col';
    classTh.textContent = 'Class';
    headerRow.appendChild(classTh);

    if (showDaily) {
        dayYmDs.forEach((ymd) => {
            const th = document.createElement('th');
            th.textContent = formatDayHeader(ymd);
            th.title = ymdToInputValue(ymd);
            headerRow.appendChild(th);
        });
    }

    if (showWeekly) {
        weekRanges.forEach((week) => {
            const th = document.createElement('th');
            th.className = 'week-col';
            th.textContent = formatWeekHeader(week);
            headerRow.appendChild(th);
        });
    }

    thead.appendChild(headerRow);

    if (availableClasses.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 1 + (showDaily ? dayYmDs.length : 0) + (showWeekly ? weekRanges.length : 0);
        td.textContent = 'No classes found for this school.';
        tr.appendChild(td);
        tbody.appendChild(tr);
    } else {
        availableClasses.forEach((cls) => {
            const tr = document.createElement('tr');
            const nameTd = document.createElement('td');
            nameTd.className = 'sticky-col';
            nameTd.textContent = `${cls.class} ${cls.section}`;
            tr.appendChild(nameTd);

            if (showDaily) {
                dayYmDs.forEach((ymd) => {
                    const td = document.createElement('td');
                    td.innerHTML = renderCellHtml(getCounts(cls.class, cls.section, ymd), metrics);
                    tr.appendChild(td);
                });
            }

            if (showWeekly) {
                weekRanges.forEach((week) => {
                    const daysInWeek = dayYmDs.filter((ymd) => ymd >= week.startYmd && ymd <= week.endYmd);
                    const td = document.createElement('td');
                    td.innerHTML = renderCellHtml(
                        sumCountsForDays(cls.class, cls.section, daysInWeek),
                        metrics
                    );
                    tr.appendChild(td);
                });
            }

            tbody.appendChild(tr);
        });
    }

    document.getElementById('dashboardGrid')?.classList.remove('hidden');
}

async function loadDashboardData() {
    const schoolSelect = document.getElementById('schoolSelector');
    const fromInput = document.getElementById('fromDate');
    const toInput = document.getElementById('toDate');

    const schoolId = schoolSelect?.value;
    const fromYmd = inputValueToYmd(fromInput?.value);
    const toYmd = inputValueToYmd(toInput?.value);

    if (!schoolId) {
        showError('Please select a school.');
        return;
    }
    if (!/^\d{8}$/.test(fromYmd) || !/^\d{8}$/.test(toYmd)) {
        showError('Please choose a valid From and To date.');
        return;
    }
    if (fromYmd > toYmd) {
        showError('From date must be on or before To date.');
        return;
    }

    selectedSchoolId = schoolId;
    showLoading(true);
    showError('');
    document.getElementById('dashboardGrid')?.classList.add('hidden');

    try {
        dayYmDs = buildDayList(fromYmd, toYmd);
        weekRanges = buildWeekRanges(fromYmd, toYmd);

        availableClasses = await fetchClassesForSchool(schoolId);
        const scoreDocs = await fetchScoresForSchoolDateRange(schoolId, fromYmd, toYmd);
        aggregateScores(scoreDocs);
        ensureClassesIncludeScoreRows();
        renderGrid();
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        showError(error.message || 'Failed to load dashboard data.');
    } finally {
        showLoading(false);
    }
}

function bindUiListeners() {
    if (listenersBound) return;
    listenersBound = true;

    document.getElementById('loadBtn')?.addEventListener('click', () => {
        loadDashboardData();
    });

    document.getElementById('schoolSelector')?.addEventListener('change', (e) => {
        selectedSchoolId = e.target.value || null;
    });

    ['showPass', 'showFail', 'showTotal'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', () => {
            if (dayYmDs.length) renderGrid();
        });
    });

    document.querySelectorAll('input[name="viewMode"]').forEach((el) => {
        el.addEventListener('change', () => {
            if (dayYmDs.length) renderGrid();
        });
    });
}

async function initAdminDashboard() {
    try {
        showLoading(true);
        showError('');
        bindUiListeners();

        const range = defaultDateRange();
        const fromInput = document.getElementById('fromDate');
        const toInput = document.getElementById('toDate');
        if (fromInput) fromInput.value = ymdToInputValue(range.fromYmd);
        if (toInput) toInput.value = ymdToInputValue(range.toYmd);

        availableSchools = await fetchAllSchools();
        if (availableSchools.length === 0) {
            showError('No schools found.');
            showLoading(false);
            return;
        }

        populateSchoolSelector();
        document.getElementById('controlsBar')?.classList.remove('hidden');
        document.getElementById('togglesBar')?.classList.remove('hidden');
        showLoading(false);

        if (availableSchools.length === 1) {
            await loadDashboardData();
        }
    } catch (error) {
        console.error('Error initializing admin dashboard:', error);
        showError(error.message || 'Failed to initialize dashboard.');
        showLoading(false);
    }
}

window.initAdminDashboard = initAdminDashboard;
