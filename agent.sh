#!/bin/bash

# 检查参数
if [ "$#" -ne 4 ]; then
    echo "Usage: $0 <NodeName> <RemoteUser> <RemoteServer> <RemotePort>"
    exit 1
fi

NODE_NAME=$1
REMOTE_USER=$2
REMOTE_SERVER=$3
REMOTE_PORT=$4

# 获取脚本所在目录
SCRIPT_DIR=$(cd $(dirname $0); pwd)
cd $SCRIPT_DIR

# 1. 执行 Python 脚本生成 JSON
# 确保 python 环境中有 psutil，如果没有可以用 venv 路径代替 python 命令
/usr/bin/python3 agent.py "$NODE_NAME"

if [ $? -ne 0 ]; then
    echo "Error: JSON generation failed."
    exit 1
fi

JSON_FILE="${NODE_NAME}.json"

# 2. 上传至汇总服务器
# 目标路径参考文档: /var/www/html/gpu/data/
TARGET_DIR="/var/www/html/gpu/data/"

echo "Uploading $JSON_FILE to $REMOTE_SERVER..."

scp -P $REMOTE_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=5 \
    "$JSON_FILE" "${REMOTE_USER}@${REMOTE_SERVER}:${TARGET_DIR}"

if [ $? -eq 0 ]; then
    echo "Success: Data uploaded."
else
    echo "Error: Upload failed."
fi