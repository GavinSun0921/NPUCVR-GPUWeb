let config = { refresh_interval: 30, gpu_name_map: {} };
let nodesConfig = {};

async function loadConfig() {
    const globalRes = await fetch('config/global.json?t=' + Date.now());
    config = await globalRes.json();

    document.getElementById('global-title').textContent = config.title;

    if (config.announcement?.trim()) {
        const annEl = document.getElementById('global-announcement');
        annEl.textContent = config.announcement;
        annEl.style.display = 'inline-block';
    }

    document.getElementById('refresh-rate').textContent = config.refresh_interval;

    const nodesRes = await fetch('config/nodes.json?t=' + Date.now());
    nodesConfig = await nodesRes.json();
}
