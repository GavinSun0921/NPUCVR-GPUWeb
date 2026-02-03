function getColorClass(percent) {
    if (percent > 90) return 'bg-red';
    if (percent > 60) return 'bg-orange';
    if (percent >= 30) return 'bg-yellow';
    return 'bg-green';
}

function clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
}

function formatGb(value) {
    if (!Number.isFinite(value)) return '-';
    if (value >= 100) return `${Math.round(value)}G`;
    return `${value.toFixed(1)}G`;
}

function updateNodeCard(nodeName, data) {
    const timeSpan = document.getElementById(`time-${nodeName}`);
    const contentDiv = document.getElementById(`content-${nodeName}`);

    if (timeSpan) timeSpan.textContent = data.timestamp;

    const sys = data.system || {cpu_percent:0, ram_percent:0, ssd_percent:0, disks: []};
    const disks = Array.isArray(sys.disks) ? sys.disks : [];
    const fallbackPercent = Number(sys.ssd_percent);
    const diskItems = disks.length ? disks : (
        Number.isFinite(fallbackPercent) ? [{ mount: "/home", used_percent: fallbackPercent }] : []
    );

    const diskHtml = diskItems.length ? `
        <div class="disk-resources">
            ${diskItems.map(d => {
                const percent = clampPercent(Number(d.used_percent ?? d.percent));
                const label = d.mount ? `Disk ${d.mount}` : "Disk";
                const sizeText = (Number.isFinite(d.used_gb) && Number.isFinite(d.total_gb))
                    ? `${formatGb(d.used_gb)} / ${formatGb(d.total_gb)}`
                    : `${percent}%`;
                return `
                    <div class="disk-item">
                        <span class="disk-label">${label}</span>
                        <div class="mini-progress">
                            <div class="mini-bar ${getColorClass(percent)}" style="width:${percent}%"></div>
                        </div>
                        <span class="disk-text">${sizeText}</span>
                    </div>
                `;
            }).join('')}
        </div>
    ` : '';

    let html = `
        <div class="system-resources">
            <div class="res-item">
                <span>CPU: ${sys.cpu_percent}%</span>
                <div class="mini-progress"><div class="mini-bar ${getColorClass(sys.cpu_percent)}" style="width:${sys.cpu_percent}%"></div></div>
            </div>
            <div class="res-item">
                <span>RAM: ${sys.ram_percent}%</span>
                <div class="mini-progress"><div class="mini-bar ${getColorClass(sys.ram_percent)}" style="width:${sys.ram_percent}%"></div></div>
            </div>
        </div>
        ${diskHtml}
        
        <div class="gpu-table-container">
            <table>
                <thead>
                    <tr>
                        <th class="col-id">ID</th>
                        <th class="col-name">Name</th>
                        <th style="width: 25%">VRAM Usage</th>
                        <th style="width: 20%">Util %</th>
                        <th>Processes</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (data.gpus && data.gpus.length > 0) {
        data.gpus.forEach(gpu => {
            const vramColor = getColorClass(gpu.vram_percent);
            const utilColor = getColorClass(gpu.util_percent);

            let displayName = gpu.name;
            if (config.gpu_name_map && config.gpu_name_map[gpu.name]) {
                displayName = config.gpu_name_map[gpu.name];
            } else {
                displayName = gpu.name.replace("NVIDIA ", "");
            }

            let processHtml = '<span style="color:#aaa">-</span>';

            if (gpu.processes && gpu.processes.length > 0) {
                processHtml = gpu.processes
                    .map(p => `<span class="process-tag" title="PID: ${p.pid}">${p.user}(${p.ram_percent}%)</span>`)
                    .join('');
            }

            html += `
                <tr>
                    <td class="col-id">${gpu.id}</td>
                    <td class="col-name"><strong>${displayName}</strong></td>
                    <td>
                        <div class="progress-wrapper">
                            <div class="progress-bg">
                                <div class="progress-bar ${vramColor}" style="width: ${gpu.vram_percent}%"></div>
                            </div>
                            <div class="progress-text w-vram">${gpu.vram_used_mb}MB / ${gpu.vram_percent}%</div>
                        </div>
                    </td>
                    <td>
                        <div class="progress-wrapper">
                            <div class="progress-bg">
                                <div class="progress-bar ${utilColor}" style="width: ${gpu.util_percent}%"></div>
                            </div>
                            <div class="progress-text w-util">${gpu.util_percent}%</div>
                        </div>
                    </td>
                    <td><div class="process-list">${processHtml}</div></td>
                </tr>
            `;
        });
    } else {
        html += `<tr><td colspan="5" style="text-align:center; padding:20px;">无 GPU 数据</td></tr>`;
    }

    html += `</tbody></table></div>`;

    const usage = data.usage;
    if (usage && Array.isArray(usage.users)) {
        const days = usage.window_days || 7;
        const maxUsers = config.usage_top_n || 6;
        const users = usage.users.slice(0, maxUsers);
        if (users.length > 0) {
            html += `
                <div class="usage-section">
                    <div class="usage-title">用户用量统计（最近${days}天）</div>
                    <table class="usage-table">
                        <thead>
                            <tr>
                                <th style="width: 30%">用户</th>
                                <th style="width: 20%">活跃时长(h)</th>
                                <th style="width: 25%">平均显存(合计%)</th>
                                <th style="width: 25%">峰值显存(合计%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr>
                                    <td>${u.user}</td>
                                    <td>${u.active_hours}</td>
                                    <td>${u.avg_vram_percent}</td>
                                    <td>${u.max_vram_percent}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            html += `
                <div class="usage-section usage-empty">
                    用户用量统计（最近${days}天）：暂无数据
                </div>
            `;
        }
    }

    contentDiv.innerHTML = html;
}
