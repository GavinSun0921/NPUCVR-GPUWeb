function renderLayout() {
    const container = document.getElementById('node-container');
    container.innerHTML = '';

    const sortedNodes = Object.entries(nodesConfig)
        .sort(([, a], [, b]) => a.order - b.order);

    sortedNodes.forEach(([nodeName, meta]) => {
        const card = document.createElement('div');
        card.className = 'node-card';
        card.id = `card-${nodeName}`;

        const statusColorClass = `status-${meta.status}`;
        const isDisabled = meta.status === 'disabled';

        let noticeHtml = (!isDisabled && meta.notice?.trim())
            ? `<div class="node-notice-box">${meta.notice}</div>` : "";

        let initContentHtml = isDisabled
            ? `<div style="padding: 20px 10px; text-align: center; color: #999; background-color: #fafafa;">
                <div style="font-size: 24px; font-weight: bold; color: #777;">🚫 此节点已停用</div>
                <div style="font-size: 14px;">原因: ${meta.notice || "暂无说明"}</div>
               </div>`
            : `<div style="padding:20px; text-align:center; color:#999;">Connecting...</div>`;

        const statusText = isDisabled ? 'Disabled' : 'Waiting...';

        card.innerHTML = `
            <div class="card-header">
                <div class="node-title">
                    <span class="status-dot ${statusColorClass}"></span>
                    ${nodeName}
                </div>
                <div class="node-meta">
                    <span id="time-${nodeName}">${statusText}</span>
                </div>
            </div>
            ${noticeHtml}
            <div id="content-${nodeName}">${initContentHtml}</div>
        `;
        container.appendChild(card);
    });
}
