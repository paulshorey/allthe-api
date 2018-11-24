#!/bin/bash

eval "$(ssh-agent -s)"
ssh-add ~/.ssh/newssh
cd /www
git reset HEAD -\-hard;
git pull

cd /www
npm install

pm2 start  app.js -i max