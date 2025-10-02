#!/bin/bash

export ZSH_CUSTOM=$HOME/.oh-my-zsh

# Check if curl is installed
if ! command -v curl &>/dev/null; then
  echo "curl is not installed. Installing curl..."
  sudo apt-get update && sudo apt-get install -y curl # For Debian/Ubuntu
  # or
  # sudo yum install curl  # For CentOS/Fedora
fi

# Check if Git is installed
if ! command -v git &>/dev/null; then
  echo "Git is not installed. Installing Git..."
  sudo apt-get install -y git # For Debian/Ubuntu
  # or
  # sudo yum install git  # For CentOS/Fedora
fi

# Check if Zsh is installed
if ! command -v zsh &>/dev/null; then
  echo "Zsh is not installed. Installing Zsh..."
  sudo apt-get install -y zsh # For Debian/Ubuntu
  # or
  # sudo yum install zsh  # For CentOS/Fedora
fi

# Check if net-tools is installed
if ! command -v ifconfig &>/dev/null; then
  echo "net-tools is not installed. Installing net-tools..."
  sudo apt-get install -y net-tools # For Debian/Ubuntu
  # or
  # sudo yum install net-tools  # For CentOS/Fedora
fi

# Check if Vim is installed
if ! command -v vim &>/dev/null; then
  echo "Vim is not installed. Installing Vim..."
  sudo apt-get install -y vim # For Debian/Ubuntu
  # or
  # sudo yum install vim  # For CentOS/Fedora
fi

# Check if htop is installed
if ! command -v htop &>/dev/null; then
  echo "htop is not installed. Installing htop..."
  sudo apt-get install -y htop # For Debian/Ubuntu
  # or
  # sudo yum install htop # For CentOS/Fedora
fi

# Check if iftop is installed
if ! command -v iftop &>/dev/null; then
  echo "iftop is not installed. Installing iftop..."
  sudo apt-get install -y iftop # For Debian/Ubuntu
  # or
  # sudo yum install iftop # For CentOS/Fedora
fi

# Check if iotop is installed
if ! command -v iotop &>/dev/null; then
  echo "iotop is not installed. Installing iotop..."
  sudo apt-get install -y iotop # For Debian/Ubuntu
  # or
  # sudo yum install iotop # For CentOS/Fedora
fi

# Check if nload is installed
if ! command -v nload &>/dev/null; then
  echo "nload is not installed. Installing nload..."
  sudo apt-get install -y nload # For Debian/Ubuntu
  # or
  # sudo yum install nload # For CentOS/Fedora
fi

# Check if zip is installed
if ! command -v zip &>/dev/null; then
  echo "zip is not installed. Installing zip..."
  sudo apt-get install -y zip # For Debian/Ubuntu
  # or
  # sudo yum install zip # For CentOS/Fedora
fi

# Check if 7z is installed
if ! command -v 7z &>/dev/null; then
  echo "7z (p7zip-full) is not installed. Installing p7zip-full..."
  sudo apt-get install -y p7zip-full # For Debian/Ubuntu
  # or
  # sudo yum install p7zip p7zip-plugins # For CentOS/Fedora
fi

# Check if OpenSSH Server is installed
if ! command -v sshd &>/dev/null; then
  echo "OpenSSH Server is not installed. Installing openssh-server..."
  sudo apt-get update && sudo apt-get install -y openssh-server # For Debian/Ubuntu
  # or
  # sudo yum install openssh-server # For CentOS/Fedora
else
  echo "OpenSSH Server is already installed."
fi

# Install Oh My Zsh (if not already installed)
if [ ! -d "$HOME/.oh-my-zsh" ]; then
  echo "Installing Oh My Zsh..."
  # The installer script may try to switch to zsh, which can exit the script.
  # We run it in a way that it doesn't automatically exit.
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi

# Install zsh-autosuggestions (if not already installed)
if [ ! -d "$ZSH_CUSTOM/plugins/zsh-autosuggestions" ]; then
  echo "Installing zsh-autosuggestions..."
  git clone https://github.com/zsh-users/zsh-autosuggestions.git $ZSH_CUSTOM/plugins/zsh-autosuggestions
fi

# Install zsh-syntax-highlighting (if not already installed)
if [ ! -d "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting" ]; then
  echo "Installing zsh-syntax-highlighting..."
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git $ZSH_CUSTOM/plugins/zsh-syntax-highlighting
fi

