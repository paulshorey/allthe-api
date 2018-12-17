server {

server_name c.paulshorey.com;
root /www/c.ps/app;
index index.html;
listen 80 default_server;
listen [::]:80 default_server ipv6only=on;

location / {
        try_files $uri $uri/ =400;
}
location ~ /\.well-known/acme-challenge {
        default_type 'text/plain';
        root /www/sslcert; #or wherever dir
        try_files /$uri /;
}
location /api/v1 {
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
        proxy_pass 'http://localhost:1080';
}

# ENABLE SSL
listen 443 ssl http2;
listen [::]:443 ssl http2;
ssl_certificate /etc/letsencrypt/live/c.paulshorey.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/c.paulshorey.com/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/c.paulshorey.com/fullchain.pem;

}