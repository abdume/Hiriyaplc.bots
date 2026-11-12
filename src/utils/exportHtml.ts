import { BotTable } from '../types';

export function generateStandaloneHtml(currentBots: BotTable[]): string {
  const botsJson = JSON.stringify(currentBots, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>TableBot - Telegram Bot Manager & Cloud Database</title>
  <meta name="description" content="Table Notes inspired Telegram Bot Manager & Live Cloud Database with Supabase sync">
  <!-- Supabase JS v2 CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Roboto', system-ui, -apple-system, sans-serif;
      background-color: #F4F6F9;
      color: #1E293B;
      -webkit-tap-highlight-color: transparent;
    }
    header.app-bar {
      background: #0D47A1;
      color: #FFFFFF;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .app-title {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: 0.2px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .icon-btn {
      background: none;
      border: none;
      color: #FFFFFF;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border-radius: 50%;
    }
    .icon-btn:hover { background: rgba(255,255,255,0.12); }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px;
    }
    .grid-2col {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .bot-card {
      background: #FFFFFF;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      position: relative;
    }
    .bot-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .bot-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0D47A1;
      margin-bottom: 4px;
    }
    .badge-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #E8F5E9;
      color: #2E7D32;
    }
    .badge-sim {
      background: #E3F2FD;
      color: #1565C0;
    }
    .amount-highlight {
      color: #E65100;
      font-weight: 700;
      font-family: 'Roboto Mono', monospace;
    }
    .table-container {
      background: #FFFFFF;
      border-radius: 12px;
      overflow: auto;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-top: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    th, td {
      border: 1px solid #E2E8F0;
      padding: 10px 12px;
    }
    th {
      background: #F8FAFC;
      font-weight: 700;
      color: #334155;
      text-align: left;
    }
    .summary-footer {
      background: #0D47A1;
      color: #FFFFFF;
      font-weight: 700;
      padding: 12px 16px;
      border-radius: 0 0 12px 12px;
      display: flex;
      justify-content: space-between;
    }
    .fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #1976D2;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      cursor: pointer;
      border: none;
      font-size: 28px;
    }
  </style>
