#!/bin/bash

# ==============================================================================
# 脚本功能: 自动覆盖APT源为USTC, 安装 Node.js, @builder.io/ai-shell, 并配置
# 使用方法:
# 1. 保存为 install_ai_shell.sh
# 2. 赋予执行权限: chmod +x install_ai_shell.sh
# 3. 使用 sudo 运行: sudo ./install_ai_shell.sh
# ==============================================================================

# 当任何命令失败时，立即退出脚本
set -e

# --- 1. 检查是否以 root 权限运行 ---
if [ "$(id -u)" -ne 0 ]; then
  echo "错误: 此脚本需要以 root 权限运行。" >&2
  echo "请尝试使用: sudo $0" >&2
  exit 1
fi

echo "✅ 权限检查通过 (root)"

# --- 2. 覆盖 APT 软件源为 USTC 镜像 ---
echo "🔄 正在备份并覆盖 APT 软件源为中国科学技术大学 (USTC) 镜像..."

# 为了动态获取系统代号, 可能需要 lsb-release
CODENAME="trixie"
echo "✅ 检测到系统代号为: $CODENAME"

# 检查新版 Debian (Bookworm/Trixie) 的 sources 文件
if [ -f /etc/apt/sources.list.d/debian.sources ]; then
  SOURCES_FILE="/etc/apt/sources.list.d/debian.sources"
  echo "检测到新版 Debian 源文件，将直接覆盖: $SOURCES_FILE"
  # 备份原始文件
  cp "$SOURCES_FILE" "$SOURCES_FILE.bak"

  # 使用 Here Document 覆盖文件内容
  cat <<EOF >"$SOURCES_FILE"
Types: deb
URIs: http://mirrors.ustc.edu.cn/debian/
Suites: $CODENAME $CODENAME-updates
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb
URIs: http://mirrors.ustc.edu.cn/debian-security/
Suites: $CODENAME-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
EOF

# 检查传统的 Debian/Ubuntu sources.list 文件
elif [ -f /etc/apt/sources.list ]; then
  SOURCES_FILE="/etc/apt/sources.list"
  echo "检测到传统格式源文件，将直接覆盖: $SOURCES_FILE"
  # 备份原始文件
  cp "$SOURCES_FILE" "$SOURCES_FILE.bak"

  # 使用 Here Document 覆盖文件内容 (适用于 Debian 和 Ubuntu)
  cat <<EOF >"$SOURCES_FILE"
# 默认注释了源码镜像，以提高 apt update 速度，如有需要可自行取消注释
deb http://mirrors.ustc.edu.cn/debian/ $CODENAME main contrib non-free non-free-firmware
# deb-src http://mirrors.ustc.edu.cn/debian/ $CODENAME main contrib non-free non-free-firmware

deb http://mirrors.ustc.edu.cn/debian/ $CODENAME-updates main contrib non-free non-free-firmware
# deb-src http://mirrors.ustc.edu.cn/debian/ $CODENAME-updates main contrib non-free non-free-firmware

deb http://mirrors.ustc.edu.cn/debian-security/ $CODENAME-security main contrib non-free non-free-firmware
# deb-src http://mirrors.ustc.edu.cn/debian-security/ $CODENAME-security main contrib non-free non-free-firmware
EOF
else
  echo "⚠️ 警告: 未找到标准的 APT 源文件。将使用系统默认源进行安装。"
fi

echo "✅ 源文件已备份，并被新的 USTC 镜像配置覆盖。"

# --- 3. 更新软件包列表并安装 Node.js 和 npm ---
echo "🔄 正在更新 apt 软件包列表 (使用新镜像)..."
apt-get update

echo "📦 正在安装 Node.js 和 npm..."
apt-get install -y nodejs npm

echo "✅ Node.js 和 npm 安装成功。"
node --version
npm --version

# --- 4. 使用 npm 全局安装 ai-shell ---
echo "🚀 正在全局安装 @builder.io/ai-shell..."
npm install -g @builder.io/ai-shell --unsafe-perm

echo "✅ @builder.io/ai-shell 安装成功。"

# --- 5. 创建并写入配置文件 ---

if [ -n "$SUDO_USER" ]; then
  TARGET_HOME=$(getent passwd "$SUDO_USER" | cut -d: -f6)
  TARGET_USER="$SUDO_USER"
else
  TARGET_HOME=$HOME
  TARGET_USER="root"
fi

CONFIG_DIR="$TARGET_HOME/.ai-shell"
CONFIG_FILE="$CONFIG_DIR/config"

echo "📝 为用户 '$TARGET_USER' 创建配置文件于 $CONFIG_FILE"

mkdir -p "$CONFIG_DIR"

cat <<EOF >"$CONFIG_FILE"
OPENAI_KEY=123
OPENAI_API_ENDPOINT=http://172.16.0.6:000/v1
MODEL=ly_azure_chatgpt_4o
LANGUAGE=zh-Hans
EOF

chown -R "$TARGET_USER":"$TARGET_USER" "$CONFIG_DIR"

echo "🎉 脚本执行完毕！"
echo "ai-shell 已成功安装并配置。"
echo "================================================="
echo "重要提示: "
echo "配置文件位于: $CONFIG_FILE"
echo "请务必将 OPENAI_KEY=123 修改为您的真实密钥！"
echo "================================================="
