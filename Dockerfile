FROM node:12-stretch
COPY . .
RUN npm i
EXPOSE 8000
CMD node .
