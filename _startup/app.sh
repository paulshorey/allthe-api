#!/bin/bash

# ports
iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 1080
# ufw allow 80/tcp
iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 1443
# ufw allow 443/tcp



# codebase
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/newssh

git reset HEAD -\-hard;
git pull

cd /www
npm install


# app
pm2 start app.js -i max