#!/bin/bash

sleep 30

eval "$(ssh-agent -s)"
ssh-add ~/.ssh/newssh
cd /www/c.ps
git reset HEAD -\-hard;
git pull

npm install

pm2 start _deploy.js