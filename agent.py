import json
import time
import sys
import subprocess
import os
import psutil

def get_gpu_info():
    """解析 nvidia-smi 输出获取 GPU 和进程信息 (修复版: 使用 UUID 匹配)"""
    gpus = []
    gpu_map = {} # 用于通过 UUID 快速找到 GPU 对象

    try:
        # 1. 获取 GPU 基础信息
        # 增加 'uuid' 字段，用于后续匹配进程
        # index, uuid, name, memory.total, memory.used, utilization.gpu
        cmd = "nvidia-smi --query-gpu=index,uuid,name,memory.total,memory.used,utilization.gpu --format=csv,noheader,nounits"
        output = subprocess.check_output(cmd, shell=True).decode('utf-8').strip()
        
        lines = output.split('\n')
        for line in lines:
            if not line: continue
            # 注意：这里 split 必须与上面的 query-gpu 顺序一致
            parts = [x.strip() for x in line.split(',')]
            if len(parts) < 6: continue
            
            idx, uuid, name, total, used, util = parts
            
            # 计算显存百分比
            total_mb = int(total)
            used_mb = int(used)
            vram_percent = round((used_mb / total_mb) * 100) if total_mb > 0 else 0
            
            gpu_data = {
                "id": int(idx),
                "uuid": uuid,   # 新增 uuid 字段
                "name": name,
                "vram_total_mb": total_mb,
                "vram_used_mb": used_mb,
                "vram_percent": vram_percent,
                "util_percent": int(util),
                "processes": [] 
            }
            gpus.append(gpu_data)
            gpu_map[uuid] = gpu_data # 建立 UUID -> GPU 对象的映射
            
        # 2. 获取 GPU 进程信息
        # 修复: 将 'gpu_index' 改为 'gpu_uuid'
        # 修复: 确保使用标准字段 'used_gpu_memory' (部分驱动不支持 'used_memory')
        p_cmd = "nvidia-smi --query-compute-apps=gpu_uuid,pid,used_gpu_memory --format=csv,noheader,nounits"
        try:
            p_output = subprocess.check_output(p_cmd, shell=True).decode('utf-8').strip()
        except subprocess.CalledProcessError:
            # 如果没有运行中的 GPU 进程，nvidia-smi 有时会返回非零状态或空，这里做容错
            p_output = ""
        
        if p_output:
            for p_line in p_output.split('\n'):
                if not p_line: continue
                parts = [x.strip() for x in p_line.split(',')]
                if len(parts) < 3: continue

                p_uuid, pid, used_mem = parts
                
                # 获取用户名
                try:
                    user = psutil.Process(int(pid)).username()
                except:
                    user = "unknown"
                
                # 使用 UUID 找到对应的 GPU 对象
                if p_uuid in gpu_map:
                    target_gpu = gpu_map[p_uuid]
                    
                    # 计算该进程显存占用百分比
                    p_ram_percent = 0
                    if target_gpu['vram_total_mb'] > 0:
                        try:
                            used_mem_val = int(used_mem) # 有时候可能是 N/A
                        except:
                            used_mem_val = 0
                        p_ram_percent = round((used_mem_val / target_gpu['vram_total_mb']) * 100)
                        
                    target_gpu['processes'].append({
                        "pid": int(pid),
                        "user": user,
                        "ram_percent": p_ram_percent
                    })

    except Exception as e:
        # 打印错误但不中断脚本，防止单次采集失败导致崩溃
        print(f"Error collecting GPU info: {e}")
        import traceback
        traceback.print_exc()
    
    return gpus

def get_system_info():
    """获取 CPU, RAM, SSD 信息"""
    try:
        return {
            "cpu_percent": round(psutil.cpu_percent(interval=1)),
            "ram_percent": round(psutil.virtual_memory().percent),
            "ssd_percent": round(psutil.disk_usage('/home').percent)
        }
    except Exception as e:
        print(f"Error collecting System info: {e}")
        return {"cpu_percent": 0, "ram_percent": 0, "ssd_percent": 0}

def main():
    if len(sys.argv) < 2:
        print("Usage: python agent.py <NodeName>")
        sys.exit(1)
        
    node_name = sys.argv[1]
    
    # 捕获整个流程，确保即使出错也能生成某种 JSON (可选)
    try:
        gpu_info = get_gpu_info()
        sys_info = get_system_info()
    except Exception as e:
        print(f"Critical error: {e}")
        sys.exit(1)

    data = {
        "node": node_name,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "system": sys_info,
        "gpus": gpu_info
    }
    
    # 写入 JSON 文件
    filename = f"{node_name}.json"
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)
    
    print(f"Generated {filename}")

if __name__ == "__main__":
    main()