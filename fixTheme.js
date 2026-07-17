const fs = require('fs');

function updateFile(file, replaces) {
    let content = fs.readFileSync(file, 'utf8');
    for (let r of replaces) {
        content = content.split(r[0]).join(r[1]);
    }
    fs.writeFileSync(file, content, 'utf8');
}

// 1. index.css
let css = fs.readFileSync('frontend/src/index.css', 'utf8');
if (!css.includes('--text-primary')) {
    css = css.replace('--text-main: #1A2233;', '--text-main: #1A2233;\n  --text-primary: #1A2233;\n  --text-secondary: #6B7686;');
    fs.writeFileSync('frontend/src/index.css', css, 'utf8');
}

// 2. AnalyticsTab.jsx
updateFile('frontend/src/components/AnalyticsTab.jsx', [
    ["color: 'rgba(255,255,255,0.6)'", "color: 'var(--text-secondary)'"],
    ["color: 'rgba(255,255,255,0.4)'", "color: 'var(--text-secondary)'"],
    ["color: 'rgba(255,255,255,0.7)'", "color: 'var(--text-primary)'"],
    ["background: 'rgba(255, 255, 255, 0.05)'", "background: 'var(--bg-card)'"],
    ["border: '1px solid rgba(255, 255, 255, 0.1)'", "border: '1px solid var(--border-color)'"],
    ["borderBottom: '1px solid rgba(255,255,255,0.1)'", "borderBottom: '1px solid var(--border-color)'"],
    ["borderBottom: '1px solid rgba(255,255,255,0.05)'", "borderBottom: '1px solid var(--border-color)'"],
    ["<th style={{ padding: '1rem 0.5rem' }}>", "<th style={{ padding: '1rem 0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>"],
    ["background: 'rgba(255, 255, 255, 0.1)', color: '#fff'", "background: 'var(--warning-bg)', color: 'var(--warning)'"]
]);

// 3. SlotsAdminTab.jsx
updateFile('frontend/src/components/SlotsAdminTab.jsx', [
    ["color: 'rgba(255,255,255,0.6)'", "color: 'var(--text-secondary)'"],
    ["color: 'rgba(255,255,255,0.7)'", "color: 'var(--text-primary)'"],
    ["background: 'rgba(255, 255, 255, 0.05)'", "background: 'var(--bg-card)'"],
    ["border: '1px solid rgba(255, 255, 255, 0.1)'", "border: '1px solid var(--border-color)'"],
    ["borderBottom: '1px solid rgba(255,255,255,0.1)'", "borderBottom: '1px solid var(--border-color)'"],
    ["borderBottom: '1px solid rgba(255,255,255,0.05)'", "borderBottom: '1px solid var(--border-color)'"],
    ["<th style={{ padding: '1rem 0.5rem' }}>", "<th style={{ padding: '1rem 0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>"],
    ["background: '#1e293b'", "background: 'var(--bg-card)'"],
    ["background: 'rgba(0,0,0,0.3)'", "background: 'var(--bg-input)'"],
    ["background: '#0f172a'", "background: 'var(--bg-input)'"],
    ["border: '1px solid rgba(255,255,255,0.2)'", "border: '1px solid var(--border-color)'"],
    ["color: 'white', outline: 'none'", "color: 'var(--text-primary)', outline: 'none'"],
    ["color: 'white' }", "color: 'var(--text-primary)' }"]
]);

// 4. ProfileTab.jsx
updateFile('frontend/src/components/ProfileTab.jsx', [
    ["color: 'rgba(255,255,255,0.6)'", "color: 'var(--text-secondary)'"],
    ["color: 'rgba(255,255,255,0.4)'", "color: 'var(--text-secondary)'"],
    ["color: 'rgba(255,255,255,0.7)'", "color: 'var(--text-primary)'"],
    ["background: 'rgba(255, 255, 255, 0.05)'", "background: 'var(--bg-card)'"],
    ["border: '1px solid rgba(255, 255, 255, 0.1)'", "border: '1px solid var(--border-color)'"],
    ["background: 'rgba(0,0,0,0.3)'", "background: 'var(--bg-input)'"],
    ["border: '1px solid rgba(255,255,255,0.2)'", "border: '1px solid var(--border-color)'"],
    ["color: 'white',", "color: 'var(--text-primary)',"],
    ["color: 'white' }", "color: 'var(--text-primary)' }"]
]);

// 5. HardwareTab.jsx
updateFile('frontend/src/components/HardwareTab.jsx', [
    ["color: 'rgba(255,255,255,0.6)'", "color: 'var(--text-secondary)'"],
    ["color: 'rgba(255,255,255,0.4)'", "color: 'var(--text-secondary)'"],
    ["color: 'rgba(255,255,255,0.7)'", "color: 'var(--text-primary)'"],
    ["background: 'rgba(255, 255, 255, 0.05)'", "background: 'var(--bg-card)'"],
    ["border: '1px solid rgba(255, 255, 255, 0.1)'", "border: '1px solid var(--border-color)'"],
    ["background: 'rgba(0,0,0,0.3)'", "background: 'var(--bg-input)'"],
    ["border: '1px solid rgba(255,255,255,0.2)'", "border: '1px solid var(--border-color)'"],
    ["color: 'white', border:", "color: 'var(--text-primary)', border:"] 
]);

// 6. DiagnosticsTab.jsx
updateFile('frontend/src/components/DiagnosticsTab.jsx', [
    ["color: 'rgba(255,255,255,0.6)'", "color: 'var(--text-secondary)'"],
    ["color: 'rgba(255,255,255,0.5)'", "color: 'var(--text-secondary)'"],
    ["color: 'rgba(255,255,255,0.4)'", "color: 'var(--text-secondary)'"],
    ["color: 'rgba(255,255,255,0.7)'", "color: 'var(--text-primary)'"],
    ["background: 'rgba(255, 255, 255, 0.05)'", "background: 'var(--bg-card)'"],
    ["border: '1px solid rgba(255, 255, 255, 0.1)'", "border: '1px solid var(--border-color)'"]
]);

console.log('Update complete.');
