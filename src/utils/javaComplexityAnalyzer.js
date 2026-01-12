// Rough, heuristic time-complexity signals for Java snippets
// Not a full parser; works on common LeetCode-style solutions.
export function analyzeJavaComplexity(code, functionName) {
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
  let braceDepth = 0
  let functionBraceDepth = null
  let sawMethodDeclaration = false

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue

    // Count braces to track scope depth
    const openBraces = (line.match(/{/g) || []).length
    const closeBraces = (line.match(/}/g) || []).length
    braceDepth += openBraces - closeBraces

    // Calculate current indent
    const indent = rawLine.replace(/\t/g, '    ').match(/^\s*/)?.[0].length ?? 0

    // Unwind loop stack when we exit loop scope
    while (loopStack.length && braceDepth < loopStack[loopStack.length - 1].braceDepth) {
      loopStack.pop()
    }

    // Exit function scope when braces close back
    if (currentFunction && functionBraceDepth !== null && braceDepth < functionBraceDepth) {
      currentFunction = null
      functionBraceDepth = null
    }

    // Detect function/method declaration
    // Matches: public/private/protected/static return_type methodName(...)
    const methodMatch = line.match(/\b(?:public|private|protected|static|\w+)\s+[\w<>\[\]]+\s+([A-Za-z_][\w]*)\s*\(/)
    if (methodMatch) {
      currentFunction = methodMatch[1]
      functionBraceDepth = braceDepth
      sawMethodDeclaration = true
    }

    // Detect loops (for, while, do-while)
    if (/\b(for|while)\s*\(/.test(line)) {
      state.loopCount += 1
      loopStack.push({ braceDepth })
      const nesting = loopStack.length
      state.maxNesting = Math.max(state.maxNesting, nesting)
    }

    // Detect do-while
    if (/\bdo\s*{/.test(line)) {
      state.loopCount += 1
      loopStack.push({ braceDepth })
      const nesting = loopStack.length
      state.maxNesting = Math.max(state.maxNesting, nesting)
    }

    // Detect sorting calls
    if (/Arrays\.sort\s*\(/.test(line) || /Collections\.sort\s*\(/.test(line) || /\.sort\s*\(/.test(line)) {
      state.sortCalls += 1
    }

    // Detect hash-based structures (HashMap, HashSet, etc.)
    if (/\bnew\s+(HashMap|HashSet|Hashtable|LinkedHashMap|LinkedHashSet|TreeMap|TreeSet)\s*[<(]/.test(line)) {
      state.hashUsage = true
    }

    // Detect recursion: calling the same function inside itself
    if (normalizedName && currentFunction === normalizedName && !sawMethodDeclaration) {
      if (line.includes(`${normalizedName}(`)) {
        state.recursionCalls += 1
      }
    }

    // Reset method declaration flag after processing that line
    sawMethodDeclaration = false
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
