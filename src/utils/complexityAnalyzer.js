// complexityAnalyzer.js
import { parse } from "acorn";
import * as walk from "acorn-walk";

/**
 * Analyze time complexity heuristically from JS source code.
 */
export function analyzeComplexity(code, functionName) {
  let ast;
  try {
    ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  } catch (err) {
    throw new Error("Invalid JavaScript: " + (err?.message || "parse error"));
  }

  const normalizedName = (functionName || "").trim();
  const state = {
    loopCount: 0,
    loopDepth: 0,
    maxDepth: 0,
    sortCalls: 0,
    recursionCalls: 0,
    hashUsage: false,
  };

  // Use a recursive walker so we can manage entry/exit for nesting depth.
  walk.recursive(ast, state, {
    ForStatement(node, st, c) {
      st.loopCount++;
      st.loopDepth++;
      st.maxDepth = Math.max(st.maxDepth, st.loopDepth);
      if (node.init) c(node.init, st);
      if (node.test) c(node.test, st);
      if (node.update) c(node.update, st);
      c(node.body, st);
      st.loopDepth--;
    },

    ForOfStatement(node, st, c) {
      st.loopCount++;
      st.loopDepth++;
      st.maxDepth = Math.max(st.maxDepth, st.loopDepth);
      c(node.left, st);
      c(node.right, st);
      c(node.body, st);
      st.loopDepth--;
    },

    ForInStatement(node, st, c) {
      st.loopCount++;
      st.loopDepth++;
      st.maxDepth = Math.max(st.maxDepth, st.loopDepth);
      c(node.left, st);
      c(node.right, st);
      c(node.body, st);
      st.loopDepth--;
    },

    WhileStatement(node, st, c) {
      st.loopCount++;
      st.loopDepth++;
      st.maxDepth = Math.max(st.maxDepth, st.loopDepth);
      c(node.test, st);
      c(node.body, st);
      st.loopDepth--;
    },

    DoWhileStatement(node, st, c) {
      st.loopCount++;
      st.loopDepth++;
      st.maxDepth = Math.max(st.maxDepth, st.loopDepth);
      c(node.body, st);
      c(node.test, st);
      st.loopDepth--;
    },

    CallExpression(node, st, c) {
      if (node.callee.type === "MemberExpression") {
        const property = node.callee.property;
        const name = property && property.type === "Identifier" ? property.name : "";
        if (name === "sort") st.sortCalls++;
      }

      if (node.callee.type === "Identifier" && normalizedName && node.callee.name === normalizedName) {
        st.recursionCalls++;
      }

      walk.base.CallExpression(node, st, c);
    },

    NewExpression(node, st, c) {
      if (node.callee && node.callee.type === "Identifier") {
        if (node.callee.name === "Set" || node.callee.name === "Map") {
          st.hashUsage = true;
        }
      }

      walk.base.NewExpression(node, st, c);
    },

    ObjectExpression(node, st, c) {
      st.hashUsage = true;
      walk.base.ObjectExpression(node, st, c);
    },
  });

  let complexity = "O(1)";

  if (state.recursionCalls > 0) {
    complexity = "Recursive (depends on recurrence)";
  } else if (state.sortCalls > 0) {
    complexity = state.maxDepth >= 2 ? "O(n^k log n)" : "O(n log n)";
  } else if (state.maxDepth >= 2) {
    complexity = `O(n^${state.maxDepth})`;
  } else if (state.maxDepth === 1) {
    complexity = "O(n)";
  }

  return {
    signals: {
      loopCount: state.loopCount,
      maxNesting: state.maxDepth,
      sortCalls: state.sortCalls,
      recursionCalls: state.recursionCalls,
      hashUsage: state.hashUsage,
    },
    inferredTimeComplexity: complexity,
  };
}
