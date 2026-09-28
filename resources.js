(() => {
  const storageKey = 'quietLibraryStudyToolkitV1';
  const durations = {
    30: ['30분 추천 구성', '5분 준비 · 20분 핵심 작업 · 5분 회상과 다음 행동 기록'],
    60: ['60분 추천 구성', '10분 질문 설정 · 35분 핵심 학습 · 15분 회상과 오답 정리'],
    90: ['90분 추천 구성', '15분 범위 확인 · 55분 실전 수행 · 20분 검토와 오답 분류']
  };
  const $ = (id) => document.getElementById(id);
  const emptyRow = () => ({ date: '', minutes: '', goal: '', result: '', focus: '', note: '' });
  let data = { duration: 30, goal: '', rule: '', next: '', rows: Array.from({ length: 7 }, emptyRow) };

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Array.isArray(saved.rows)) data = { ...data, ...saved, rows: Array.from({ length: 7 }, (_, index) => ({ ...emptyRow(), ...(saved.rows[index] || {}) })) };
  } catch (_) {}

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(data));
    updateSummary();
  }

  function selectDuration(value) {
    data.duration = Number(value);
    document.querySelectorAll('.duration-button').forEach((button) => button.classList.toggle('active', Number(button.dataset.duration) === data.duration));
    $('planTitle').textContent = durations[data.duration][0];
    $('planText').textContent = durations[data.duration][1];
    $('sessionTimerLink').href = `/?minutes=${data.duration}`;
    save();
  }

  function renderRows() {
    $('logBody').innerHTML = data.rows.map((row, index) => `<tr>
      <td><input type="date" data-row="${index}" data-field="date" value="${escapeValue(row.date)}" aria-label="${index + 1}일차 날짜"></td>
      <td><input type="number" min="1" max="180" data-row="${index}" data-field="minutes" value="${escapeValue(row.minutes)}" placeholder="분" aria-label="${index + 1}일차 설정 시간"></td>
      <td><input class="wide-field" type="text" maxlength="100" data-row="${index}" data-field="goal" value="${escapeValue(row.goal)}" placeholder="과목과 목표" aria-label="${index + 1}일차 과목과 목표"></td>
      <td><input class="wide-field" type="text" maxlength="100" data-row="${index}" data-field="result" value="${escapeValue(row.result)}" placeholder="완료한 결과" aria-label="${index + 1}일차 실제 결과"></td>
      <td><select data-row="${index}" data-field="focus" aria-label="${index + 1}일차 집중 상태"><option value="">선택</option><option value="3" ${row.focus === '3' ? 'selected' : ''}>좋음</option><option value="2" ${row.focus === '2' ? 'selected' : ''}>보통</option><option value="1" ${row.focus === '1' ? 'selected' : ''}>어려움</option></select></td>
      <td><input class="wide-field" type="text" maxlength="120" data-row="${index}" data-field="note" value="${escapeValue(row.note)}" placeholder="방해 요소 / 다음 행동" aria-label="${index + 1}일차 방해 요소와 다음 행동"></td>
    </tr>`).join('');
  }

  function escapeValue(value) {
    return String(value || '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  function updateSummary() {
    const recorded = data.rows.filter((row) => row.date || row.goal || row.result || row.minutes);
    const total = recorded.reduce((sum, row) => sum + (Number(row.minutes) || 0), 0);
    const focusRows = recorded.filter((row) => Number(row.focus));
    const average = focusRows.length ? focusRows.reduce((sum, row) => sum + Number(row.focus), 0) / focusRows.length : 0;
    $('sessionCount').textContent = `${recorded.length}회`;
    $('minuteTotal').textContent = `${total}분`;
    $('focusAverage').textContent = average >= 2.5 ? '좋음' : average >= 1.5 ? '보통' : average > 0 ? '어려움' : '-';
  }

  document.querySelectorAll('.duration-button').forEach((button) => button.addEventListener('click', () => selectDuration(button.dataset.duration)));
  [['sessionGoal', 'goal'], ['stuckRule', 'rule'], ['nextAction', 'next']].forEach(([id, field]) => {
    $(id).value = data[field];
    $(id).addEventListener('input', (event) => { data[field] = event.target.value; save(); });
  });
  $('logBody').addEventListener('input', (event) => {
    const row = Number(event.target.dataset.row); const field = event.target.dataset.field;
    if (Number.isInteger(row) && field) { data.rows[row][field] = event.target.value; save(); }
  });
  $('logBody').addEventListener('change', (event) => {
    const row = Number(event.target.dataset.row); const field = event.target.dataset.field;
    if (Number.isInteger(row) && field) { data.rows[row][field] = event.target.value; save(); }
  });
  $('printLog').addEventListener('click', () => window.print());
  $('clearLog').addEventListener('click', () => {
    if (!window.confirm('이 브라우저에 저장된 계획과 7일 기록을 모두 지울까요?')) return;
    data = { duration: 30, goal: '', rule: '', next: '', rows: Array.from({ length: 7 }, emptyRow) };
    localStorage.removeItem(storageKey);
    $('sessionGoal').value = ''; $('stuckRule').value = ''; $('nextAction').value = '';
    renderRows(); selectDuration(30);
  });
  renderRows(); selectDuration(data.duration);
})();
