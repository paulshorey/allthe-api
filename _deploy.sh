#!/bin/bash

eval "$(ssh-agent -s)"
ssh-add ~/.ssh/newssh

cd /www
git add .
git reset HEAD -\-hard;
git pull
npm install

pm2 restart all