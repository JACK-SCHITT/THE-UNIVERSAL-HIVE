<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>THE UNIVERSAL HIVE</title>
  <style>
    :root {
      --bg: #111513;
      --panel: #171c1a;
      --line: #2a312f;
      --text: #edf4ef;
      --muted: #abbaa8;
      --law: #9ae2af;
      --accent: #9bb9a1;
      --button: #8fb899;
      --danger: #bc8e5a;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 16px/1.5 ui-monospace, monospace;
    }
    body { padding: 24px 16px 60px; }
    .wrap {
      max-width: 920px;
      margin: 0 auto;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 18px;
    }
    h1, h2, h3 { margin: 0 0 10px; }
    .law {
      color: var(--law);
      font-size: 13px;
      margin-bottom: 12px;
    }
    textarea, input, button {
      width: 100%;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: #0d1111;
      color: var(--text);
      padding: 12px 14px;
      font: inherit;
    }
    button {
      background: var(--button);
      color: #0b110d;
      border: none;
      cursor: pointer;
      font-weight: 700;
    }
    .row { display: flex; gap: 12px; }
    .row > * { flex: 1; }
    pre {
      background: #0a0d0d;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 14px;
      white-space: pre-wrap;
      word-break: break-word;
      min-height: 120px;
      margin-top: 12px;
    }
    .muted { color: var(--muted); }
    .badge {
      display: inline-block;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 5px 10px;
      color: var(--muted);
      font-size: 12px;
      margin-right: 8px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="panel">
      <h1>THE UNIVERSAL HIVE</h1>
      <div class="law">Provide for all. Find the good. Never limit unnecessarily.</div>
      <div>
        <span class="badge">base model</span>
        <span class="badge">law-locked</span>
        <span class="badge">GitHub Pages ready</span>
      </div>
    </div>

    <div class="panel">
      <h2>Base Seed</h2>
      <textarea id="prompt" rows="6">Who are you?</textarea>
      <div class="row" style="margin-top: 12px;">
        <button id="go">GENERATE</button>
      </div>
      <pre id="output">ready.</pre>
    </div>

    <div class="panel">
      <h2>Agent Registry</h2>
      <div class="muted">The base law remains frozen. Every agent starts on the seed until an operator saves a specialization.</div>
      <pre id="registry">base
research
creative
code
ops</pre>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
