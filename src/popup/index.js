import './index.css'
import { analyzeComplexity } from '../utils/complexityAnalyzer'
import { analyzePythonComplexity } from '../utils/pythonComplexityAnalyzer'
import { analyzeJavaComplexity } from '../utils/javaComplexityAnalyzer'

// Simple heuristic-based language detection
function detectLanguage(code) {
  if (!code || !code.trim()) {
    return 'javascript'
  }

  const lines = code.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  
  let javaScore = 0
  let pythonScore = 0
  let jsScore = 0

  for (const line of lines) {
    if (line.startsWith('//') || line.startsWith('#') || line.startsWith('/*') || line.startsWith('*')) {
      continue
    }

    // Java patterns
    if (/\b(public|private|protected)\s+(static\s+)?(void|int|boolean|String|double|float|long)\s+\w+\s*\(/.test(line)) javaScore += 3
    if (/\bnew\s+(HashMap|HashSet|ArrayList|LinkedList)\s*[<(]/.test(line)) javaScore += 2
    if (/\b(class|interface|extends|implements)\s+\w+/.test(line)) javaScore += 2
    if (line.endsWith(';') && !line.includes('for') && !line.includes('while')) javaScore += 0.5
    if (/\bint\[\]|\bString\[\]/.test(line)) javaScore += 1

    // Python patterns
    if (/^def\s+\w+\s*\(/.test(line)) pythonScore += 3
    if (/\b(self|True|False|None|elif|pass)\b/.test(line)) pythonScore += 2
    if (/:.*$/.test(line) && /\b(if|for|while|def|class)\b/.test(line)) pythonScore += 1
    if (/\brange\s*\(|\benumerate\s*\(|\blen\s*\(/.test(line)) pythonScore += 1

    // JavaScript patterns
    if (/\b(function|const|let|var)\s+\w+/.test(line)) jsScore += 2
    if (/=>\s*{|=>\s*\w/.test(line)) jsScore += 2
    if (/\bnew\s+(Map|Set|Array)\s*[(<]/.test(line)) jsScore += 2
    if (/===|!==/.test(line)) jsScore += 1
  }

  const maxScore = Math.max(javaScore, pythonScore, jsScore)
  if (maxScore === 0) return 'javascript'
  if (javaScore === maxScore) return 'java'
  if (pythonScore === maxScore) return 'python'
  return 'javascript'
}

const samples = {
  javascript: `function twoSum(nums, target) {
  const seen = new Map()
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (seen.has(complement)) return [seen.get(complement), i]
    seen.set(nums[i], i)
  }
  return []
}`,
  python: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
  java: `public int[] twoSum(int[] nums, int target) {
    HashMap<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[] { seen.get(complement), i };
        }
        seen.put(nums[i], i);
    }
    return new int[] {};
}`,
}

const LIMITS = {
  maxChars: 30000,
  maxLines: 1500,
}

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app')

  appElement.innerHTML = `
    <main class="layout">
      <div class="left-column">
        <header class="header-compact">
          <h1 class="logo">Time Complexity Analyzer</h1>
          <p class="tagline">Understand the efficiency of your code</p>
        </header>

        <form id="analyzer" class="input-workspace" autocomplete="off">
          <div class="controls">
            <label class="field">
              <span class="field-label">Language</span>
              <select id="language" name="language" class="select-input">
                <option value="auto">Auto-detect</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
            </label>
            <label class="field field-optional">
              <span class="field-label">Function name <span class="optional-text">(optional)</span></span>
              <input id="fn-name" name="fn-name" class="text-input" placeholder="e.g., twoSum" title="Used to detect recursive calls within the specified function" />
              <span class="field-hint">Helps detect recursion in the specified function</span>
            </label>
          </div>
          
          <label class="field editor-field">
            <span class="field-label">Code</span>
            <textarea 
              id="code" 
              name="code" 
              rows="16" 
              spellcheck="false" 
              class="code-editor"
              placeholder="// Paste or type your code here&#10;// Try an example using the button below"
            ></textarea>
          </label>
          
          <div class="action-bar">
            <button type="submit" class="btn-analyze">
              <span class="btn-icon">⚡</span>
              Analyze Complexity
            </button>
            <button type="button" id="use-sample" class="btn-secondary">Try Example</button>
          </div>
        </form>
      </div>

      <div class="right-column">
        <div id="results" class="analysis-panel">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p class="empty-text">Run an analysis to see insights here</p>
          </div>
        </div>
      </div>
    </main>
  `

  const codeInput = document.getElementById('code')
  const fnInput = document.getElementById('fn-name')
  const langSelect = document.getElementById('language')
  const form = document.getElementById('analyzer')
  const resultsEl = document.getElementById('results')
  const sampleButton = document.getElementById('use-sample')

  const validateSnippet = (code, language) => {
    if (!code || !code.trim()) {
      throw new Error('Add code to analyze.')
    }

    if (!['auto', 'python', 'javascript', 'java'].includes(language)) {
      throw new Error('Unsupported language selection.')
    }

    if (code.length > LIMITS.maxChars) {
      throw new Error('Code too large (max 30k characters).')
    }

    const lineCount = code.split(/\r?\n/).length
    if (lineCount > LIMITS.maxLines) {
      throw new Error('Code too large (max 1500 lines).')
    }
  }

  const generateExplanation = (complexity, signals) => {
    const { maxNesting, sortCalls, recursionCalls, hashUsage, loopCount } = signals
    
    if (recursionCalls > 0) {
      return "This solution uses recursion. The actual complexity depends on the recurrence relation and tree depth."
    }
    
    if (complexity === "O(n log n)") {
      return "This solution runs in linearithmic time because it sorts the input, which is the dominant operation."
    }
    
    if (complexity.includes("n^2")) {
      if (maxNesting === 2) {
        return "This solution runs in quadratic time because the outer loop iterates n times, and for each iteration, the inner loop also runs n times."
      }
      return `This solution has polynomial time complexity due to ${maxNesting} levels of nested iteration.`
    }
    
    if (complexity === "O(n)") {
      if (hashUsage) {
        return "This solution runs in linear time because it iterates through the input once and uses constant-time hash lookups."
      }
      return "This solution runs in linear time because it makes a single pass through the input."
    }
    
    if (complexity === "O(1)") {
      return "This solution runs in constant time. The operations performed don't depend on the input size."
    }
    
    return "The complexity is determined by the most expensive operation in the code."
  }

  const generateObservations = (signals) => {
    const observations = []
    
    if (signals.loopCount === 1) {
      observations.push({ icon: "✓", text: "Single pass through input" })
    } else if (signals.loopCount > 1) {
      observations.push({ icon: "🔄", text: `${signals.loopCount} loop structures detected` })
    }
    
    if (signals.hashUsage) {
      observations.push({ icon: "⚡", text: "Uses hash-based data structure for O(1) lookups" })
    }
    
    if (signals.maxNesting > 1) {
      observations.push({ icon: "📊", text: `${signals.maxNesting} levels of nested iteration` })
    }
    
    if (signals.sortCalls > 0) {
      observations.push({ icon: "🔀", text: `Sorting operation detected (${signals.sortCalls} call${signals.sortCalls > 1 ? 's' : ''})` })
    }
    
    if (signals.recursionCalls > 0) {
      observations.push({ icon: "♻️", text: "Recursive function calls present" })
    }
    
    if (signals.loopCount === 0 && signals.recursionCalls === 0) {
      observations.push({ icon: "⚡", text: "No loops or recursion detected" })
    }
    
    return observations
  }

  const getComplexityColor = (complexity) => {
    if (complexity.includes("O(1)") || complexity.includes("O(log n)")) return "excellent"
    if (complexity.includes("O(n)") && !complexity.includes("log")) return "good"
    if (complexity.includes("log n")) return "moderate"
    if (complexity.includes("n^2") || complexity.includes("Recursive")) return "poor"
    return "moderate"
  }

  const renderResult = (analysis, detectedLanguage = null) => {
    const { inferredTimeComplexity, signals } = analysis
    const explanation = generateExplanation(inferredTimeComplexity, signals)
    const observations = generateObservations(signals)
    const complexityColor = getComplexityColor(inferredTimeComplexity)
    
    resultsEl.classList.remove('empty-state-active')
    resultsEl.classList.add('has-results')
    
    const languageDisplay = detectedLanguage ? `
      <div class="detected-language">
        <span class="language-badge">Detected: ${detectedLanguage.charAt(0).toUpperCase() + detectedLanguage.slice(1)}</span>
      </div>
    ` : ''
    
    resultsEl.innerHTML = `
      ${languageDisplay}
      <div class="summary-section">
        <div class="summary-card complexity-${complexityColor}">
          <div class="card-label">TIME COMPLEXITY</div>
          <div class="card-value">${inferredTimeComplexity}</div>
          <div class="card-explanation">${explanation}</div>
        </div>
        
        <div class="summary-card complexity-good">
          <div class="card-label">SPACE COMPLEXITY</div>
          <div class="card-value">O(${signals.hashUsage ? 'n' : '1'})</div>
          <div class="card-explanation">${signals.hashUsage ? 'Additional data structure allocation' : 'Uses constant extra space'}</div>
        </div>
      </div>
      
      ${observations.length > 0 ? `
        <div class="observations-section">
          <h3 class="section-title">Key Observations</h3>
          <ul class="observations-list">
            ${observations.map(obs => `
              <li class="observation-item">
                <span class="obs-icon">${obs.icon}</span>
                <span class="obs-text">${obs.text}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div class="reasoning-section">
        <h3 class="section-title">Why This Complexity?</h3>
        <p class="reasoning-text">${explanation}</p>
      </div>
      
      <details class="metrics-details">
        <summary class="metrics-summary">Show detailed breakdown</summary>
        <div class="metrics-content">
          <div class="metric-row">
            <span class="metric-label">Loops Detected:</span>
            <span class="metric-value">${signals.loopCount}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Max Nesting Depth:</span>
            <span class="metric-value">${signals.maxNesting}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Recursive Calls:</span>
            <span class="metric-value">${signals.recursionCalls > 0 ? 'Yes' : 'No'}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Sorting Operations:</span>
            <span class="metric-value">${signals.sortCalls > 0 ? 'Yes' : 'No'}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Hash-based Structures:</span>
            <span class="metric-value">${signals.hashUsage ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </details>
    `
    
    // Animate in with stagger
    setTimeout(() => {
      resultsEl.classList.add('animated')
    }, 50)
  }

  const renderError = (message) => {
    resultsEl.classList.remove('empty-state-active', 'animated')
    resultsEl.classList.add('has-results')
    resultsEl.innerHTML = `
      <div class="error-card">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${message}</div>
      </div>
    `
  }

  const showLoading = () => {
    resultsEl.classList.remove('empty-state-active')
    resultsEl.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">Analyzing complexity...</p>
      </div>
    `
  }

  const persistDraft = (analysis) => {
    chrome.storage.local.set({
      tcDraft: codeInput.value,
      tcFunctionName: fnInput.value,
      tcLanguage: langSelect.value,
      tcLastResult: analysis || null,
    })
  }

  const loadDraft = () => {
    chrome.storage.local.get(['tcDraft', 'tcFunctionName', 'tcLanguage', 'tcLastResult'], (data) => {
      const lang = data.tcLanguage || 'auto'
      langSelect.value = lang
      codeInput.value = data.tcDraft || samples.javascript
      fnInput.value = data.tcFunctionName || 'twoSum'
      if (data.tcLastResult) renderResult(data.tcLastResult)
    })
  }

  const analyze = () => {
    const code = codeInput.value.trim()
    const fnName = fnInput.value.trim()
    let language = langSelect.value
    const wasAutoDetected = language === 'auto'

    try {
      // Auto-detect language if "auto" is selected
      if (language === 'auto') {
        language = detectLanguage(code)
      }
      
      validateSnippet(code, language)
      
      showLoading()
      
      // Simulate processing time for better UX
      setTimeout(() => {
        let analysis
        if (language === 'python') {
          analysis = analyzePythonComplexity(code, fnName)
        } else if (language === 'java') {
          analysis = analyzeJavaComplexity(code, fnName)
        } else {
          analysis = analyzeComplexity(code, fnName)
        }
        renderResult(analysis, wasAutoDetected ? language : null)
        persistDraft(analysis)
      }, 600)
    } catch (err) {
      renderError(err?.message || 'Could not analyze this code.')
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    analyze()
  })

  sampleButton.addEventListener('click', () => {
    const lang = langSelect.value
    codeInput.value = samples[lang]
    fnInput.value = 'twoSum'
    persistDraft()
  })

  codeInput.addEventListener('input', () => persistDraft())
  fnInput.addEventListener('input', () => persistDraft())
  langSelect.addEventListener('change', () => {
    // keep code unless empty, otherwise load sample for the new language
    if (!codeInput.value.trim()) {
      codeInput.value = samples[langSelect.value]
    }
    persistDraft()
  })

  // Set initial empty state
  resultsEl.classList.add('empty-state-active')

  loadDraft()
})
