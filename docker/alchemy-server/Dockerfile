FROM node:10.13.0

RUN apt install git
RUN git clone https://github.com/daostack/alchemy-server.git
WORKDIR alchemy-server
# checkout the social-verification branch
# TODO: remove next line once changes are merged to master.
RUN git checkout social-verification

RUN npm ci

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.4.0/wait /wait

COPY datasources.json /alchemy-server/server
COPY .env /alchemy-server/.env
COPY entry.sh /entry.sh

RUN chmod +x /wait /entry.sh
ENTRYPOINT [ "/entry.sh" ]
