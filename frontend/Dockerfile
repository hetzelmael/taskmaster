FROM nginx:alpine
COPY index.html style.css app.js /usr/share/nginx/html/
COPY nginx-railway.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD sh -c "RESOLVER=$(grep nameserver /etc/resolv.conf | awk '{print $2}' | head -1) && \
           sed -i \"s/DOCKER_DNS/$RESOLVER/g\" /etc/nginx/conf.d/default.conf && \
           nginx -g 'daemon off;'"
