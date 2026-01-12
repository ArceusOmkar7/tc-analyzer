import './index.css'

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app')

  appElement.innerHTML = `
    <main class="shell">
      <h3>Time Complexity Analyzer</h3>
      <p class="muted">Use the popup to paste JavaScript or Python and see a quick, heuristic time complexity estimate. The side panel mirrors the latest result.</p>
      <ul class="list">
        <li>Pick language (Python by default), paste a valid snippet, optionally set the function name for recursion detection.</li>
        <li>Signals track loop counts, nesting depth, sort calls, recursion hits, and hash structure usage.</li>
        <li>Results are stored locally so the side panel can display the last run.</li>
        <li>Guards: snippets up to ~30k chars / 1500 lines, valid code required.</li>
      </ul>
      <p class="muted">No extra configuration needed.</p>
    </main>
  `
})
