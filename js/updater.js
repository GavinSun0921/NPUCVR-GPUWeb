function getColorClass(percent) {
    if (percent > 90) return 'bg-red';
    if (percent > 60) return 'bg-orange';
    if (percent >= 30) return 'bg-yellow';
    return 'bg-green';
}

function updateNodeCard(nodeName, data) {
    const timeSpan = document.getElementById(`time-${nodeName}`);
    const contentDiv = document.getElementById(`content-${nodeName}`);

    if (timeSpan) timeSpan.textContent = data.timestamp;

    const sys = data.system || {cpu_percent:0, ram_percent:0, ssd_percent:0};

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
            <div class="res-item">
                <span>SSD: ${sys.ssd_percent}%</span>
                <div class="mini-progress"><div class="mini-bar ${getColorClass(sys.ssd_percent)}" style="width:${sys.ssd_percent}%"></div></div>
            </div>
        </div>
        
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

    contentDiv.innerHTML = html;
}
