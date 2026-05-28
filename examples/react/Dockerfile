FROM node:18.20-alpine AS builder

USER node

WORKDIR /home/node/app

COPY --chown=node . .

ENV NEXT_PUBLIC_CHAIN_LIST=unification,unificationtestnet
ENV NEXT_PUBLIC_DEFAULT_CHAIN=unification

RUN yarn install --frozen-lockfile --production && yarn add sharp && yarn build

FROM node:18.20-alpine

USER node

WORKDIR /home/node/app

COPY --from=builder --chown=node /home/node/app/node_modules ./node_modules
COPY --from=builder --chown=node /home/node/app/.next ./.next
COPY --from=builder --chown=node /home/node/app/public ./public
COPY --from=builder --chown=node /home/node/app/package.json .

EXPOSE 3000

CMD [ "yarn", "start" ]