# Install pbcopy functionality from specified URL
echo "Downloading and installing pbcopy script..."
sudo curl -fsSL https://raw.githubusercontent.com/skaji/remote-pbcopy-iterm2/refs/heads/master/pbcopy -o /usr/bin/pbcopy
if [ -f /usr/bin/pbcopy ]; then
  echo "Setting executable permissions for pbcopy..."
  sudo chmod +x /usr/bin/pbcopy
  echo "pbcopy has been installed successfully."
else
  echo "Failed to download pbcopy. Please check the URL or network connection."
fi

# --- Section for OpenSSH Server Configuration ---

# Configure SSH for root access with authorized keys
echo "Configuring SSH for root login with public key..."
SSH_DIR="/root/.ssh"
AUTH_KEYS_FILE="$SSH_DIR/authorized_keys"
KEYS_URL="https://github.com/fqdeng.keys"

# Create .ssh directory for root if it doesn't exist
if [ ! -d "$SSH_DIR" ]; then
  echo "Creating $SSH_DIR directory..."
  sudo mkdir -p "$SSH_DIR"
  sudo chmod 700 "$SSH_DIR"
fi

# Download and set the public keys, overwriting the file.
echo "Downloading public keys from $KEYS_URL..."
sudo curl -fsSL "$KEYS_URL" -o "$AUTH_KEYS_FILE"

if [ $? -eq 0 ]; then
  echo "Keys downloaded successfully."
  # Set correct permissions
  sudo chmod 600 "$AUTH_KEYS_FILE"
  echo "Authorized keys have been set up for root."
else
  echo "Failed to download keys from $KEYS_URL. Please check the URL or network connection."
fi

# Modify sshd_config
SSHD_CONFIG="/etc/ssh/sshd_config"
echo "Modifying $SSHD_CONFIG for key-based root login..."

# PermitRootLogin yes
if sudo grep -qE "^#?\s*PermitRootLogin" "$SSHD_CONFIG"; then
  sudo sed -ri "s/^#?\s*PermitRootLogin.*/PermitRootLogin yes/" "$SSHD_CONFIG"
else
  echo "PermitRootLogin yes" | sudo tee -a "$SSHD_CONFIG" >/dev/null
fi

# PasswordAuthentication no
if sudo grep -qE "^#?\s*PasswordAuthentication" "$SSHD_CONFIG"; then
  sudo sed -ri "s/^#?\s*PasswordAuthentication.*/PasswordAuthentication no/" "$SSHD_CONFIG"
else
  echo "PasswordAuthentication no" | sudo tee -a "$SSHD_CONFIG" >/dev/null
fi

# ChallengeResponseAuthentication no
if sudo grep -qE "^#?\s*ChallengeResponseAuthentication" "$SSHD_CONFIG"; then
  sudo sed -ri "s/^#?\s*ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/" "$SSHD_CONFIG"
else
  echo "ChallengeResponseAuthentication no" | sudo tee -a "$SSHD_CONFIG" >/dev/null
fi

# Restart SSH service to apply changes
echo "Restarting SSH service..."
if command -v systemctl &>/dev/null; then
  sudo systemctl restart sshd
else
  sudo service sshd restart
fi

echo "SSH server configured."

# --- End of Section ---

# Check if Docker is installed
if ! command -v docker &>/dev/null; then
  echo "Docker is not installed. Installing Docker..."
  sudo wget -qO- get.docker.com | sudo bash
else
  echo "Docker is already installed."
fi

# Update .zshrc to enable plugins and change theme to "ys"
echo "Enabling plugins and changing theme in .zshrc..."
# Use a temporary file to avoid issues with sed -i on some systems
ZSHRC_FILE=$HOME/.zshrc
if [ -f "$ZSHRC_FILE" ]; then
  sed -i.bak 's/^plugins=(git)$/plugins=(git zsh-autosuggestions zsh-syntax-highlighting extract)/' "$ZSHRC_FILE"
  sed -i.bak 's/^ZSH_THEME="robbyrussell"$/ZSH_THEME="ys"/' "$ZSHRC_FILE"
else
  echo ".zshrc not found. Skipping plugin and theme configuration."
fi

# Append additional configuration to .zshrc
echo "Appending additional configuration to .zshrc..."
cat <<EOL >>$HOME/.zshrc

# Add Neovim to PATH
export PATH="/opt/nvim-linux-x86_64/bin:\$PATH"

