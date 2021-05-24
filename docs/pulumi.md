# Pulumi Setup

## Amazon Linux 2

Install Pulumi:
```
curl -fsSL https://get.pulumi.com | sh -s -- --version 2.25.2
source ~/.bashrc
```
Install Node.js:
```
curl -sL https://rpm.nodesource.com/setup_14.x | sudo bash -
sudo yum install -y nodejs
```
Install Git:
```
sudo yum install -y git
```
Install Pulumi plugins:
```
pulumi plugin install
```

## macOS

Install Pulumi:
```
curl -fsSL https://get.pulumi.com | sh -s -- --version 2.25.2
```
Install Node.js:
```
brew install node@14
```
Install Pulumi plugins:
```
pulumi plugin install
```
