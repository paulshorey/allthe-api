#!/bin/bash

eval "$(ssh-agent -s)"
ssh-add ~/.ssh/newssh
cd /www/c.ps
git reset HEAD -\-hard;
git pull

cd /www/c.ps
npm install

pm2 start  app.js -i max