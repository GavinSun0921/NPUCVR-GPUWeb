# 📊 GPU Cluster Monitor (Lightweight)

一个轻量级、无数据库、易扩展的实验室级 GPU 集群监控系统。 采用**节点主动推送 (Push)** 模式，前端实时解析 JSON 进行可视化展示。支持多行公告、ID 独立对齐、自定义 Logo 等特性。



## 📂 目录结构
本项目采用统一结构，**服务端**和**节点机**使用同一份代码包即可。
```
gpu-monitor/
├── agent.py            # [通用] 采集脚本
├── agent.sh            # [通用] 启动脚本
├── index.html          # [服务端] 监控主页
├── logo.png            # [服务端] Logo
├── README.md           # [通用] 说明书
├── config/             # [服务端] 配置文件
│   ├── global.json
│   └── nodes.json
└── data/               # [服务端] 数据接收目录
    └── .gitkeep        # (占位文件)
```

## 🚀 部署指南

### 角色 A：作为服务端 (Web Server)

适用于：汇总展示数据的机器 (需要安装 Nginx/Apache 或使用 Python HTTP)

1. 上传代码 将 gpu-monitor 文件夹完整放置在 Web 服务器目录下（例如 /var/www/html/gpu-monitor）。
2. 设置权限 (关键步骤) 必须赋予 data 目录写入权限，否则节点无法上传数据。
3. 配置节点 编辑 config/nodes.json，注册所有需要监控的节点名称（未注册的节点上传数据也不会显示）。
4. 访问 打开浏览器访问：http://<Server-IP>/gpu-monitor/

### 角色 B：作为节点机 (GPU Node)

适用于：被监控的显卡服务器

1. 下载代码 将 gpu-monitor 文件夹下载到节点机任意位置（例如 ~/gpu-monitor）。
2. 安装依赖 需要 Python 3 和 psutil 库。
    ```python
    pip3 install psutil
    ```
3. 配置上传路径 编辑 agent.sh，修改 TARGET_DIR 变量，使其指向服务端的实际绝对路径。
    ```python
    vim agent.sh
    ```
4. 配置免密 SSH 确保节点机可以免密传输文件到服务端。
    ```bash
    ssh-copy-id -p <SSH端口> <服务端用户>@<服务端IP>
    ```
5. 测试与定时任务
    ```shell
    # 1. 赋予执行权限
    chmod +x agent.sh

    # 2. 手动测试运行 (参数：节点名 远程用户 远程IP SSH端口)
    ./agent.sh Server01 stuser 192.168.1.100 22
    # 如果没报错，且服务端的 data/ 目录下出现了 Server01.json，即成功。

    # 3. 添加 Crontab 定时任务 (每分钟采集一次)
    crontab -e
    # 添加如下行：
    * * * * * /path/to/gpu-monitor/agent.sh Server01 stuser 192.168.1.100 22 > /dev/null 2>&1
    ```

## ⚙️ 配置文件说明

所有配置修改后，刷新网页即可生效。

### 1. 全局配置 (config/global.json)
```json
{
    "title": "Lab GPU Center",      // 网页顶部大标题
    "announcement": "公告：\n1. 请注意显存占用", // 全局公告 (支持 \n 换行)
    "refresh_interval": 30          // 网页自动刷新间隔 (秒)
    "gpu_name_map": {
        "NVIDIA GeForce RTX 3090": "RTX 3090 (24G)", // 实际在网页中显示显卡的名称，可自定义
        "NVIDIA GeForce RTX 4090": "RTX 4090 (24G)",
        "NVIDIA A100-SXM4-80GB": "A100 80G",
        "NVIDIA L40": "L40 (48G)",
        "NVIDIA RTX 5880 Ada Generation": "RTX 5880 Ada (48G)"
    }
}
```

### 2. 节点管理 (config/nodes.json)
```json
{
    "Server10": {
        "status": "available",      // 状态颜色: available(绿), maintenance(黄), disabled(灰)
        "notice": "8卡 3090 推理节点\n请勿运行训练任务", // 节点专属公告 (支持 \n 换行)
        "order": 1                  // 排序权重 (越小越靠前)
    },
    "Server19": {
        "status": "maintenance",
        "notice": "显卡故障维修中",
        "order": 2
    }
}
```

