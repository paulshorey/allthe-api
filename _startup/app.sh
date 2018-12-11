#!/bin/bash

eval "$(ssh-agent -s)"
ssh-add ~/.ssh/newssh

git reset HEAD -\-hard;
git pull

cd /www
npm install

pm2 start _app.js -i max