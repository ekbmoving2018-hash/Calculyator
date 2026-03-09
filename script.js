(function () {
  'use strict';

  const MAX_DIGITS = 16;
  const ERROR_MSG = 'Нельзя делить на ноль';
  const THOUSANDS_SEP = ',';
  const DECIMAL = '.';

  const exprEl = document.getElementById('expr');
  const resultEl = document.getElementById('result');
  const themeToggle = document.getElementById('themeToggle');
  const buttons = document.querySelectorAll('.calculator .btn');

  let state = {
    expression: '',
    hasError: false,
    showResult: false,
    degreeMode: true,
  };

  function formatWithThousands(num) {
    const str = String(num);
    if (str.includes('e')) return str;
    const [intPart, decPart] = str.split('.');
    const formatted = intPart.replace(/\B(?=(\d{3})+$)/g, THOUSANDS_SEP);
    return decPart ? formatted + '.' + decPart : formatted;
  }

  function formatResult(num) {
    if (!Number.isFinite(num)) return String(num);
    const n = Math.round(num * 1e12) / 1e12;
    const str = String(n);
    if (str.includes('e') || str.length > MAX_DIGITS + 2) {
      return parseFloat(n).toExponential(8);
    }
    return formatWithThousands(n);
  }

  function updateDisplay() {
    if (state.hasError) {
      exprEl.textContent = '';
      resultEl.textContent = ERROR_MSG;
      return;
    }
    exprEl.textContent = state.expression || '';
    if (state.showResult) {
      const num = parseFloat(state.expression);
      resultEl.textContent = Number.isFinite(num) ? '=' + formatResult(num) : '=' + ERROR_MSG;
    } else {
      resultEl.textContent = '=0';
    }
  }

  function setError() {
    state.hasError = true;
    state.expression = '';
    state.showResult = false;
    updateDisplay();
  }

  function clearError() {
    if (state.hasError) state.hasError = false;
  }

  function evaluateSequential(expr) {
    const s = expr.replace(/\s/g, '').replace(/−/g, '-');
    let tokens = s.match(/(\d+\.?\d*|[+\-*\/])/g);
    if (!tokens || tokens.length < 2) return null;
    if (tokens[0] === '-') {
      tokens = ['-' + tokens[1]].concat(tokens.slice(2));
    }
    let result = parseFloat(tokens[0]);
    if (isNaN(result)) return null;
    for (let i = 1; i < tokens.length; i += 2) {
      const op = tokens[i];
      const next = parseFloat(tokens[i + 1]);
      if (isNaN(next)) return null;
      switch (op) {
        case '+':
          result += next;
          break;
        case '-':
          result -= next;
          break;
        case '*':
          result *= next;
          break;
        case '/':
          if (next === 0) return null;
          result /= next;
          break;
        default:
          return null;
      }
    }
    return Math.round(result * 1e12) / 1e12;
  }

  function inputDigit(digit) {
    clearError();
    if (state.showResult) {
      state.expression = String(digit);
      state.showResult = false;
    } else {
      const lastNum = state.expression.match(/(\d[0-9.]*)$/);
      if (lastNum && lastNum[0].replace(/\./g, '').length >= MAX_DIGITS) return;
      state.expression += String(digit);
    }
    updateDisplay();
  }

  function inputDecimal() {
    clearError();
    if (state.showResult) {
      state.expression = '0' + DECIMAL;
      state.showResult = false;
    } else {
      const lastNum = state.expression.match(/(\d[0-9.]*)$/);
      if (lastNum && lastNum[0].includes(DECIMAL)) return;
      if (/[+\-*\/−]$/.test(state.expression) || state.expression === '') {
        state.expression += '0' + DECIMAL;
      } else {
        state.expression += DECIMAL;
      }
    }
    updateDisplay();
  }

  function setOperator(symbol) {
    clearError();
    if (state.showResult) state.showResult = false;
    if (state.expression === '' || /[+\-*\/−]$/.test(state.expression)) {
      state.expression = state.expression.slice(0, -1) + symbol;
    } else {
      state.expression += symbol;
    }
    updateDisplay();
  }

  function handleClear() {
    clearError();
    state.expression = '';
    state.showResult = false;
    updateDisplay();
  }

  function handleBackspace() {
    if (state.hasError) return;
    if (state.showResult) state.showResult = false;
    if (state.expression.length === 0) return;
    state.expression = state.expression.slice(0, -1);
    updateDisplay();
  }

  function handleE() {
    clearError();
    if (state.showResult) state.expression = '';
    state.showResult = false;
    state.expression += Math.E.toString().slice(0, 12);
    updateDisplay();
  }

  function handleMu() {
    clearError();
    if (state.showResult) state.expression = '';
    state.showResult = false;
    state.expression += '0.000001';
    updateDisplay();
  }

  function handleSin() {
    if (state.hasError) return;
    const m = state.expression.match(/(\d+\.?\d*)$/);
    if (!m) return;
    const numStr = m[0];
    const val = parseFloat(numStr);
    const rad = state.degreeMode ? (val * Math.PI) / 180 : val;
    const res = Math.round(Math.sin(rad) * 1e12) / 1e12;
    state.expression = state.expression.slice(0, -numStr.length) + String(res);
    state.showResult = false;
    updateDisplay();
  }

  function handleDeg() {
    state.degreeMode = !state.degreeMode;
    const degBtn = document.querySelector('[data-action="deg"]');
    if (degBtn) degBtn.textContent = state.degreeMode ? 'deg' : 'rad';
  }

  function handleEquals() {
    if (state.hasError) return;
    let expr = state.expression.trim();
    if (/[+\-*\/−]$/.test(expr)) expr = expr.slice(0, -1);
    if (!expr || !/[+\-*\/−]/.test(expr)) return;
    const result = evaluateSequential(expr);
    if (result === null || !Number.isFinite(result)) {
      setError();
      return;
    }
    state.expression = String(result);
    state.showResult = true;
    updateDisplay();
  }

  const actions = {
    '0': () => inputDigit(0),
    '1': () => inputDigit(1),
    '2': () => inputDigit(2),
    '3': () => inputDigit(3),
    '4': () => inputDigit(4),
    '5': () => inputDigit(5),
    '6': () => inputDigit(6),
    '7': () => inputDigit(7),
    '8': () => inputDigit(8),
    '9': () => inputDigit(9),
    decimal: inputDecimal,
    add: () => setOperator('+'),
    subtract: () => setOperator('−'),
    multiply: () => setOperator('*'),
    divide: () => setOperator('/'),
    equals: handleEquals,
    ac: handleClear,
    backspace: handleBackspace,
    e: handleE,
    mu: handleMu,
    sin: handleSin,
    deg: handleDeg,
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (actions[action]) actions[action]();
    });
  });

  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.textContent = isDark ? '☀' : '☾';
    localStorage.setItem('calc-theme', isDark ? 'light' : 'dark');
  });

  const saved = localStorage.getItem('calc-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☾';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  document.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key >= '0' && key <= '9') {
      e.preventDefault();
      inputDigit(parseInt(key, 10));
    } else if (key === ',' || key === '.') {
      e.preventDefault();
      inputDecimal();
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      handleEquals();
    } else if (key === 'Escape') {
      e.preventDefault();
      handleClear();
    } else if (key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (key === '+') {
      e.preventDefault();
      setOperator('+');
    } else if (key === '-') {
      e.preventDefault();
      setOperator('−');
    } else if (key === '*') {
      e.preventDefault();
      setOperator('*');
    } else if (key === '/') {
      e.preventDefault();
      setOperator('/');
    }
  });

  updateDisplay();
})();
