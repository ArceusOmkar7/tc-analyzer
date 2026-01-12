// Rough, heuristic time-complexity signals for Python snippets
// Not a full parser; works on common LeetCode-style solutions.
export function analyzePythonComplexity(code, functionName) {
  if (!code || !code.trim()) {
    throw new Error('No code provided')
  }

  if (code.length > 30000) {
    throw new Error('Snippet too large (max 30k characters)')
  }

  const lines = code.split(/\r?\n/)

  if (lines.length > 1500) {
    throw new Error('Snippet too large (max 1500 lines)')
  }

  const state = {
    loopCount: 0,
    maxNesting: 0,
    sortCalls: 0,
    recursionCalls: 0,
    hashUsage: false,
  }

  const loopStack = []
  const normalizedName = (functionName || '').trim()
  let currentFunction = null
  let currentFunctionIndent = null
  let sawDefLine = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    // treat tabs as 2 spaces to stabilize indentation comparisons
    const indent = rawLine.replace(/\t/g, '  ').match(/^\s*/)?.[0].length ?? 0

    // unwind loop stack when indentation decreases
    while (loopStack.length && indent <= loopStack[loopStack.length - 1].indent) {
      loopStack.pop()
    }

    // leave function scope when dedenting past its indent
    if (currentFunction && indent < (currentFunctionIndent ?? 0)) {
      currentFunction = null
      currentFunctionIndent = null
    }

    // detect entering a function
    const defMatch = line.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/)
    if (defMatch) {
      currentFunction = defMatch[1]
      currentFunctionIndent = indent
      sawDefLine = true
    }

    // detect loops
    if (/^(for|while)\s+/.test(line)) {
      state.loopCount += 1
      loopStack.push({ indent })
      const nesting = loopStack.length
      state.maxNesting = Math.max(state.maxNesting, nesting)
    }

    // detect sort usage
    if (line.includes('.sort(') || /\bsorted\s*\(/.test(line)) {
      state.sortCalls += 1
    }

    // detect hash-based structures (dict/set comprehensions or literals)
    if (/{[^}]*:/.test(line) || /\bdict\s*\(/.test(line) || /\bset\s*\(/.test(line) || /{.*for.*in/.test(line)) {
      state.hashUsage = true
    }

    // detect recursion: inside the same function, calling itself
    if (normalizedName && currentFunction === normalizedName && !sawDefLine) {
      if (line.includes(`${normalizedName}(`)) {
        state.recursionCalls += 1
      }
    }

    // reset def-line flag after processing that line
    sawDefLine = false
  }

  let complexity = 'O(1)'
  if (state.recursionCalls > 0) {
    complexity = 'Recursive (depends on recurrence)'
  } else if (state.sortCalls > 0) {
    complexity = state.maxNesting >= 2 ? 'O(n^k log n)' : 'O(n log n)'
  } else if (state.maxNesting >= 2) {
    complexity = `O(n^${state.maxNesting})`
  } else if (state.maxNesting === 1) {
    complexity = 'O(n)'
  }

  return {
    signals: state,
    inferredTimeComplexity: complexity,
  }
}