</head>
<body>
  <header class="app-bar">
    <div class="app-title">
      <span>TableBot</span>
      <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 12px;">Standalone Edition</span>
    </div>
    <div style="font-size: 0.85rem;">Signed In: Local / Supabase Ready</div>
  </header>

  <main class="container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #0D47A1;">All Bots & Databases</h2>
      <button onclick="addNewBlankBot()" style="background: #1976D2; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600;">+ New Bot</button>
    </div>

    <div id="botsGrid" class="grid-2col"></div>
    <div id="tableContainer" class="table-container" style="display: none;"></div>
  </main>

  <script>
    let bots = ${botsJson};
    let activeBotId = null;

    function renderBotGrid() {
      const container = document.getElementById('botsGrid');
      const tableDiv = document.getElementById('tableContainer');
      tableDiv.style.display = 'none';
      container.style.display = 'grid';

      container.innerHTML = bots.map(bot => \`
        <div class="bot-card" onclick="openBot('\${bot.id}')">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h3>\${bot.name}</h3>
            <span class="badge-status \${bot.botStatus === 'simulator' ? 'badge-sim' : ''}">\${bot.botStatus.toUpperCase()}</span>
          </div>
          <p style="font-size: 0.85rem; color: #64748B; margin: 6px 0;">\${bot.description || 'Telegram Bot Table'}</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #94A3B8; margin-top: 12px; border-top: 1px solid #F1F5F9; padding-top: 8px;">
            <span>\${bot.rows.length} records</span>
            <span style="color: #1976D2; font-weight: 600;">Open Grid →</span>
          </div>
        </div>
      \`).join('');
    }

    function openBot(botId) {
      activeBotId = botId;
      const bot = bots.find(b => b.id === botId);
      if (!bot) return;

      const gridDiv = document.getElementById('botsGrid');
      const tableDiv = document.getElementById('tableContainer');
      gridDiv.style.display = 'none';
      tableDiv.style.display = 'block';

      let totalSum = 0;
      const amountCols = bot.columns.filter(c => c.type === 'amount' || c.type === 'number');
      bot.rows.forEach(r => {
        amountCols.forEach(col => {
          const val = parseFloat(r[col.id]);
          if (!isNaN(val)) totalSum += val;
        });
      });

      let tableHtml = \`
        <div style="padding: 16px; border-bottom: 1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center;">
          <button onclick="renderBotGrid()" style="background:#ECEFF1; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600;">← Back</button>
          <h2 style="font-weight:700; color:#0D47A1;">\${bot.name}</h2>
          <button onclick="addRow('\${bot.id}')" style="background:#1976D2; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">+ Add Row</button>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              \${bot.columns.map(c => \`<th>\${c.name}</th>\`).join('')}
            </tr>
          </thead>
          <tbody>
            \${bot.rows.map((row, idx) => \`
              <tr>
                <td style="text-align: center; color: #94A3B8; font-weight: 600;">\${idx + 1}</td>
                \${bot.columns.map(col => {
                  const val = row[col.id] !== undefined ? row[col.id] : '';
                  const isAmount = col.type === 'amount';
                  return \`<td class="\${isAmount ? 'amount-highlight' : ''}" style="text-align: \${col.style.align || 'left'};">\${isAmount && typeof val === 'number' ? (col.currency !== 'None' ? col.currency : '') + val.toFixed(col.decimals || 2) : val}</td>\`;
                }).join('')}
              </tr>
            \`).join('')}
          </tbody>
        </table>
        <div class="summary-footer">
          <span>Σ Formula Sum</span>
          <span class="amount-highlight" style="color: #FFD54F;">$\${totalSum.toFixed(2)}</span>
        </div>
      \`;

      tableDiv.innerHTML = tableHtml;
    }

    function addRow(botId) {
      const bot = bots.find(b => b.id === botId);
      if (!bot) return;
      const newRow = { id: 'row_' + Date.now() };
      bot.columns.forEach(c => {
        newRow[c.id] = c.type === 'amount' ? 0.00 : (c.type === 'checkbox' ? false : 'New Entry');
      });
      bot.rows.push(newRow);
      openBot(botId);
    }

    function addNewBlankBot() {
      const existingNames = new Set(bots.map(b => b.name));
      let name = 'New Bot';
      if (existingNames.has(name)) {
        let counter = 2;
        while (existingNames.has('New Bot ' + counter)) counter++;
        name = 'New Bot ' + counter;
      }
      const newBot = {
        id: 'bot_' + Date.now(),
        name: name,
        description: 'Telegram Bot & Live Table',
        telegramToken: '',
        botStatus: 'simulator',
        isFavorite: false,
        updatedAt: new Date().toISOString(),
        columns: [
          { id: 'c1', name: 'User ID', type: 'text', widthMultiplier: 1.0, currency: 'None', thousandSeparator: false, decimals: 0, style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' }, includeInGraph: true },
          { id: 'c2', name: 'Username', type: 'text', widthMultiplier: 1.1, currency: 'None', thousandSeparator: false, decimals: 0, style: { bold: false, italic: false, align: 'left', color: '#0D47A1', bgColor: '#FFFFFF' }, includeInGraph: true },
          { id: 'c3', name: 'Message', type: 'text', widthMultiplier: 1.5, currency: 'None', thousandSeparator: false, decimals: 0, style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' }, includeInGraph: false },
          { id: 'c4', name: 'Amount', type: 'amount', widthMultiplier: 1.1, currency: '$', thousandSeparator: true, decimals: 2, style: { bold: true, italic: false, align: 'right', color: '#E65100', bgColor: '#FFFFFF' }, includeInGraph: true }
        ],
        rows: []
      };
      bots.unshift(newBot);
      openBot(newBot.id);
    }

    // Initialize
    renderBotGrid();
  </script>
</body>
</html>`;
}

export function downloadStandaloneHtmlFile(bots: BotTable[]) {
  const htmlContent = generateStandaloneHtml(bots);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'TableNotes-Telegram-Bot-Manager.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
