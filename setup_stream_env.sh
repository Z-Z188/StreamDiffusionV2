/usr/bin/env bash
# 一键创建并配置 stream 环境（无任何 y/n 操作）

set -e  # 只要有一步出错就退出脚本

ENV_NAME="stream"
PYTHON_VERSION="3.10.0"
TORCH_INDEX_URL="https://download.pytorch.org/whl/cu124"

echo ">>> 检查 conda 是否可用..."
if ! command -v conda &>/dev/null; then
    echo "[-] 未找到 conda，请先安装 Anaconda / Miniconda 并配置环境变量。"
    exit 1
fi

# 让 conda 在脚本里生效
eval "$(conda shell.bash hook)"

echo ">>> 创建 conda 环境: ${ENV_NAME} (python=${PYTHON_VERSION})"
# 如果环境存在则跳过
if conda env list | awk '{print $1}' | grep -qx "${ENV_NAME}"; then
    echo "[*] 环境 ${ENV_NAME} 已存在，跳过创建。"
else
    conda create -y -n "${ENV_NAME}" "python=${PYTHON_VERSION}"
fi

echo ">>> 激活环境: ${ENV_NAME}"
conda activate "${ENV_NAME}"

echo ">>> 当前 python 版本："
python --version

echo ">>> 检查 nvcc（如果安装了 CUDA toolkit）"
if command -v nvcc &>/dev/null; then
    nvcc -V || true
else
    echo "[*] 未找到 nvcc，仅说明未安装 CUDA toolkit（不影响驱动版 PyTorch 使用）。"
fi

echo ">>> 安装 PyTorch (CUDA 12.4)"
pip install -q torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 --index-url "${TORCH_INDEX_URL}"

echo ">>> 安装项目依赖 requirements.txt"
if [ -f "requirements.txt" ]; then
    pip install -q -r requirements.txt
else
    echo "[-] 未找到 requirements.txt，请确认在项目根目录下。"
    exit 1
fi

echo ">>> 使用 develop 模式安装 setup.py"
if [ -f "setup.py" ]; then
    python setup.py develop
else
    echo "[-] 未找到 setup.py，请确认在项目根目录下。"
    exit 1
fi

echo "🎉  完成！所有步骤均自动完成，无需手动输入 y。"
echo "👉 使用环境：  conda activate ${ENV_NAME}"

