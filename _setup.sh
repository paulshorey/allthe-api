#################################
######################
############
###
# FIRST
pbcopy < ~/.ssh/newssh              # <<< COPY ON LOCAL
echo "CMD_V" >> ~/.ssh/newssh       # <<< PASTE ON REMOTE


#################################
######################
############
###
# AND ON GITHUB
set up webhook to HOST_NAME:9999/_deploy

#################################
######################
############
###
# THEN <<<< ON REMOTE, REPLACE STRING BELOW WITH SSH PRIVATE KEY:

###
# SSH KEY + GIT
chmod 600 ~/.ssh/newssh
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/newssh

###
# CODEBASE
git clone GIT_SSH_URL /www

###
# REMOTE EDITING
wget -O /usr/local/bin/rsub \https://raw.github.com/aurora/rmate/master/rmate
chmod a+x /usr/local/bin/rsub

###
# CLI + NODE + NPM
apt update;
apt install ne;
echo "# [delete]
KEY     0x7f    Backspace
# [ctrl]+[z]
KEY     0x1a    Undo
# [ctrl]+[r]
KEY     0x12    Redo
# [ctrl]+[d](delete line)
KEY     0x04    DL
# [ctrl]+[w]=(start of line)
KEY     0x17    SOL
# [ctrl]+[e]=(end of line)
KEY     0x05    EOL" >> ~/.ne/.keys;
apt install zsh;
cd /tmp;
sh -c "$(curl -fsSL https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh)";
sed -i 's/\<robbyrussell\>/kolo/' ~/.zshrc; source ~/.zshrc;
curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh;
bash nodesource_setup.sh;
apt install nodejs;
npm install -g pm2;

###
# /etc/crontab
echo "
@reboot root bash /www/_cron/deploy.sh" >> /etc/crontab;

###
# ~/.zprofile
echo '
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/newssh
cd /www;
git reset HEAD -\-hard;
git pull
source ~/.aliases.sh;
alias sublime="rsub";
EDITOR=ne;
echo ""
echo "TIPS:"
echo "rsub ./filename"
echo ""
' >> ~/.zprofile;
source ~/.zprofile;





##############################
###################
##########
## For serving Front-end

###
# NGIN-X
sudo apt install nginx;
sudo systemctl enable nginx;
sudo systemctl start nginx;
echo "
server {
    listen 80 default_server;
    listen [::]:80 default_server ipv6only=on;

    server_name c.paulshorey.com;
    root /www/app;

    index index.html;

    location / {
            try_files $uri $uri/ =400;
    }
    
    location ~ /\.well-known/acme-challenge {
		default_type 'text/plain';
		root /www/sslcert; #or wherever dir
		try_files /$uri /;
	}
}
" >> /etc/nginx/sites-available/default;
sudo nginx -t;
sudo systemctl restart nginx;


###
# /etc/nginx/sites-available/default
server {
        listen 80;
        listen [::]:80;

        #listen 443 ssl;
        #listen [::]:443 ssl;

        root /www/paulshorey;

        #ssl_certificate /etc/letsencrypt/live/paulshorey.com/fullchain.pem;
        #ssl_certificate_key /etc/letsencrypt/live/paulshorey.com/privkey.pem;

        #location ~ /html {
        #        root /www; #this will serve from /www/html
        #        allow all;
        #}

        #location ~ /.well-known {
        #        root /www/html;
        #        allow all;
        #}
        #location ~ /.well-known/acme-challenge {
        #        root /www/html;
        #        allow all;
        #}

        #location /node {
        #        proxy_set_header   X-Forwarded-For $remote_addr;
        #        proxy_set_header   Host $http_host;
        #        proxy_pass         "http://127.0.0.1:2080";
        #}

        #location /api {
        #        proxy_set_header   X-Forwarded-For $remote_addr;
        #        proxy_set_header   Host $http_host;
        #        proxy_pass         "http://127.0.0.1:1080";
        #}
}
server {
    server_name carteblanchejazzband.com carteblanchejazzband.paulshorey.com;
    listen 80;
    root /www/carteblanchejazzband;
    try_files $uri $uri/ index.html /index.html =404;
    allow all;
    autoindex on;
}
server {
    server_name luxul.paulshorey.com;
    listen 80;
    root /www/luxul;
    try_files $uri $uri/ index.html /index.html =404;
    allow all;
    autoindex on;
}
server {
    server_name beyond.paulshorey.com;
    listen 80;
    root /www/beyond;
    try_files $uri $uri/ index.html /index.html =404;
    allow all;
    autoindex on;
}
server {
    server_name corrosion.paulshorey.com;
    listen 80;
    root /www/beyond/bp-corrosion;
    try_files $uri $uri/ index.html /index.html =404;
    allow all;
    autoindex on;
}