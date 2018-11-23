server {
        listen 80 default_server;
        listen [::]:80 default_server ipv6only=on;

        server_name c.paulshorey.com
        root /www/c.ps/app

        index index.html

        location / {
                try_files $uri $uri/ =400;
        }
}






