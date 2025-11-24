async function refreshData() {
    document.getElementById('last-updated').textContent =
        new Date().toLocaleTimeString('zh-CN', { hour12: false });

    for (const [nodeName, meta] of Object.entries(nodesConfig)) {
        if (meta.status === 'disabled') continue;

        try {
            const res = await fetch(`data/${nodeName}.json?t=${Date.now()}`);
            const data = await res.json();
            updateNodeCard(nodeName, data);
        } catch (e) {
            console.warn(nodeName, e);
            document.getElementById(`content-${nodeName}`).innerHTML =
                `<div class="error-msg">节点离线</div>`;
        }
    }
}

async function init() {
    await loadConfig();
    renderLayout();
    refreshData();
    setInterval(refreshData, config.refresh_interval * 1000);
}

init();