import './index.css'

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app')

  appElement.innerHTML = `
    <main class="sidepanel-layout">
      <header class="sidepanel-header">
        <div>
          <h1 class="sidepanel-title">Time Complexity Analyzer</h1>
          <p class="sidepanel-subtitle">Latest analysis from your popup session</p>
        </div>
      </header>
      <section class="sidepanel-content" id="results">
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p class="empty-text">Run an analysis in the popup to see results here</p>
        </div>
      </section>
    </main>
  `

  const resultsEl = document.getElementById('results')

  const generateExplanation = (complexity, signals) => {
    const { maxNesting, sortCalls, recursionCalls, hashUsage } = signals
    
    if (recursionCalls > 0) {
      return "Uses recursion. Complexity depends on the recurrence relation."
    }
    
    if (complexity === "O(n log n)") {
      return "Linearithmic time due to sorting operation."
    }
    
    if (complexity.includes("n^2")) {
      return maxNesting === 2 ? 
        "Quadratic time due to nested loops." : 
        `Polynomial complexity with ${maxNesting} nested levels.`
    }
    
    if (complexity === "O(n)") {
      return hashUsage ? 
        "Linear time with hash-based lookups." : 
        "Linear time with single pass through input."
    }
    
    if (complexity === "O(1)") {
      return "Constant time operations."
    }
    
    return "Complexity determined by most expensive operation."
  }

  const getComplexityColor = (complexity) => {
    if (complexity.includes("O(1)") || complexity.includes("O(log n)")) return "excellent"
    if (complexity.includes("O(n)") && !complexity.includes("log")) return "good"
    if (complexity.includes("log n")) return "moderate"
    if (complexity.includes("n^2") || complexity.includes("Recursive")) return "poor"
    return "moderate"
  }

  const render = (data) => {
    if (!data) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p class="empty-text">No analysis available yet</p>
          <p class="empty-hint">Open the popup and analyze some code</p>
        </div>
      `
      return
    }

    const { inferredTimeComplexity, signals } = data
    const explanation = generateExplanation(inferredTimeComplexity, signals)
    const complexityColor = getComplexityColor(inferredTimeComplexity)
    
    resultsEl.innerHTML = `
      <div class="summary-section">
        <div class="summary-card complexity-${complexityColor}">
          <div class="card-label">TIME COMPLEXITY</div>
          <div class="card-value">${inferredTimeComplexity}</div>
          <div class="card-explanation">${explanation}</div>
        </div>
        
        <div class="summary-card complexity-good">
          <div class="card-label">SPACE COMPLEXITY</div>
          <div class="card-value">O(${signals.hashUsage ? 'n' : '1'})</div>
          <div class="card-explanation">${signals.hashUsage ? 'Additional data structure' : 'Constant extra space'}</div>
        </div>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">🔄</div>
          <div class="metric-info">
            <div class="metric-label">Loops</div>
            <div class="metric-value">${signals.loopCount}</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-info">
            <div class="metric-label">Max Nesting</div>
            <div class="metric-value">${signals.maxNesting}</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">🔀</div>
          <div class="metric-info">
            <div class="metric-label">Sort Calls</div>
            <div class="metric-value">${signals.sortCalls}</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">♻️</div>
          <div class="metric-info">
            <div class="metric-label">Recursion</div>
            <div class="metric-value">${signals.recursionCalls > 0 ? 'Yes' : 'No'}</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">⚡</div>
          <div class="metric-info">
            <div class="metric-label">Hash Usage</div>
            <div class="metric-value">${signals.hashUsage ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>
      
      <div class="info-note">
        <p>💡 Open the popup to analyze new code snippets</p>
      </div>
    `
  }

  chrome.storage.local.get(['tcLastResult'], (data) => {
    render(data.tcLastResult)
  })

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.tcLastResult) {
      render(changes.tcLastResult.newValue)
    }
  })
})