# Custom Key Bindings
bindkey '^[' backward-word
bindkey '^]' forward-word

# Custom Aliases
alias gs='git status'
alias vim='nvim'

#nvm
if [ -s "\$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "\$NVM_DIR/bash_completion" ] && . "\$NVM_DIR/bash_completion"
  alias nvm='unalias nvm node npm yarn && . "\$NVM_DIR"/nvm.sh && nvm_use_if_needed & nvm'
  alias node='unalias nvm node npm yarn && . "\$NVM_DIR"/nvm.sh && nvm_use_if_needed & node'
  alias npm='unalias nvm node npm yarn && . "\$NVM_DIR"/nvm.sh && nvm_use_if_needed & npm'
  alias yarn='unalias nvm node npm yarn && . "\$NVM_DIR"/nvm.sh && nvm_use_if_needed & yarn'
fi
EOL

# Appending additional configuration to .ai-shell
echo "Appending additional configuration to .ai-shell..."
cat <<EOL >>$HOME/.ai-shell

OPENAI_KEY=123
OPENAI_API_ENDPOINT=http://172.16.0.6:6000/v1
MODEL=ly_azure_chatgpt_4o
LANGUAGE=zh-Hans

EOL

# Install nvm (Node Version Manager)
echo "Installing nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Source nvm script to make it available in the current shell session
# This ensures that the 'nvm' command is available for the next steps
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js v22 using nvm and set it as the default version
echo "Installing Node.js v22 and setting it as default..."
nvm install 22
nvm use 22
nvm alias default 22

# Install @builder.io/ai-shell globally via npm
echo "Installing @builder.io/ai-shell globally..."
npm install -g @builder.io/ai-shell

# --- Section for Neovim and LazyVim ---

# Install Neovim from official release
echo "Installing Neovim from latest release..."
NVIM_URL="https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz"
NVIM_DIR="/opt/nvim-linux-x86_64"

if [ ! -d "$NVIM_DIR" ]; then
  echo "Downloading Neovim..."
  curl -L "$NVIM_URL" -o /tmp/nvim-linux-x86_64.tar.gz
  echo "Extracting Neovim to /opt..."
  sudo tar -C /opt -xzf /tmp/nvim-linux-x86_64.tar.gz
  rm /tmp/nvim-linux-x86_64.tar.gz
  echo "Neovim installed in $NVIM_DIR"
else
  echo "Neovim directory $NVIM_DIR already exists. Skipping installation."
fi

# Install LazyVim for Neovim
NVIM_CONFIG_DIR="$HOME/.config/nvim"
# Back up existing Neovim configuration if it exists
if [ -d "$NVIM_CONFIG_DIR" ]; then
  echo "Existing Neovim configuration found. Backing it up to $NVIM_CONFIG_DIR.bak..."
  mv "$NVIM_CONFIG_DIR" "$NVIM_CONFIG_DIR.bak"
fi

# Clone the LazyVim starter template
echo "Installing LazyVim by cloning the starter template..."
git clone https://github.com/LazyVim/starter "$NVIM_CONFIG_DIR"

# Remove the .git folder so you can manage your own config with git
if [ -d "$NVIM_CONFIG_DIR/.git" ]; then
  echo "Removing .git folder from LazyVim starter..."
  rm -rf "$NVIM_CONFIG_DIR/.git"
fi

echo "LazyVim has been installed successfully."

# --- End of Section ---

# Change root's default shell to zsh
echo "Changing root's default shell to zsh..."
if command -v zsh &>/dev/null; then
  ZSH_PATH=$(which zsh)
  # Add zsh to the list of valid shells if it's not already there
  if ! grep -Fxq "$ZSH_PATH" /etc/shells; then
    echo "Adding $ZSH_PATH to /etc/shells..."
    echo "$ZSH_PATH" | sudo tee -a /etc/shells
  fi
  # Change the shell for the root user
  sudo chsh -s "$ZSH_PATH" root
  if [ $? -eq 0 ]; then
    echo "Successfully changed root's shell to $ZSH_PATH."
  else
    echo "Failed to change root's shell. Please do it manually."
  fi
else
  echo "zsh is not installed, skipping shell change for root."
fi

echo ""
echo "✅ All installations and configurations are complete!"
echo "This now includes: Neovim and LazyVim."
echo "Please restart your terminal or run 'source ~/.zshrc' to apply all changes."
echo "The first time you run 'nvim', LazyVim will automatically install its plugins."
