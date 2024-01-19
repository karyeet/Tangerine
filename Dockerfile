FROM node:20.10.0-alpine
LABEL maintainer="https://github.com/karyeet"
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY ./* ./

USER node

RUN npm install

RUN npm run compile

COPY --chown=node:node . .

CMD [ "node", "." ]